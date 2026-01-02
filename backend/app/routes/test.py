from fastapi import APIRouter
import os

router = APIRouter(prefix="/api/test", tags=["test"])


@router.get("/anthropic")
async def test_anthropic():
    """Test Anthropic API key configuration."""
    api_key = os.getenv('ANTHROPIC_API_KEY')

    if not api_key:
        return {
            "configured": False,
            "message": "ANTHROPIC_API_KEY not found in environment",
            "suggestion": "Add your API key to backend/.env file"
        }

    if api_key == "your-api-key-here":
        return {
            "configured": False,
            "message": "ANTHROPIC_API_KEY is still the placeholder value",
            "suggestion": "Replace 'your-api-key-here' with your actual Anthropic API key"
        }

    # Test actual API call
    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=api_key)

        # Make a minimal test call
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=10,
            messages=[{
                "role": "user",
                "content": "Say 'OK' if you can read this."
            }]
        )

        result_text = response.content[0].text

        return {
            "configured": True,
            "message": "Anthropic API key is working correctly!",
            "test_response": result_text,
            "model": "claude-sonnet-4-5-20250929",
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }

    except Exception as e:
        error_message = str(e)

        # Provide helpful error messages
        if "credit balance is too low" in error_message.lower() or "purchase credits" in error_message.lower():
            suggestion = "Insufficient credits. Add credits to your Anthropic account at https://console.anthropic.com/settings/plans"
        elif "authentication_error" in error_message.lower():
            suggestion = "Your API key appears to be invalid. Check that it's copied correctly from https://console.anthropic.com/"
        elif "rate_limit" in error_message.lower():
            suggestion = "Rate limit reached. Wait a moment and try again."
        elif "insufficient" in error_message.lower() or "credit" in error_message.lower():
            suggestion = "Credit or billing issue. Check your Anthropic account at https://console.anthropic.com/settings/plans"
        else:
            suggestion = "Check your internet connection and API key."

        return {
            "configured": False,
            "message": f"API key found but test call failed: {error_message}",
            "suggestion": suggestion,
            "error": error_message
        }


@router.get("/openai")
async def test_openai():
    """Test OpenAI API key configuration."""
    api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        return {
            "configured": False,
            "message": "OPENAI_API_KEY not found in environment (this is optional)",
            "suggestion": "If you want to use OpenAI, add OPENAI_API_KEY to backend/.env file"
        }

    # Test actual API call
    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{
                "role": "user",
                "content": "Say 'OK' if you can read this."
            }],
            max_tokens=10
        )

        result_text = response.choices[0].message.content

        return {
            "configured": True,
            "message": "OpenAI API key is working correctly!",
            "test_response": result_text,
            "model": "gpt-4-turbo-preview",
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }
        }

    except Exception as e:
        return {
            "configured": False,
            "message": f"API key found but test call failed: {str(e)}",
            "error": str(e)
        }
