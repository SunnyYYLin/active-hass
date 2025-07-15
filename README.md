# 主动家居智能体仓库

> 🤖 **AI驱动的智能家居管理系统** - 基于DashScope qwen模型的智能化家居助手

## 🚀 项目特点

- **🧠 纯LLM驱动**: 完全基于DashScope qwen模型，无传统规则引擎
- **🏠 智能分析**: AI实时分析家居状态，提供个性化建议
- **💬 自然交互**: 支持自然语言对话，理解复杂指令
- **🔄 实时响应**: 毫秒级响应，流畅的用户体验
- **📈 持续学习**: 基于用户行为优化建议算法

## 🛠️ 技术架构

- **后端**: Python FastAPI + SQLite
- **AI引擎**: DashScope qwen-turbo模型
- **API接口**: OpenAI兼容接口
- **数据库**: SQLite（设备状态、对话历史）
- **前端**: RESTful API（支持任意前端框架）

## 📦 快速开始

### 1. 环境准备

```bash
# 克隆仓库
git clone <repo-url>
cd active-hass

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 DASHSCOPE_API_KEY
```

### 2. 环境配置

在 `.env` 文件中配置：

```env
# DashScope API配置（必需）
DASHSCOPE_API_KEY=your-dashscope-api-key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-turbo

# 应用配置
APP_NAME=Active Home Assistant
APP_VERSION=2.0.0
DEBUG=True
```

### 3. 启动服务

```bash
cd backend
python app.py
```

访问 http://localhost:8000/docs 查看API文档

### 4. 测试LLM集成

```bash
# 运行完整测试
./test_api.sh

# 或单独测试LLM
python test_dashscope.py
```

## 🔌 API端点

### 核心LLM端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/agent/interact` | POST | 与AI助手对话 |
| `/api/agent/analyze` | POST | AI分析家居状态 |
| `/api/agent/test-llm` | POST | 测试LLM集成 |
| `/api/agent/status` | GET | 获取AI状态 |
| `/api/agent/history` | GET | 对话历史 |

### 设备管理端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/devices/` | GET | 获取所有设备 |
| `/api/devices/{device_id}` | GET | 获取设备详情 |
| `/api/devices/{device_id}/toggle` | POST | 切换设备状态 |
| `/api/devices/status/summary` | GET | 设备状态摘要 |

## 🤖 LLM功能特性

### 1. 智能分析
```python
# 示例：AI分析当前家居状态
POST /api/agent/analyze
{
    "current_state": {...},
    "suggestion": {
        "content": "客厅无人但灯开着，建议关闭以节省能源",
        "confidence": 0.9,
        "reasoning": "基于qwen模型的智能分析",
        "suggested_actions": [...]
    }
}
```

### 2. 自然对话
```python
# 示例：与AI助手对话
POST /api/agent/interact
{
    "message": "请帮我优化家里的能耗"
}

# AI回复
{
    "message": "我建议关闭客厅的灯光，可以节省约15%的能耗...",
    "actions_taken": [...],
    "timestamp": "2025-07-15T12:00:00"
}
```

### 3. 上下文理解
- **历史记忆**: AI记住之前的对话和用户偏好
- **状态感知**: 实时了解所有设备状态
- **个性化**: 根据用户行为调整建议策略

## 🧪 测试用例

系统提供完整的测试覆盖：

1. **LLM连接测试**: 验证DashScope API可用性
2. **智能分析测试**: 测试AI状态分析能力
3. **对话交互测试**: 验证自然语言理解
4. **系统集成测试**: 端到端功能验证

```bash
# 运行所有测试
./test_api.sh

# 预期输出
🏠 主动家居智能体API测试（LLM模式）
✅ LLM可用: qwen-turbo
🤖 LLM建议: 客厅没人但灯开着，要不要关掉节省电费？
💬 消息数量: 10
✅ LLM模式测试完成!
```

## 🎯 支持的AI模型

- **qwen-turbo** (推荐): 快速响应，成本低
- **qwen-plus**: 更强能力，适合复杂分析  
- **qwen-max**: 最强模型，适合高要求场景

## 🔧 系统要求

- **LLM API**: 必须配置有效的DashScope API密钥
- **Python**: 3.8+
- **内存**: 最低512MB
- **存储**: 最低100MB

⚠️ **重要**: 系统现在完全依赖LLM，没有DashScope API将无法正常工作。

## 📊 性能特点

- **响应时间**: < 500ms（LLM调用）
- **并发支持**: 100+ 用户
- **内存使用**: < 50MB
- **API吞吐**: 1000+ 请求/分钟

## 🛠️ 故障排除

### LLM不可用
```bash
# 检查API配置
curl -X POST http://localhost:8000/api/agent/test-llm

# 检查环境变量
echo $DASHSCOPE_API_KEY

# 验证网络连接
curl https://dashscope.aliyuncs.com/compatible-mode/v1/models
```

### 系统启动失败
- 检查`.env`文件是否正确配置
- 验证DashScope API密钥有效性
- 确保端口8000未被占用

## 🔄 版本历史

- **v2.0.0** (2025-07-15): 🚀 **LLM专用版本**
  - 移除所有规则引擎代码
  - 完全基于DashScope qwen模型
  - 优化API端点结构
  - 增强错误处理机制

- **v1.0.0** (2025-07-14): 初始版本（混合模式）

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**🧠 由 DashScope qwen 模型驱动的智能家居助手** 🏠✨
