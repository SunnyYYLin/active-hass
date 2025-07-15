#!/usr/bin/env python3
"""
智能体动作执行测试脚本
测试通过PUT API调用控制设备的功能
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 添加backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_agent_actions():
    """测试智能体动作执行"""
    try:
        from services.agent_service import AgentService
        
        print("🔍 初始化智能体服务...")
        agent_service = AgentService()
        
        # 测试动作数据
        test_actions = {
            "light_living": {
                "status": "off"
            },
            "light_bedroom": {
                "status": "on",
                "properties": {
                    "brightness": 60
                }
            }
        }
        
        print(f"🧪 测试动作: {test_actions}")
        
        # 执行动作测试
        print("🚀 执行建议动作...")
        results = await agent_service._execute_suggested_actions(test_actions)
        
        print("\n📊 执行结果:")
        for result in results:
            status = "✅ 成功" if result.get("success") else "❌ 失败"
            device_id = result.get("device_id", "未知设备")
            message = result.get("message", "无消息")
            print(f"  {status} {device_id}: {message}")
        
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_ai_response_parsing():
    """测试AI响应解析"""
    try:
        from services.agent_service import AgentService
        
        print("\n🔍 测试AI响应解析...")
        agent_service = AgentService()
        
        # 测试响应
        test_response = """厨房没人但灯还亮着，我帮你关掉吧？

<action>
{"light_kitchen": {"status": "off"}}
</action>"""
        
        print(f"🧪 测试响应: {test_response}")
        
        # 解析响应
        suggestion = agent_service._parse_ai_response(test_response)
        
        print("\n📊 解析结果:")
        print(f"  内容: {suggestion.content}")
        print(f"  建议操作: {suggestion.suggested_actions}")
        
        # 如果有建议操作，执行它们
        if suggestion.suggested_actions:
            print("\n🚀 执行解析出的操作...")
            results = await agent_service._execute_suggested_actions(suggestion.suggested_actions)
            
            for result in results:
                status = "✅ 成功" if result.get("success") else "❌ 失败"
                device_id = result.get("device_id", "未知设备")
                message = result.get("message", "无消息")
                print(f"  {status} {device_id}: {message}")
        
        return True
        
    except Exception as e:
        print(f"❌ 解析测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("🧪 智能体动作执行测试")
    print("=" * 50)
    
    # 检查后端服务是否运行
    import subprocess
    try:
        result = subprocess.run(
            ["curl", "-s", "http://localhost:8000/api/devices/", "-o", "/dev/null", "-w", "%{http_code}"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip() == "200":
            print("✅ 后端服务运行正常")
        else:
            print("❌ 后端服务未运行，请先启动: python backend/app.py")
            return
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("⚠️  无法检查后端服务状态，继续测试...")
    
    # 运行测试
    async def run_tests():
        success1 = await test_agent_actions()
        success2 = await test_ai_response_parsing()
        
        print("\n" + "=" * 50)
        if success1 and success2:
            print("🎉 所有测试通过！")
        else:
            print("❌ 部分测试失败")
    
    asyncio.run(run_tests())

if __name__ == "__main__":
    main()
