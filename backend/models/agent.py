from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    """消息角色"""
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"

class AgentMessage(BaseModel):
    """智能体消息模型"""
    id: str
    role: MessageRole
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = {}

class AgentContext(BaseModel):
    """智能体上下文模型"""
    messages: List[AgentMessage]
    current_state: Dict[str, Any]
    user_preferences: Dict[str, Any] = {}
    last_interaction: Optional[datetime] = None

class AgentSuggestion(BaseModel):
    """智能体建议模型"""
    id: str
    content: str
    suggested_actions: Dict[str, Any] = []  # 建议的操作
    reasoning: str  # 推理过程
    timestamp: datetime

class UserInteraction(BaseModel):
    """用户交互模型"""
    message: str
    context: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    """智能体响应模型"""
    message: str
    suggestions: List[AgentSuggestion] = []
    actions_taken: List[Dict[str, Any]] = []
    needs_user_confirmation: bool = False
    timestamp: datetime

class AgentConfig(BaseModel):
    """智能体配置模型"""
    name: str = "家居助手"
    model: str = "gpt-3.5-turbo"
    max_context_length: int = 10
    response_delay: float = 1.0
    proactive_mode: bool = True  # 是否主动模式
    suggestion_threshold: float = 0.7  # 建议触发阈值
