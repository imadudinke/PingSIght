from pydantic import BaseModel, HttpUrl, Field, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
import ipaddress
from urllib.parse import urlparse


class MonitorCreate(BaseModel):
    url: HttpUrl
    friendly_name: str = Field(..., min_length=1, max_length=50)
    interval_seconds: int = Field(default=60, ge=30, le=3600)  # Min 30s, Max 1hr
    
    @field_validator('url')
    @classmethod
    def validate_url_security(cls, v: HttpUrl) -> HttpUrl:
        """Prevent SSRF attacks by blocking internal/private URLs"""
        url_str = str(v)
        parsed = urlparse(url_str)
        
        # Block localhost variations
        localhost_patterns = [
            'localhost', '127.0.0.1', '0.0.0.0', '::1',
            '127.', '0.', '10.', '172.16.', '172.17.', '172.18.',
            '172.19.', '172.20.', '172.21.', '172.22.', '172.23.',
            '172.24.', '172.25.', '172.26.', '172.27.', '172.28.',
            '172.29.', '172.30.', '172.31.', '192.168.'
        ]
        
        hostname = parsed.hostname or ''
        
        # Check for localhost patterns
        for pattern in localhost_patterns:
            if hostname.lower().startswith(pattern.lower()):
                raise ValueError(f"Monitoring internal/private URLs is not allowed: {hostname}")
        
        # Additional IP address validation
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local:
                raise ValueError(f"Monitoring private/internal IP addresses is not allowed: {hostname}")
        except ValueError as e:
            if "not allowed" in str(e):
                raise e
            # Not an IP address, continue with hostname validation
            pass
        
        # Block common internal domains
        blocked_domains = [
            'internal', 'local', 'intranet', 'corp', 'lan'
        ]
        
        for domain in blocked_domains:
            if domain in hostname.lower():
                raise ValueError(f"Monitoring internal domains is not allowed: {hostname}")
        
        # Ensure HTTPS for production security (optional, can be removed for development)
        if parsed.scheme not in ['http', 'https']:
            raise ValueError("Only HTTP and HTTPS URLs are supported")
        
        return v


class MonitorResponse(BaseModel):
    id: UUID
    user_id: UUID
    url: str
    friendly_name: str
    interval_seconds: int
    status: str
    is_active: bool
    last_checked: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MonitorUpdate(BaseModel):
    friendly_name: Optional[str] = Field(None, min_length=1, max_length=50)
    interval_seconds: Optional[int] = Field(None, ge=30, le=3600)
    is_active: Optional[bool] = None


class MonitorList(BaseModel):
    monitors: list[MonitorResponse]
    total: int
    page: int
    per_page: int