# 主动家居智能体 API 文档

## 📖 概述

主动家居智能体是一个基于DashScope qwen模型的智能化家居管理系统，提供设备管理、智能分析和自然语言交互功能。

**API基础信息**
- **基础URL**: `http://localhost:8000`
- **API版本**: v1.0.0
- **认证方式**: 暂不需要认证
- **数据格式**: JSON
- **字符编码**: UTF-8

## 🏠 系统状态接口

### 获取系统状态
获取系统整体运行状态信息。

```http
GET /api/status
```

**响应示例**
```json
{
    "status": "running",
    "devices_count": 7,
    "agent_active": true,
    "timestamp": "2025-07-15T04:04:31.972456"
}
```

## 🔧 设备管理接口

### 1. 获取所有设备
获取系统中所有智能设备的列表。

```http
GET /api/devices/
```

**响应示例**
```json
[
    {
        "id": "light_bedroom",
        "name": "卧室主灯",
        "type": "light",
        "room": "bedroom",
        "status": "on",
        "brightness": 80,
        "last_updated": "2025-07-15T04:04:31.972456",
        "created_at": "2025-07-15T04:00:00.000000",
        "properties": {}
    },
    {
        "id": "sensor_bedroom_motion",
        "name": "卧室人体感应器",
        "type": "sensor",
        "room": "bedroom",
        "status": "on",
        "sensor_type": "motion",
        "value": 1,
        "unit": "boolean",
        "detection_duration": 300,
        "last_updated": "2025-07-15T04:04:31.972456",
        "created_at": "2025-07-15T04:00:00.000000",
        "properties": {}
    }
]
```

### 2. 按房间获取设备
获取指定房间的所有设备。

```http
GET /api/devices/room/{room}
```

**路径参数**
- `room` (string): 房间类型
  - `living_room` - 客厅
  - `bedroom` - 卧室
  - `kitchen` - 厨房
  - `bathroom` - 卫生间
  - `balcony` - 阳台

**请求示例**
```http
GET /api/devices/room/bedroom
```

### 3. 获取单个设备
获取指定设备的详细信息。

```http
GET /api/devices/{device_id}
```

**路径参数**
- `device_id` (string): 设备唯一标识符

**请求示例**
```http
GET /api/devices/light_bedroom
```

### 4. 更新设备状态
更新指定设备的状态和属性。

```http
PUT /api/devices/{device_id}
```

**请求体**
```json
{
    "status": "on",
    "properties": {
        "brightness": 90,
        "color": "#ffffff"
    }
}
```

**响应示例**
```json
{
    "success": true,
    "message": "设备状态更新成功",
    "device": {
        "id": "light_bedroom",
        "name": "卧室主灯",
        "type": "light",
        "room": "bedroom",
        "status": "on",
        "brightness": 90,
        "last_updated": "2025-07-15T04:04:31.972456"
    }
}
```

### 5. 切换设备开关
快速切换设备的开关状态。

```http
POST /api/devices/{device_id}/toggle
```

**请求示例**
```http
POST /api/devices/light_kitchen/toggle
```

**响应示例**
```json
{
    "success": true,
    "message": "设备已开启",
    "device": {
        "id": "light_kitchen",
        "name": "厨房灯",
        "status": "on"
    }
}
```

### 6. 获取设备状态摘要
获取所有设备的统计信息。

```http
GET /api/devices/status/summary
```

**响应示例**
```json
{
    "total_devices": 7,
    "devices_on": 4,
    "devices_off": 3,
    "by_type": {
        "light": {"total": 3, "on": 2, "off": 1},
        "sensor": {"total": 3, "on": 3, "off": 0},
        "air_conditioner": {"total": 1, "on": 0, "off": 1}
    },
    "by_room": {
        "bedroom": {"total": 3, "on": 2, "off": 1},
        "living_room": {"total": 2, "on": 1, "off": 1},
        "kitchen": {"total": 1, "on": 0, "off": 1}
    }
}
```

### 7. 获取所有房间列表
获取系统支持的所有房间类型。

```http
GET /api/devices/rooms
```

**响应示例**
```json
{
    "success": true,
    "rooms": [
        {"value": "living_room", "name": "客厅"},
        {"value": "bedroom", "name": "卧室"},
        {"value": "kitchen", "name": "厨房"},
        {"value": "bathroom", "name": "卫生间"},
        {"value": "balcony", "name": "阳台"}
    ],
    "total": 5
}
```

