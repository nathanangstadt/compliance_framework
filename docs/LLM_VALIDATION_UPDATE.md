# LLM Validation Feature - Implementation Summary

## Overview

This update adds full support for LLM validation nodes in the No-Code Policy Builder, allowing policies to semantically validate tool response values using AI models (Anthropic or OpenAI).

## What Was Changed

### Backend Changes

#### 1. Database Schema (`backend/app/models.py`)
- Added `_nocode_nodes` column to the `Policy` table to store visual policy editor state
- This allows policies created in the no-code editor to be re-edited later

```python
_nocode_nodes = Column(JSON, nullable=True)  # Store no-code editor nodes for re-editing
```

#### 2. Pydantic Schemas (`backend/app/schemas.py`)
- Added `_nocode_nodes` field to `PolicyCreate`, `PolicyUpdate`, and `PolicyResponse` schemas
- Allows the API to send and receive no-code node configurations

#### 3. API Routes (`backend/app/routes/policies.py`)
- Updated `create_policy` to save `_nocode_nodes`
- Updated `update_policy` to update `_nocode_nodes`
- Ensures no-code policies can be created and edited

#### 4. Policy Evaluator (`backend/app/services/policy_evaluator.py`)
- Added support for `llm_validate_response` condition type in compound_tool policies
- Extracts tool results and maps them to tool calls
- Validates tool response parameters using LLM (Anthropic or OpenAI)
- Checks for rejection keywords: "violation", "rejected", "denied", "no", "non-compliant", "does not comply", "fails"

**Key Code Addition (lines 213-313):**
```python
if condition_type == "llm_validate_response":
    # LLM validation of tool response
    tool_name = condition.get("tool_name")
    target_parameter = condition.get("target_parameter")
    validation_prompt = condition.get("validation_prompt")
    llm_provider = condition.get("llm_provider", "anthropic")
    model = condition.get("model", "claude-sonnet-4-5-20250929")

    # Find tool calls for this tool
    for tool_call in tool_calls:
        if tool_call["name"] == tool_name:
            # Get the result for this tool call
            tool_result = tool_results.get(tool_call["id"])
            # ... validate with LLM and check for rejection keywords
```

### Frontend Changes

#### 1. No-Code Policy Editor (`frontend/src/components/NoCodePolicyEditor.js`)
- Updated `convertToBackendPolicy()` to generate `llm_validate_response` conditions
- Added support for loading policies from `_nocode_nodes` for editing
- Added `onClose` prop support

**Key Code Addition (lines 172-183):**
```javascript
} else if (node.type === ATOMIC_NODE_TYPES.LLM_VALIDATION) {
  // LLM validation node - convert to llm_validate_response
  if (node.config.tool_name && node.config.target_parameter && node.config.validation_prompt) {
    conditions.push({
      type: 'llm_validate_response',
      tool_name: node.config.tool_name,
      target_parameter: node.config.target_parameter,
      validation_prompt: node.config.validation_prompt,
      llm_provider: node.config.llm_provider || 'anthropic',
      model: node.config.model || 'claude-sonnet-4-5-20250929'
    });
  }
}
```

#### 2. Policies Page (`frontend/src/pages/PoliciesPage.js`)
- Updated `handleEdit()` to detect policies with `_nocode_nodes` and open no-code editor
- Updated `handleNoCodeSave()` to handle both create and update operations
- Passes `initialPolicy` to NoCodePolicyEditor for editing

**Key Changes:**
```javascript
const handleEdit = (policy) => {
  setEditingPolicy(policy);
  // If policy has _nocode_nodes, open no-code editor, otherwise open code editor
  if (policy._nocode_nodes && Array.isArray(policy._nocode_nodes)) {
    setShowNoCodeEditor(true);
  } else {
    setShowEditor(true);
  }
};
```

## How to Test

### Prerequisites
1. **Backend API Key**: Ensure you have an Anthropic API key set in `backend/.env`:
   ```bash
   ANTHROPIC_API_KEY=your-api-key-here
   ```
   (Optional: Set `OPENAI_API_KEY` if using OpenAI models)

2. **Restart Containers**: The database schema has changed, so a fresh start is required:
   ```bash
   docker-compose down
   rm backend/compliance.db  # Remove old database
   docker-compose up -d --build
   ```

### Testing Steps

#### 1. Create a Policy with LLM Validation

1. Open the application at http://localhost:3000
2. Navigate to **Policies** page
3. Click **🎨 No-Code Builder**
4. Enter policy details:
   - Name: "Approval Status Validation"
   - Description: "Ensure approval requests actually get approved"

5. Add an LLM Validation Node:
   - Click **+ Add Rule**
   - Select **🤖 LLM Validation**
   - Tool Name: `request_human_approval`
   - Target Parameter: `status`
   - Validation Prompt: `Validate the status indicates an approval. Look for words like 'approved', 'yes', 'go ahead', 'confirmed'. Respond with 'compliant' if approved, 'violation' if rejected or denied.`
   - LLM Provider: `anthropic`
   - Model: `claude-sonnet-4-5-20250929`

6. Click **Save Policy**

#### 2. Test with Rejection Sample

