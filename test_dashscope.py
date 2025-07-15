#!/usr/bin/env python3
"""
DashScope API测试脚本
用于验证qwen模型的调用是否正常
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

try:
    from openai import OpenAI
except ImportError:
    print("❌ 请先安装OpenAI库: pip install openai")
    sys.exit(1)

def test_dashscope_api():
    """测试DashScope API调用"""
    # 获取配置
    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    model = os.getenv("DASHSCOPE_MODEL", "qwen-turbo")
    
    if not api_key:
        print("❌ 请在.env文件中设置DASHSCOPE_API_KEY")
        return False
    
    try:
        # 创建客户端
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        print(f"🔗 连接到: {base_url}")
        print(f"🤖 使用模型: {model}")
        print("📡 正在测试API调用...")
        
        # 测试调用
        extra_params = {}
        if "qwen" in model.lower():
            extra_params["stream"] = False
            extra_params["extra_body"] = {"enable_thinking": False}
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system", 
                    "content": "你是一个智能家居助手，负责分析家居状态并提供建议。请用简洁友好的语气回复。"
                },
                {
                    "role": "user", 
                    "content": "当前状态：客厅无人，卧室有人5分钟，客厅灯开着，卧室灯开着。发现问题：客厅无人但灯开着。请给出建议。"
                }
            ],
            temperature=0.7,
            max_tokens=150,
            timeout=10,
            **extra_params
        )
        
        # 输出结果
        suggestion = response.choices[0].message.content.strip()
        print(f"✅ API调用成功!")
        print(f"🤖 模型回复: {suggestion}")
        
        # 检查回复质量
        if len(suggestion) < 10:
            print("⚠️  回复内容较短，可能存在问题")
        elif "客厅" in suggestion and ("灯" in suggestion or "关" in suggestion):
            print("✅ 回复内容符合预期")
        else:
            print("⚠️  回复内容可能不够准确")
        
        return True
        
    except Exception as e:
        print(f"❌ API调用失败: {e}")
        print("请检查：")
        print("1. DASHSCOPE_API_KEY是否正确")
        print("2. 网络连接是否正常")
        print("3. 模型名称是否正确")
        return False

def test_models():
    """测试可用的模型列表"""
    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    
    if not api_key:
        return
    
    try:
        client = OpenAI(api_key=api_key, base_url=base_url)
        
        print("\n📋 测试常用模型:")
        models_to_test = ["qwen-turbo", "qwen-plus", "qwen-max"]
        
        for model in models_to_test:
            try:
                extra_params = {}
                if "qwen" in model.lower():
                    extra_params["stream"] = False
                    extra_params["extra_body"] = {"enable_thinking": False}
                
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "你好"}],
                    max_tokens=10,
                    timeout=5,
                    **extra_params
                )
                print(f"✅ {model} - 可用")
            except Exception as e:
                print(f"❌ {model} - 不可用: {str(e)[:50]}")
    
    except Exception as e:
        print(f"❌ 模型列表测试失败: {e}")

if __name__ == "__main__":
    print("🧪 DashScope API 测试")
    print("=" * 40)
    
    # 基础API测试
    success = test_dashscope_api()
    
    if success:
        # 模型测试
        test_models()
        print("\n🎉 测试完成! DashScope API配置正确")
    else:
        print("\n❌ 测试失败! 请检查配置")
    
    print("\n💡 提示:")
    print("- 确保在.env文件中正确设置了DASHSCOPE_API_KEY")
    print("- 如果使用的是阿里云DashScope，请确保账户有足够的调用次数")
    print("- 推荐使用qwen-turbo模型，性价比较高")
