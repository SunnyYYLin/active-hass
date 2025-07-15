#!/bin/bash

# 主动家居智能体启动脚本

echo "🏠 启动主动家居智能体服务..."

# 检查是否在正确的目录
if [ ! -f "app.py" ]; then
    echo "❌ 请在backend目录下运行此脚本"
    exit 1
fi

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

# 检查依赖
echo "📦 检查依赖..."
pip3 install -r ../requirements.txt

# 检查环境变量文件
if [ ! -f "../.env" ]; then
    echo "⚠️  .env文件不存在，复制示例文件..."
    cp ../.env.example ../.env
    echo "✅ 请编辑 .env 文件并填入必要的配置"
fi

# 启动服务
echo "🚀 启动服务..."
python3 app.py
