import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from models.devices import Device, HomeState
from models.agent import AgentMessage, AgentContext

DATABASE_PATH = os.getenv("DATABASE_URL", "sqlite:///./smart_home.db").replace("sqlite:///", "")

class Database:
    """数据库管理类"""
    
    def __init__(self):
        self.db_path = DATABASE_PATH
    
    def get_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 允许按列名访问
        return conn
    
    def init_tables(self):
        """初始化数据库表"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 设备表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                room TEXT NOT NULL,
                status TEXT NOT NULL,
                properties TEXT,
                last_updated TIMESTAMP,
                created_at TIMESTAMP
            )
        ''')
        
        # 智能体消息表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_messages (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        # 家居状态历史表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS home_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP,
                devices_data TEXT,
                room_occupancy TEXT,
                summary TEXT
            )
        ''')
        
        # 用户偏好表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    # 设备相关操作
    def save_device(self, device: Device):
        """保存设备信息"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO devices 
            (id, name, type, room, status, properties, last_updated, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            device.id, device.name, device.type.value, device.room.value,
            device.status.value, json.dumps(device.properties),
            device.last_updated, device.created_at
        ))
        
        conn.commit()
        conn.close()
    
    def get_device(self, device_id: str) -> Optional[Dict]:
        """获取单个设备"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM devices WHERE id = ?', (device_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_all_devices(self) -> List[Dict]:
        """获取所有设备"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM devices ORDER BY room, name')
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def delete_device(self, device_id: str):
        """删除设备"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM devices WHERE id = ?', (device_id,))
        conn.commit()
        conn.close()
    
    # 智能体消息操作
    def save_message(self, message: AgentMessage):
        """保存智能体消息"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO agent_messages (id, role, content, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            message.id, message.role.value, message.content,
            message.timestamp, json.dumps(message.metadata)
        ))
        
        conn.commit()
        conn.close()
    
    def get_recent_messages(self, limit: int = 10) -> List[Dict]:
        """获取最近的消息"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM agent_messages 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in reversed(rows)]
    
    # 家居状态操作
    def save_home_state(self, state: HomeState):
        """保存家居状态"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        devices_data = json.dumps([device.dict() for device in state.devices])
        room_occupancy = json.dumps({room.value: occupied for room, occupied in state.room_occupancy.items()})
        
        cursor.execute('''
            INSERT INTO home_states (timestamp, devices_data, room_occupancy, summary)
            VALUES (?, ?, ?, ?)
        ''', (state.timestamp, devices_data, room_occupancy, state.summary))
        
        conn.commit()
        conn.close()
    
    # 用户偏好操作
    def set_preference(self, key: str, value: Any):
        """设置用户偏好"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
            VALUES (?, ?, ?)
        ''', (key, json.dumps(value), datetime.now()))
        
        conn.commit()
        conn.close()
    
    def get_preference(self, key: str) -> Optional[Any]:
        """获取用户偏好"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT value FROM user_preferences WHERE key = ?', (key,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return json.loads(row['value'])
        return None

# 全局数据库实例
db = Database()

async def init_database():
    """初始化数据库"""
    db.init_tables()
    print("✅ 数据库初始化完成")
