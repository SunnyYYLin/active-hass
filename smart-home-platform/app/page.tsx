"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DevicePanel } from "@/components/device-panel"
import { RoomView } from "@/components/room-view"
import { AutomationPanel } from "@/components/automation-panel"
import { AIAssistant } from "@/components/ai-assistant"

export default function SmartHomePlatform() {
  const [activeView, setActiveView] = useState("dashboard")
  const [devices, setDevices] = useState([
    { id: "light1", name: "客厅主灯", type: "light", status: "on", brightness: 80, room: "living", x: 30, y: 25 },
    { id: "light2", name: "卧室台灯", type: "light", status: "off", brightness: 0, room: "bedroom", x: 75, y: 30 },
    { id: "ac1", name: "客厅空调", type: "ac", status: "on", temperature: 24, room: "living", x: 20, y: 15 },
    { id: "tv1", name: "客厅电视", type: "tv", status: "off", channel: 1, room: "living", x: 50, y: 40 },
    { id: "curtain1", name: "客厅窗帘", type: "curtain", status: "closed", openness: 20, room: "living", x: 15, y: 35 },
    { id: "door1", name: "前门", type: "door", status: "locked", room: "entrance", x: 85, y: 60 },
  ])

  const updateDevice = (deviceId: string, updates: any) => {
    setDevices((prev) => prev.map((device) => (device.id === deviceId ? { ...device, ...updates } : device)))
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DevicePanel devices={devices} updateDevice={updateDevice} />
      case "room":
        return <RoomView devices={devices} updateDevice={updateDevice} />
      case "automation":
        return <AutomationPanel devices={devices} />
      case "assistant":
        return <AIAssistant devices={devices} updateDevice={updateDevice} />
      default:
        return <DevicePanel devices={devices} updateDevice={updateDevice} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  )
}
