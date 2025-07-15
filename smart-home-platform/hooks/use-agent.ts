import { useState, useEffect, useCallback } from 'react';
import { apiService, AgentMessage, UserInteraction, AgentResponse } from '@/lib/api';

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null);

  // 加载对话历史
  const loadConversationHistory = useCallback(async (limit: number = 20) => {
    try {
      setLoading(true);
      const history = await apiService.getConversationHistory(limit);
      setMessages(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载对话历史失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 发送消息给AI助手
  const sendMessage = useCallback(async (message: string, context?: Record<string, any>) => {
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // 立即添加用户消息到界面
    setMessages(prev => [...prev, userMessage]);

    try {
      setLoading(true);
      setError(null);

      const interaction: UserInteraction = { message, context };
      const response = await apiService.interactWithAgent(interaction);

      // 添加AI响应
      const agentMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.message,
        timestamp: response.timestamp,
        metadata: {
          suggestions: response.suggestions,
          actions_taken: response.actions_taken,
          needs_user_confirmation: response.needs_user_confirmation,
        },
      };

      setMessages(prev => [...prev, agentMessage]);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送消息失败';
      setError(errorMessage);
      
      // 添加错误消息
      const errorAgentMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `抱歉，我遇到了一些问题：${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorAgentMessage]);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取AI助手状态
  const getAgentStatus = useCallback(async () => {
    try {
      const status = await apiService.getAgentStatus();
      setAgentStatus(status);
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取助手状态失败');
    }
  }, []);

  // 分析当前家居状态
  const analyzeCurrentState = useCallback(async () => {
    try {
      setLoading(true);
      const analysis = await apiService.analyzeCurrentState();
      
      if (analysis.suggestion) {
        const analysisMessage: AgentMessage = {
          id: Date.now().toString(),
          role: 'agent',
          content: analysis.suggestion.content,
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'analysis',
            suggested_actions: analysis.suggestion.suggested_actions,
            reasoning: analysis.suggestion.reasoning,
          },
        };
        setMessages(prev => [...prev, analysisMessage]);
      }
      
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 测试LLM连接
  const testLLM = useCallback(async () => {
    try {
      const result = await apiService.testLLM();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LLM测试失败');
      throw err;
    }
  }, []);

  // 重置对话上下文
  const resetContext = useCallback(async () => {
    try {
      await apiService.resetAgentContext();
      setMessages([]);
      setError(null);
      
      // 添加欢迎消息
      const welcomeMessage: AgentMessage = {
        id: Date.now().toString(),
        role: 'agent',
        content: '您好！我是您的智能家居助手。我可以帮您控制设备、查看状态、提供智能建议等。请问有什么可以帮您的吗？',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置上下文失败');
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 初始化
  useEffect(() => {
    // 加载初始状态和欢迎消息
    resetContext();
    getAgentStatus();
  }, []);

  return {
    messages,
    loading,
    error,
    agentStatus,
    sendMessage,
    loadConversationHistory,
    getAgentStatus,
    analyzeCurrentState,
    testLLM,
    resetContext,
    clearError,
  };
}
