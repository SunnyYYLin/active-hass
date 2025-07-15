from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models.devices import Device, DeviceUpdateRequest, DeviceResponse, DeviceStatus, Room
from services.home_simulator import HomeSimulator

router = APIRouter()


# 依赖注入：获取家居模拟器实例
async def get_home_simulator() -> HomeSimulator:
    """获取家居模拟器实例"""
    from app import home_simulator
    return home_simulator


def get_room_name(room: Room) -> str:
    """获取房间的中文名称
    
    Args:
        room: 房间枚举值
        
    Returns:
        str: 房间的中文名称
    """
    room_names = {
        Room.LIVING_ROOM: "客厅",
        Room.BEDROOM: "卧室", 
        Room.KITCHEN: "厨房",
        Room.BATHROOM: "卫生间",
        Room.BALCONY: "阳台"
    }
    return room_names.get(room, room.value)

@router.get("/rooms")
async def get_all_rooms():
    """获取所有可用房间列表
    
    Returns:
        dict: 包含房间信息的响应，包括value和中文名称
    """
    try:
        rooms = [{"value": room.value, "name": get_room_name(room)} for room in Room]
        return {
            "success": True,
            "rooms": rooms,
            "total": len(rooms)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取房间列表失败: {str(e)}")

@router.get("/status/summary")
async def get_devices_summary(home_sim: HomeSimulator = Depends(get_home_simulator)):
    """获取设备状态摘要
    
    Returns:
        dict: 包含设备总数、开关状态统计、按类型和房间分组的统计信息
    """
    try:
        devices = home_sim.get_all_devices()
        
        summary = {
            "total_devices": len(devices),
            "devices_on": len([d for d in devices if d.status == DeviceStatus.ON]),
            "devices_off": len([d for d in devices if d.status == DeviceStatus.OFF]),
            "by_type": {},
            "by_room": {}
        }
        
        # 统计函数：减少重复代码
        def update_stats(category_dict: dict, key: str, is_on: bool):
            """更新统计信息"""
            if key not in category_dict:
                category_dict[key] = {"total": 0, "on": 0, "off": 0}
            
            category_dict[key]["total"] += 1
            if is_on:
                category_dict[key]["on"] += 1
            else:
                category_dict[key]["off"] += 1
        
        # 按类型和房间统计
        for device in devices:
            is_on = device.status == DeviceStatus.ON
            update_stats(summary["by_type"], device.type.value, is_on)
            update_stats(summary["by_room"], device.room.value, is_on)
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设备摘要失败: {str(e)}")

@router.get("/", response_model=List[Device])
async def get_all_devices(home_sim: HomeSimulator = Depends(get_home_simulator)):
    """获取所有设备
    
    Returns:
        List[Device]: 所有设备的列表
    """
    try:
        devices = home_sim.get_all_devices()
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设备列表失败: {str(e)}")


@router.get("/room/{room}")
async def get_devices_by_room(room: Room, home_sim: HomeSimulator = Depends(get_home_simulator)):
    """按房间获取设备
    
    Args:
        room: 房间枚举值
        
    Returns:
        List[Device]: 指定房间的设备列表
    """
    try:
        devices = home_sim.get_devices_by_room(room)
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取房间设备失败: {str(e)}")


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str, home_sim: HomeSimulator = Depends(get_home_simulator)):
    """获取单个设备
    
    Args:
        device_id: 设备ID
        
    Returns:
        Device: 设备信息
    """
    device = home_sim.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    return DeviceResponse(
        success=True,
        message="设备信息获取成功",
        device=device,
        properties=device.properties
    )

async def _update_device_helper(
    device_id: str, 
    status: Optional[DeviceStatus] = None,
    properties: Optional[dict] = None,
    home_sim: HomeSimulator = None
) -> DeviceResponse:
    """设备更新辅助函数，减少重复代码
    
    Args:
        device_id: 设备ID
        status: 新的设备状态
        properties: 设备属性
        home_sim: 家居模拟器实例
        
    Returns:
        DeviceResponse: 更新结果
    """
    device = home_sim.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    try:
        success = await home_sim.update_device(
            device_id=device_id,
            status=status,
            properties=properties
        )
        # print(f"更新设备: {device_id}, 状态: {status}, 属性: {properties}, 成功: {success}")
        if success:
            updated_device = home_sim.get_device(device_id)
            print(updated_device)
            message = "设备状态更新成功"
            if status:
                message = f"设备已{'开启' if status == DeviceStatus.ON else '关闭'}"
            
            return DeviceResponse(
                success=True,
                message=message,
                device=updated_device,
                properties=properties
            )
            
        else:
            return DeviceResponse(
                success=False,
                message="设备状态更新失败"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新设备失败: {str(e)}")


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str, 
    update_request: DeviceUpdateRequest,
    home_sim: HomeSimulator = Depends(get_home_simulator)
):
    """更新设备状态
    
    Args:
        device_id: 设备ID
        update_request: 更新请求数据
        
    Returns:
        DeviceResponse: 更新结果
    """
    print(f"更新设备: {device_id}, 状态: {update_request.status}, 属性: {update_request.properties}")
    return await _update_device_helper(
        device_id=device_id,
        status=update_request.status,
        properties=update_request.properties,
        home_sim=home_sim
    )


@router.post("/{device_id}/toggle", response_model=DeviceResponse)
async def toggle_device(device_id: str, home_sim: HomeSimulator = Depends(get_home_simulator)):
    """切换设备开关状态
    
    Args:
        device_id: 设备ID
        
    Returns:
        DeviceResponse: 切换结果
    """
    device = home_sim.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    # 切换状态
    new_status = DeviceStatus.OFF if device.status == DeviceStatus.ON else DeviceStatus.ON
    
    return await _update_device_helper(
        device_id=device_id,
        status=new_status,
        home_sim=home_sim
    )