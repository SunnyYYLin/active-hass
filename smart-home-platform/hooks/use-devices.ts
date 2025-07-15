import { useState, useEffect, useCallback } from 'react';
import { apiService, Device, DeviceUpdateRequest } from '@/lib/api';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载所有设备
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const devicesData = await apiService.getAllDevices();
      setDevices(devicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载设备失败');
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新设备
  const updateDevice = useCallback(async (deviceId: string, updates: DeviceUpdateRequest) => {
    try {
      const response = await apiService.updateDevice(deviceId, updates);
      if (response.success && response.device) {
        setDevices(prev => 
          prev.map(device => 
            device.id === deviceId ? response.device! : device
          )
        );
        return response;
      } else {
        throw new Error(response.message || '更新设备失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新设备失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 切换设备状态
  const toggleDevice = useCallback(async (deviceId: string) => {
    try {
      const response = await apiService.toggleDevice(deviceId);
      if (response.success && response.device) {
        setDevices(prev => 
          prev.map(device => 
            device.id === deviceId ? response.device! : device
          )
        );
        return response;
      } else {
        throw new Error(response.message || '切换设备状态失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换设备状态失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 按房间获取设备
  const getDevicesByRoom = useCallback((room: string) => {
    return devices.filter(device => device.room === room);
  }, [devices]);

  // 按类型获取设备
  const getDevicesByType = useCallback((type: string) => {
    return devices.filter(device => device.type === type);
  }, [devices]);

  // 获取设备状态统计
  const getDeviceStats = useCallback(() => {
    const total = devices.length;
    const online = devices.filter(device => device.status === 'on').length;
    const offline = devices.filter(device => device.status === 'off').length;
    const unknown = devices.filter(device => device.status === 'unknown').length;

    return { total, online, offline, unknown };
  }, [devices]);

  // 初始加载
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  return {
    devices,
    loading,
    error,
    loadDevices,
    updateDevice,
    toggleDevice,
    getDevicesByRoom,
    getDevicesByType,
    getDeviceStats,
    setError,
  };
}
