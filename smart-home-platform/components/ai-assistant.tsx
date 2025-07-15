"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Lightbulb, Wind, Tv } from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  status: string
  brightness?: number
  temperature?: number
  room: string
}

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  devices: Device[]
  updateDevice: (deviceId: string, updates: any) => void
}

export function AIAssistant({ devices, updateDevice }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "您好！我是您的智能家居助手。我可以帮您控制设备、查看状态、设置场景等。请问有什么可以帮您的吗？",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const processCommand = (input: string): string => {
    const lowerInput = input.toLowerCase()

    // 开灯命令
    if (lowerInput.includes("开灯") || lowerInput.includes("打开灯")) {
      const lightDevices = devices.filter((d) => d.type === "light")
      lightDevices.forEach((device) => {
        updateDevice(device.id, { status: "on", brightness: 80 })
      })
      return `已为您开启${lightDevices.length}盏灯`
    }

    // 关灯命令
    if (lowerInput.includes("关灯") || lowerInput.includes("关闭灯")) {
      const lightDevices = devices.filter((d) => d.type === "light")
      lightDevices.forEach((device) => {
        updateDevice(device.id, { status: "off" })
      })
      return `已为您关闭${lightDevices.length}盏灯`
    }

    // 空调控制
    if (lowerInput.includes("空调")) {
      const acDevices = devices.filter((d) => d.type === "ac")
      if (lowerInput.includes("开") || lowerInput.includes("打开")) {
        acDevices.forEach((device) => {
          updateDevice(device.id, { status: "on", temperature: 24 })
        })
        return "已为您开启空调，温度设置为24°C"
      } else if (lowerInput.includes("关") || lowerInput.includes("关闭")) {
        acDevices.forEach((device) => {
          updateDevice(device.id, { status: "off" })
        })
        return "已为您关闭空调"
      }
    }

    // 温度设置
    const tempMatch = lowerInput.match(/(\d+)度|(\d+)°c/i)
    if (tempMatch && lowerInput.includes("温度")) {
      const temp = Number.parseInt(tempMatch[1] || tempMatch[2])
      const acDevices = devices.filter((d) => d.type === "ac")
      acDevices.forEach((device) => {
        updateDevice(device.id, { temperature: temp, status: "on" })
      })
      return `已将空调温度设置为${temp}°C`
    }

    // 设备状态查询
    if (lowerInput.includes("状态") || lowerInput.includes("情况")) {
      const onDevices = devices.filter((d) => d.status === "on").length
      const totalDevices = devices.length
      return `当前有${onDevices}个设备开启，共${totalDevices}个设备。所有设备运行正常。`
    }

    // 场景模式
    if (lowerInput.includes("睡眠模式") || lowerInput.includes("晚安")) {
      devices.forEach((device) => {
        if (device.type === "light") {
          updateDevice(device.id, { status: "off" })
        } else if (device.type === "ac") {
          updateDevice(device.id, { temperature: 26 })
        }
      })
      return "已启动睡眠模式：关闭所有灯光，空调调至26°C"
    }

    if (lowerInput.includes("回家模式") || lowerInput.includes("我回来了")) {
      devices.forEach((device) => {
        if (device.type === "light" && device.room === "living") {
          updateDevice(device.id, { status: "on", brightness: 60 })
        } else if (device.type === "ac") {
          updateDevice(device.id, { status: "on", temperature: 24 })
        }
      })
      return "欢迎回家！已为您开启客厅灯光和空调"
    }

    // 默认回复
    return "抱歉，我没有理解您的指令。您可以尝试说：'开灯'、'关灯'、'开空调'、'设置温度25度'、'查看状态'、'睡眠模式'等。"
  }

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // 处理命令并生成回复
    setTimeout(() => {
      const response = processCommand(inputValue)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 500)

    setInputValue("")
  }

  const quickActions = [
    { label: "开启所有灯", command: "开灯" },
    { label: "关闭所有灯", command: "关灯" },
    { label: "开启空调", command: "开空调" },
    { label: "睡眠模式", command: "睡眠模式" },
    { label: "查看状态", command: "查看状态" },
  ]

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">AI智能助手</h2>
        <p className="text-gray-600">通过语音或文字控制您的智能家居</p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* 聊天区域 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              智能助手
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* 消息列表 */}
            <div className="flex-1 overflow-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "assistant" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                  {message.type === "user" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>

            {/* 输入区域 */}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="输入指令或问题..."
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <div className="w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    setInputValue(action.command)
                    setTimeout(sendMessage, 100)
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>设备状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.slice(0, 4).map((device) => {
                  const Icon = device.type === "light" ? Lightbulb : device.type === "ac" ? Wind : Tv
                  return (
                    <div key={device.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${device.status === "on" ? "text-green-500" : "text-gray-400"}`} />
                        <span className="text-sm">{device.name}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          device.status === "on" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {device.status === "on" ? "开启" : "关闭"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
