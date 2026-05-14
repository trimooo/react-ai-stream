"""Core RAIS protocol helpers."""

from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator, Literal


Message = dict  # {"role": str, "content": str}
Provider = Literal["openai", "anthropic"]


def rais_event(data: dict) -> str:
    """Encode a dict as a RAIS SSE line."""
    return f"data: {json.dumps(data)}\n\n"


async def stream_response(
    messages: list[Message],
    *,
    provider: Provider,
    api_key: str | None = None,
    model: str | None = None,
    max_tokens: int = 1024,
    system: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Yield RAIS-compliant SSE strings from a provider's streaming API.

    Args:
        messages:   Conversation history (list of {role, content} dicts).
        provider:   "openai" or "anthropic".
        api_key:    API key. Falls back to OPENAI_API_KEY / ANTHROPIC_API_KEY env var.
        model:      Model name. Defaults to provider-appropriate model.
        max_tokens: Maximum tokens to generate (Anthropic only; OpenAI ignores this).
        system:     System prompt injected before the conversation.

    Yields:
        RAIS SSE strings — ``data: {...}\\n\\n`` — suitable for StreamingResponse.
    """
    if provider == "openai":
        async for chunk in _stream_openai(messages, api_key=api_key, model=model, system=system):
            yield chunk
    elif provider == "anthropic":
        async for chunk in _stream_anthropic(
            messages, api_key=api_key, model=model, max_tokens=max_tokens, system=system
        ):
            yield chunk
    else:
        yield rais_event({"type": "error", "error": f"Unknown provider: {provider!r}"})


async def _stream_openai(
    messages: list[Message],
    *,
    api_key: str | None,
    model: str | None,
    system: str | None,
) -> AsyncGenerator[str, None]:
    try:
        from openai import AsyncOpenAI  # type: ignore[import]
    except ImportError:
        yield rais_event({"type": "error", "error": "openai package not installed — run: pip install rais[openai]"})
        return

    client = AsyncOpenAI(api_key=api_key)
    msgs: list[Message] = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.extend(messages)

    try:
        stream = await client.chat.completions.create(
            model=model or "gpt-4o-mini",
            messages=msgs,  # type: ignore[arg-type]
            stream=True,
        )
        async for event in stream:
            text = event.choices[0].delta.content
            if text:
                yield rais_event({"type": "text", "text": text})
                await asyncio.sleep(0)  # yield control to event loop
            if event.choices[0].finish_reason:
                break
        yield rais_event({"type": "done"})
    except Exception as exc:
        yield rais_event({"type": "error", "error": str(exc)})


async def _stream_anthropic(
    messages: list[Message],
    *,
    api_key: str | None,
    model: str | None,
    max_tokens: int,
    system: str | None,
) -> AsyncGenerator[str, None]:
    try:
        import anthropic  # type: ignore[import]
    except ImportError:
        yield rais_event({"type": "error", "error": "anthropic package not installed — run: pip install rais[anthropic]"})
        return

    client = anthropic.AsyncAnthropic(api_key=api_key)
    filtered = [m for m in messages if m.get("role") != "system"]

    try:
        async with client.messages.stream(
            model=model or "claude-sonnet-4-6",
            max_tokens=max_tokens,
            messages=filtered,  # type: ignore[arg-type]
            **({"system": system} if system else {}),
        ) as stream:
            async for text in stream.text_stream:
                yield rais_event({"type": "text", "text": text})
                await asyncio.sleep(0)
        yield rais_event({"type": "done"})
    except Exception as exc:
        yield rais_event({"type": "error", "error": str(exc)})
