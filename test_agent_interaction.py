#!/usr/bin/env python3
"""
智能体交互完整测试脚本
测试智能体分析家居状态、生成建议和执行操作的完整流程
"""

import asyncio
import os
import sys
from dotenv import load_dotenv
from datetime import datetime

# 加载环境变量
load_dotenv()

# 添加backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_agent_full_workflow():
    """测试智能体完整工作流程"""
    try:
        from services.agent_service import AgentService
        from models.devices import HomeState, Device, DeviceType, DeviceStatus, Room
        from models.agent import UserInteraction
        
        print("🧪 智能体交互完整测试")
        print("=" * 50)
        
        # 初始化智能体服务
        print("🔍 初始化智能体服务...")
        agent_service = AgentService()
        await agent_service.initialize()
        
        # 创建模拟家居状态
        mock_devices = [
            Device(
                id="light_living",
                name="客厅主灯",
                type=DeviceType.LIGHT,
                room=Room.LIVING_ROOM,
                status=DeviceStatus.ON,  # 客厅灯开着但没人
                properties={"brightness": 90},
                last_updated=datetime.now(),
                created_at=datetime.now()
            ),
            Device(
                id="light_bedroom",
                name="卧室主灯",
                type=DeviceType.LIGHT,
                room=Room.BEDROOM,
                status=DeviceStatus.ON,  # 卧室灯开着有人
                properties={"brightness": 80},
                last_updated=datetime.now(),
                created_at=datetime.now()
            ),
            Device(
                id="light_kitchen",
                name="厨房灯",
                type=DeviceType.LIGHT,
                room=Room.KITCHEN,
                status=DeviceStatus.ON,  # 厨房灯开着但没人
                properties={"brightness": 100},
                last_updated=datetime.now(),
                created_at=datetime.now()
            )
        ]
        
        home_state = HomeState(
            devices=mock_devices,
            timestamp=datetime.now(),
            room_occupancy={
                "living_room": False,  # 客厅无人
                "bedroom": True,       # 卧室有人
                "kitchen": False,      # 厨房无人
                "bathroom": False,
                "balcony": False
            },
            summary="卧室有人，客厅和厨房无人但灯都开着"
        )
        
        # 测试状态分析和建议生成
        print("🔍 测试状态分析和建议生成...")
        print(f"模拟状态: 卧室有人，客厅和厨房无人但灯都开着")
        
        suggestion = await agent_service.analyze_home_state(home_state)
        
        if suggestion:
            print(f"📝 建议内容: {suggestion.content}")
            if suggestion.suggested_actions:
                print(f"🔧 建议操作: {suggestion.suggested_actions}")
            else:
                print("📝 仅提供了文字建议，无自动操作")
        else:
            print("ℹ️  智能体认为当前状态无需特别关注")
        
        # 测试用户交互
        print("\n🗣️ 测试用户交互...")
        user_interaction = UserInteraction(
            message="帮我关掉客厅的灯",
            context={"room": "living_room"}
        )
        
        response = await agent_service.handle_user_interaction(user_interaction)
        print(f"🤖 智能体回复: {response.message}")
        
        if response.actions_taken:
            print(f"🔧 执行的操作: {response.actions_taken}")
        
        print("\n🗣️ 测试另一个用户交互...")
        user_interaction2 = UserInteraction(
            message="现在家里的灯光情况怎么样？",
            context={}
        )
        
        response2 = await agent_service.handle_user_interaction(user_interaction2)
        print(f"🤖 智能体回复: {response2.message}")
        
        print("\n=" * 50)
        print("🎉 完整工作流程测试完成！")
        
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_agent_full_workflow())
    if success:
        print("✅ 所有测试通过！")
    else:
        print("❌ 测试失败！")
        sys.exit(1)
