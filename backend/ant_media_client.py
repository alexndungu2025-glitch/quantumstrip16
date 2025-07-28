"""
Ant Media Server Client Adapter
Provides a clean interface to Ant Media Server REST API for the streaming application
"""

import httpx
import asyncio
import logging
from typing import Dict, Any, Optional, List
import os

logger = logging.getLogger(__name__)

class AntMediaClient:
    """Client adapter for Ant Media Server REST API"""
    
    def __init__(self, base_url: str = None, app_name: str = "LiveApp"):
        """
        Initialize Ant Media Server client
        
        Args:
            base_url: Base URL of Ant Media Server (default: localhost:5080)
            app_name: Application name in Ant Media Server (default: LiveApp)
        """
        self.base_url = base_url or "http://localhost:5080"
        self.app_name = app_name
        self.api_base = f"{self.base_url}/{self.app_name}/rest/v2"
        
    async def create_broadcast(self, stream_id: str, name: str = "", **kwargs) -> Dict[str, Any]:
        """
        Create a new broadcast stream
        
        Args:
            stream_id: Unique identifier for the stream
            name: Human-readable name for the stream
            **kwargs: Additional broadcast properties
            
        Returns:
            Dictionary containing broadcast information
        """
        try:
            payload = {
                "streamId": stream_id,
                "name": name or stream_id,
                "type": "liveStream",
                "publicStream": True,
                **kwargs
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/broadcasts/create",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"Created broadcast: {stream_id}")
                return result
                
        except Exception as e:
            logger.error(f"Error creating broadcast {stream_id}: {e}")
            raise
    
    async def start_broadcast(self, stream_id: str) -> bool:
        """
        Start a broadcast stream
        
        Args:
            stream_id: Stream identifier
            
        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/broadcasts/{stream_id}/start"
                )
                response.raise_for_status()
                
                logger.info(f"Started broadcast: {stream_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error starting broadcast {stream_id}: {e}")
            return False
    
    async def stop_broadcast(self, stream_id: str) -> bool:
        """
        Stop a broadcast stream
        
        Args:
            stream_id: Stream identifier
            
        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/broadcasts/{stream_id}/stop"
                )
                response.raise_for_status()
                
                logger.info(f"Stopped broadcast: {stream_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error stopping broadcast {stream_id}: {e}")
            return False
    
    async def get_broadcast(self, stream_id: str) -> Optional[Dict[str, Any]]:
        """
        Get broadcast information
        
        Args:
            stream_id: Stream identifier
            
        Returns:
            Broadcast information or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/broadcasts/{stream_id}"
                )
                
                if response.status_code == 404:
                    return None
                    
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Error getting broadcast {stream_id}: {e}")
            return None
    
    async def delete_broadcast(self, stream_id: str) -> bool:
        """
        Delete a broadcast
        
        Args:
            stream_id: Stream identifier
            
        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_base}/broadcasts/{stream_id}"
                )
                response.raise_for_status()
                
                logger.info(f"Deleted broadcast: {stream_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error deleting broadcast {stream_id}: {e}")
            return False
    
    async def get_live_broadcasts(self, offset: int = 0, size: int = 50) -> List[Dict[str, Any]]:
        """
        Get list of live broadcasts
        
        Args:
            offset: Offset for pagination
            size: Number of items to return
            
        Returns:
            List of live broadcast information
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/broadcasts/list/{offset}/{size}"
                )
                response.raise_for_status()
                
                broadcasts = response.json()
                # Filter only live broadcasts
                live_broadcasts = [b for b in broadcasts if b.get('status') == 'broadcasting']
                
                return live_broadcasts
                
        except Exception as e:
            logger.error(f"Error getting live broadcasts: {e}")
            return []
    
    async def get_webrtc_config(self) -> Dict[str, Any]:
        """
        Get WebRTC configuration for client connections
        
        Returns:
            WebRTC configuration including ICE servers
        """
        return {
            "iceServers": [
                {"urls": "stun:stun.l.google.com:19302"},
                {"urls": "stun:stun1.l.google.com:19302"}
            ],
            "websocket_url": f"ws://localhost:5080/{self.app_name}/websocket",
            "ant_media_url": self.base_url
        }
    
    async def get_broadcast_statistics(self, stream_id: str) -> Optional[Dict[str, Any]]:
        """
        Get broadcast statistics
        
        Args:
            stream_id: Stream identifier
            
        Returns:
            Statistics information or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/broadcasts/{stream_id}/stats"
                )
                
                if response.status_code == 404:
                    return None
                    
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Error getting broadcast stats {stream_id}: {e}")
            return None
    
    async def health_check(self) -> bool:
        """
        Check if Ant Media Server is healthy
        
        Returns:
            True if server is healthy
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/{self.app_name}/rest/v2/version"
                )
                response.raise_for_status()
                return True
                
        except Exception as e:
            logger.error(f"Ant Media Server health check failed: {e}")
            return False

# Singleton instance
ant_media_client = AntMediaClient()