from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.devices import Device, DeviceUpdateRequest, DeviceResponse, DeviceStatus, Room
from services.home_simulator import HomeSimulator

router = APIRouter()

# 依赖注入：获取家居模拟器实例
async def get_home_simulator() -> HomeSimulator:
    # 这里应该从全局实例获取，暂时创建新实例用于演示
    from app import home_simulator
    return home_simulator

@router.get("/", response_model=List[Device])
async def get_all_devices(home_sim: HomeSimulator = Depends(get_home_simulator)):
    """获取所有设备"""
    try:
        devices = home_sim.get_all_devices()
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设备列表失败: {str(e)}")

@router.get("/{device_id}", response_model=Device)
async def get_device(device_id: str, home_sim: HomeSimulator = Depends(get_home_simulator)):
    """获取单个设备"""
    device = home_sim.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    return device

@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str, 
    update_request: DeviceUpdateRequest,
    home_sim: HomeSimulator = Depends(get_home_simulator)
):
    """更新设备状态"""
    device = home_sim.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    try:
        success = await home_sim.update_device(
            device_id=device_id,
            status=update_request.status,
            properties=update_request.properties
        )
        
        if success:
            updated_device = home_sim.get_device(device_id)
            return DeviceResponse(
                success=True,
                message="设备状态更新成功",
                device=updated_device
            )
        else:
            return DeviceResponse(
                success=False,
                message="设备状态更新失败"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新设备失败: {str(e)}")

@router.get("/room/{room}")
async def get_devices_by_room(room: Room, home_sim: HomeSimulator = Depends(get_home_simulator)):
    """按房间获取设备"""
    try:
        devices = home_sim.get_devices_by_room(room)
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取房间设备失败: {str(e)}")

@router.post("/{device_id}/toggle", response_model=DeviceResponse)
async def toggle_device(device_id: str, home_sim: HomeSimulator = Depends(get_home_simulator)):
    """切换设备开关状态"""
    device = home_sim.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    try:
        # 切换状态
        new_status = DeviceStatus.OFF if device.status == DeviceStatus.ON else DeviceStatus.ON
        
        success = await home_sim.update_device(
            device_id=device_id,
            status=new_status
        )
        
        if success:
            updated_device = home_sim.get_device(device_id)
            return DeviceResponse(
                success=True,
                message=f"设备已{'开启' if new_status == DeviceStatus.ON else '关闭'}",
                device=updated_device
            )
        else:
            return DeviceResponse(
                success=False,
                message="设备状态切换失败"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"切换设备状态失败: {str(e)}")

@router.get("/status/summary")
async def get_devices_summary(home_sim: HomeSimulator = Depends(get_home_simulator)):
    """获取设备状态摘要"""
    try:
        devices = home_sim.get_all_devices()
        
        summary = {
            "total_devices": len(devices),
            "devices_on": len([d for d in devices if d.status == DeviceStatus.ON]),
            "devices_off": len([d for d in devices if d.status == DeviceStatus.OFF]),
            "by_type": {},
            "by_room": {}
        }
        
        # 按类型统计
        for device in devices:
            device_type = device.type.value
            if device_type not in summary["by_type"]:
                summary["by_type"][device_type] = {"total": 0, "on": 0, "off": 0}
            
            summary["by_type"][device_type]["total"] += 1
            if device.status == DeviceStatus.ON:
                summary["by_type"][device_type]["on"] += 1
            else:
                summary["by_type"][device_type]["off"] += 1
        
        # 按房间统计
        for device in devices:
            room = device.room.value
            if room not in summary["by_room"]:
                summary["by_room"][room] = {"total": 0, "on": 0, "off": 0}
            
            summary["by_room"][room]["total"] += 1
            if device.status == DeviceStatus.ON:
                summary["by_room"][room]["on"] += 1
            else:
                summary["by_room"][room]["off"] += 1
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设备摘要失败: {str(e)}")
