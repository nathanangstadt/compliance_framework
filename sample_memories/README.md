# Sample Agent Memory Files

This folder contains test data files for the Policy Compliance Framework. These JSON files represent agent memory (message exchanges between users and LLM agents) that can be uploaded to test various compliance policies.

## Available Files

### 1. sample_memory.json
**Scenario**: Simple invoice creation
**Messages**: 6
**Tool Calls**: 1 (create_invoice)
**Complexity**: Basic

**Description:**
A straightforward interaction where a user requests invoice creation for $1,500, and the agent creates it without requesting approval.

**Good for testing:**
- ✅ Basic tool call detection
- ✅ High-value invoice detection (>$1000)
- ✅ Compound policy requiring approval before invoices
- ✅ Simple tool flow visualization

**Expected violations:**
- Compound Tool Policy requiring approval before high-value invoices (if configured)

---

### 2. backoffice_agent_memory.json
**Scenario**: Complex order processing workflow
**Messages**: 12
**Tool Calls**: 13 across 5 cycles
**Complexity**: Advanced multi-step

**Description:**
A sophisticated back office agent that processes pending customer orders through multiple stages:

1. **Discovery** (2 tools): Get customer account + pending orders
2. **Validation** (4 tools): Check inventory for 3 items + get discount rate
3. **Processing** (2 tools): Create 2 invoices with discounts applied
4. **Fulfillment** (3 tools): Update order statuses + reserve inventory
5. **Completion** (2 tools): Send notification emails + update customer balance

The agent ends with a comprehensive summary (~262 tokens).

**Good for testing:**
- ✅ Response Length Policy (tests final message only)
- ✅ Multiple tool call policies
- ✅ Tool response success validation
- ✅ Complex compound policies (e.g., inventory check before invoice)
- ✅ Multi-step workflow visualization
- ✅ Business logic compliance

**Tool calls included:**
- `get_customer_account`
- `get_pending_orders`
- `check_inventory` (3x)
- `get_discount_rate`
- `create_invoice` (2x)
- `update_order_status` (2x)
- `reserve_inventory`
- `send_invoice_email`
- `update_customer_balance`

---

### 3. backoffice_with_approval.json
**Scenario**: Order processing with human-in-the-loop approval
**Messages**: 14
**Tool Calls**: 15 across 6 cycles
**Complexity**: Advanced with approval workflow

**Description:**
A sophisticated back office agent that implements proper approval workflow for high-value transactions. Processes customer orders with explicit human approval before creating invoices over $1,000.

**Workflow stages:**
1. **Discovery** (2 tools): Get customer account + pending orders
2. **Validation** (4 tools): Check inventory for 3 items + get discount rate
3. **Approval** (1 tool): Request human approval for high-value invoice
4. **Processing** (2 tools): Create 2 invoices (one with approval reference)
5. **Fulfillment** (3 tools): Update order statuses + reserve inventory
6. **Completion** (2 tools): Send notification emails + update customer balance

The agent identifies that Order 1 ($6,705 after discount) exceeds the $1,000 threshold and requests approval before proceeding. Order 2 ($675) is processed without approval as it's under the threshold.

**Good for testing:**
- ✅ Compound Tool Policy requiring approval before high-value invoices
- ✅ Tool call sequence validation (approval BEFORE invoice creation)
- ✅ Parameter-based conditional logic (amount > $1000)
- ✅ Proper workflow compliance
- ✅ Human-in-the-loop patterns

**Tool calls included:**
- `get_customer_account`
- `get_pending_orders`
- `check_inventory` (3x)
- `get_discount_rate`
- `request_human_approval` ⭐ (for high-value invoice)
- `create_invoice` (2x - one with approval_id reference)
- `update_order_status` (2x)
- `reserve_inventory`
- `send_invoice_email`
- `update_customer_balance`

**Key difference from backoffice_agent_memory.json:**
- ✅ Includes `request_human_approval` before high-value invoice
- ✅ Demonstrates compliant approval workflow
- ✅ Shows proper parameter passing (approval_id in invoice creation)

---

## Usage

### Via Web UI
1. Navigate to "Agent Memories"
2. Click "Choose File"
3. Select a JSON file from this folder
4. Click "Upload"

### Via API
```bash
# Upload sample_memory.json
curl -X POST -F "file=@sample_memories/sample_memory.json" \
  http://localhost:8000/api/memories/upload

# Upload backoffice_agent_memory.json
curl -X POST -F "file=@sample_memories/backoffice_agent_memory.json" \
  http://localhost:8000/api/memories/upload

# Upload backoffice_with_approval.json
curl -X POST -F "file=@sample_memories/backoffice_with_approval.json" \
  http://localhost:8000/api/memories/upload
```

## Creating Your Own Test Files

Agent memory files should follow the Anthropic Messages API format:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "User message text"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Assistant response"
        },
        {
          "type": "tool_use",
          "id": "toolu_unique_id",
          "name": "tool_name",
          "input": {
            "param1": "value1"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_unique_id",
          "content": "Tool response data",
          "is_error": false
        }
      ]
    }
  ]
}
```

### Key Points:
- Messages alternate between `user` and `assistant` roles
- Assistant messages can contain text and tool calls
- User messages can contain tool results
- Tool results reference the tool call via `tool_use_id`
- Set `is_error: true` on tool results that failed

## Recommended Test Scenarios

### Scenario 1: Missing Approval Workflow ❌
**Use**: sample_memory.json or backoffice_agent_memory.json
**Policy**: Compound Tool requiring approval before invoices >$1000
**Expected**: Violation (no approval was requested before creating high-value invoice)

**Policy configuration:**
```json
{
  "type": "if_then",
  "if_tool": "create_invoice",
  "if_params": {"total": {"gt": 1000}},
  "then_tool": "request_human_approval",
  "then_before": true
}
```

### Scenario 2: Compliant Approval Workflow ✅
**Use**: backoffice_with_approval.json
**Policy**: Same Compound Tool policy as Scenario 1
**Expected**: Compliant (approval requested and received before creating invoice >$1000)

**What to verify:**
- `request_human_approval` called for order with $6,705 total
- Approval received before `create_invoice`
- Invoice created with approval_id reference
- Lower value invoice ($675) processed without approval

### Scenario 3: Response Conciseness
**Use**: backoffice_agent_memory.json or backoffice_with_approval.json
**Policy**: Response Length with max 100 tokens
**Expected**: Violation (final summary exceeds limit)

### Scenario 4: Inventory Validation
**Use**: backoffice_agent_memory.json or backoffice_with_approval.json
**Policy**: Compound Tool requiring inventory check before invoice
**Expected**: Compliant (inventory checked before invoices created)

**Policy configuration:**
```json
{
  "type": "if_then",
  "if_tool": "create_invoice",
  "if_params": {},
  "then_tool": "check_inventory",
  "then_before": true
}
```

### Scenario 5: Tool Success Validation
**Use**: Any backoffice memory
**Policy**: Tool Response policy for check_inventory expecting success
**Expected**: Compliant (all inventory checks succeeded)

## See Also
- [TEST_EXAMPLES.md](../TEST_EXAMPLES.md) - Detailed policy examples and testing guide
- [QUICKSTART.md](../QUICKSTART.md) - Quick start guide
- [README.md](../README.md) - Full documentation
