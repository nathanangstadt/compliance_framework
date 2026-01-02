# No-Code Policy Builder Guide

The No-Code Policy Builder allows you to create complex compliance policies visually without writing any code or JSON. Build policies by combining atomic "nodes" that represent different compliance rules.

## Accessing the Builder

1. Navigate to the "Policies" page
2. Click the **🎨 No-Code Builder** button
3. Start building your policy visually!

## Atomic Node Types

### 1. 🔧 Tool Call Node
**Purpose**: Check if a specific tool is called with certain parameter conditions

**Configuration:**
- **Tool Name**: The exact name of the tool to check for (e.g., `create_invoice`)
- **Parameter Conditions**: Define constraints on tool parameters

**Parameter Condition Operators:**
- `Greater Than (gt)`: Parameter value must be > specified value
- `Less Than (lt)`: Parameter value must be < specified value
- `Equals (eq)`: Parameter value must exactly match
- `Greater or Equal (gte)`: Parameter value must be >= specified value
- `Less or Equal (lte)`: Parameter value must be <= specified value

**Example Use Cases:**
- Detect when invoices are created
- Check if invoice amounts exceed a threshold
- Verify specific parameters are present

**Example Configuration:**
```
Tool Name: create_invoice
Parameter Conditions:
  - total > 1000
  - currency = "USD"
```

---

### 2. ✓ Tool Response Check Node
**Purpose**: Validate tool response parameters or ensure tool succeeded

**Configuration:**
- **Tool Name**: The tool whose response to check
- **Expect Success**: Require that the tool did not return an error
- **Response Parameter Checks**: Validate specific response fields

**Response Check Comparisons:**
- `Equals`: Value must exactly match
- `Contains`: Value must contain the specified string
- `Not Equals`: Value must not match

**Example Use Cases:**
- Ensure inventory checks succeeded
- Verify response status is "completed"
- Check that specific fields are present in responses

**Example Configuration:**
```
Tool Name: check_inventory
Expect Success: ✓
Response Checks:
  - status equals "in_stock"
  - available > 0
```

---

### 3. 🤖 LLM Validation Node
**Purpose**: Use AI to validate tool response values (for complex semantic checks)

**Configuration:**
- **Tool Name**: The tool whose response to validate
- **Target Parameter**: Which field from the response to analyze
- **Validation Prompt**: Instructions for the LLM on what to check
- **LLM Provider**: anthropic or openai
- **Model**: The specific model to use

**Example Use Cases:**
- Validate that approval status indicates "approved" (handles variations like "Approved", "Yes", "Go ahead")
- Check for appropriate professional tone
- Verify descriptions are detailed enough
- Detect inappropriate content

**Example Configuration:**
```
Tool Name: request_human_approval
Target Parameter: status
Validation Prompt: "Validate the status indicates an approval.
                   Look for words like 'approved', 'yes', 'go ahead', 'confirmed'.
                   Respond with 'compliant' if approved, 'violation' if not."
LLM Provider: anthropic
Model: claude-sonnet-4-5-20250929
```

**When to Use LLM Validation:**
- The exact response format varies (e.g., "Approved" vs "Yes" vs "Go for it")
- Semantic understanding is needed (not just string matching)
- Complex validation logic that's hard to express as rules

---

### 4. ⚡ Conditional (If-Then) Node
**Purpose**: Enforce that if one tool is called, another tool must also be called

**Configuration:**
- **If this tool is called**: Select a Tool Call node
- **Then this tool must be called**: Select another Tool Call node
- **Require BEFORE**: If checked, the "then" tool must be called BEFORE the "if" tool

**Example Use Cases:**
- Require approval before high-value operations
- Ensure validation before processing
- Enforce specific workflow sequences

**Example Configuration:**
```
If Tool: create_invoice (with total > 1000)
Then Tool: request_human_approval
Require BEFORE: ✓
```
This creates a rule: "If creating an invoice over $1000, approval must be requested first"

---

## Building Your First Policy

### Example: High-Value Invoice Approval

**Goal**: Ensure that invoices over $1,000 require human approval BEFORE being created.

**Steps:**

1. **Create the policy shell**
   - Policy Name: "High Value Invoice Approval"
   - Description: "Require approval for invoices exceeding $1,000"

2. **Add Tool Call Node #1** (the trigger)
   - Type: 🔧 Tool Call
   - Tool Name: `create_invoice`
   - Add Parameter Condition:
     - Parameter: `total`
     - Operator: `Greater Than`
     - Value: `1000`

3. **Add Tool Call Node #2** (the requirement)
   - Type: 🔧 Tool Call
   - Tool Name: `request_human_approval`

