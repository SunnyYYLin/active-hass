#!/bin/bash

# 主动家居智能体API测试脚本（LLM模式）
# 演示基于LLM的完整功能流程

echo "🏠 主动家居智能体API测试（LLM模式）"
echo "================================"

# 1. 检查系统状态
echo "1. 检查系统状态:"
curl -s http://localhost:8000/api/status | python3 -m json.tool
echo

# 2. 检查LLM状态
echo "2. 检查LLM集成状态:"
curl -s -X POST http://localhost:8000/api/agent/test-llm | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('llm_available'):
    print(f\"  ✅ LLM可用: {data['model']}\")
    print(f\"  🤖 测试响应: {data['test_response']}\")
else:
    print(f\"  ❌ LLM不可用: {data.get('error', '未知错误')}\")
"
echo

# 3. 获取所有设备
echo "3. 获取所有设备:"
curl -s http://localhost:8000/api/devices/ | python3 -c "
import json, sys
data = json.load(sys.stdin)
for device in data:
    print(f\"  {device['name']} ({device['id']}) - {device['status']} - {device['room']}\")
"
echo

# 4. 使用LLM分析当前状态
echo "4. 使用LLM分析当前状态:"
curl -s -X POST http://localhost:8000/api/agent/analyze | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('suggestion'):
    print(f\"  🤖 LLM建议: {data['suggestion']['content']}\")
    print(f\"  📊 置信度: {data['suggestion']['confidence']}\")
    print(f\"  🧠 推理: {data['suggestion']['reasoning']}\")
else:
    print(f\"  ℹ️ 当前状态无需特别处理\")
"
echo

# 5. 用户与LLM交互
echo "5. 用户与LLM交互:"
curl -s -X POST http://localhost:8000/api/agent/interact \
  -H "Content-Type: application/json" \
  -d '{"message": "请分析一下当前家里的状态，并给出优化建议"}' | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"  🤖 LLM回复: {data['message']}\")
if data['actions_taken']:
    print(f\"  ⚙️ 执行的操作: {len(data['actions_taken'])}个\")
"
echo

# 6. 查看对话历史
echo "6. 对话历史:"
curl -s http://localhost:8000/api/agent/history | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"  共有 {len(data)} 条对话记录\")
for i, msg in enumerate(data[-3:], 1):  # 显示最近3条
    role = '🤖' if msg['role'] == 'agent' else '👤'
    print(f\"  {role} {msg['content'][:50]}{'...' if len(msg['content']) > 50 else ''}\")
"
echo

# 6. 查看对话历史
echo "6. 对话历史:"
curl -s http://localhost:8000/api/agent/history | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"  共有 {len(data)} 条对话记录\")
for i, msg in enumerate(data[-3:], 1):  # 显示最近3条
    role = '🤖' if msg['role'] == 'agent' else '👤'
    print(f\"  {role} {msg['content'][:50]}{'...' if len(msg['content']) > 50 else ''}\")
"
echo

# 7. 智能体状态（LLM模式）
echo "7. 智能体状态（LLM模式）:"
curl -s http://localhost:8000/api/agent/status | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"  🤖 智能体活跃: {data['active']}\")
print(f\"  🧠 LLM可用: {data['llm_available']}\")
if data['llm_available']:
    print(f\"  📚 使用模型: {data['model']}\")
print(f\"  💬 消息数量: {data['message_count']}\")
"
echo

# 8. 设备状态摘要
echo "8. 设备状态摘要:"
curl -s http://localhost:8000/api/devices/status/summary | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"  总设备数: {data['total_devices']}\")
print(f\"  开启设备: {data['devices_on']}\")
print(f\"  关闭设备: {data['devices_off']}\")
print(f\"  按类型统计:\")
for device_type, stats in data['by_type'].items():
    print(f\"    {device_type}: {stats['on']}开/{stats['off']}关\")
"
echo

echo "✅ LLM模式测试完成!"
echo "📖 查看完整API文档: http://localhost:8000/docs"
