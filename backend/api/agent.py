from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
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
    """获取智能体服务实例"""
    from app import agent_service
    return agent_service


async def get_home_simulator() -> HomeSimulator:
    """获取家居模拟器实例"""
    from app import home_simulator
    return home_simulator


async def execute_agent_actions(actions: List[dict], home_sim: HomeSimulator):
    """在后台执行智能体建议的操作
    
    Args:
        actions: 要执行的操作列表
        home_sim: 家居模拟器实例
    """
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

@router.post("/interact", response_model=AgentResponse)
async def interact_with_agent(
    background_tasks: BackgroundTasks,
    agent: AgentService = Depends(get_agent_service),
    home_sim: HomeSimulator = Depends(get_home_simulator),
    interaction: UserInteraction = None,
    message: str = Query(None, description="消息内容（可选，用于查询参数方式）")
):
    """处理人对AI的回复 - 支持JSON请求体或查询参数
    
    Args:
        interaction: 用户交互对象（JSON请求体）
        message: 消息内容（查询参数方式）
        
    Returns:
        AgentResponse: 智能体响应
    """
    try:
        # 优先使用请求体中的数据，如果没有则使用查询参数
        if interaction is None:
            if message is None:
                raise HTTPException(status_code=422, detail="需要提供message参数或UserInteraction对象")
            interaction = UserInteraction(message=message)
        
        # 处理用户交互
        response = await agent.handle_user_interaction(interaction)
        
        # 如果需要执行操作，在后台执行
        if response.actions_taken:
            background_tasks.add_task(execute_agent_actions, response.actions_taken, home_sim)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"智能体交互失败: {str(e)}")

@router.post("/analyze")
async def analyze_current_state_with_llm(
    agent: AgentService = Depends(get_agent_service),
    home_sim: HomeSimulator = Depends(get_home_simulator)
):
    """使用LLM分析当前状态
    
    Returns:
        dict: 包含当前状态、LLM建议和分析时间的响应
    """
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
    """测试LLM集成功能
    
    Returns:
        dict: LLM可用性测试结果
    """
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
    """获取智能体状态（LLM模式）
    
    Returns:
        dict: 智能体当前状态信息
    """
    try:
        context = agent.get_context()
        return {
            "active": agent.is_active,
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
    """获取对话历史
    
    Args:
        limit: 返回的消息数量限制
        
    Returns:
        List[AgentMessage]: 对话历史消息列表
    """
    try:
        history = await agent.get_conversation_history(limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话历史失败: {str(e)}")


@router.post("/reset")
async def reset_agent_context(agent: AgentService = Depends(get_agent_service)):
    """重置智能体上下文
    
    Returns:
        dict: 重置结果消息
    """
    try:
        # 清空消息历史
        agent.context.messages = []
        agent.context.current_state = {}
        agent.last_suggestion_time = None
        
        return {"message": "智能体上下文已重置"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重置智能体失败: {str(e)}")
