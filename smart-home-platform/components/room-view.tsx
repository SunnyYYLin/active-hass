"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Lightbulb, Wind, Tv, Blinds, DoorOpen } from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  status: string
  brightness?: number
  temperature?: number
  channel?: number
  openness?: number
  room: string
  x: number
  y: number
}

interface RoomViewProps {
  devices: Device[]
  updateDevice: (deviceId: string, updates: any) => void
}

export function RoomView({ devices, updateDevice }: RoomViewProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "light":
        return Lightbulb
      case "ac":
        return Wind
      case "tv":
        return Tv
      case "curtain":
        return Blinds
      case "door":
        return DoorOpen
      default:
        return Lightbulb
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on":
        return "text-green-500"
      case "off":
        return "text-gray-400"
      case "locked":
        return "text-red-500"
      case "closed":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="p-6 h-full flex gap-6">
      <div className="flex-1">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">房间视图</h2>
          <p className="text-gray-600">点击房间中的设备进行控制</p>
        </div>

        <Card className="h-[600px]">
          <CardContent className="p-0 h-full relative">
            {/* 房间背景 */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
              {/* 房间布局 */}
              <div className="absolute inset-4 border-2 border-gray-300 bg-white/50 rounded-lg">
                {/* 客厅区域 */}
                <div className="absolute top-4 left-4 w-1/2 h-1/2 border border-gray-200 bg-yellow-50/30 rounded flex items-center justify-center text-sm text-gray-600">
                  客厅
                </div>

                {/* 卧室区域 */}
                <div className="absolute top-4 right-4 w-2/5 h-1/2 border border-gray-200 bg-blue-50/30 rounded flex items-center justify-center text-sm text-gray-600">
                  卧室
                </div>

                {/* 入口区域 */}
                <div className="absolute bottom-4 right-4 w-1/3 h-1/3 border border-gray-200 bg-green-50/30 rounded flex items-center justify-center text-sm text-gray-600">
                  入口
                </div>
              </div>

              {/* 设备图标 */}
              {devices.map((device) => {
                const Icon = getDeviceIcon(device.type)
                return (
                  <button
                    key={device.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 ${
                      selectedDevice?.id === device.id ? "border-blue-500" : "border-gray-200"
                    }`}
                    style={{ left: `${device.x}%`, top: `${device.y}%` }}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <Icon className={`w-6 h-6 ${getStatusColor(device.status)}`} />
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 设备控制面板 */}
      <div className="w-80">
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle>设备控制</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDevice ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getDeviceIcon(selectedDevice.type)
                    return <Icon className={`w-8 h-8 ${getStatusColor(selectedDevice.status)}`} />
                  })()}
                  <div>
                    <h3 className="font-semibold">{selectedDevice.name}</h3>
                    <p className="text-sm text-gray-500">{selectedDevice.room}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const newStatus = selectedDevice.status === "on" ? "off" : "on"
                      updateDevice(selectedDevice.id, { status: newStatus })
                      setSelectedDevice({ ...selectedDevice, status: newStatus })
                    }}
                  >
                    {selectedDevice.status === "on" ? "关闭" : "开启"}
                  </Button>

                  {selectedDevice.type === "light" && selectedDevice.brightness !== undefined && (
                    <div>
                      <label className="text-sm font-medium">亮度: {selectedDevice.brightness}%</label>
                      <Slider
                        value={[selectedDevice.brightness]}
                        onValueChange={([value]) => {
                          updateDevice(selectedDevice.id, { brightness: value })
                          setSelectedDevice({ ...selectedDevice, brightness: value })
                        }}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {selectedDevice.type === "ac" && selectedDevice.temperature !== undefined && (
                    <div>
                      <label className="text-sm font-medium">温度: {selectedDevice.temperature}°C</label>
                      <Slider
                        value={[selectedDevice.temperature]}
                        onValueChange={([value]) => {
                          updateDevice(selectedDevice.id, { temperature: value })
                          setSelectedDevice({ ...selectedDevice, temperature: value })
                        }}
                        min={16}
                        max={30}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {selectedDevice.type === "curtain" && selectedDevice.openness !== undefined && (
                    <div>
                      <label className="text-sm font-medium">开启度: {selectedDevice.openness}%</label>
                      <Slider
                        value={[selectedDevice.openness]}
                        onValueChange={([value]) => {
                          updateDevice(selectedDevice.id, { openness: value })
                          setSelectedDevice({ ...selectedDevice, openness: value })
                        }}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <p>点击房间中的设备图标</p>
                <p>开始控制设备</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
