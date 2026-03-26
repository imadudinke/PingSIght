import asyncio
import httpx
import time

async def main():
    async with httpx.AsyncClient() as client:
        def trace_handler(title, event_name, **kwargs):
            print(f"trace_handler: {title} {event_name}")

        trace_dict = {
            "connection.connect_tcp.started": lambda **kw: print("connect started"),
            "connection.connect_tcp.complete": lambda **kw: print("connect complete"),
        }
        class Trace:
             def trace(self, event_name, **kwargs):
                 print(event_name, kwargs)
        
        try:
             res = await client.get('http://example.com', extensions={'trace': trace_dict})
             print(res)
        except Exception as e:
             print("Error:", e)

asyncio.run(main())