## 🤖 智能体接口

### 1. 用户交互
与AI助手进行自然语言对话。

```http
POST /api/agent/interact
```

**请求体**
```json
{
    "message": "请分析一下当前家里的状态，并给出优化建议",
    "context": {
        "user_id": "user123",
        "session_id": "session456"
    }
}
```

**响应示例**
```json
{
    "message": "我发现客厅没有人但灯还开着，建议关掉节省电费。卧室温度有点高，可以考虑开空调。",
    "suggestions": [],
    "actions_taken": [
        {
            "type": "turn_off_lights",
            "room": "living_room",
            "devices": ["light_living"],
            "status": "completed"
        }
    ],
    "needs_user_confirmation": false,
    "timestamp": "2025-07-15T04:04:31.972456"
}
```

### 2. 智能状态分析
使用LLM分析当前家居状态并生成建议。

```http
POST /api/agent/analyze
```

**响应示例**
```json
{
    "current_state": {
        "devices": [...],
        "timestamp": "2025-07-15T04:04:31.972456",
        "room_occupancy": {
            "bedroom": true,
            "living_room": false,
            "kitchen": false
        },
        "summary": "仅卧室有人"
    },
    "suggestion": {
        "id": "sugg_123",
        "content": "客厅没有人，但灯还开着，需要我帮你关吗？",
        "suggested_actions": [
            {
                "type": "turn_off_lights",
                "room": "living_room",
                "devices": ["light_living"]
            }
        ],
        "reasoning": "基于qwen模型的智能分析",
        "timestamp": "2025-07-15T04:04:31.972456"
    },
    "analysis_time": "2025-07-15T04:04:31.972456"
}
```

### 3. 测试LLM集成
测试LLM模型的可用性和响应质量。

```http
POST /api/agent/test-llm
```

**响应示例**
```json
{
    "llm_available": true,
    "model": "qwen-turbo",
    "test_response": "你在卧室待了5分钟了，客厅的灯还开着，要不要关掉节省电费？",
    "client_type": "OpenAI"
}
```

### 4. 获取智能体状态
查看智能体当前运行状态和配置信息。

```http
GET /api/agent/status
```

**响应示例**
```json
{
    "active": true,
    "llm_available": true,
    "model": "qwen-turbo",
    "last_interaction": "2025-07-15T04:04:31.972456",
    "message_count": 15,
    "config": {
        "name": "家居助手",
        "model": "qwen-turbo",
        "max_context_length": 10,
        "response_delay": 1.0,
        "proactive_mode": true,
        "suggestion_threshold": 0.7
    }
}
```

### 5. 获取对话历史
获取用户与智能体的对话记录。

```http
GET /api/agent/history?limit=20
```

**查询参数**
- `limit` (integer, optional): 返回消息数量限制，默认20

**响应示例**
```json
[
    {
        "id": "msg_123",
        "role": "user",
        "content": "请分析一下当前家里的状态",
        "timestamp": "2025-07-15T04:04:31.972456",
        "metadata": {}
    },
    {
        "id": "msg_124",
        "role": "agent",
        "content": "我发现客厅没有人但灯还开着，建议关掉节省电费。",
        "timestamp": "2025-07-15T04:04:32.972456",
        "metadata": {
            "suggestion_id": "sugg_123",
            "reasoning": "基于qwen模型的智能分析"
        }
    }
]
```

### 6. 重置智能体上下文
清空智能体的对话历史和上下文信息。

```http
POST /api/agent/reset
```

**响应示例**
```json
{
    "message": "智能体上下文已重置"
}
```

## 📊 数据模型

### Device（设备模型）
```json
{
    "id": "string",           // 设备唯一标识
    "name": "string",         // 设备名称
    "type": "string",         // 设备类型：light/sensor/air_conditioner/switch/camera/door
    "room": "string",         // 所在房间：living_room/bedroom/kitchen/bathroom/balcony
    "status": "string",       // 设备状态：on/off/unknown
    "properties": "object",   // 设备属性（动态字段）
    "last_updated": "string", // 最后更新时间（ISO格式）
    "created_at": "string"    // 创建时间（ISO格式）
}
```

### LightDevice（灯光设备）
继承Device，额外包含：
```json
{
    "brightness": "integer",  // 亮度：0-100
    "color": "string"        // 颜色代码（可选）
}
```

