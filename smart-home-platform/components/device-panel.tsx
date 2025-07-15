"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Lightbulb, Wind, Tv, Blinds, DoorOpen, Thermometer } from "lucide-react"

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

interface DevicePanelProps {
  devices: Device[]
  updateDevice: (deviceId: string, updates: any) => void
}

export function DevicePanel({ devices, updateDevice }: DevicePanelProps) {
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
        return Thermometer
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on":
        return "text-green-600"
      case "off":
        return "text-gray-400"
      case "locked":
        return "text-red-600"
      case "closed":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">设备监控</h2>
        <p className="text-gray-600">管理和控制您的智能家居设备</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => {
          const Icon = getDeviceIcon(device.type)
          return (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${getStatusColor(device.status)}`} />
                    <div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <p className="text-sm text-gray-500">{device.room}</p>
                    </div>
                  </div>
                  <Switch
                    checked={device.status === "on" || device.status === "locked"}
                    onCheckedChange={(checked) => {
                      const newStatus =
                        device.type === "door" ? (checked ? "locked" : "unlocked") : checked ? "on" : "off"
                      updateDevice(device.id, { status: newStatus })
                    }}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {device.type === "light" && device.brightness !== undefined && (
                  <div>
                    <label className="text-sm font-medium">亮度: {device.brightness}%</label>
                    <Slider
                      value={[device.brightness]}
                      onValueChange={([value]) => updateDevice(device.id, { brightness: value })}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                {device.type === "ac" && device.temperature !== undefined && (
                  <div>
                    <label className="text-sm font-medium">温度: {device.temperature}°C</label>
                    <Slider
                      value={[device.temperature]}
                      onValueChange={([value]) => updateDevice(device.id, { temperature: value })}
                      min={16}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                {device.type === "curtain" && device.openness !== undefined && (
                  <div>
                    <label className="text-sm font-medium">开启度: {device.openness}%</label>
                    <Slider
                      value={[device.openness]}
                      onValueChange={([value]) => updateDevice(device.id, { openness: value })}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newStatus = device.status === "on" ? "off" : "on"
                      updateDevice(device.id, { status: newStatus })
                    }}
                  >
                    {device.status === "on" ? "关闭" : "开启"}
                  </Button>
                  <Button size="sm" variant="outline">
                    详情
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
