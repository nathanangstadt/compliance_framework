# API Key Setup Guide

To use LLM-based policy checks (like semantic approval validation), you need to configure an AI API key.

## Quick Setup

### Option 1: Anthropic Claude (Recommended)

1. **Get API Key**:
   - Visit https://console.anthropic.com/
   - Sign up or log in
   - Navigate to "API Keys"
   - Create a new API key

2. **Configure**:
   ```bash
   # Edit backend/.env file
   nano backend/.env

   # Replace the placeholder with your actual key:
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
   ```

3. **Restart Backend**:
   ```bash
   docker-compose restart backend
   ```

### Option 2: OpenAI GPT

1. **Get API Key**:
   - Visit https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key

2. **Configure**:
   ```bash
   # Edit backend/.env file
   nano backend/.env

   # Add your OpenAI key:
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```

3. **Restart Backend**:
   ```bash
   docker-compose restart backend
   ```

## Verification

After configuring the API key, test it:

1. Call the built-in test endpoints:
   - Anthropic: `GET http://localhost:8000/api/test/anthropic`
   - OpenAI: `GET http://localhost:8000/api/test/openai`
2. Navigate to **Policies** → Create a policy with **🤖 LLM Tool Response** or **🔍 LLM Response Validation** check
3. Process sessions and check violation details - should show the LLM's actual response instead of "API key not configured"

## Which LLM Checks Need API Keys?

### Require API Key:
- **🤖 LLM Tool Response** - Semantic validation of tool responses
- **🔍 LLM Response Validation** - Full response validation (PII, tone, etc.)

### Work Without API Key:
- **🔧 Tool Call** - Tool usage detection
- **↩️ Tool Response** - Response value matching
- **📏 Response Length** - Token counting
- **🔢 Tool Call Count** - Call frequency limits
- **🔎 Response Contains** - Keyword matching
- **🚫 Tool Absence** - Tool prohibition

## Cost Considerations

### Anthropic Claude
- **Model**: claude-sonnet-4-5-20250929
- **Pricing**: ~$3 per million input tokens, ~$15 per million output tokens
- **Typical Cost**: $0.001 - $0.01 per policy evaluation

### OpenAI GPT
- **Models**: gpt-4o, gpt-4o-mini
- **Pricing**: baked into the app (see `backend/app/services/check_types.py`); dashboard shows estimated cost after LLM policies run
- **Typical Cost**: $0.003 - $0.03 per policy evaluation

**Recommendation**: Start with Anthropic - it's more cost-effective for this use case.

### Security
- Do not commit real API keys. Keep `backend/.env` local (use `.env.example` as a template).
- Consider `git update-index --skip-worktree backend/.env` to avoid accidental commits.

## Troubleshooting

### "Anthropic API key not configured"

**Problem**: LLM checks show this error in violation details

**Solutions**:
1. Check that `backend/.env` file exists
2. Verify API key is correct (starts with `sk-ant-`)
3. Ensure no extra spaces or quotes around the key
4. Restart backend: `docker-compose restart backend`

### "LLM validation error: [some error]"

**Problem**: API call failed

**Common Causes**:
- **Invalid API Key**: Double-check the key is correct
- **Insufficient Credits**: Add credits to your account
- **Rate Limit**: Wait a moment and try again
- **Network Issue**: Check your internet connection

### Policy always passes even with wrong values

**Problem**: LLM not detecting violations

**Solutions**:
1. Make validation prompt more specific
2. Include examples in the prompt
3. Tell the LLM to respond with "violation" or "compliant"
4. Check the LLM's actual response in violation details

## Example: Working LLM Check

**Good Configuration**:
```javascript
{
  "type": "llm_tool_response",
  "tool_name": "request_human_approval",
  "parameter": "status",
  "validation_prompt": "Validate that the status indicates approval. Look for words like 'approved', 'granted', 'yes', 'confirmed'. If the status indicates rejection, denial, or refusal, respond with 'violation'. If approved, respond with 'compliant'.",
  "llm_provider": "anthropic",
  "model": "claude-sonnet-4-5-20250929"
}
```

**Why it works**:
- Clear criteria (what's approved vs rejected)
- Explicit keywords to look for
- Tells LLM exactly how to respond
- Uses specific model

## Security Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Keeps your API keys private

2. **Use separate keys for dev/prod**
   - Create different API keys
   - Easier to revoke if compromised

3. **Monitor usage**
   - Check Anthropic/OpenAI dashboard regularly
   - Set up usage alerts

4. **Rotate keys periodically**
   - Create new key every few months
   - Delete old keys

## Need Help?

- **Anthropic Support**: https://support.anthropic.com/
- **OpenAI Support**: https://help.openai.com/
- **This Framework**: See [USER_GUIDE.md](USER_GUIDE.md)
