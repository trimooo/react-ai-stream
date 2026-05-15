from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from rais import stream_response
from pydantic import BaseModel
import os

app = FastAPI(title="__PROJECT_NAME__")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    messages: list[dict]


@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_response(
            req.messages,
            provider="anthropic",
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
            model="claude-haiku-4-5-20251001",
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
