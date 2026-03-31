import ssl
import socket
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def get_ssl_info(url: str) -> Optional[Dict[str, Any]]:
    """
    Extract SSL certificate information from a URL.
    
    Args:
        url: Full URL (e.g., https://example.com)
        
    Returns:
        Dict with SSL info or None if not HTTPS/failed
    """
    try:
        # Parse URL to get hostname
        parsed = urlparse(url)
        
        # Only check HTTPS URLs
        if parsed.scheme != 'https':
            logger.debug(f"Skipping SSL check for non-HTTPS URL: {url}")
            return None
            
        hostname = parsed.hostname
        port = parsed.port or 443
        
        if not hostname:
            logger.warning(f"No hostname found in URL: {url}")
            return None
        
        logger.info(f"Checking SSL certificate for {hostname}:{port}")
        
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect and get certificate
        with socket.create_connection((hostname, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                # Parse expiration date
                not_after_str = cert.get('notAfter')
                if not not_after_str:
                    logger.warning(f"No expiration date in certificate for {hostname}")
                    return None
                
                # Parse: 'Jan 1 23:59:59 2025 GMT'
                expiry_date = datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
                # Calculate days remaining
                now = datetime.now(timezone.utc)
                days_remaining = (expiry_date - now).days
                
                # Determine status
                if days_remaining < 0:
                    status = "expired"
                elif days_remaining <= 7:
                    status = "critical"
                elif days_remaining <= 30:
                    status = "warning"
                else:
                    status = "valid"
                
                logger.info(f"SSL check successful for {hostname}: {status}, {days_remaining} days remaining")
                
                return {
                    "status": status,
                    "expiry_date": expiry_date,
                    "days_remaining": days_remaining,
                    "issuer": cert.get('issuer'),
                    "subject": cert.get('subject'),
                    "version": cert.get('version')
                }
                
    except socket.timeout:
        logger.warning(f"SSL check timeout for {url}")
        return None
    except ssl.SSLError as e:
        logger.error(f"SSL error for {url}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Failed to get SSL info for {url}: {str(e)}", exc_info=True)
        return None


def get_ssl_expiry_days(hostname: str, port: int = 443) -> Optional[int]:
    """
    Get days until SSL certificate expires.
    
    Args:
        hostname: Domain name (e.g., example.com)
        port: Port number (default 443)
        
    Returns:
        Days remaining or None if failed
    """
    try:
        context = ssl.create_default_context()
        
        with socket.create_connection((hostname, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                not_after_str = cert.get('notAfter')
                if not not_after_str:
                    return None
                
                expiry_date = datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
                now = datetime.now(timezone.utc)
                days_remaining = (expiry_date - now).days
                
                return days_remaining
                
    except Exception as e:
        logger.error(f"Failed to get SSL expiry for {hostname}: {str(e)}")
        return None
