"""
rais — RAIS protocol helpers for Python async servers.

Quick start (FastAPI + OpenAI):

    from fastapi import FastAPI
    from fastapi.responses import StreamingResponse
    from rais import stream_response

    app = FastAPI()

    @app.post("/api/chat")
    async def chat(req: dict):
        return StreamingResponse(
            stream_response(req["messages"], provider="openai"),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
"""

from .core import stream_response, rais_event

__all__ = ["stream_response", "rais_event"]
