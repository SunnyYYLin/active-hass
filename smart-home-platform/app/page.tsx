"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DevicePanel } from "@/components/device-panel"
import { RoomView } from "@/components/room-view"
import { AutomationPanel } from "@/components/automation-panel"
import { AIAssistant } from "@/components/ai-assistant"
import { useDevices } from "@/hooks/use-devices"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { AIBubbleProvider } from "@/components/ai-bubble-context"
import { ActiveViewProvider, useActiveView } from "@/components/active-view-context"

function SmartHomePlatformContent({ devices, loading, error, updateDevice, toggleDevice, getDevicesByRoom, getDeviceStats, setError }: any) {
  const { activeView, setActiveView } = useActiveView()

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">加载设备中...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <button 
                onClick={() => setError(null)} 
                className="ml-2 text-blue-600 underline"
              >
                重试
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    switch (activeView) {
      case "dashboard":
        return <DevicePanel devices={devices} updateDevice={updateDevice} toggleDevice={toggleDevice} />
      case "room":
        return <RoomView devices={devices} updateDevice={updateDevice} toggleDevice={toggleDevice} />
      case "automation":
        return <AutomationPanel devices={devices} />
      case "assistant":
        return <AIAssistant />
      default:
        return <DevicePanel devices={devices} updateDevice={updateDevice} toggleDevice={toggleDevice} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  )
}

export default function SmartHomePlatform() {
  const {
    devices,
    loading,
    error,
    updateDevice,
    toggleDevice,
    getDevicesByRoom,
    getDeviceStats,
    setError
  } = useDevices()
  return (
    <ActiveViewProvider>
      <AIBubbleProvider>
        <SmartHomePlatformContent
          devices={devices}
          loading={loading}
          error={error}
          updateDevice={updateDevice}
          toggleDevice={toggleDevice}
          getDevicesByRoom={getDevicesByRoom}
          getDeviceStats={getDeviceStats}
          setError={setError}
        />
      </AIBubbleProvider>
    </ActiveViewProvider>
  )
}
