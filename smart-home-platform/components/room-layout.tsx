"use client"

import { useState } from "react"
import { Device } from "@/lib/api"
import { Lightbulb, Wind, Tv, Blinds, DoorOpen, Camera, ToggleLeft, Activity } from "lucide-react"

interface RoomLayoutProps {
  room: string
  devices: Device[]
  selectedDevice?: Device | null
  onDeviceClick?: (device: Device) => void
  updating?: string | null
}

interface RoomConfig {
  name: string
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>
  furniture: Array<{ 
    type: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    rotation?: number 
  }>
  zones: {
    [deviceType: string]: Array<{ x: number; y: number; label?: string }>
  }
}

export function RoomLayout({ room, devices, selectedDevice, onDeviceClick, updating }: RoomLayoutProps) {
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

  const getRoomConfig = (roomType: string): RoomConfig => {
    const configs: { [key: string]: RoomConfig } = {
      living_room: {
        name: '客厅',
        walls: [
          { x1: 5, y1: 10, x2: 95, y2: 10 }, // 上墙
          { x1: 95, y1: 10, x2: 95, y2: 90 }, // 右墙
          { x1: 95, y1: 90, x2: 5, y2: 90 }, // 下墙
          { x1: 5, y1: 90, x2: 5, y2: 10 }, // 左墙
        ],
        furniture: [
          { type: 'sofa', x: 30, y: 60, width: 40, height: 15 },
          { type: 'tv_stand', x: 35, y: 15, width: 30, height: 8 },
          { type: 'coffee_table', x: 40, y: 50, width: 20, height: 10 },
          { type: 'window', x: 70, y: 10, width: 20, height: 3 },
        ],
        zones: {
          light: [
            { x: 25, y: 20, label: '主灯' }, 
            { x: 75, y: 20, label: '辅灯' },
            { x: 15, y: 70, label: '台灯' }, 
            { x: 85, y: 70, label: '落地灯' }
          ],
          tv: [{ x: 50, y: 19, label: '电视' }],
          air_conditioner: [{ x: 90, y: 25, label: '空调' }],
          curtain: [{ x: 80, y: 15, label: '窗帘' }],
          switch: [{ x: 10, y: 30, label: '开关' }, { x: 10, y: 70, label: '开关' }],
          sensor: [{ x: 20, y: 25, label: '传感器' }, { x: 80, y: 85, label: '传感器' }],
          camera: [{ x: 15, y: 15, label: '摄像头' }],
          door: [{ x: 5, y: 50, label: '门' }]
        }
      },
      bedroom: {
        name: '卧室',
        walls: [
          { x1: 10, y1: 15, x2: 90, y2: 15 },
          { x1: 90, y1: 15, x2: 90, y2: 85 },
          { x1: 90, y1: 85, x2: 10, y2: 85 },
          { x1: 10, y1: 85, x2: 10, y2: 15 },
        ],
        furniture: [
          { type: 'bed', x: 25, y: 35, width: 35, height: 25 },
          { type: 'wardrobe', x: 70, y: 20, width: 15, height: 40 },
          { type: 'desk', x: 15, y: 70, width: 25, height: 10 },
          { type: 'window', x: 65, y: 15, width: 20, height: 3 },
        ],
        zones: {
          light: [{ x: 50, y: 25, label: '主灯' }, { x: 20, y: 65, label: '床头灯' }, { x: 80, y: 65, label: '台灯' }],
          air_conditioner: [{ x: 85, y: 30, label: '空调' }],
          curtain: [{ x: 75, y: 20, label: '窗帘' }],
          switch: [{ x: 15, y: 30, label: '开关' }],
          sensor: [{ x: 25, y: 30, label: '传感器' }],
          camera: [{ x: 20, y: 20, label: '摄像头' }],
          door: [{ x: 10, y: 50, label: '门' }]
        }
      },
      kitchen: {
        name: '厨房',
        walls: [
          { x1: 15, y1: 20, x2: 85, y2: 20 },
          { x1: 85, y1: 20, x2: 85, y2: 80 },
          { x1: 85, y1: 80, x2: 15, y2: 80 },
          { x1: 15, y1: 80, x2: 15, y2: 20 },
        ],
        furniture: [
          { type: 'counter', x: 20, y: 25, width: 60, height: 10 },
          { type: 'sink', x: 35, y: 25, width: 15, height: 10 },
          { type: 'stove', x: 55, y: 25, width: 15, height: 10 },
          { type: 'fridge', x: 75, y: 40, width: 8, height: 15 },
        ],
        zones: {
          light: [{ x: 30, y: 30, label: '主灯' }, { x: 70, y: 30, label: '辅灯' }],
          switch: [{ x: 20, y: 35, label: '开关' }],
          sensor: [{ x: 50, y: 35, label: '烟雾传感器' }, { x: 75, y: 65, label: '温度传感器' }],
          camera: [{ x: 80, y: 25, label: '摄像头' }],
          door: [{ x: 15, y: 50, label: '门' }]
        }
      },
      bathroom: {
        name: '卫生间',
        walls: [
          { x1: 20, y1: 25, x2: 80, y2: 25 },
          { x1: 80, y1: 25, x2: 80, y2: 75 },
          { x1: 80, y1: 75, x2: 20, y2: 75 },
          { x1: 20, y1: 75, x2: 20, y2: 25 },
        ],
        furniture: [
          { type: 'toilet', x: 25, y: 45, width: 12, height: 15 },
          { type: 'sink', x: 50, y: 30, width: 15, height: 10 },
          { type: 'shower', x: 65, y: 45, width: 12, height: 15 },
        ],
        zones: {
          light: [{ x: 50, y: 35, label: '主灯' }],
          switch: [{ x: 25, y: 30, label: '开关' }],
          sensor: [{ x: 40, y: 65, label: '湿度传感器' }],
          door: [{ x: 20, y: 50, label: '门' }]
        }
      },
      balcony: {
        name: '阳台',
        walls: [
          { x1: 25, y1: 30, x2: 75, y2: 30 },
          { x1: 75, y1: 30, x2: 75, y2: 70 },
          { x1: 75, y1: 70, x2: 25, y2: 70 },
          { x1: 25, y1: 70, x2: 25, y2: 30 },
        ],
        furniture: [
          { type: 'railing', x: 70, y: 35, width: 3, height: 30 },
          { type: 'plant_stand', x: 40, y: 45, width: 8, height: 8 },
        ],
        zones: {
          light: [{ x: 50, y: 40, label: '主灯' }],
          curtain: [{ x: 70, y: 50, label: '窗帘' }],
          switch: [{ x: 30, y: 35, label: '开关' }],
          sensor: [{ x: 45, y: 60, label: '传感器' }],
          door: [{ x: 25, y: 50, label: '门' }]
        }
      }
    }
    return configs[roomType] || configs.living_room
  }

  const config = getRoomConfig(room)

  const getDevicePosition = (device: Device, deviceIndex: number) => {
    const typeZones = config.zones[device.type] || []
    
    if (typeZones.length === 0) {
      // 如果没有预定义位置，使用网格布局
      const allDevices = devices
      const totalDevices = allDevices.length
      const deviceIdx = allDevices.findIndex(d => d.id === device.id)
      const gridCols = Math.ceil(Math.sqrt(totalDevices))
      const row = Math.floor(deviceIdx / gridCols)
      const col = deviceIdx % gridCols
      
      return {
        x: 25 + (col * 50) / gridCols,
        y: 25 + (row * 50) / Math.ceil(totalDevices / gridCols),
      }
    }
    
    // 使用预定义位置
    const zoneIndex = deviceIndex % typeZones.length
    const basePosition = typeZones[zoneIndex]
    
    // 如果是同类型的第二个或更多设备，稍微偏移位置
    if (deviceIndex >= typeZones.length) {
      const offset = Math.floor(deviceIndex / typeZones.length)
      return {
        x: Math.min(90, Math.max(10, basePosition.x + (offset * 5))),
        y: Math.min(80, Math.max(20, basePosition.y + (offset * 5))),
      }
    }
    
    return basePosition
  }

  const renderFurniture = (furniture: any) => {
    const furnitureIcons: { [key: string]: string } = {
      sofa: '/furniture/sofa.svg',
      bed: '/furniture/bed.svg',
      tv_stand: '/furniture/tv_stand.svg',
      coffee_table: '/furniture/coffee_table.svg',
      counter: '/furniture/counter.svg',
      desk: '/furniture/desk.svg',
      wardrobe: '/furniture/wardrobe.svg',
      toilet: '/furniture/toilet.svg',
      sink: '/furniture/sink.svg',
      shower: '/furniture/shower.svg',
      stove: '/furniture/stove.svg',
      fridge: '/furniture/fridge.svg',
      window: '/furniture/window.svg',
      railing: '/furniture/railing.svg',
      plant_stand: '/furniture/plant_stand.svg'
    }
    
    const iconPath = furnitureIcons[furniture.type]
    
    if (iconPath) {
      return (
        <image
          key={`${furniture.type}-${furniture.x}-${furniture.y}`}
          x={`${furniture.x}%`}
          y={`${furniture.y}%`}
          width={`${furniture.width}%`}
          height={`${furniture.height}%`}
          href={iconPath}
          opacity="0.9"
          filter="url(#drop-shadow)"
        />
      )
    }
    
    // 如果没有对应的图标，回退到原来的方块显示
    const furnitureColors: { [key: string]: string } = {
      sofa: '#8B5CF6',
      bed: '#EC4899',
      tv_stand: '#374151',
      coffee_table: '#92400E',
      counter: '#6B7280',
      desk: '#92400E',
      wardrobe: '#7C3AED',
      toilet: '#E5E7EB',
      sink: '#3B82F6',
      shower: '#E5E7EB',
      stove: '#EF4444',
      fridge: '#F3F4F6',
      window: '#60A5FA',
      railing: '#6B7280',
      plant_stand: '#10B981'
    }
    
    return (
      <rect
        key={`${furniture.type}-${furniture.x}-${furniture.y}`}
        x={`${furniture.x}%`}
        y={`${furniture.y}%`}
        width={`${furniture.width}%`}
        height={`${furniture.height}%`}
        fill={furnitureColors[furniture.type] || '#9CA3AF'}
        opacity="0.6"
        rx="2"
      />
    )
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
      {/* SVG 背景层 - 墙壁和家具 */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {/* 定义滤镜效果 */}
        <defs>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
          </filter>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        
        {/* 房间墙壁 */}
        {config.walls.map((wall, index) => (
          <line
            key={`wall-${index}`}
            x1={`${wall.x1}%`}
            y1={`${wall.y1}%`}
            x2={`${wall.x2}%`}
            y2={`${wall.y2}%`}
            stroke="#1F2937"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
        
        {/* 家具 */}
        {config.furniture.map(renderFurniture)}
        
        {/* 房间名称 */}
        <text
          x="50%"
          y="8%"
          textAnchor="middle"
          className="fill-gray-700 text-lg font-bold"
        >
          {config.name}
        </text>
        
        {/* 网格线（可选，用于调试） */}
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 设备图标层 */}
      {devices.map((device, index) => {
        const Icon = getDeviceIcon(device.type)
        const devicesOfSameType = devices.filter(d => d.type === device.type)
        const deviceTypeIndex = devicesOfSameType.findIndex(d => d.id === device.id)
        const position = getDevicePosition(device, deviceTypeIndex)
        const isSelected = selectedDevice?.id === device.id
        const isUpdating = updating === device.id
        
        return (
          <button
            key={device.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
              isSelected 
                ? "ring-3 ring-blue-500 bg-blue-50 shadow-lg scale-110" 
                : "hover:bg-white/90 hover:shadow-md hover:scale-105"
            } p-3 rounded-full transition-all duration-300 ${
              isUpdating ? "opacity-50 cursor-not-allowed animate-pulse" : "cursor-pointer"
            } bg-white/80 backdrop-blur-sm border-2 border-white/50`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              zIndex: isSelected ? 20 : 10,
            }}
            onClick={() => onDeviceClick?.(device)}
            disabled={isUpdating}
          >
            <Icon 
              className={`w-6 h-6 ${getStatusColor(device.status)}`} 
            />
            
            {/* 设备名称标签 */}
            <div className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap px-2 py-1 rounded-md shadow-sm ${
              isSelected 
                ? "bg-blue-100 text-blue-800 border border-blue-200" 
                : "bg-white/90 text-gray-700 border border-gray-200"
            }`}>
              {device.name}
            </div>
            
            {/* 设备状态指示器 */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
              device.status === 'on' ? 'bg-green-400' : 
              device.status === 'off' ? 'bg-gray-400' : 'bg-yellow-400'
            }`} />
            
            {/* 设备类型小图标 */}
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-full border border-gray-300 flex items-center justify-center">
              <Icon className="w-2 h-2 text-gray-600" />
            </div>
          </button>
        )
      })}
      
      {/* 空房间提示 */}
      {devices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 15 }}>
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/50">
            <p className="text-gray-500 text-lg mb-2">该房间暂无设备</p>
            <p className="text-gray-400 text-sm">请在其他房间查看设备</p>
          </div>
        </div>
      )}
    </div>
  )
}