### SensorDevice（传感器设备）
继承Device，额外包含：
```json
{
    "sensor_type": "string",      // 传感器类型：motion/temperature/humidity/light/door
    "value": "number",            // 传感器数值
    "unit": "string",             // 数值单位
    "detection_duration": "integer" // 检测持续时间（秒）
}
```

### ACDevice（空调设备）
继承Device，额外包含：
```json
{
    "temperature": "number",  // 设定温度
    "mode": "string",        // 模式：auto/cool/heat/fan
    "fan_speed": "integer"   // 风速：1-5
}
```

### AgentMessage（智能体消息）
```json
{
    "id": "string",          // 消息唯一标识
    "role": "string",        // 角色：user/agent/system
    "content": "string",     // 消息内容
    "timestamp": "string",   // 时间戳（ISO格式）
    "metadata": "object"     // 元数据
}
```

### AgentSuggestion（智能体建议）
```json
{
    "id": "string",              // 建议唯一标识
    "content": "string",         // 建议内容
    "suggested_actions": "array", // 建议的操作列表
    "reasoning": "string",       // 推理过程
    "timestamp": "string"        // 时间戳（ISO格式）
}
```

## 🚀 快速开始

### 1. 启动服务
```bash
cd backend
python app.py
```

### 2. 测试基本功能
```bash
# 查看系统状态
curl http://localhost:8000/api/status

# 获取所有设备
curl http://localhost:8000/api/devices/

# 与智能体对话
curl -X POST http://localhost:8000/api/agent/interact \
  -H "Content-Type: application/json" \
  -d '{"message": "帮我检查一下家里的状态"}'
```

### 3. 查看API文档
访问 http://localhost:8000/docs 获取交互式API文档。

## ⚡ 典型使用场景

### 场景1：设备控制
```bash
# 1. 获取卧室设备
curl http://localhost:8000/api/devices/room/bedroom

# 2. 切换卧室灯状态
curl -X POST http://localhost:8000/api/devices/light_bedroom/toggle

# 3. 调节亮度
curl -X PUT http://localhost:8000/api/devices/light_bedroom \
  -H "Content-Type: application/json" \
  -d '{"properties": {"brightness": 50}}'
```

### 场景2：智能分析
```bash
# 1. 触发状态分析
curl -X POST http://localhost:8000/api/agent/analyze

# 2. 用户确认建议
curl -X POST http://localhost:8000/api/agent/interact \
  -H "Content-Type: application/json" \
  -d '{"message": "好的，帮我关掉客厅的灯"}'

# 3. 查看执行结果
curl http://localhost:8000/api/devices/status/summary
```

### 场景3：对话交互
```bash
# 1. 询问建议
curl -X POST http://localhost:8000/api/agent/interact \
  -H "Content-Type: application/json" \
  -d '{"message": "现在适合开空调吗？"}'

# 2. 查看对话历史
curl http://localhost:8000/api/agent/history?limit=10
```

## 🔧 错误处理

### HTTP状态码
- `200` - 请求成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

### 错误响应格式
```json
{
    "detail": "错误描述信息"
}
```

### 常见错误
- **设备不存在**: `设备不存在` (404)
- **LLM不可用**: `LLM客户端不可用，无法生成建议` (500)
- **参数错误**: `请求参数验证失败` (400)

## 🛠️ 环境配置

### 必需环境变量
```env
# DashScope API配置（必需）
DASHSCOPE_API_KEY=your-dashscope-api-key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-turbo

# 应用配置
APP_NAME=Active Home Assistant
APP_VERSION=1.0.0
DEBUG=True

# 服务器配置
HOST=0.0.0.0
PORT=8000
```

## 📈 性能指标

- **响应时间**: < 500ms（LLM调用）
- **并发支持**: 100+ 用户
- **内存使用**: < 50MB
- **API吞吐**: 1000+ 请求/分钟

## 🔄 版本信息

- **当前版本**: v1.0.0
- **API版本**: v1
- **最后更新**: 2025-07-15
- **兼容性**: Python 3.8+

---

**🧠 由 DashScope qwen 模型驱动的智能家居API** 🏠✨

更多信息请参考：
- [项目总结文档](PROJECT_SUMMARY.md)
- [演示文档](DEMO.md) 
- [迁移指南](../MIGRATION_TO_LLM.md)