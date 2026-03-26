import asyncio
import httpx
import time

async def main():
    async with httpx.AsyncClient() as client:
        # Trace callbacks must be an async function/coroutine? For httpcore they might be async or sync depending on the event, but typically they are just functions or async functions. Wait! Let's just print kwargs to see the signature.
        
        async def on_tcp_started(**kwargs):
            print("tcp_started", kwargs)
            
        async def on_tcp_complete(**kwargs):
            print("tcp_complete", kwargs)
            
        async def on_req_started(**kwargs):
            print("req_started", kwargs)
            
        async def on_res_started(**kwargs):
            print("res_started", kwargs)
            
        trace_dict = {
            "connection.connect_tcp.started": on_tcp_started,
            "connection.connect_tcp.complete": on_tcp_complete,
            "request.send_request_headers.started": on_req_started,
            "response.receive_response_headers.started": on_res_started,
        }
        
        try:
             res = await client.get('http://example.com', extensions={'trace': trace_dict})
             print(res)
        except Exception as e:
             print("Error:", e)

asyncio.run(main())
