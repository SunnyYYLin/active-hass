"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Zap, Trash2, Settings, Play, Pause } from "lucide-react"
import { Device } from "@/lib/api"

interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  trigger: {
    type: "time" | "device" | "sensor"
    value: string
    condition?: string
  }
  action: {
    deviceId: string
    action: string
    value?: string
  }
  lastExecuted?: string
  executionCount: number
}

interface AutomationPanelProps {
  devices: Device[]
}

export function AutomationPanel({ devices }: AutomationPanelProps) {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "rule1",
      name: "晚上自动开灯",
      enabled: true,
      trigger: { type: "time", value: "19:00" },
      action: { deviceId: "light1", action: "turn_on", value: "80" },
      lastExecuted: "2025-01-14 19:00:00",
      executionCount: 15,
    },
    {
      id: "rule2",
      name: "离家安全模式",
      enabled: true,
      trigger: { type: "sensor", value: "door_sensor", condition: "closed_for_30min" },
      action: { deviceId: "all_lights", action: "turn_off" },
      executionCount: 8,
    },
    {
      id: "rule3",
      name: "温度自动调节",
      enabled: false,
      trigger: { type: "sensor", value: "temperature", condition: ">28" },
      action: { deviceId: "ac1", action: "turn_on", value: "24" },
      executionCount: 3,
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: "",
    enabled: true,
    trigger: { type: "time", value: "" },
    action: { deviceId: "", action: "turn_on" },
  })

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

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId)
    return device ? device.name : deviceId
  }

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case "time": return "定时触发"
      case "device": return "设备状态"
      case "sensor": return "传感器"
      default: return type
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "turn_on": return "开启"
      case "turn_off": return "关闭"
      case "toggle": return "切换"
      case "set_brightness": return "设置亮度"
      case "set_temperature": return "设置温度"
      default: return action
    }
  }

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.trigger?.value || !newRule.action?.deviceId) {
      return
    }

    const rule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      enabled: newRule.enabled || true,
      trigger: newRule.trigger as AutomationRule['trigger'],
      action: newRule.action as AutomationRule['action'],
      executionCount: 0,
    }

    setRules(prev => [...prev, rule])
    setNewRule({
      name: "",
      enabled: true,
      trigger: { type: "time", value: "" },
      action: { deviceId: "", action: "turn_on" },
    })
    setIsCreating(false)
  }

  const presetScenes = [
    {
      name: "回家模式",
      description: "开启客厅灯光，设置舒适温度",
      actions: ["客厅主灯开启", "空调设置24°C"]
    },
    {
      name: "睡眠模式", 
      description: "关闭所有灯光，降低空调温度",
      actions: ["关闭所有灯光", "空调设置22°C"]
    },
    {
      name: "离家模式",
      description: "关闭所有设备，启动安全监控",
      actions: ["关闭所有设备", "启动摄像头监控"]
    },
    {
      name: "观影模式",
      description: "调暗灯光，开启电视",
      actions: ["灯光调至30%", "打开客厅电视"]
    }
  ]

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">智能自动化</h2>
        <p className="text-gray-600">设置自动化规则和场景模式</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 自动化规则列表 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">自动化规则</h3>
            <Button
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
            >
              <Plus className="w-4 h-4 mr-2" />
              新增规则
            </Button>
          </div>

          {/* 创建新规则表单 */}
          {isCreating && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">创建新规则</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">规则名称</label>
                  <Input
                    value={newRule.name || ""}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入规则名称"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">触发类型</label>
                    <Select
                      value={newRule.trigger?.type}
                      onValueChange={(value) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, type: value as any }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">定时触发</SelectItem>
                        <SelectItem value="device">设备状态</SelectItem>
                        <SelectItem value="sensor">传感器</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">触发条件</label>
                    <Input
                      value={newRule.trigger?.value || ""}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, value: e.target.value }
                      }))}
                      placeholder={newRule.trigger?.type === "time" ? "19:00" : "条件值"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">目标设备</label>
                    <Select
                      value={newRule.action?.deviceId}
                      onValueChange={(value) => setNewRule(prev => ({
                        ...prev,
                        action: { ...prev.action!, deviceId: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择设备" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map(device => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} ({getRoomName(device.room)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">执行动作</label>
                    <Select
                      value={newRule.action?.action}
                      onValueChange={(value) => setNewRule(prev => ({
                        ...prev,
                        action: { ...prev.action!, action: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turn_on">开启</SelectItem>
                        <SelectItem value="turn_off">关闭</SelectItem>
                        <SelectItem value="toggle">切换</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateRule}>创建规则</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 规则列表 */}
          <div className="space-y-3">
            {rules.map((rule) => (
              <Card key={rule.id} className={rule.enabled ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "启用" : "禁用"}
                        </Badge>
                        {rule.executionCount > 0 && (
                          <Badge variant="outline">
                            执行 {rule.executionCount} 次
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {getTriggerTypeLabel(rule.trigger.type)}: {rule.trigger.value}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>
                            {getActionLabel(rule.action.action)} {getDeviceName(rule.action.deviceId)}
                            {rule.action.value && ` (${rule.action.value})`}
                          </span>
                        </div>
                        {rule.lastExecuted && (
                          <div className="text-xs text-gray-500">
                            最后执行: {rule.lastExecuted}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 预设场景 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">预设场景</h3>
          
          <div className="space-y-3">
            {presetScenes.map((scene, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{scene.name}</h4>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{scene.description}</p>
                  
                  <div className="space-y-1">
                    {scene.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        {action}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 统计信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">统计信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">活跃规则:</span>
                <span className="font-medium">{rules.filter(r => r.enabled).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">总规则数:</span>
                <span className="font-medium">{rules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">今日执行:</span>
                <span className="font-medium">{rules.reduce((sum, r) => sum + r.executionCount, 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
