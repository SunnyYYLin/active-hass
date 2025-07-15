"use client"
import React, { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { useActiveView } from "@/components/active-view-context"

const AIBubbleContext = createContext<{
  showAIBubble: boolean
  setShowAIBubble: (v: boolean) => void
  content: string
  setContent: (v: string) => void
}>({
  showAIBubble: false,
  setShowAIBubble: () => {},
  content: "",
  setContent: () => {},
})

export const useAIBubble = () => useContext(AIBubbleContext)

export const AIBubbleProvider = ({ children }: { children: React.ReactNode }) => {
  const [showAIBubble, setShowAIBubble] = useState(false)
  const [content, setContent] = useState("")
  const { setActiveView } = useActiveView()
  return (
    <AIBubbleContext.Provider value={{ showAIBubble, setShowAIBubble, content, setContent }}>
      {children}
      {/* 悬浮窗 */}
      {showAIBubble && content && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999 }}>
          <div
            className="bg-white border border-blue-200 shadow-xl rounded-lg p-6 min-w-[400px] max-w-lg animate-fade-in cursor-pointer"
            style={{ minHeight: '180px', maxHeight: '480px' }}
            onClick={() => {
              setShowAIBubble(false)
              setActiveView("assistant")
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-blue-700 text-xl">小灵提醒您</span>
              <button
                className="ml-2 text-gray-400 hover:text-blue-600 text-2xl font-bold"
                onClick={e => {
                  e.stopPropagation()
                  setShowAIBubble(false)
                }}
                aria-label="关闭"
              >×</button>
            </div>
            <div className="text-gray-700 text-lg whitespace-pre-line overflow-y-auto" style={{ maxHeight: '340px' }}>{content}</div>
          </div>
        </div>
      )}
    </AIBubbleContext.Provider>
  )
} 