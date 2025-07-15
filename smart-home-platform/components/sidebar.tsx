"use client"

import { Home, Zap, Map, Settings, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAIBubble } from "@/components/ai-bubble-context"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "设备监控", icon: Zap },
    { id: "room", label: "房间视图", icon: Map },
    { id: "automation", label: "自动化", icon: Settings },
    { id: "assistant", label: "AI助手", icon: MessageCircle },
  ]

  const { showAIBubble, setShowAIBubble } = useAIBubble()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Home className="w-8 h-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">智能家居</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className="w-full justify-start gap-3 relative"
                onClick={() => {
                  setActiveView(item.id)
                  if (item.id === "assistant") setShowAIBubble(false)
                }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.id === "assistant" && showAIBubble && (
                  <span className="absolute right-3 top-2 bg-blue-500 text-white text-xs rounded px-2 py-0.5 shadow z-10">
                    AI智能分析
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p>在线设备: 6/8</p>
          <p>系统状态: 正常</p>
        </div>
      </div>
    </div>
  )
}
