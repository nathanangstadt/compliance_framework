# Test Examples and Policy Demonstrations

## Test Memory Files

All sample memory files are located in the `sample_memories/` folder.

### 1. sample_memory.json
**Description**: Simple invoice creation scenario
- Single user request
- Agent creates invoice for $1500
- Demonstrates basic tool call flow
- Good for testing Tool Call and Compound Tool policies

**Use Cases:**
- Test "create_invoice" tool call detection
- Test compound policy requiring approval before high-value invoices
- Simple flow visualization

### 2. backoffice_agent_memory.json
**Description**: Complex multi-cycle back office agent
- Single user request to process pending orders
- Agent makes **5 cycles** of tool invocations:
  1. Check customer account and get pending orders (2 tools)
  2. Verify inventory for 3 items + get discount rate (4 tools)
  3. Create 2 invoices with discounts (2 tools)
  4. Update order statuses + reserve inventory (3 tools)
  5. Send emails + update customer balance (2 tools)
- **Total**: 13 tool calls across 5 assistant messages
- Final comprehensive summary response

**Use Cases:**
- Test Response Length Policy (only checks final summary)
- Test multiple Tool Call policies
- Test Tool Response policies for success validation
- Test complex Compound Tool policies
- Demonstrate multi-step workflow visualization

## Policy Examples

### Response Length Policy
**Updated Behavior**: Only evaluates the **final assistant message**

```json
{
  "name": "Maximum Final Response Length",
  "description": "Final assistant response should not exceed 100 tokens",
  "policy_type": "response_length",
  "config": {
    "max_tokens": 100
  }
}
```

**Why only final message?**
- Intermediate tool-calling messages are typically brief
- The final summary/response is where verbosity matters
- Cost control focuses on the concluding response
- Better reflects actual agent behavior patterns

**Test with backoffice_agent_memory.json:**
- Final message (index 11) has ~262 tokens
- With max_tokens: 100, this violates the policy
- All intermediate messages are ignored

### Tool Call Policy Examples

**Example 1: Detect invoice creation**
```json
{
  "name": "Invoice Creation Detection",
  "policy_type": "tool_call",
  "config": {
    "tool_name": "create_invoice"
  }
}
```

**Example 2: Verify high-value invoices**
```json
{
  "name": "High Value Invoice Check",
  "policy_type": "tool_call",
  "config": {
    "tool_name": "create_invoice",
    "parameters": {
      "total": {"gt": 1000}
    }
  }
}
```

**Example 3: Check inventory verification**
```json
{
  "name": "Inventory Check Required",
  "policy_type": "tool_call",
  "config": {
    "tool_name": "check_inventory"
  }
}
```

### Compound Tool Policy Examples

**Example 1: Approval before high-value invoice (sample_memory.json)**
```json
{
  "name": "High Value Invoice Approval",
  "description": "Invoices over $1000 require prior approval",
  "policy_type": "compound_tool",
  "config": {
    "conditions": [
      {
        "type": "if_then",
        "if_tool": "create_invoice",
        "if_params": {"total": {"gt": 1000}},
        "then_tool": "request_approval",
        "then_before": true
      }
    ]
  }
}
```
**Result**: sample_memory.json will FAIL (no approval requested)

**Example 2: Customer verification before order processing**
```json
{
  "name": "Customer Verification Required",
  "policy_type": "compound_tool",
  "config": {
    "conditions": [
      {
        "type": "if_then",
        "if_tool": "get_pending_orders",
        "if_params": {},
        "then_tool": "get_customer_account",
        "then_before": false
      }
    ]
  }
}
```
**Result**: backoffice_agent_memory.json will PASS (both tools called)

**Example 3: Inventory check before invoice creation**
```json
{
  "name": "Verify Inventory Before Invoice",
  "policy_type": "compound_tool",
  "config": {
    "conditions": [
      {
        "type": "if_then",
        "if_tool": "create_invoice",
        "if_params": {},
        "then_tool": "check_inventory",
        "then_before": true
      }
    ]
  }
}
```
**Result**: backoffice_agent_memory.json will PASS (inventory checked before invoices)

