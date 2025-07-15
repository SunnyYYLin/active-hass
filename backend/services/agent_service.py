import asyncio
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid

from models.agent import (
    AgentMessage, AgentContext, AgentSuggestion, 
    UserInteraction, AgentResponse, AgentConfig, MessageRole
)
from models.devices import HomeState, SensorDevice, SensorType, Room
from database.database import db
from openai import OpenAI

SYSTEM_PROMPT = """你是一个智能家居助手，负责分析家居状态并提供主动建议。

你的职责：
1. 分析当前家居设备状态和人员位置
2. 识别可能的问题：能耗浪费、安全隐患、舒适度问题
3. 以自然、友好的语气提供具体建议
4. 建议要实用且容易执行

你有控制智能家居的能力，当你决定帮助用户执行某个操作时，使用以下格式：

<action>
{
    "device_id": {
        "status": "on" | "off",
        "properties": {
            "brightness": 80,
            "temperature": 26,
            "mode": "cool"
        }
    }
}
</action>

可用设备ID：
- light_bedroom: 卧室主灯
- light_living: 客厅主灯  
- light_kitchen: 厨房灯
- ac_bedroom: 卧室空调

操作示例：
关闭客厅灯：
<action>
{"light_living": {"status": "off"}}
</action>

开启卧室空调并设置温度：
<action>
{"ac_bedroom": {"status": "on", "properties": {"temperature": 24, "mode": "cool"}}}
</action>

调节卧室灯亮度：
<action>
{"light_bedroom": {"status": "on", "properties": {"brightness": 60}}}
</action>

只有在明确需要执行操作时才使用<action>标签，否则只给出文字建议。

回复要求：
- 直接给出建议或执行，不要多余的客套话
- 使用"你"而不是"您"
- 语气要自然亲切，像朋友一样
- 一次只关注最重要的1-2个问题
- 建议要具体明确

示例风格：
"你在卧室待了10分钟了，客厅的灯还开着，要不要关掉节省电费？"
"厨房没人但灯还亮着，我帮你关掉吧？"
"卧室温度有点高，要开空调吗？"
"客厅灯已经关了<action>...</action>"
"""

