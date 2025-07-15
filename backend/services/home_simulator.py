import asyncio
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from models.devices import (
    Device, SensorDevice, LightDevice, ACDevice,
    DeviceType, DeviceStatus, SensorType, Room, HomeState
)
from database.database import db

class HomeSimulator:
    """家居环境模拟器"""
    
    def __init__(self):
        self.devices: Dict[str, Device] = {}
        self.is_running = False
        self.simulation_task = None
    
    async def initialize(self):
        """初始化模拟器"""
        await self._create_default_devices()
        self.is_running = True
        # 启动后台模拟任务
        self.simulation_task = asyncio.create_task(self._simulation_loop())
        print("🏠 家居模拟器已启动")
    
    async def _create_default_devices(self):
        """创建默认设备"""
        current_time = datetime.now()
        
        # 创建传感器设备
        sensors = [
            {
                "id": "sensor_bedroom_motion",
                "name": "卧室人体感应器",
                "room": Room.BEDROOM,
                "sensor_type": SensorType.MOTION,
                "value": 0,
                "unit": "boolean"
            },
            {
                "id": "sensor_living_motion", 
                "name": "客厅人体感应器",
                "room": Room.LIVING_ROOM,
                "sensor_type": SensorType.MOTION,
                "value": 0,
                "unit": "boolean"
            },
            {
                "id": "sensor_bedroom_temp",
                "name": "卧室温度传感器",
                "room": Room.BEDROOM,
                "sensor_type": SensorType.TEMPERATURE,
                "value": 25.5,
                "unit": "°C"
            }
        ]
        
        for sensor_data in sensors:
            sensor = SensorDevice(
                id=sensor_data["id"],
                name=sensor_data["name"],
                type=DeviceType.SENSOR,
                room=sensor_data["room"],
                status=DeviceStatus.ON,
                sensor_type=sensor_data["sensor_type"],
                value=sensor_data["value"],
                unit=sensor_data["unit"],
                detection_duration=0,
                last_updated=current_time,
                created_at=current_time,
                properties={}
            )
            self.devices[sensor.id] = sensor
            db.save_device(sensor)
        
        # 创建灯光设备
        lights = [
            {
                "id": "light_bedroom",
                "name": "卧室主灯",
                "room": Room.BEDROOM,
                "status": DeviceStatus.ON,
                "brightness": 80
            },
            {
                "id": "light_living",
                "name": "客厅主灯", 
                "room": Room.LIVING_ROOM,
                "status": DeviceStatus.ON,
                "brightness": 90
            },
            {
                "id": "light_kitchen",
                "name": "厨房灯",
                "room": Room.KITCHEN,
                "status": DeviceStatus.OFF,
                "brightness": 100
            }
        ]
        
        for light_data in lights:
            light = LightDevice(
                id=light_data["id"],
                name=light_data["name"],
                type=DeviceType.LIGHT,
                room=light_data["room"],
                status=light_data["status"],
                brightness=light_data["brightness"],
                last_updated=current_time,
                created_at=current_time,
                properties={}
            )
            self.devices[light.id] = light
            db.save_device(light)
        
        # 创建空调设备
        ac = ACDevice(
            id="ac_bedroom",
            name="卧室空调",
            type=DeviceType.AC,
            room=Room.BEDROOM,
            status=DeviceStatus.OFF,
            temperature=26.0,
            mode="auto",
            fan_speed=3,
            last_updated=current_time,
            created_at=current_time,
            properties={}
        )
        self.devices[ac.id] = ac
        db.save_device(ac)
    
    async def _simulation_loop(self):
        """模拟循环"""
        while self.is_running:
            pass
            await asyncio.sleep(10)
    
    async def _save_current_state(self):
        """保存当前家居状态"""
        room_occupancy = {}
        
        # 计算房间占用状态
        for room in Room:
            # 查找该房间的运动传感器
            motion_sensors = [
                device for device in self.devices.values()
                if isinstance(device, SensorDevice) 
                and device.sensor_type == SensorType.MOTION
                and device.room == room
            ]
            
            # 如果有任一传感器检测到人，则认为房间有人
            room_occupancy[room] = any(sensor.value == 1 for sensor in motion_sensors)
        
        # 生成状态摘要
        summary = self._generate_state_summary(room_occupancy)
        
        # 创建状态对象，转换datetime为字符串
        devices_list = []
        for device in self.devices.values():
            device_dict = device.dict()
            # 转换datetime字段为ISO格式字符串
            if 'last_updated' in device_dict:
                device_dict['last_updated'] = device_dict['last_updated'].isoformat()
            if 'created_at' in device_dict:
                device_dict['created_at'] = device_dict['created_at'].isoformat()
            devices_list.append(device_dict)
        
        # 直接保存到数据库，不使用HomeState对象
        from database.database import db
        import json
        
        devices_data = json.dumps(devices_list)
        room_occupancy_data = json.dumps({room.value: occupied for room, occupied in room_occupancy.items()})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO home_states (timestamp, devices_data, room_occupancy, summary)
            VALUES (?, ?, ?, ?)
        ''', (datetime.now().isoformat(), devices_data, room_occupancy_data, summary))
        
        conn.commit()
        conn.close()
    
    def _generate_state_summary(self, room_occupancy: Dict[Room, bool]) -> str:
        """生成状态摘要"""
        occupied_rooms = [room.value for room, occupied in room_occupancy.items() if occupied]
        
        if not occupied_rooms:
            return "家中无人"
        elif len(occupied_rooms) == 1:
            return f"仅{occupied_rooms[0]}有人"
        else:
            return f"有人的房间：{', '.join(occupied_rooms)}"
    
    def get_device(self, device_id: str) -> Device:
        """获取设备"""
        return self.devices.get(device_id)
    
    def get_all_devices(self) -> List[Device]:
        """获取所有设备"""
        return list(self.devices.values())
    
    def get_devices_by_room(self, room: Room) -> List[Device]:
        """按房间获取设备"""
        return [device for device in self.devices.values() if device.room == room]
    
    async def update_device(self, device_id: str, status: DeviceStatus = None, properties: Dict[str, Any] = None) -> bool:
        """更新设备状态"""
        if device_id not in self.devices:
            return False
        
        device = self.devices[device_id]
        current_time = datetime.now()
        
        if status is not None:
            device.status = status
        
        if properties:
            # 更新特定属性
            if isinstance(device, LightDevice) and "brightness" in properties:
                device.brightness = properties["brightness"]
            elif isinstance(device, ACDevice):
                if "temperature" in properties:
                    device.temperature = properties["temperature"]
                if "mode" in properties:
                    device.mode = properties["mode"]
                if "fan_speed" in properties:
                    device.fan_speed = properties["fan_speed"]
        
        device.last_updated = current_time
        db.save_device(device)
        return True
    
    def get_current_state(self) -> HomeState:
        """获取当前状态"""
        room_occupancy = {}
        
        for room in Room:
            motion_sensors = [
                device for device in self.devices.values()
                if isinstance(device, SensorDevice) 
                and device.sensor_type == SensorType.MOTION
                and device.room == room
            ]
            room_occupancy[room] = any(sensor.value == 1 for sensor in motion_sensors)
        
        return HomeState(
            devices=list(self.devices.values()),
            timestamp=datetime.now(),
            room_occupancy=room_occupancy,
            summary=self._generate_state_summary(room_occupancy)
        )
    
    def get_current_time(self) -> datetime:
        """获取当前时间"""
        return datetime.now()
    
    async def stop(self):
        """停止模拟器"""
        self.is_running = False
        if self.simulation_task:
            self.simulation_task.cancel()
            try:
                await self.simulation_task
            except asyncio.CancelledError:
                pass
        print("🛑 家居模拟器已停止")
