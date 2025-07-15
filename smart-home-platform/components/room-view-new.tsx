"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Lightbulb, Wind, Tv, Blinds, DoorOpen, Camera, ToggleLeft, Activity } from "lucide-react"
import { Device, DeviceUpdateRequest } from "@/lib/api"
import { RoomLayout } from "./room-layout"

interface RoomViewProps {
  devices: Device[]
  updateDevice: (deviceId: string, updates: DeviceUpdateRequest) => Promise<any>
  toggleDevice: (deviceId: string) => Promise<any>
}

export function RoomView({ devices, updateDevice, toggleDevice }: RoomViewProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string>("living_room")
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
        return Lightbulb
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

  const rooms = Array.from(new Set(devices.map(device => device.room)))
  const currentRoomDevices = devices.filter(device => device.room === selectedRoom)

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device)
  }

  const handleToggleDevice = async (deviceId: string) => {
    if (updating) return
    
    try {
      setUpdating(deviceId)
      await toggleDevice(deviceId)
      
      // 更新选中的设备信息
      if (selectedDevice && selectedDevice.id === deviceId) {
        const updatedDevice = devices.find(d => d.id === deviceId)
        if (updatedDevice) {
          setSelectedDevice(updatedDevice)
        }
      }
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
      
      // 更新选中的设备信息
      if (selectedDevice && selectedDevice.id === deviceId) {
        const updatedDevice = devices.find(d => d.id === deviceId)
        if (updatedDevice) {
          setSelectedDevice(updatedDevice)
        }
      }
    } catch (error) {
      console.error('更新设备属性失败:', error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="flex h-full">
      {/* 房间选择侧边栏 */}
      <div className="w-64 bg-white border-r p-4">
        <h3 className="text-lg font-semibold mb-4">房间选择</h3>
        <div className="space-y-2">
          {rooms.map((room) => (
            <Button
              key={room}
              variant={selectedRoom === room ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedRoom(room)}
            >
              {getRoomName(room)}
              <Badge variant="secondary" className="ml-auto">
                {devices.filter(d => d.room === room).length}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {/* 房间视图 */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{getRoomName(selectedRoom)}</h2>
            <p className="text-gray-600">点击设备图标查看详细信息和控制选项</p>
          </div>

          {/* 房间布局 */}
          <Card className="h-96 relative overflow-hidden">
            <CardContent className="p-0 h-full">
              <RoomLayout
                room={selectedRoom}
                devices={currentRoomDevices}
                selectedDevice={selectedDevice}
                onDeviceClick={handleDeviceClick}
                updating={updating}
              />
            </CardContent>
          </Card>
        </div>

        {/* 设备控制面板 */}
        {selectedDevice && (
          <div className="w-80 bg-white border-l p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getDeviceIcon(selectedDevice.type)
                    return <Icon className={`w-6 h-6 ${getStatusColor(selectedDevice.status)}`} />
                  })()}
                  <div>
                    <CardTitle>{selectedDevice.name}</CardTitle>
                    <p className="text-sm text-gray-500">{getRoomName(selectedDevice.room)}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 设备状态切换 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">设备状态:</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={selectedDevice.status === "on" ? "default" : "secondary"}
                      className={selectedDevice.status === "on" ? "bg-green-100 text-green-800" : ""}
                    >
                      {selectedDevice.status === "on" ? "开启" : selectedDevice.status === "off" ? "关闭" : "未知"}
                    </Badge>
                    <Switch
                      checked={selectedDevice.status === "on"}
                      disabled={updating === selectedDevice.id}
                      onCheckedChange={() => handleToggleDevice(selectedDevice.id)}
                    />
                  </div>
                </div>

                {/* 灯光控制 */}
                {selectedDevice.type === "light" && selectedDevice.status === "on" && (
                  <div>
                    <label className="text-sm font-medium">
                      亮度: {selectedDevice.properties?.brightness || 0}%
                    </label>
                    <Slider
                      value={[selectedDevice.properties?.brightness || 0]}
                      disabled={updating === selectedDevice.id}
                      onValueChange={([value]) => handlePropertyUpdate(selectedDevice.id, 'brightness', value)}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* 空调控制 */}
                {selectedDevice.type === "air_conditioner" && selectedDevice.status === "on" && (
                  <div>
                    <label className="text-sm font-medium">
                      温度: {selectedDevice.properties?.temperature || 24}°C
                    </label>
                    <Slider
                      value={[selectedDevice.properties?.temperature || 24]}
                      disabled={updating === selectedDevice.id}
                      onValueChange={([value]) => handlePropertyUpdate(selectedDevice.id, 'temperature', value)}
                      min={16}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* 传感器数据显示 */}
                {selectedDevice.type === "sensor" && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">数值:</span>
                      <span className="text-sm font-medium">
                        {selectedDevice.properties?.value !== undefined 
                          ? `${selectedDevice.properties.value} ${selectedDevice.properties?.unit || ''}`
                          : '无数据'
                        }
                      </span>
                    </div>
                    {selectedDevice.properties?.detection_duration !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">检测时长:</span>
                        <span className="text-sm font-medium">{selectedDevice.properties.detection_duration}秒</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 设备信息 */}
                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">设备ID:</span>
                    <span className="font-mono text-xs">{selectedDevice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最后更新:</span>
                    <span>{new Date(selectedDevice.last_updated).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
