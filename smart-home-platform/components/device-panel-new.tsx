"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Wind, Tv, Blinds, DoorOpen, Thermometer, Camera, ToggleLeft, Activity } from "lucide-react"
import { Device, DeviceUpdateRequest } from "@/lib/api"
import { useState } from "react"

interface DevicePanelProps {
  devices: Device[]
  updateDevice: (deviceId: string, updates: DeviceUpdateRequest) => Promise<any>
  toggleDevice: (deviceId: string) => Promise<any>
}

export function DevicePanel({ devices, updateDevice, toggleDevice }: DevicePanelProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "light":
        return Lightbulb
      case "air_conditioner":
        return Wind
      case "tv":
        return Tv
      case "curtain":
        return Blinds
      case "door":
        return DoorOpen
      case "camera":
        return Camera
      case "switch":
        return ToggleLeft
      case "sensor":
        return Activity
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
      case "unknown":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on":
        return <Badge variant="default" className="bg-green-100 text-green-800">开启</Badge>
      case "off":
        return <Badge variant="secondary">关闭</Badge>
      case "unknown":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">未知</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoomName = (room: string) => {
    const roomNames: { [key: string]: string } = {
      'living_room': '客厅',
      'bedroom': '卧室',
      'kitchen': '厨房',
      'bathroom': '卫生间',
      'balcony': '阳台',
    }
    return roomNames[room] || room
  }

  const getDeviceTypeName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'light': '灯光',
      'air_conditioner': '空调',
      'sensor': '传感器',
      'switch': '开关',
      'camera': '摄像头',
      'door': '门窗',
    }
    return typeNames[type] || type
  }

  const handleToggle = async (deviceId: string) => {
    if (updating) return
    
    try {
      setUpdating(deviceId)
      await toggleDevice(deviceId)
    } catch (error) {
      console.error('切换设备状态失败:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handlePropertyUpdate = async (deviceId: string, property: string, value: any) => {
    if (updating) return

    try {
      setUpdating(deviceId)
      const currentDevice = devices.find(d => d.id === deviceId)
      await updateDevice(deviceId, {
        properties: { ...currentDevice?.properties, [property]: value }
      })
    } catch (error) {
      console.error('更新设备属性失败:', error)
    } finally {
      setUpdating(null)
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
          const brightness = device.properties?.brightness || 0
          const temperature = device.properties?.temperature || 24
          const isUpdating = updating === device.id
          
          return (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${getStatusColor(device.status)}`} />
                    <div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <p className="text-sm text-gray-500">{getRoomName(device.room)} · {getDeviceTypeName(device.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(device.status)}
                    <Switch
                      checked={device.status === "on"}
                      disabled={isUpdating}
                      onCheckedChange={() => handleToggle(device.id)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 灯光设备的亮度控制 */}
                {device.type === "light" && device.status === "on" && (
                  <div>
                    <label className="text-sm font-medium">亮度: {brightness}%</label>
                    <Slider
                      value={[brightness]}
                      disabled={isUpdating}
                      onValueChange={([value]) => handlePropertyUpdate(device.id, 'brightness', value)}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* 空调设备的温度控制 */}
                {device.type === "air_conditioner" && device.status === "on" && (
                  <div>
                    <label className="text-sm font-medium">温度: {temperature}°C</label>
                    <Slider
                      value={[temperature]}
                      disabled={isUpdating}
                      onValueChange={([value]) => handlePropertyUpdate(device.id, 'temperature', value)}
                      min={16}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* 传感器设备显示数值 */}
                {device.type === "sensor" && (
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">传感器数值:</span>
                      <span className="font-medium">
                        {device.properties?.value !== undefined 
                          ? `${device.properties.value} ${device.properties?.unit || ''}`
                          : '无数据'
                        }
                      </span>
                    </div>
                    {device.properties?.detection_duration !== undefined && (
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">检测时长:</span>
                        <span className="font-medium">{device.properties.detection_duration}秒</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 设备属性显示 */}
                {Object.keys(device.properties || {}).length > 0 && device.type !== "light" && device.type !== "air_conditioner" && device.type !== "sensor" && (
                  <div className="text-sm">
                    <p className="text-gray-600 mb-2">设备属性:</p>
                    <div className="space-y-1">
                      {Object.entries(device.properties || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最后更新时间 */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  最后更新: {new Date(device.last_updated).toLocaleString('zh-CN')}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">暂无设备数据</p>
        </div>
      )}
    </div>
  )
}
