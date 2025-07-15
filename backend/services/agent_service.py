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
        
        if suggestion and suggestion.confidence >= self.config.suggestion_threshold:
            # 保存建议为消息
            message = AgentMessage(
                id=str(uuid.uuid4()),
                role=MessageRole.AGENT,
                content=suggestion.content,
                timestamp=datetime.now(),
                metadata={
                    "suggestion_id": suggestion.id,
                    "confidence": suggestion.confidence,
                    "reasoning": suggestion.reasoning
                }
            )
            
            await self._add_message(message)
            self.last_suggestion_time = datetime.now()
            
            return suggestion
        
        return None
    
    def _should_generate_suggestion(self, home_state: HomeState) -> bool:
        """判断是否应该生成建议"""
        # 如果不是主动模式，不生成建议
        if not self.config.proactive_mode:
            return False
        
        # 如果最近刚生成过建议，避免过于频繁
        if (self.last_suggestion_time and 
            datetime.now() - self.last_suggestion_time < timedelta(minutes=5)):
            return False
        
        # 检查是否有值得关注的状态
        return True
    
    async def _generate_suggestion(self, home_state: HomeState) -> Optional[AgentSuggestion]:
        """使用LLM生成智能建议（仅支持LLM）"""
        try:
            # 分析当前状态
            analysis = self._analyze_state_patterns(home_state)
            
            if not analysis:
                return None
            
            # 构建详细的状态描述
            state_description = self._build_detailed_state_description(home_state, analysis)
            
            # 构建提示词
            system_prompt = self._build_system_prompt_v2()
            user_prompt = self._build_user_prompt_v2(state_description, analysis)
            
            # 调用LLM API
            response = await self._call_llm_api(system_prompt, user_prompt)
            
            if response:
                # 解析AI响应
                return self._parse_ai_response_v2(response, analysis)
            else:
                print("❌ LLM调用失败，无可用的建议生成方式")
                return None
                
        except Exception as e:
            print(f"❌ AI建议生成失败: {e}")
            return None
    
    async def _call_llm_api(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """调用LLM API"""
        try:
            if not self.llm_client:
                return None
            
            import asyncio
            
            # 使用异步方式调用
            def sync_call():
                # 为qwen模型添加特殊参数
                extra_params = {}
                if "qwen" in self.config.model.lower():
                    extra_params["stream"] = False
                    extra_params["extra_body"] = {"enable_thinking": False}
                
                return self.llm_client.chat.completions.create(
                    model=self.config.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
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
        """构建详细的状态描述"""
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
    
    def _build_system_prompt_v2(self) -> str:
        """构建优化的系统提示词"""
        return """你是一个智能家居助手，负责分析家居状态并提供主动建议。

你的职责：
1. 分析当前家居设备状态和人员位置
2. 识别可能的问题：能耗浪费、安全隐患、舒适度问题
3. 以自然、友好的语气提供具体建议
4. 建议要实用且容易执行

回复要求：
- 直接给出建议，不要多余的客套话
- 使用"你"而不是"您"
- 语气要自然亲切，像朋友一样
- 一次只关注最重要的1-2个问题
- 建议要具体明确

示例风格：
"你在卧室待了10分钟了，客厅的灯还开着，要不要关掉节省电费？"
"厨房没人但灯还亮着，我帮你关掉吧？"
"卧室温度有点高，要开空调吗？"
"""
    
    def _build_user_prompt_v2(self, state_description: str, analysis: Dict[str, Any]) -> str:
        """构建优化的用户提示词"""
        prompt = f"当前家居状态：{state_description}\n\n"
        
        # 添加发现的问题
        if analysis.get("device_issues"):
            issues = []
            for issue in analysis["device_issues"]:
                if issue["type"] == "unused_light":
                    room_name = self._translate_room_name(issue["room"])
                    issues.append(f"{room_name}无人但灯开着")
            
            if issues:
                prompt += f"发现的问题：{';'.join(issues)}\n\n"
        
        # 添加用户行为模式
        if analysis.get("patterns"):
            patterns = []
            for pattern in analysis["patterns"]:
                if pattern["type"] == "long_stay":
                    room_name = self._translate_room_name(pattern["room"])
                    duration_min = pattern["duration"] // 60
                    patterns.append(f"在{room_name}停留{duration_min}分钟")
            
            if patterns:
                prompt += f"用户行为：{';'.join(patterns)}\n\n"
        
        prompt += "请分析这个状态，如果发现需要用户关注的问题，给出一个简洁友好的建议。如果一切正常，回复'当前状态良好'。"
        
        return prompt
    
    def _parse_ai_response_v2(self, ai_response: str, analysis: Dict[str, Any]) -> AgentSuggestion:
        """解析AI响应"""
        # 如果AI认为一切正常，不生成建议
        if "当前状态良好" in ai_response or "没有问题" in ai_response:
            return None
        
        # 构建建议的操作
        actions = []
        confidence = 0.9  # AI建议的置信度较高
        
        # 根据分析结果推断可能的操作
        for issue in analysis.get("device_issues", []):
            if issue["type"] == "unused_light":
                actions.append({
                    "type": "turn_off_lights",
                    "room": issue["room"],
                    "devices": issue["devices"]
                })
        
        # 如果没有具体操作，降低置信度
        if not actions:
            confidence = 0.7
        
        return AgentSuggestion(
            id=str(uuid.uuid4()),
            content=ai_response,
            confidence=confidence,
            suggested_actions=actions,
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
        actions_taken = []
        
        # 检查是否需要执行操作
        if "是" in interaction.message or "好" in interaction.message or "帮我" in interaction.message:
            # 执行建议的操作
            actions_taken = await self._execute_suggested_actions()
            if actions_taken:
                response_content += " 已经帮你完成了！"
        elif "不" in interaction.message or "不用" in interaction.message:
            response_content = "好的，我记住了你的偏好。"
        
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
            
            # 构建系统提示
            system_prompt = """你是一个智能家居助手，负责回应用户的消息。请根据用户的回复给出简洁友好的响应。
如果用户同意建议，回复确认信息。
如果用户拒绝建议，表示理解并记住偏好。
保持回复简洁友好。"""
            
            # 构建用户提示
            user_prompt = f"用户说：{message}\n\n请给出合适的回复："
            
            # 调用LLM API
            response = await self._call_llm_api(system_prompt, user_prompt)
            
            if response:
                return response
            else:
                return "我明白了。有什么需要帮助的可以随时告诉我。"
                
        except Exception as e:
            print(f"❌ 处理用户响应失败: {e}")
            return "我明白了。有什么需要帮助的可以随时告诉我。"
    
    async def _execute_suggested_actions(self) -> List[Dict[str, Any]]:
        """执行建议的操作"""
        # 这里需要与家居模拟器交互执行实际操作
        # 暂时返回模拟的执行结果
        actions_taken = []
        
        # 查找最近的建议消息
        for message in reversed(self.context.messages):
            if (message.role == MessageRole.AGENT and 
                "suggestion_id" in message.metadata):
                # 模拟执行关灯操作
                actions_taken.append({
                    "type": "turn_off_lights",
                    "status": "success",
                    "message": "已关闭相关灯光"
                })
                break
        
        return actions_taken
    
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
    
    def is_agent_active(self) -> bool:
        """检查智能体是否活跃"""
        return self.is_active
    
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
