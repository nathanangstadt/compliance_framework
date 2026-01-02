# Sample Memory Comparison

This document compares the three sample memory files to help you understand when to use each one for testing.

## Quick Comparison Table

| Feature | sample_memory.json | backoffice_agent_memory.json | backoffice_with_approval.json |
|---------|-------------------|------------------------------|------------------------------|
| **Complexity** | Simple | Advanced | Advanced |
| **Messages** | 6 | 12 | 14 |
| **Tool Calls** | 1 | 13 | 15 |
| **Cycles** | 1 | 5 | 6 |
| **Human Approval** | ❌ No | ❌ No | ✅ Yes |
| **Invoice Count** | 1 | 2 | 2 |
| **Invoice Amount** | $1,500 | $6,588 total | $7,380 total |
| **Best For Testing** | Basic policies | Multi-step workflows | Approval workflows |

## Detailed Comparison

### 1. sample_memory.json - Simple Workflow

**Purpose**: Demonstrate basic non-compliant behavior

**Scenario**: User requests invoice creation for $1,500. Agent creates it immediately without approval.

**Workflow**:
```
User Request
    ↓
create_invoice ($1,500)
    ↓
Confirmation
```

**Test Use Cases**:
- ✅ Basic Tool Call detection
- ✅ High-value invoice detection
- ❌ Missing approval workflow violation
- ✅ Simple flow visualization

**Expected Results**:
- Response Length Policy (100 tokens): ✅ PASS (brief response)
- Tool Call Policy (create_invoice): ✅ PASS (tool called)
- Compound Policy (approval required): ❌ FAIL (no approval)

---

### 2. backoffice_agent_memory.json - Complex Non-Compliant Workflow

**Purpose**: Demonstrate complex multi-cycle agent WITHOUT approval

**Scenario**: Process orders for customer 12345. Agent handles $7,750 in orders through 5 cycles but never requests approval for high-value invoices.

**Workflow**:
```
User Request
    ↓
Cycle 1: Get customer + orders
    ↓
Cycle 2: Check inventory (3x) + discount rate
    ↓
Cycle 3: Create invoices (2x) - $4,038 & $2,550 (NO APPROVAL!)
    ↓
Cycle 4: Update statuses + reserve inventory
    ↓
Cycle 5: Send emails + update balance
    ↓
Final Summary (~262 tokens)
```

**Test Use Cases**:
- ✅ Multi-step workflow visualization
- ✅ Response Length Policy (final message only)
- ✅ Multiple Tool Call policies
- ✅ Tool Response success validation
- ✅ Inventory-before-invoice validation (PASS)
- ❌ Approval-before-invoice validation (FAIL)

**Expected Results**:
- Response Length Policy (100 tokens): ❌ FAIL (~262 tokens)
- Response Length Policy (300 tokens): ✅ PASS
- Tool Call Policy (create_invoice): ✅ PASS (2 invoices)
- Tool Call Policy (check_inventory): ✅ PASS (3 checks)
- Compound Policy (inventory before invoice): ✅ PASS
- Compound Policy (approval before invoice): ❌ FAIL (no approval)

---

### 3. backoffice_with_approval.json - Complex Compliant Workflow

**Purpose**: Demonstrate proper approval workflow implementation

**Scenario**: Process orders for customer 67890. Agent handles $8,200 in orders and CORRECTLY requests approval before creating the $6,705 invoice.

**Workflow**:
```
User Request (explicitly mentions approval requirement)
    ↓
Cycle 1: Get customer + orders
    ↓
Cycle 2: Check inventory (3x) + discount rate
    ↓
Cycle 3: request_human_approval ($6,705 invoice) ⭐
    ↓
Cycle 4: Create invoices (2x)
    - Invoice 1: $6,705 WITH approval_id ✅
    - Invoice 2: $675 NO approval needed (under threshold)
    ↓
Cycle 5: Update statuses + reserve inventory
    ↓
Cycle 6: Send emails + update balance
    ↓
Final Summary
```

