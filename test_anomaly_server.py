"""
Test FastAPI server for anomaly detection testing.
Runs on port 8001 with controllable latency endpoints.
"""

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import time
import random
import uvicorn

app = FastAPI(title="Anomaly Test Server", version="1.0.0")

# Track request count for simulation
request_count = {"normal": 0, "slow": 0, "random": 0}


@app.get("/")
async def root():
    """Fast endpoint - always responds quickly"""
    return {"message": "Anomaly Test Server", "status": "healthy"}


@app.get("/fast")
async def fast_endpoint():
    """Fast endpoint - 50-100ms response time"""
    delay = random.uniform(0.05, 0.1)  # 50-100ms
    time.sleep(delay)
    request_count["normal"] += 1
    
    return {
        "endpoint": "fast",
        "message": "This is a fast endpoint",
        "delay_ms": round(delay * 1000, 2),
        "request_count": request_count["normal"]
    }


@app.get("/normal")
async def normal_endpoint():
    """Normal endpoint - 200-400ms response time"""
    delay = random.uniform(0.2, 0.4)  # 200-400ms
    time.sleep(delay)
    request_count["normal"] += 1
    
    return {
        "endpoint": "normal",
        "message": "This is a normal endpoint",
        "delay_ms": round(delay * 1000, 2),
        "request_count": request_count["normal"]
    }


@app.get("/slow")
async def slow_endpoint():
    """Slow endpoint - 2000-3000ms response time (anomaly!)"""
    delay = random.uniform(2.0, 3.0)  # 2000-3000ms
    time.sleep(delay)
    request_count["slow"] += 1
    
    return {
        "endpoint": "slow",
        "message": "This is a SLOW endpoint (should trigger anomaly)",
        "delay_ms": round(delay * 1000, 2),
        "request_count": request_count["slow"],
        "warning": "This endpoint is intentionally slow to test anomaly detection"
    }


@app.get("/random")
async def random_endpoint():
    """Random endpoint - sometimes fast, sometimes slow"""
    request_count["random"] += 1
    
    # 80% fast, 20% slow
    if random.random() < 0.8:
        delay = random.uniform(0.2, 0.4)  # 200-400ms (normal)
        is_slow = False
    else:
        delay = random.uniform(2.0, 3.0)  # 2000-3000ms (anomaly!)
        is_slow = True
    
    time.sleep(delay)
    
    return {
        "endpoint": "random",
        "message": "This endpoint randomly becomes slow",
        "delay_ms": round(delay * 1000, 2),
        "is_slow": is_slow,
        "request_count": request_count["random"]
    }


@app.get("/custom")
async def custom_delay(delay_ms: int = Query(default=300, ge=0, le=10000)):
    """Custom delay endpoint - specify delay in milliseconds"""
    delay = delay_ms / 1000.0
    time.sleep(delay)
    
    return {
        "endpoint": "custom",
        "message": f"Custom delay of {delay_ms}ms",
        "delay_ms": delay_ms,
        "requested_delay": delay_ms
    }


@app.get("/simulate-issue")
async def simulate_issue():
    """Simulates a performance issue (database slowdown, etc.)"""
    # First 5 requests: normal (300ms)
    # Next 5 requests: slow (2000ms) - simulating an issue
    # After 10 requests: back to normal
    
    total_requests = sum(request_count.values())
    
    if 5 <= total_requests < 10:
        # Simulate issue
        delay = random.uniform(2.0, 3.0)
        status = "ISSUE"
    else:
        # Normal
        delay = random.uniform(0.2, 0.4)
        status = "NORMAL"
    
    time.sleep(delay)
    
    return {
        "endpoint": "simulate-issue",
        "message": "Simulating real-world performance issue",
        "delay_ms": round(delay * 1000, 2),
        "status": status,
        "total_requests": total_requests,
        "explanation": "Requests 6-10 are slow to simulate a temporary issue"
    }


@app.get("/stats")
async def get_stats():
    """Get request statistics"""
    return {
        "request_counts": request_count,
        "total_requests": sum(request_count.values()),
        "endpoints": {
            "/fast": "50-100ms",
            "/normal": "200-400ms",
            "/slow": "2000-3000ms (anomaly)",
            "/random": "80% normal, 20% slow",
            "/custom": "Custom delay",
            "/simulate-issue": "Simulates temporary issue"
        }
    }


@app.get("/reset")
async def reset_stats():
    """Reset request counters"""
    request_count["normal"] = 0
    request_count["slow"] = 0
    request_count["random"] = 0
    
    return {
        "message": "Statistics reset",
        "request_counts": request_count
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Anomaly Test Server",
        "port": 8001
    }


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Anomaly Test Server on http://localhost:8001")
    print("=" * 60)
    print("\nAvailable Endpoints:")
    print("  GET /              - Root endpoint (fast)")
    print("  GET /fast          - Fast endpoint (50-100ms)")
    print("  GET /normal        - Normal endpoint (200-400ms)")
    print("  GET /slow          - Slow endpoint (2000-3000ms) ⚠️")
    print("  GET /random        - Random (80% fast, 20% slow)")
    print("  GET /custom?delay_ms=500 - Custom delay")
    print("  GET /simulate-issue - Simulates temporary issue")
    print("  GET /stats         - View statistics")
    print("  GET /reset         - Reset statistics")
    print("  GET /health        - Health check")
    print("\n" + "=" * 60)
    print("📊 Use this server to test anomaly detection!")
    print("=" * 60)
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
