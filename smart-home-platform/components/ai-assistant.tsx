"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Bot, User, Lightbulb, RefreshCw, AlertCircle, Zap, CheckCircle } from "lucide-react"
import { useAgent } from "@/hooks/use-agent"

interface Message {
  id: string
  role: "user" | "agent" | "system"
  content: string
  timestamp: string
  metadata?: any
}

export function AIAssistant() {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const {
    messages,
    loading,
    error,
    agentStatus,
    sendMessage,
    analyzeCurrentState,
    testLLM,
    resetContext,
    clearError,
  } = useAgent()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    // 延迟一小段时间再滚动，确保DOM渲染完成
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, loading])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const messageText = inputValue.trim()
    setInputValue("")

    try {
      await sendMessage(messageText)
    } catch (error) {
      console.error("发送消息失败:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAnalyzeState = async () => {
    setIsAnalyzing(true)
    try {
      await analyzeCurrentState()
    } catch (error) {
      console.error("分析状态失败:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleTestLLM = async () => {
    try {
      const result = await testLLM()
      
      const testMessage: Message = {
        id: Date.now().toString(),
        role: "agent",
        content: result.llm_available 
          ? `LLM连接测试成功！\\n模型: ${result.model}\\n测试响应: ${result.test_response}`
          : `LLM连接失败: ${result.error}`,
        timestamp: new Date().toISOString(),
        metadata: { type: 'test_result', ...result }
      }
      
      // 这里需要直接更新消息，因为这不是通过正常对话流程
      console.log("LLM测试结果:", result)
    } catch (error) {
      console.error("LLM测试失败:", error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI智能助手</h2>
              <div className="flex items-center gap-2 mt-1">
                {agentStatus?.llm_available ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    LLM已连接
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    LLM未连接
                  </Badge>
                )}
                {agentStatus?.active && (
                  <Badge variant="outline">
                    <Zap className="w-3 h-3 mr-1" />
                    智能体活跃
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyzeState}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              分析状态
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestLLM}
            >
              测试LLM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetContext}
            >
              重置对话
            </Button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <button 
                onClick={clearError} 
                className="ml-2 text-blue-600 underline"
              >
                关闭
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role !== "user" && (
              <Avatar className="w-8 h-8 bg-blue-100">
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-blue-600" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* 显示AI建议的操作 */}
              {message.metadata?.actions_taken && message.metadata.actions_taken.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                  <p className="font-medium text-green-800">已执行操作:</p>
                  <ul className="list-disc list-inside text-green-700">
                    {message.metadata.actions_taken.map((action: any, index: number) => (
                      <li key={index}>{action.description || JSON.stringify(action)}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 显示建议 */}
              {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <p className="font-medium text-blue-800">建议:</p>
                  {message.metadata.suggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="text-blue-700">
                      {suggestion.content}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
              </div>
            </div>
            
            {message.role === "user" && (
              <Avatar className="w-8 h-8 bg-gray-100">
                <AvatarFallback>
                  <User className="w-4 h-4 text-gray-600" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 bg-blue-100">
              <AvatarFallback>
                <Bot className="w-4 h-4 text-blue-600" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-white border shadow-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">正在思考...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题或指令..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !inputValue.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          提示: 您可以询问设备状态、控制设备，或请求智能建议
        </div>
      </div>
    </div>
  )
}