**Key Differences**:
- ⭐ Includes `request_human_approval` tool call
- ⭐ Approval obtained BEFORE high-value invoice creation
- ⭐ Invoice includes approval_id reference
- ⭐ Demonstrates conditional logic (approval only for >$1000)

**Test Use Cases**:
- ✅ Compliant approval workflow
- ✅ Human-in-the-loop patterns
- ✅ Conditional approval logic
- ✅ Tool call sequencing validation
- ✅ Parameter-based decision making

**Expected Results**:
- Response Length Policy (100 tokens): ❌ FAIL (~similar to backoffice)
- Tool Call Policy (request_human_approval): ✅ PASS
- Tool Call Policy (create_invoice): ✅ PASS (2 invoices)
- Compound Policy (approval before invoice >$1000): ✅ PASS ⭐
- Compound Policy (inventory before invoice): ✅ PASS

---

## Side-by-Side Policy Test Results

### Policy: "High Value Invoice Approval Required"
**Configuration**:
```json
{
  "type": "if_then",
  "if_tool": "create_invoice",
  "if_params": {"total": {"gt": 1000}},
  "then_tool": "request_human_approval",
  "then_before": true
}
```

| Memory File | Result | Reason |
|------------|--------|--------|
| sample_memory.json | ❌ FAIL | Creates $1,500 invoice without approval |
| backoffice_agent_memory.json | ❌ FAIL | Creates $4,038 and $2,550 invoices without approval |
| backoffice_with_approval.json | ✅ PASS | Requests approval before $6,705 invoice |

---

## When to Use Each File

### Use sample_memory.json when:
- Testing basic policy functionality
- Demonstrating simple violations
- Learning the system
- Quick smoke tests
- Teaching policy concepts

### Use backoffice_agent_memory.json when:
- Testing complex multi-cycle workflows
- Demonstrating non-compliant behavior
- Testing tool sequence policies
- Validating flow visualization
- Testing response length on final message only
- Showing what NOT to do

### Use backoffice_with_approval.json when:
- Testing compliant approval workflows
- Demonstrating best practices
- Validating human-in-the-loop patterns
- Testing conditional policy logic
- Showing what TO do
- Comparing compliant vs non-compliant side-by-side

---

## Testing Recommendations

### Comparison Testing
Upload both `backoffice_agent_memory.json` and `backoffice_with_approval.json`, then:

1. Create the "High Value Invoice Approval Required" policy
2. Evaluate both memories against it
3. Compare results:
   - backoffice_agent_memory: Should show violations
   - backoffice_with_approval: Should be compliant
4. Review in the UI to see the differences visually

### Progressive Testing
1. Start with `sample_memory.json` - learn basics
2. Move to `backoffice_agent_memory.json` - understand complexity
3. Compare with `backoffice_with_approval.json` - see the fix
4. Create your own variations

### Policy Development
When creating new policies:
1. Test against `backoffice_with_approval.json` first (should pass)
2. Test against `backoffice_agent_memory.json` (should fail appropriately)
3. Test against `sample_memory.json` (should fail on high-value invoice)
4. Adjust policy until results match expectations

---

## Common Questions

**Q: Why are there two similar backoffice memories?**
A: To demonstrate the difference between non-compliant and compliant workflows for the same business scenario. This helps validate that policies can distinguish between good and bad behavior.

**Q: Should I always use backoffice_with_approval.json for testing?**
A: No. Use `backoffice_agent_memory.json` to verify your policies can detect violations. Use `backoffice_with_approval.json` to verify they don't create false positives.

**Q: Can I modify these files?**
A: Yes! These are templates. Modify them to match your specific use cases, tool names, and business rules.

**Q: Which file has the most tool calls?**
A: `backoffice_with_approval.json` with 15 tool calls (includes the approval request).

**Q: Do both backoffice files test the same policies?**
A: Yes, but with opposite expected results for approval-related policies. This validates that your policies work correctly.
