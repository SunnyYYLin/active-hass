// API 服务层 - 与后端API交互

export interface Device {
  id: string;
  name: string;
  type: 'light' | 'air_conditioner' | 'sensor' | 'switch' | 'camera' | 'door';
  room: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony';
  status: 'on' | 'off' | 'unknown';
  properties: Record<string, any>;
  last_updated: string;
  created_at: string;
}

export interface DeviceUpdateRequest {
  status?: 'on' | 'off' | 'unknown';
  properties?: Record<string, any>;
}

export interface DeviceResponse {
  success: boolean;
  message: string;
  device?: Device;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserInteraction {
  message: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  message: string;
  suggestions: any[];
  actions_taken: any[];
  needs_user_confirmation: boolean;
  timestamp: string;
}

export interface SystemStatus {
  status: string;
  devices_count: number;
  agent_active: boolean;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '请求失败' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API请求失败 ${endpoint}:`, error);
      throw error;
    }
  }

  // 系统状态相关
  async getSystemStatus(): Promise<SystemStatus> {
    return this.request<SystemStatus>('/api/status');
  }

  // 设备相关API
  async getAllDevices(): Promise<Device[]> {
    return this.request<Device[]>('/api/devices/');
  }

  async getDevice(deviceId: string): Promise<Device> {
    return this.request<Device>(`/api/devices/${deviceId}`);
  }

  async updateDevice(deviceId: string, updates: DeviceUpdateRequest): Promise<DeviceResponse> {
    return this.request<DeviceResponse>(`/api/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async toggleDevice(deviceId: string): Promise<DeviceResponse> {
    return this.request<DeviceResponse>(`/api/devices/${deviceId}/toggle`, {
      method: 'POST',
    });
  }

  async getDevicesByRoom(room: string): Promise<Device[]> {
    return this.request<Device[]>(`/api/devices/room/${room}`);
  }

  // AI助手相关API
  async interactWithAgent(interaction: UserInteraction): Promise<AgentResponse> {
    return this.request<AgentResponse>('/api/agent/interact', {
      method: 'POST',
      body: JSON.stringify(interaction),
    });
  }

  async getAgentStatus(): Promise<any> {
    return this.request('/api/agent/status');
  }

  async getConversationHistory(limit: number = 20): Promise<AgentMessage[]> {
    return this.request<AgentMessage[]>(`/api/agent/history?limit=${limit}`);
  }

  async analyzeCurrentState(): Promise<any> {
    return this.request('/api/agent/analyze', {
      method: 'POST',
    });
  }

  async testLLM(): Promise<any> {
    return this.request('/api/agent/test-llm', {
      method: 'POST',
    });
  }

  async resetAgentContext(): Promise<{ message: string }> {
    return this.request('/api/agent/reset', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
