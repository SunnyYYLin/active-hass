"use client"

import { useState } from "react"
import { Device } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FloorPlanProps {
  devices: Device[]
  onRoomSelect: (room: string) => void
}

interface RoomInfo {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

export function FloorPlan({ devices, onRoomSelect }: FloorPlanProps) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null)

  const rooms: RoomInfo[] = [
    {
      id: 'living_room',
      name: '客厅',
      x: 30,
      y: 30,
      width: 40,
      height: 35,
      color: '#E3F2FD'
    },
    {
      id: 'bedroom',
      name: '卧室',
      x: 10,
      y: 30,
      width: 18,
      height: 25,
      color: '#F3E5F5'
    },
    {
      id: 'kitchen',
      name: '厨房',
      x: 72,
      y: 30,
      width: 18,
      height: 25,
      color: '#E8F5E8'
    },
    {
      id: 'bathroom',
      name: '卫生间',
      x: 10,
      y: 57,
      width: 18,
      height: 18,
      color: '#FFF3E0'
    },
    {
      id: 'balcony',
      name: '阳台',
      x: 72,
      y: 57,
      width: 18,
      height: 18,
      color: '#E0F2F1'
    }
  ]

  const getRoomDeviceCount = (roomId: string) => {
    return devices.filter(device => device.room === roomId).length
  }

  const getRoomActiveDeviceCount = (roomId: string) => {
    return devices.filter(device => device.room === roomId && device.status === 'on').length
  }

  const getDoorPosition = (roomId: string) => {
    switch (roomId) {
      case 'living_room':
        return { x: 30, y: 47.5 } // 左侧门
      case 'bedroom':
        return { x: 28, y: 42.5 } // 右侧门
      case 'kitchen':
        return { x: 72, y: 42.5 } // 左侧门
      case 'bathroom':
        return { x: 28, y: 66 } // 右侧门
      case 'balcony':
        return { x: 72, y: 66 } // 左侧门
      default:
        return { x: 0, y: 0 }
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6 h-full">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">家居平面图</h2>
          <p className="text-gray-600">点击房间进入查看和控制设备</p>
        </div>

        <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
          {/* SVG 背景层 */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* 外墙 */}
            <rect
              x="8%"
              y="25%"
              width="84%"
              height="55%"
              fill="none"
              stroke="#374151"
              strokeWidth="4"
            />
            
            {/* 内墙 */}
            {/* 客厅与卧室之间的墙 */}
            <line x1="30%" y1="30%" x2="30%" y2="65%" stroke="#374151" strokeWidth="3" />
            {/* 客厅与厨房之间的墙 */}
            <line x1="70%" y1="30%" x2="70%" y2="65%" stroke="#374151" strokeWidth="3" />
            {/* 卧室与卫生间之间的墙 */}
            <line x1="10%" y1="55%" x2="28%" y2="55%" stroke="#374151" strokeWidth="3" />
            {/* 客厅与卫生间/阳台之间的墙 */}
            <line x1="30%" y1="55%" x2="70%" y2="55%" stroke="#374151" strokeWidth="3" />
            {/* 厨房与阳台之间的墙 */}
            <line x1="72%" y1="55%" x2="90%" y2="55%" stroke="#374151" strokeWidth="3" />

            {/* 门 */}
            {rooms.map((room) => {
              const doorPos = getDoorPosition(room.id)
              return (
                <g key={`door-${room.id}`}>
                  <circle
                    cx={`${doorPos.x}%`}
                    cy={`${doorPos.y}%`}
                    r="3"
                    fill="#8B5CF6"
                    stroke="#6D28D9"
                    strokeWidth="1"
                  />
                  <text
                    x={`${doorPos.x}%`}
                    y={`${doorPos.y + 8}%`}
                    textAnchor="middle"
                    className="fill-gray-600 text-xs font-medium"
                  >
                    门
                  </text>
                </g>
              )
            })}

            {/* 标题 */}
            <text
              x="50%"
              y="15%"
              textAnchor="middle"
              className="fill-gray-800 text-xl font-bold"
            >
              智能家居平面图
            </text>

            {/* 网格线（可选） */}
            <defs>
              <pattern id="floorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#floorGrid)" />
          </svg>

          {/* 房间区域 */}
          {rooms.map((room) => {
            const deviceCount = getRoomDeviceCount(room.id)
            const activeCount = getRoomActiveDeviceCount(room.id)
            const isHovered = hoveredRoom === room.id

            return (
              <button
                key={room.id}
                className={`absolute transition-all duration-300 rounded-lg border-2 ${
                  isHovered
                    ? "border-blue-500 shadow-lg scale-105 z-20"
                    : "border-gray-300 hover:border-blue-300 hover:shadow-md z-10"
                } bg-white/80 backdrop-blur-sm cursor-pointer`}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.width}%`,
                  height: `${room.height}%`,
                  backgroundColor: isHovered ? room.color : `${room.color}80`,
                }}
                onClick={() => onRoomSelect(room.id)}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
              >
                <div className="flex flex-col items-center justify-center h-full p-2">
                  {/* 房间名称 */}
                  <h3 className={`font-bold text-gray-800 mb-2 ${
                    room.width > 25 ? 'text-lg' : 'text-sm'
                  }`}>
                    {room.name}
                  </h3>
                  
                  {/* 设备统计 */}
                  <div className="flex flex-col items-center space-y-1">
                    <Badge variant="outline" className="text-xs bg-white/90">
                      {deviceCount} 个设备
                    </Badge>
                    {activeCount > 0 && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        {activeCount} 个开启
                      </Badge>
                    )}
                  </div>

                  {/* 房间图标 */}
                  <div className="mt-2 text-2xl opacity-60">
                    {room.id === 'living_room' && '🛋️'}
                    {room.id === 'bedroom' && '🛏️'}
                    {room.id === 'kitchen' && '🍳'}
                    {room.id === 'bathroom' && '🚿'}
                    {room.id === 'balcony' && '🌿'}
                  </div>
                </div>
              </button>
            )
          })}

          {/* 指南针 */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 border border-gray-300 z-30">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-400 rounded-full relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 text-red-500 text-xs font-bold">
                    N
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 图例 */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-300 z-30">
            <h4 className="text-sm font-semibold mb-2">图例</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>门</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-gray-400"></div>
                <span>墙</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
