from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 延迟导入，避免循环依赖
from api.devices import router as devices_router
from api.agent import router as agent_router
from database.database import init_database
from services.home_simulator import HomeSimulator
from services.agent_service import AgentService

# 创建FastAPI应用
app = FastAPI(
    title=os.getenv("APP_NAME", "Active Home Assistant"),
    description="主动家居智能体API",
    version=os.getenv("APP_VERSION", "1.0.0"),
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境请根据需求配置
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局服务实例
home_simulator = HomeSimulator()
agent_service = AgentService()

# 包含路由
app.include_router(devices_router, prefix="/api/devices", tags=["设备管理"])
app.include_router(agent_router, prefix="/api/agent", tags=["智能体"])

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化"""
    print("🏠 正在启动主动家居智能体服务...")
    
    # 初始化数据库
    await init_database()
    
    # 初始化家居模拟器
    await home_simulator.initialize()
    
    # 初始化智能体服务
    await agent_service.initialize()
    
    print("✅ 服务启动成功!")
    print(f"📖 API文档: http://localhost:{os.getenv('PORT', 8000)}/docs")

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "欢迎使用主动家居智能体API",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "docs": "/docs"
    }

@app.get("/api/status")
async def get_status():
    """获取系统状态
    
    Returns:
        dict: 系统运行状态信息
    """
    try:
        return {
            "status": "running",
            "devices_count": len(home_simulator.get_all_devices()),
            "agent_active": agent_service.is_active,
            "llm_available": agent_service.llm_client is not None,
            "timestamp": home_simulator.get_current_time().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": "N/A"
        }

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    print(f"全局异常: {exc}")  # 记录异常日志
    return JSONResponse(
        status_code=500,
        content={"detail": f"内部服务器错误: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    )
