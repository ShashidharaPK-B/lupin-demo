"""Shared LLM client for all agents."""

import json
import logging
from typing import Any

from openai import AsyncAzureOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncAzureOpenAI | None = None


def get_llm() -> AsyncAzureOpenAI:
    global _client
    if _client is None:
        _client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
    return _client


async def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> dict[str, Any]:
    """Call Azure OpenAI and return parsed JSON response."""
    client = get_llm()
    response = await client.chat.completions.create(
        model=settings.azure_openai_deployment_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=4096,
    )
    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)
