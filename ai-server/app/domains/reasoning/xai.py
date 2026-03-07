from ...core.config import settings
from xai_sdk import Client
from xai_sdk.chat import user, system
import os

client = Client(api_key=settings.XAI_API_KEY)

DEFAULT_MODEL_NAME = os.getenv("XAI_MODEL_NAME", "grok-4-1-fast-reasoning")
DEFAULT_SYSTEM_PROMPT = os.getenv(
    "XAI_SYSTEM_PROMPT",
    "You are Grok, a highly intelligent, helpful AI assistant.",
)


def create_chat(model: str | None = None, system_prompt: str | None = None):
    """
    Create a chat with the configured model and system prompt.

    :param model: Optional override for the model name.
    :param system_prompt: Optional override for the system prompt.
    :return: An initialized chat object.
    """
    model_name = model or DEFAULT_MODEL_NAME
    sys_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT

    chat = client.chat.create(model=model_name)
    chat.append(system(sys_prompt))
    return chat


def run_reasoning(prompt: str, model: str | None = None, system_prompt: str | None = None):
    """
    Run a reasoning request with the given user prompt.

    :param prompt: The user prompt to send to the model.
    :param model: Optional override for the model name.
    :param system_prompt: Optional override for the system prompt.
    :return: The response content from the model.
    """
    chat = create_chat(model=model, system_prompt=system_prompt)
    chat.append(user(prompt))
    response = chat.sample()
    return response.content