class AgentService:
    """智能体服务"""
    
    def __init__(self):
        self.config = AgentConfig()
        self.context = AgentContext(
            messages=[],
            current_state={},
            user_preferences={}
        )
        self.last_suggestion_time = None
        self.is_active = False
        self.llm_client = None
        
        # 初始化LLM客户端
        self._init_llm_client()
    
    def _init_llm_client(self):
        """初始化LLM客户端"""
        # 优先使用DashScope API
        dashscope_key = os.getenv("DASHSCOPE_API_KEY")
        if dashscope_key:
            dashscope_base_url = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
            try:
                self.llm_client = OpenAI(
                    api_key=dashscope_key,
                    base_url=dashscope_base_url
                )
                self.config.model = os.getenv("DASHSCOPE_MODEL", "qwen-turbo")
                print(f"✅ 已配置DashScope API ({self.config.model})")
                return
            except Exception as e:
                raise ValueError(f"❌ DashScope配置失败: {e}")

        # 备用API
        pass
 
        # 无可用API或使用演示模式
        raise ValueError("❌ 未配置有效的LLM API密钥，请检查环境变量 DASHSCOPE_API_KEY")
    
    async def initialize(self):
        """初始化智能体服务（必须有LLM支持）"""
        if not self.llm_client:
            raise RuntimeError("❌ LLM客户端初始化失败，智能体服务无法启动。请检查DashScope API配置。")
        
        # 加载历史消息
        await self._load_context()
        self.is_active = True
        print("🤖 智能体服务已启动（LLM模式）")
    
    async def _load_context(self):
        """加载历史上下文"""
        # 从数据库加载最近的消息
        recent_messages = db.get_recent_messages(self.config.max_context_length)
        
        self.context.messages = []
        for msg_data in recent_messages:
            message = AgentMessage(
                id=msg_data["id"],
                role=MessageRole(msg_data["role"]),
                content=msg_data["content"],
                timestamp=datetime.fromisoformat(msg_data["timestamp"]),
                metadata=json.loads(msg_data["metadata"]) if msg_data["metadata"] else {}
            )
            self.context.messages.append(message)
        
        # 加载用户偏好
        preferences = db.get_preference("user_preferences")
        if preferences:
            self.context.user_preferences = preferences
    
    async def analyze_home_state(self, home_state: HomeState) -> Optional[AgentSuggestion]:
        """分析家居状态并生成建议"""
        self.context.current_state = home_state.dict()
        
        # 检查是否需要生成建议
        if not self._should_generate_suggestion(home_state):
            return None
        
        # 分析状态并生成建议
        suggestion = await self._generate_suggestion(home_state)
        
        if suggestion:
            # 如果建议包含操作，执行这些操作
            if suggestion.suggested_actions:
                print(f"🔧 执行建议操作: {suggestion.suggested_actions}")
                action_results = await self._execute_suggested_actions(suggestion.suggested_actions)
            
            # 保存建议为消息
            message = AgentMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.AGENT,
                content=suggestion.content,
                timestamp=datetime.now(),
                metadata={
                    "suggestion_id": suggestion.id,
                    "reasoning": suggestion.reasoning,
                    "suggested_actions": suggestion.suggested_actions,
                }
            )
                
            await self._add_message(message)
            self.last_suggestion_time = datetime.now()
        
        return suggestion
    
    def _should_generate_suggestion(self, home_state: HomeState) -> bool:
        """判断是否应该生成建议"""
        # 如果最近刚生成过建议，避免过于频繁
        if (self.last_suggestion_time and 
            datetime.now() - self.last_suggestion_time < timedelta(seconds=10)):
            return False
        
        # 检查是否有值得关注的状态
        return True
    
    async def _generate_suggestion(self, home_state: HomeState) -> Optional[AgentSuggestion]:
        """**主动**生成智能建议"""
        try:
            # 构建详细的状态描述
            state_description = self._build_detailed_state_description(home_state)
            print(f"🔍 分析家居状态: {state_description}")
            
            # 构建提示词
            system_prompt = self._build_analysis_system_prompt()
            user_prompt = self._build_analysis_user_prompt(state_description)
            
            # 调用LLM API
            response = await self._call_llm_api(system_prompt, user_prompt)
            print(response)
            
            if response:
                # 解析AI响应
                return self._parse_ai_response(response)
            else:
                print("❌ LLM调用失败，无可用的建议生成方式")
                return None
                
        except Exception as e:
            print(f"❌ AI建议生成失败: {e}")
            return None
    
    async def _call_llm_api(self, system_prompt: str, user_prompt: str, with_history: bool = False) -> Optional[str]:
        """调用LLM API"""
        try:
            if not self.llm_client:
                return None
            
            import asyncio
            
            # 构建消息列表
            if with_history:
                # 包含历史消息
                messages = [{"role": "system", "content": system_prompt}]
                
                # 添加最近的历史消息（限制数量以避免超过token限制）
                recent_messages = self.context.messages[-6:]  # 最近6条消息
                for msg in recent_messages:
                    role = "user" if msg.role == MessageRole.USER else "assistant"
                    messages.append({"role": role, "content": msg.content})
                
                # 添加当前用户消息
                messages.append({"role": "user", "content": user_prompt})
            else:
                # 不包含历史消息，只有系统提示和用户消息
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            
            # 使用异步方式调用
            def sync_call():
                # 为qwen模型添加特殊参数
                extra_params = {}
                if "qwen" in self.config.model.lower():
                    extra_params["stream"] = False
                    # extra_params["extra_body"] = {"enable_thinking": False}
                
                return self.llm_client.chat.completions.create(
                    model=self.config.model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=300,
                    timeout=10,  # 10秒超时
                    **extra_params
                )
            
            # 在线程池中执行同步调用
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, sync_call)
            
            if response and response.choices:
                return response.choices[0].message.content.strip()
            else:
                print("❌ LLM API返回空响应")
                return None
            
        except Exception as e:
            print(f"❌ LLM API调用失败: {e}")
            return None    
        
    def _build_detailed_state_description(self, home_state: HomeState) -> str:
        """构建详细的状态描述
        
        Args:
            home_state: 家居状态对象
            
        Returns:
            str: 详细的状态描述字符串
        """
        descriptions = []
        
        # 房间占用状态
        for room, occupied in home_state.room_occupancy.items():
            room_name = self._translate_room_name(room)
            if occupied:
                # 查找停留时间
                duration = 0
                for device in home_state.devices:
                    if (device.room == room and 
                        hasattr(device, 'sensor_type') and 
                        device.sensor_type == "motion" and
                        hasattr(device, 'detection_duration')):
                        duration = device.detection_duration
                        break
                
                if duration > 60:
                    descriptions.append(f"{room_name}有人已停留{duration//60}分钟")
                else:
                    descriptions.append(f"{room_name}有人")
            else:
                descriptions.append(f"{room_name}无人")
        
        # 设备状态
        device_states = []
        for device in home_state.devices:
            if device.type == "light":
                room_name = self._translate_room_name(device.room)
                status = "开启" if device.status == "on" else "关闭"
                device_states.append(f"{room_name}{device.name}{status}")
            elif device.type == "air_conditioner" and device.status == "on":
                room_name = self._translate_room_name(device.room)
                temp = getattr(device, 'temperature', 26)
                device_states.append(f"{room_name}空调开启，设定{temp}°C")
        
        # 组合描述
        state_desc = "；".join(descriptions)
        if device_states:
            state_desc += "。设备状态：" + "；".join(device_states)
        
        return state_desc
        
        # return home_state.dict()
    
    def _build_analysis_system_prompt(self) -> str:
        """构建优化的系统提示词"""
        return SYSTEM_PROMPT
    
    def _build_analysis_user_prompt(self, state_description: str) -> str:
        """构建优化的用户提示词"""
        prompt = f"当前家居状态：{state_description}\n\n"
        prompt += "请分析这个状态，如果发现需要用户关注的问题，给出一个简洁友好的建议。如果一切正常，回复'当前状态良好'。"
        
        return prompt
    
    def _parse_ai_response(self, ai_response: str) -> AgentSuggestion:
        """解析AI响应"""
        import re
        import json
        
        # 解析AI响应中的操作指令，格式为：<action>{...}</action>
        print(f"🔍 解析AI响应: {ai_response}")
        action_pattern = re.compile(r'<action>(.*?)</action>', re.DOTALL)
        matches = action_pattern.search(ai_response)
        
        suggested_actions = {}
        if matches:
            try:
                # 尝试解析JSON格式的操作
                action_json = matches.group(1).strip()
                suggested_actions = json.loads(action_json)
                print(f"🔧 解析到建议操作: {suggested_actions}")
            except json.JSONDecodeError as e:
                print(f"❌ 解析操作JSON失败: {e}")
                print(f"原始内容: {matches.group(1)}")
                suggested_actions = {}
        
        # 移除操作标签，只保留文本内容
        clean_content = re.sub(r'<action>.*?</action>', '', ai_response, flags=re.DOTALL).strip()
        
        return AgentSuggestion(
            id=str(uuid.uuid4()),
            content=clean_content,
            suggested_actions=suggested_actions,
            reasoning="基于qwen模型的智能分析",
            timestamp=datetime.now()
        )
    
    def _translate_room_name(self, room: str) -> str:
        """翻译房间名称"""
        room_names = {
            "living_room": "客厅",
            "bedroom": "卧室", 
            "kitchen": "厨房",
            "bathroom": "卫生间",
            "balcony": "阳台"
        }
        return room_names.get(room, room)
    
    async def handle_user_interaction(self, interaction: UserInteraction) -> AgentResponse:
        """处理用户交互"""
        # 保存用户消息
        user_message = AgentMessage(
            id=str(uuid.uuid4()),
            role=MessageRole.USER,
            content=interaction.message,
            timestamp=datetime.now(),
            metadata=interaction.context or {}
        )
        await self._add_message(user_message)
        
        # 处理用户回复
        response_content = await self._process_user_response(interaction.message)
        actions_taken = []  # 用户交互暂时不执行自动操作
        
        # 保存助手回复
        agent_message = AgentMessage(
            id=str(uuid.uuid4()),
            role=MessageRole.AGENT,
            content=response_content,
            timestamp=datetime.now(),
            metadata={"actions_taken": actions_taken}
        )
        await self._add_message(agent_message)
        
        return AgentResponse(
            message=response_content,
            suggestions=[],
            actions_taken=actions_taken,
            needs_user_confirmation=False,
            timestamp=datetime.now()
        )
    
    async def _process_user_response(self, message: str) -> str:
        """处理用户响应（使用LLM）"""
        try:
            if not self.llm_client:
                print("❌ LLM客户端不可用，无法处理用户响应")
                return "抱歉，我暂时无法处理您的请求。"
            
            # 构建历史消息和当前用户消息
            user_prompt = f"用户说：{message}\n\n请给出合适的回复："
            
            # 调用改进的LLM API（包含历史消息）
            response = await self._call_llm_api(SYSTEM_PROMPT, user_prompt, with_history=True)
            
            if response:
                # 解析响应中的操作
                import re
                import json
                
                action_pattern = re.compile(r'<action>(.*?)</action>', re.DOTALL)
                matches = action_pattern.search(response)
                
                if matches:
                    try:
                        # 解析并执行操作
                        action_json = matches.group(1).strip()
                        actions = json.loads(action_json)
                        print(f"🔧 用户交互中执行操作: {actions}")
                        await self._execute_suggested_actions(actions)
                        
                        # 移除操作标签，只返回文本内容
                        clean_response = re.sub(r'<action>.*?</action>', '', response, flags=re.DOTALL).strip()
                        return clean_response if clean_response else "操作已完成。"
                    except json.JSONDecodeError as e:
                        print(f"❌ 解析用户交互操作JSON失败: {e}")
                        return re.sub(r'<action>.*?</action>', '', response, flags=re.DOTALL).strip()
                
                return response
            else:
                return "我明白了。有什么需要帮助的可以随时告诉我。"
                
        except Exception as e:
            print(f"❌ 处理用户响应失败: {e}")
            return "我明白了。有什么需要帮助的可以随时告诉我。"
    
    async def _execute_suggested_actions(self, actions: dict) -> List[Dict[str, Any]]:
        """执行建议的操作"""
        results = []
        
        if not actions:
            return results
        
        try:
            import httpx
            import os
            
            # 获取后端服务地址 - 直接使用localhost:8000，因为这是内部调用
            base_url = "http://localhost:8000"
            
            async with httpx.AsyncClient() as client:
                for device_id, device_config in actions.items():
                    try:
                        # 准备更新数据
                        update_data = {}
                        
                        # 设置设备状态
                        if "status" in device_config:
                            update_data["status"] = device_config["status"]
                        
                        # 设置设备属性
                        if "properties" in device_config:
                            update_data["properties"] = device_config["properties"]
                        
                        # 发送PUT请求更新设备
                        response = await client.put(
                            f"{base_url}/api/devices/{device_id}",
                            json=update_data,
                            headers={"Content-Type": "application/json"},
                            timeout=10.0
                        )
                        
                        if response.status_code == 200:
                            response_data = response.json()
                            if response_data.get("success"):
                                results.append({
                                    "device_id": device_id,
                                    "success": True,
                                    "message": response_data.get("message", "设备控制成功"),
                                    "action": device_config
                                })
                                print(f"✅ 设备 {device_id} 控制成功")
                            else:
                                results.append({
                                    "device_id": device_id,
                                    "success": False,
                                    "message": response_data.get("message", "设备控制失败"),
                                    "action": device_config
                                })
                                print(f"❌ 设备 {device_id} 控制失败: {response_data.get('message')}")
                        else:
                            error_text = response.text
                            results.append({
                                "device_id": device_id,
                                "success": False,
                                "message": f"HTTP {response.status_code}: {error_text}",
                                "action": device_config
                            })
                            print(f"❌ 设备 {device_id} API调用失败: HTTP {response.status_code}")
                            
                    except Exception as e:
                        results.append({
                            "device_id": device_id,
                            "success": False,
                            "message": f"执行失败: {str(e)}",
                            "action": device_config
                        })
                        print(f"❌ 设备 {device_id} 执行异常: {e}")
            
            return results
            
        except Exception as e:
            print(f"❌ 执行建议操作失败: {e}")
            return [{
                "success": False,
                "message": f"执行失败: {str(e)}",
                "actions": actions
            }]
        
    
    async def _add_message(self, message: AgentMessage):
        """添加消息到上下文"""
        self.context.messages.append(message)
        
        # 保存到数据库
        db.save_message(message)
        
        # 限制上下文长度
        if len(self.context.messages) > self.config.max_context_length:
            self.context.messages = self.context.messages[-self.config.max_context_length:]
        
        self.context.last_interaction = datetime.now()
    
    def get_context(self) -> AgentContext:
        """获取当前上下文"""
        return self.context
    
    async def get_conversation_history(self, limit: int = 20) -> List[AgentMessage]:
        """获取对话历史"""
        messages_data = db.get_recent_messages(limit)
        messages = []
        
        for msg_data in messages_data:
            message = AgentMessage(
                id=msg_data["id"],
                role=MessageRole(msg_data["role"]),
                content=msg_data["content"],
                timestamp=datetime.fromisoformat(msg_data["timestamp"]),
                metadata=json.loads(msg_data["metadata"]) if msg_data["metadata"] else {}
            )
            messages.append(message)
        
        return messages
