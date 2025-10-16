"""
Async callback handler for sending HTTP callbacks with configurable delays.
"""
import asyncio
import json
import logging
from typing import Optional, Dict, Any
import httpx
from datetime import datetime


logger = logging.getLogger(__name__)


class CallbackHandler:
    """Handler for sending async HTTP callbacks."""
    
    def __init__(self, max_timeout: int = 30):
        """
        Initialize the callback handler.
        
        Args:
            max_timeout: Maximum timeout for HTTP requests in seconds
        """
        self.max_timeout = max_timeout
    
    async def send_callback(
        self,
        url: str,
        method: str,
        payload: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        delay_ms: int = 0
    ) -> bool:
        """
        Send an async callback to the specified URL after a delay.
        
        Args:
            url: The callback URL to send the request to
            method: HTTP method (GET, POST, PUT, etc.)
            payload: The payload to send in the callback
            headers: Optional headers to include in the callback
            delay_ms: Delay in milliseconds before sending the callback
            
        Returns:
            True if callback was sent successfully, False otherwise
        """
        try:
            # Apply delay if configured
            if delay_ms > 0:
                await asyncio.sleep(delay_ms / 1000.0)
            
            # Prepare headers
            callback_headers = headers or {}
            if "Content-Type" not in callback_headers:
                callback_headers["Content-Type"] = "application/json"
            
            # Send the callback
            async with httpx.AsyncClient(timeout=self.max_timeout) as client:
                method_upper = method.upper()
                
                if method_upper == "GET":
                    # For GET, send payload as query params
                    response = await client.get(url, params=payload, headers=callback_headers)
                elif method_upper in ["POST", "PUT", "PATCH"]:
                    # For POST/PUT/PATCH, send as JSON body
                    response = await client.request(
                        method_upper,
                        url,
                        json=payload,
                        headers=callback_headers
                    )
                elif method_upper == "DELETE":
                    # For DELETE, send payload as JSON body if present
                    response = await client.delete(
                        url,
                        json=payload if payload else None,
                        headers=callback_headers
                    )
                else:
                    logger.warning(f"Unsupported callback method: {method}")
                    return False
                
                # Log the result
                logger.info(
                    f"Callback sent to {url} - Method: {method} - "
                    f"Status: {response.status_code} - Delay: {delay_ms}ms"
                )
                
                # Consider 2xx and 3xx as success
                return 200 <= response.status_code < 400
                
        except httpx.TimeoutException:
            logger.error(f"Callback timeout for URL: {url}")
            return False
        except httpx.RequestError as e:
            logger.error(f"Callback request error for URL {url}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending callback to {url}: {str(e)}")
            return False
    
    def extract_callback_url(
        self,
        request_data: Any,
        field_path: str
    ) -> Optional[str]:
        """
        Extract callback URL from request data using a field path.
        
        Supports simple field names like "callbackUrl" or nested paths like "meta.callback.url"
        
        Args:
            request_data: The request data (dict, typically from JSON)
            field_path: Path to the callback URL field (e.g., "callbackUrl" or "meta.callback")
            
        Returns:
            The extracted URL or None if not found
        """
        if not isinstance(request_data, dict):
            return None
        
        # Split the path by dots
        path_parts = field_path.split('.')
        
        current = request_data
        for part in path_parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        
        # Ensure the final value is a string (URL)
        if isinstance(current, str):
            return current
        
        return None
    
    def schedule_callback(
        self,
        url: str,
        method: str,
        payload: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        delay_ms: int = 0
    ):
        """
        Schedule a callback to be sent asynchronously (fire and forget).
        
        This creates a task that runs in the background without blocking.
        
        Args:
            url: The callback URL
            method: HTTP method
            payload: The payload to send
            headers: Optional headers
            delay_ms: Delay before sending
        """
        asyncio.create_task(
            self.send_callback(url, method, payload, headers, delay_ms)
        )


# Global instance
callback_handler = CallbackHandler()


def schedule_callback(
    url: str,
    method: str,
    payload: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None,
    delay_ms: int = 0
):
    """
    Convenience function to schedule a callback.
    
    Args:
        url: The callback URL
        method: HTTP method
        payload: The payload to send
        headers: Optional headers
        delay_ms: Delay before sending
    """
    callback_handler.schedule_callback(url, method, payload, headers, delay_ms)


def extract_callback_url(request_data: Any, field_path: str) -> Optional[str]:
    """
    Convenience function to extract callback URL from request data.
    
    Args:
        request_data: The request data
        field_path: Path to the callback URL field
        
    Returns:
        The extracted URL or None
    """
    return callback_handler.extract_callback_url(request_data, field_path)
