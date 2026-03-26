import asyncio
import httpx
import time

async def main():
    async with httpx.AsyncClient() as client:
        def my_trace(event_name, info):
            print("TRACE:", event_name, info)
            
        trace_dict = {
            "connection.connect_tcp.started": lambda **kw: print("connect started"),
            "connection.connect_tcp.complete": lambda **kw: print("connect complete"),
        }
        
        try:
             res = await client.get('http://google.com', extensions={'trace': my_trace})
             print(res)
             
             res2 = await client.get('http://google.com', extensions={'trace': trace_dict})
        except Exception as e:
             print("Error:", e)

asyncio.run(main())
