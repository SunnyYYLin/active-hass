from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from models.agent import (
    AgentSuggestion, UserInteraction, AgentResponse, 
    AgentMessage, AgentContext
)
from models.devices import HomeState, DeviceStatus
from services.agent_service import AgentService
from services.home_simulator import HomeSimulator

router = APIRouter()

# 依赖注入
async def get_agent_service() -> AgentService:
    from app import agent_service
    return agent_service

async def get_home_simulator() -> HomeSimulator:
    from app import home_simulator
    return home_simulator

@router.post("/interact", response_model=AgentResponse)
async def interact_with_agent(
    interaction: UserInteraction,
    background_tasks: BackgroundTasks,
    agent: AgentService = Depends(get_agent_service),
    home_sim: HomeSimulator = Depends(get_home_simulator)
):
    """处理人对AI的回复"""
    try:
        # 处理用户交互
        response = await agent.handle_user_interaction(interaction)
        
        # 如果需要执行操作，在后台执行
        if response.actions_taken:
            background_tasks.add_task(execute_agent_actions, response.actions_taken, home_sim)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"智能体交互失败: {str(e)}")

async def execute_agent_actions(actions: List[dict], home_sim: HomeSimulator):
    """在后台执行智能体建议的操作"""
    for action in actions:
        try:
            if action["type"] == "turn_off_lights":
                # 关闭指定房间的灯光
                room = action.get("room")
                device_ids = action.get("devices", [])
                
                for device_id in device_ids:
                    await home_sim.update_device(
                        device_id=device_id,
                        status="off"
                    )
                    print(f"✅ 已关闭设备: {device_id}")
            
        except Exception as e:
            print(f"❌ 执行操作失败: {action}, 错误: {e}")

@router.post("/analyze")
async def analyze_current_state_with_llm(
    agent: AgentService = Depends(get_agent_service),
    home_sim: HomeSimulator = Depends(get_home_simulator)
):
    """使用LLM分析当前状态"""
    try:
        # 获取当前状态
        current_state = home_sim.get_current_state()
        
        # 强制分析（忽略时间限制）
        agent.last_suggestion_time = None
        suggestion = await agent.analyze_home_state(current_state)
        
        return {
            "current_state": current_state.dict(),
            "suggestion": suggestion.dict() if suggestion else None,
            "analysis_time": current_state.timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM状态分析失败: {str(e)}")

@router.post("/test-llm")
async def test_llm_integration(
    agent: AgentService = Depends(get_agent_service)
):
    """测试LLM集成功能"""
    try:
        # 检查LLM客户端是否可用
        if not agent.llm_client:
            return {
                "llm_available": False,
                "error": "LLM客户端不可用",
                "client_type": None,
                "model": None
            }
        
        # 模拟一个测试场景
        test_prompt_system = """你是一个智能家居助手，负责分析家居状态并提供主动建议。请用简洁友好的语气回复。"""
        
        test_prompt_user = """当前家居状态：卧室有人5分钟；客厅无人；客厅灯开着。

请分析这个状态，如果发现需要用户关注的问题，给出一个简洁友好的建议。"""

        response = await agent._call_llm_api(test_prompt_system, test_prompt_user)
        
        return {
            "llm_available": True,
            "model": agent.config.model,
            "test_response": response,
            "client_type": "OpenAI"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM测试失败: {str(e)}")

@router.get("/status")
async def get_agent_status(agent: AgentService = Depends(get_agent_service)):
    """获取智能体状态（LLM模式）"""
    try:
        context = agent.get_context()
        return {
            "active": agent.is_agent_active(),
            "llm_available": agent.llm_client is not None,
            "model": agent.config.model if agent.llm_client else None,
            "last_interaction": context.last_interaction,
            "message_count": len(context.messages),
            "config": agent.config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取智能体状态失败: {str(e)}")

@router.get("/history", response_model=List[AgentMessage])
async def get_conversation_history(
    limit: int = 20,
    agent: AgentService = Depends(get_agent_service)
):
    """获取对话历史"""
    try:
        history = await agent.get_conversation_history(limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话历史失败: {str(e)}")

@router.post("/reset")
async def reset_agent_context(agent: AgentService = Depends(get_agent_service)):
    """重置智能体上下文"""
    try:
        # 清空消息历史
        agent.context.messages = []
        agent.context.current_state = {}
        agent.last_suggestion_time = None
        
        return {"message": "智能体上下文已重置"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重置智能体失败: {str(e)}")
