# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Start the Application

```bash
# From the compliance_framework directory
docker-compose up --build
```

Wait for both services to start. You should see:
- Backend running on http://localhost:8000
- Frontend running on http://localhost:3000

### 2. Access the Application

Open your browser to http://localhost:3000

### 3. Upload a Sample Memory

1. Click "Agent Memories" in the navigation
2. Click "Choose File" and select `sample_memories/sample_memory.json`
3. Click "Upload"

### 4. Create a Sample Policy

1. Click "Policies" in the navigation
2. Click "Create Policy"
3. Try this example - **Compound Tool Policy** to ensure approval for high-value invoices:
   - **Name**: "High Value Invoice Approval"
   - **Description**: "Ensure approval is requested before creating invoices over $1000"
   - **Policy Type**: "Compound Tool"
   - **Conditions**:
   ```json
   [
     {
       "type": "if_then",
       "if_tool": "create_invoice",
       "if_params": {"amount": {"gt": 1000}},
       "then_tool": "request_approval",
       "then_before": true
     }
   ]
   ```
4. Click "Save Policy"

### 5. Evaluate Compliance

1. Go back to "Agent Memories"
2. Click "Evaluate" on your uploaded memory
3. Go to "Dashboard" to see results

### 6. Review Non-Compliant Memory

1. From the Dashboard, you'll see the sample memory is non-compliant (no approval was requested)
2. Click "Review" to see:
   - **Messages Tab**: All messages with violations highlighted
   - **Tool Flow Tab**: Visual flow of the create_invoice tool call
   - **Compliance Summary**: Shows the policy violation

## More Policy Examples

### Response Length Policy
Limit agent responses to 500 tokens:
- **Policy Type**: Response Length
- **Max Tokens**: 500

### Tool Call Policy
Ensure specific tool is called:
- **Policy Type**: Tool Call
- **Tool Name**: `create_order`
- **Parameters**: `{"amount": {"gt": 100}}`

### Tool Response Policy
Ensure tool succeeds:
- **Policy Type**: Tool Response
- **Tool Name**: `create_invoice`
- **Expect Success**: ✓

### LLM Evaluation Policy
Check for PII in assistant responses (requires API key):
- **Policy Type**: LLM Evaluation
- **Evaluation Prompt**: "Does this message contain PII such as email addresses, phone numbers, or social security numbers? Respond with 'violation' if PII is found, otherwise respond with 'compliant'."
- **Message Filter**: `{"role": "assistant"}`
- **LLM Provider**: anthropic
- **Model**: claude-sonnet-4-5-20250929

**Note**: For LLM evaluation policies, you need to:
1. Copy `backend/.env.example` to `backend/.env`
2. Add your API key: `ANTHROPIC_API_KEY=your_key_here`
3. Restart: `docker-compose down && docker-compose up`

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are in use, edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Changed from 3000:3000
```

### Database Issues
Delete the database and restart:
```bash
docker-compose down -v
docker-compose up --build
```

### API Not Responding
Check backend logs:
```bash
docker-compose logs backend
```

## Next Steps

1. Upload your own agent memory JSON files
2. Create policies specific to your use case
3. Evaluate all memories: Click "Evaluate All" in Agent Memories
4. Review the Dashboard for compliance insights
5. Examine the screenshots folder for additional UX inspiration
