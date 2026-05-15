from __future__ import annotations

import asyncio
import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

app = FastAPI(title="__PROJECT_NAME__")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# Groq is OpenAI-compatible — free tier with fast Llama models
_client = AsyncOpenAI(
    api_key=os.environ.get("GROQ_API_KEY", ""),
    base_url="https://api.groq.com/openai/v1",
)


def _event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _stream_groq(messages: list[dict]):
    try:
        stream = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,  # type: ignore[arg-type]
            stream=True,
        )
        async for event in stream:
            text = event.choices[0].delta.content
            if text:
                yield _event({"type": "text", "text": text})
                await asyncio.sleep(0)
            if event.choices[0].finish_reason:
                break
        yield _event({"type": "done"})
    except Exception as exc:
        yield _event({"type": "error", "error": str(exc)})


class ChatRequest(BaseModel):
    messages: list[dict]


@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        _stream_groq(req.messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
