"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Clock, Zap, Trash2 } from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  status: string
  room: string
}

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
    },
    {
      id: "rule2",
      name: "离家模式",
      enabled: true,
      trigger: { type: "device", value: "door1", condition: "locked" },
      action: { deviceId: "light1", action: "turn_off" },
    },
  ])

  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: "",
    enabled: true,
    trigger: { type: "time", value: "" },
    action: { deviceId: "", action: "" },
  })

  const addRule = () => {
    if (newRule.name && newRule.trigger?.value && newRule.action?.deviceId) {
      const rule: AutomationRule = {
        id: `rule${Date.now()}`,
        name: newRule.name,
        enabled: newRule.enabled || true,
        trigger: newRule.trigger as AutomationRule["trigger"],
        action: newRule.action as AutomationRule["action"],
      }
      setRules([...rules, rule])
      setNewRule({
        name: "",
        enabled: true,
        trigger: { type: "time", value: "" },
        action: { deviceId: "", action: "" },
      })
      setShowAddRule(false)
    }
  }

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter((rule) => rule.id !== ruleId))
  }

  const toggleRule = (ruleId: string) => {
    setRules(rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const getTriggerText = (trigger: AutomationRule["trigger"]) => {
    switch (trigger.type) {
      case "time":
        return `时间: ${trigger.value}`
      case "device":
        const device = devices.find((d) => d.id === trigger.value)
        return `设备: ${device?.name} ${trigger.condition}`
      default:
        return trigger.value
    }
  }

  const getActionText = (action: AutomationRule["action"]) => {
    const device = devices.find((d) => d.id === action.deviceId)
    const actionText = action.action === "turn_on" ? "开启" : action.action === "turn_off" ? "关闭" : action.action
    return `${device?.name} ${actionText}${action.value ? ` (${action.value})` : ""}`
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">自动化规则</h2>
          <p className="text-gray-600">设置智能家居自动化场景</p>
        </div>
        <Button onClick={() => setShowAddRule(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加规则
        </Button>
      </div>

      {showAddRule && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>创建新规则</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">规则名称</label>
              <Input
                value={newRule.name || ""}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="输入规则名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">触发条件</label>
                <Select
                  value={newRule.trigger?.type}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      trigger: { ...newRule.trigger!, type: value as "time" | "device" | "sensor" },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择触发类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">定时</SelectItem>
                    <SelectItem value="device">设备状态</SelectItem>
                    <SelectItem value="sensor">传感器</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">触发值</label>
                {newRule.trigger?.type === "time" ? (
                  <Input
                    type="time"
                    value={newRule.trigger.value}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        trigger: { ...newRule.trigger!, value: e.target.value },
                      })
                    }
                  />
                ) : (
                  <Select
                    value={newRule.trigger?.value}
                    onValueChange={(value) =>
                      setNewRule({
                        ...newRule,
                        trigger: { ...newRule.trigger!, value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择设备" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">执行设备</label>
                <Select
                  value={newRule.action?.deviceId}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      action: { ...newRule.action!, deviceId: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择设备" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">执行动作</label>
                <Select
                  value={newRule.action?.action}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      action: { ...newRule.action!, action: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择动作" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="turn_on">开启</SelectItem>
                    <SelectItem value="turn_off">关闭</SelectItem>
                    <SelectItem value="set_brightness">设置亮度</SelectItem>
                    <SelectItem value="set_temperature">设置温度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addRule}>保存规则</Button>
              <Button variant="outline" onClick={() => setShowAddRule(false)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <div>
                    <h3 className="font-semibold">{rule.name}</h3>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getTriggerText(rule.trigger)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {getActionText(rule.action)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
