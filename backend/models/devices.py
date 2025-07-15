from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class DeviceType(str, Enum):
    """设备类型枚举"""
    LIGHT = "light"           # 灯光
    SENSOR = "sensor"         # 传感器
    AC = "air_conditioner"    # 空调
    SWITCH = "switch"         # 开关
    CAMERA = "camera"         # 摄像头
    DOOR = "door"            # 门窗

class DeviceStatus(str, Enum):
    """设备状态枚举"""
    ON = "on"
    OFF = "off"
    UNKNOWN = "unknown"

class SensorType(str, Enum):
    """传感器类型"""
    MOTION = "motion"         # 人体感应
    TEMPERATURE = "temperature"  # 温度
    HUMIDITY = "humidity"     # 湿度
    LIGHT = "light"          # 光照
    DOOR = "door"            # 门磁

class Room(str, Enum):
    """房间枚举"""
    LIVING_ROOM = "living_room"   # 客厅
    BEDROOM = "bedroom"           # 卧室
    KITCHEN = "kitchen"           # 厨房
    BATHROOM = "bathroom"         # 卫生间
    BALCONY = "balcony"          # 阳台

class Device(BaseModel):
    """设备基础模型"""
    id: str
    name: str
    type: DeviceType
    room: Room
    status: DeviceStatus
    properties: Dict[str, Any] = {}
    last_updated: datetime
    created_at: datetime

class SensorDevice(Device):
    """传感器设备模型"""
    sensor_type: SensorType
    value: Optional[float] = None
    unit: Optional[str] = None
    detection_duration: int = 0  # 检测持续时间（秒）

class LightDevice(Device):
    """灯光设备模型"""
    brightness: int = 100  # 亮度 0-100
    color: Optional[str] = None  # 颜色代码

class ACDevice(Device):
    """空调设备模型"""
    temperature: float = 26.0  # 设定温度
    mode: str = "auto"  # 模式：auto, cool, heat, fan
    fan_speed: int = 3  # 风速 1-5

class DeviceUpdateRequest(BaseModel):
    """设备更新请求模型"""
    status: Optional[DeviceStatus] = None
    properties: Optional[Dict[str, Any]] = None

class DeviceResponse(BaseModel):
    """设备响应模型"""
    success: bool
    message: str
    device: Optional[Device] = None

class HomeState(BaseModel):
    """家居状态模型"""
    devices: List[Device]
    timestamp: datetime
    room_occupancy: Dict[Room, bool]  # 房间占用状态
    summary: str  # 状态摘要
