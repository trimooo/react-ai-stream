# rais

RAIS protocol helpers for Python — stream AI responses from FastAPI, Starlette, or any async Python server.

## Install

```bash
pip install rais
# or with provider SDKs
pip install "rais[all]"
```

## Usage

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from rais import stream_response

app = FastAPI()

@app.post("/api/chat")
async def chat(req: dict):
    return StreamingResponse(
        stream_response(req["messages"], provider="openai"),
        media_type="text/event-stream"
    )
```