1. Navigate to **Memories** page
2. Click **Upload Memory**
3. Upload `sample_memories/backoffice_with_rejection.json`
4. Click **Evaluate** and select the "Approval Status Validation" policy
5. **Expected Result**: Policy should be **VIOLATED**
   - The LLM should detect that `"status": "rejected"` on line 147 is not an approval
   - Violation details should show the LLM's evaluation result

#### 3. Test with Approval Sample

1. Upload `sample_memories/backoffice_with_approval.json`
2. Evaluate against the "Approval Status Validation" policy
3. **Expected Result**: Policy should be **COMPLIANT**
   - The approval status should pass validation

#### 4. Test Editing No-Code Policies

1. Navigate to **Policies** page
2. Click **Edit** on a policy created with the no-code builder
3. **Expected Result**: The no-code editor should open (not the code editor)
4. The LLM Validation node should display with all its configuration
5. You can modify and save the policy

### Advanced Test: Compound Policy

Create a policy that combines multiple conditions:

1. Add **Tool Call Node**:
   - Tool Name: `create_invoice`
   - Add Parameter Condition: `total` > `3000`

2. Add **LLM Validation Node**:
   - Tool Name: `request_human_approval`
   - Target Parameter: `status`
   - Validation Prompt: (same as above)

3. Add **Conditional Node**:
   - If: `create_invoice` (the first node)
   - Then: `request_human_approval`
   - Require BEFORE: ✓ (checked)

This creates a policy that:
- Detects invoices over $3000
- Requires approval to be requested BEFORE creating the invoice
- Validates that the approval status actually indicates approval (not rejection)

## Violation Types

The LLM validation feature introduces new violation types:

1. **`llm_validate_response_violation`**: The LLM determined the response parameter doesn't meet the validation criteria
   - Details include: tool name, parameter, value, and LLM's evaluation result

2. **`llm_eval_error`**: An error occurred during LLM validation
   - Could be: API key not configured, LLM API error, or parsing error

## Configuration Options

### LLM Providers

**Anthropic** (default):
- Provider: `anthropic`
- Default Model: `claude-sonnet-4-5-20250929`
- Requires: `ANTHROPIC_API_KEY` in backend/.env

**OpenAI**:
- Provider: `openai`
- Default Model: `gpt-4-turbo-preview`
- Requires: `OPENAI_API_KEY` in backend/.env

### Validation Prompts

The validation prompt should be clear and specific:
- Describe what constitutes compliance vs violation
- Include examples of acceptable values
- Specify how the LLM should respond

**Good Example:**
```
Validate the status indicates an approval. Look for words like 'approved',
'yes', 'go ahead', 'confirmed'. Respond with 'compliant' if approved,
'violation' if rejected or denied.
```

**Poor Example:**
```
Check if approved  # Too vague
```

## How It Works

### Policy Creation Flow

1. User creates LLM Validation node in no-code editor
2. Frontend converts node to `llm_validate_response` condition
3. Backend saves policy with both `config` (backend format) and `_nocode_nodes` (editor state)

### Policy Evaluation Flow

1. Policy evaluator finds tool calls matching `tool_name`
2. Extracts tool results from user messages
3. Parses JSON response and gets `target_parameter` value
4. Sends value and validation prompt to LLM (Anthropic or OpenAI)
5. Checks LLM response for rejection keywords
6. Creates violation if any rejection keyword found

### Policy Re-Editing Flow

1. User clicks "Edit" on a policy
2. Frontend checks if `_nocode_nodes` exists
3. If yes: Opens no-code editor with saved nodes
4. If no: Opens code editor (legacy policy)
5. User modifies policy and saves
6. Both `config` and `_nocode_nodes` are updated

## Troubleshooting

### "Anthropic API key not configured"
- Add `ANTHROPIC_API_KEY` to `backend/.env`
- Restart backend: `docker-compose restart backend`

### "Policy has no effect"
- Ensure tool names match exactly (case-sensitive)
- Check that target parameter exists in tool response
- Verify validation prompt is clear

### "Can't edit policy in no-code editor"
- Policy was created in code editor (no `_nocode_nodes`)
- Create a new policy using no-code builder
- Or manually add `_nocode_nodes` via API

### Database errors after update
- Database schema changed (added `_nocode_nodes` column)
- Remove old database: `rm backend/compliance.db`
- Restart containers: `docker-compose up -d --build`

## Files Modified

1. `backend/app/models.py` - Added `_nocode_nodes` column
2. `backend/app/schemas.py` - Added `_nocode_nodes` to schemas
3. `backend/app/routes/policies.py` - Handle `_nocode_nodes` in create/update
4. `backend/app/services/policy_evaluator.py` - LLM validation logic
5. `frontend/src/components/NoCodePolicyEditor.js` - Generate LLM validation conditions
6. `frontend/src/pages/PoliciesPage.js` - Smart policy editing (code vs no-code)

## Next Steps

Future enhancements could include:
- Visual workflow diagram showing node connections
- More complex validation logic (AND/OR combinations)
- Parameter path navigation for nested response fields
- LLM caching to reduce API costs
- Validation prompt templates for common scenarios