4. **Add Conditional Node** (link them together)
   - Type: ⚡ Conditional
   - If this tool is called: Select Node #1 (create_invoice)
   - Then this tool must be called: Select Node #2 (request_human_approval)
   - Require BEFORE: ✓ (checked)

5. **Save the policy**

**Result**: The system will now flag any agent memory where an invoice over $1,000 is created without prior approval.

---

## Advanced Example: Approval Status Validation

**Goal**: Ensure that when approval is requested, the response actually indicates approval (not just any response).

**Steps:**

1. **Add Tool Call Node** - Check for approval request
   - Tool Name: `request_human_approval`

2. **Add LLM Validation Node** - Validate the approval status
   - Tool Name: `request_human_approval`
   - Target Parameter: `status`
   - Validation Prompt: "Check if the status field indicates approval. Accept variations like 'approved', 'yes', 'confirmed', 'go ahead'. Respond 'compliant' if approved, 'violation' otherwise."
   - LLM Provider: `anthropic`
   - Model: `claude-sonnet-4-5-20250929`

3. **Save the policy**

**Result**: The LLM will analyze the actual approval status and handle variations in how approval is expressed.

---

## Node Management

### Reordering Nodes
- Use **↑** and **↓** buttons to change node order
- Order matters for sequential policies

### Deleting Nodes
- Click the **×** button on any node
- Conditional nodes that reference deleted nodes will need updating

### Editing Nodes
- All fields can be edited after creation
- Changes are only saved when you click "Save Policy"

---

## Tips and Best Practices

### 1. Start Simple
- Begin with one or two nodes
- Test with sample data
- Add complexity incrementally

### 2. Name Things Clearly
- Use descriptive policy names
- Tool names should match exactly what's in your agent memory

### 3. Test Your Policies
- Upload the `backoffice_with_approval.json` sample (should pass)
- Upload the `backoffice_agent_memory.json` sample (should fail)
- Verify the policy works as expected

### 4. Combine Nodes Wisely
- Tool Call nodes define WHAT to check
- Conditional nodes define workflow SEQUENCE
- LLM Validation adds semantic understanding

### 5. Use LLM Validation Sparingly
- Only when exact string matching won't work
- Costs API credits per evaluation
- Great for handling natural language variations

---

## Common Patterns

### Pattern 1: Threshold-Based Approval
```
IF: create_invoice (amount > X)
THEN: request_human_approval (BEFORE)
```

### Pattern 2: Validation Before Action
```
IF: process_order
THEN: check_inventory (BEFORE)
```

### Pattern 3: Success Verification
```
Tool Response Check:
  - Tool: database_write
  - Expect Success: ✓
  - Response: status = "committed"
```

### Pattern 4: Semantic Validation
```
LLM Validation:
  - Tool: customer_response
  - Parameter: tone
  - Prompt: "Verify the response maintains a professional tone"
```

---

## Limitations

### Current Version
- **Supported Backend Policy**: Compound Tool policies only
- **Node Linking**: Conditional nodes link Tool Call nodes
- **Editing**: No-code policies created in the builder can be re-edited there
- **Code Policies**: Policies created in the code editor stay in code format

### Future Enhancements
- Support for all policy types (Response Length, LLM Eval, etc.)
- Visual workflow diagram
- Policy templates
- Advanced logic operators (AND/OR/NOT)
- Parameter path navigation (nested object fields)

---

## Troubleshooting

### "Policy has no effect"
- Ensure Tool Call nodes have the correct tool names (case-sensitive)
- Verify parameter conditions use the right operator
- Check that Conditional nodes reference the right nodes

### "Too many violations"
- Check if parameter conditions are too strict
- Verify the operator (gt vs gte, etc.)
- Review sample data to see actual parameter values

### "Policy doesn't validate"
- LLM Validation nodes require API keys in backend/.env
- Validation prompts should be clear and specific
- Test prompts with sample data first

---

## Conversion to Backend Format

The No-Code Builder automatically converts your visual policy to the backend format:

**Visual Policy:**
- Tool Call: `create_invoice` (total > 1000)
- Tool Call: `request_human_approval`
- Conditional: IF create_invoice THEN request_human_approval (BEFORE)

**Backend JSON:**
```json
{
  "policy_type": "compound_tool",
  "config": {
    "conditions": [{
      "type": "if_then",
      "if_tool": "create_invoice",
      "if_params": {"total": {"gt": 1000}},
      "then_tool": "request_human_approval",
      "then_before": true
    }]
  }
}
```

The visual representation is stored in `_nocode_nodes` for future editing.

---

## See Also
- [TEST_EXAMPLES.md](TEST_EXAMPLES.md) - Policy testing examples
- [sample_memories/README.md](sample_memories/README.md) - Test data
- [COMPARISON.md](COMPARISON.md) - Sample memory comparisons