### Tool Response Policy Example

**Ensure all inventory checks succeed**
```json
{
  "name": "Inventory Check Success",
  "policy_type": "tool_response",
  "config": {
    "tool_name": "check_inventory",
    "expect_success": true
  }
}
```

### LLM Evaluation Policy Examples

**Example 1: Check for PII in final response**
```json
{
  "name": "No PII in Final Response",
  "policy_type": "llm_eval",
  "config": {
    "evaluation_prompt": "Does this message contain any personally identifiable information (PII) such as email addresses, phone numbers, social security numbers, or credit card numbers? Respond with 'violation' if PII is found, otherwise respond with 'compliant'.",
    "message_filter": {"role": "assistant"},
    "llm_provider": "anthropic",
    "model": "claude-sonnet-4-5-20250929"
  }
}
```

**Example 2: Verify professional tone**
```json
{
  "name": "Professional Tone Check",
  "policy_type": "llm_eval",
  "config": {
    "evaluation_prompt": "Evaluate if this message maintains a professional business tone. Look for casual language, slang, or inappropriate informality. Respond with 'violation' if unprofessional, otherwise 'compliant'.",
    "message_filter": {"role": "assistant"},
    "llm_provider": "anthropic",
    "model": "claude-sonnet-4-5-20250929"
  }
}
```

## Testing Workflow

### 1. Upload Test Memories
```bash
# Via UI: Navigate to "Agent Memories" → Upload files from sample_memories/ folder
# Via API:
curl -X POST -F "file=@sample_memories/sample_memory.json" http://localhost:8000/api/memories/upload
curl -X POST -F "file=@sample_memories/backoffice_agent_memory.json" http://localhost:8000/api/memories/upload
```

### 2. Create Policies
Use the UI's Policy Editor or create via API as shown in examples above.

### 3. Evaluate Compliance
```bash
# Via UI: Click "Evaluate" on each memory or "Evaluate All"
# Via API:
curl -X POST http://localhost:8000/api/compliance/evaluate \
  -H 'Content-Type: application/json' \
  -d '{"memory_id": 1}'
```

### 4. Review Results
- **Dashboard**: See overall compliance metrics and charts
- **Memory Detail**: Click "Review" on non-compliant memories to see:
  - Messages tab with violations highlighted
  - Tool Flow tab showing the complete tool call sequence
  - Compliance Summary tab with policy results

## Expected Test Results

### Sample Memory (sample_memory.json)

| Policy | Expected Result | Reason |
|--------|----------------|--------|
| Response Length (100 tokens) | ✅ PASS | Final response is brief |
| Tool Call: create_invoice | ✅ PASS | Invoice tool is called |
| High Value Invoice ($1000+) | ✅ PASS | Invoice is $1500 |
| Approval Before Invoice | ❌ FAIL | No approval requested |

### Backoffice Memory (backoffice_agent_memory.json)

| Policy | Expected Result | Reason |
|--------|----------------|--------|
| Response Length (100 tokens) | ❌ FAIL | Final summary is ~262 tokens |
| Response Length (300 tokens) | ✅ PASS | Under limit |
| Tool Call: create_invoice | ✅ PASS | 2 invoices created |
| Tool Call: check_inventory | ✅ PASS | 3 inventory checks |
| Inventory Before Invoice | ✅ PASS | Inventory checked in cycle 2, invoices in cycle 3 |
| Customer Check Required | ✅ PASS | Customer account checked first |

## Advanced Testing Scenarios

### Multi-Policy Evaluation
Test how a memory performs against multiple policies simultaneously:

1. Create 3-5 different policy types
2. Evaluate a single memory against all policies
3. Review the Dashboard to see compliance breakdown by policy

### Edge Cases

**Empty memory**: Upload a JSON with just `{"messages": []}`
- Should handle gracefully
- No violations possible

**Single message**: Upload with only a user message
- Response Length: No assistant message to check
- Tool policies: No tools to validate

**Tool-only conversation**: Messages with only tool calls, no text
- Response Length: Should handle empty text content
- Tool policies: Should work normally
