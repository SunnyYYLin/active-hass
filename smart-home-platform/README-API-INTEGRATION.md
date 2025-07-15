# 前端代码适配说明

## 概述

前端代码已成功适配后端API，主要包含以下改进：

## 主要变更

### 1. API服务层 (`lib/api.ts`)
- 创建了完整的API服务类，包含所有后端接口
- 支持设备管理、AI助手交互、系统状态查询等功能
- 统一的错误处理和类型定义

### 2. 自定义Hooks
- `hooks/use-devices.ts`: 设备状态管理Hook
- `hooks/use-agent.ts`: AI助手交互Hook
- 提供了加载状态、错误处理、数据更新等功能

### 3. 组件更新

#### 设备面板 (`components/device-panel.tsx`)
- 适配后端设备模型 (Device类型)
- 支持通过properties动态显示设备属性
- 实现了设备状态切换和属性更新
- 优化了UI显示，增加了设备类型和房间信息

#### AI助手 (`components/ai-assistant.tsx`)
- 完全重写以使用后端LLM API
- 支持对话历史加载
- 显示LLM连接状态
- 支持分析当前家居状态
- 显示AI建议的操作和建议

#### 房间视图 (`components/room-view.tsx`)
- 适配新的设备数据结构
- 改进了房间布局显示
- 增加了设备详细控制面板

#### 自动化面板 (`components/automation-panel.tsx`)
- 增强了规则管理功能
- 添加了预设场景
- 改进了UI设计和用户体验

### 4. 主页面 (`app/page.tsx`)
- 使用新的Hooks管理状态
- 添加了加载状态和错误处理
- 简化了组件间的数据传递

### 5. 环境配置
- 添加了 `.env.local` 文件配置API地址
- 默认后端地址: `http://localhost:8000`

## API接口对应

### 设备管理
- `GET /api/devices/` - 获取所有设备
- `GET /api/devices/{id}` - 获取单个设备
- `PUT /api/devices/{id}` - 更新设备状态
- `POST /api/devices/{id}/toggle` - 切换设备状态
- `GET /api/devices/room/{room}` - 按房间获取设备

### AI助手
- `POST /api/agent/interact` - 与AI助手交互
- `GET /api/agent/status` - 获取助手状态
- `GET /api/agent/history` - 获取对话历史
- `POST /api/agent/analyze` - 分析当前状态
- `POST /api/agent/test-llm` - 测试LLM连接
- `POST /api/agent/reset` - 重置对话上下文

### 系统状态
- `GET /api/status` - 获取系统状态

## 数据类型适配

### 设备类型 (Device)
```typescript
interface Device {
  id: string
  name: string
  type: 'light' | 'air_conditioner' | 'sensor' | 'switch' | 'camera' | 'door'
  room: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony'
  status: 'on' | 'off' | 'unknown'
  properties: Record<string, any>
  last_updated: string
  created_at: string
}
```

### 设备属性示例
- **灯光设备**: `{ brightness: number }`
- **空调设备**: `{ temperature: number, mode: string }`
- **传感器设备**: `{ value: number, unit: string, detection_duration: number }`

## 使用方法

### 1. 启动后端服务
```bash
cd backend
python app.py
```

### 2. 启动前端服务
```bash
cd smart-home-platform
npm run dev
```

### 3. 访问应用
打开浏览器访问: `http://localhost:3000`

## 主要功能

1. **设备监控**: 查看所有设备状态，实时控制设备
2. **房间视图**: 按房间查看设备，可视化设备布局
3. **AI助手**: 与智能助手对话，获取智能建议
4. **自动化**: 设置自动化规则和场景模式

## 错误处理

- 网络错误自动显示提示
- API错误统一处理
- 加载状态指示
- 重试机制

## 环境变量

在 `.env.local` 文件中配置：
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 注意事项

1. 确保后端服务已启动并可访问
2. 检查API地址配置是否正确
3. 如有CORS问题，请检查后端CORS配置
4. 建议使用Chrome或Firefox等现代浏览器
