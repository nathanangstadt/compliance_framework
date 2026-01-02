# Policy System V2 - Migration Plan

## Overview

This document outlines the migration from the current policy system to the new extensible, user-friendly Policy V2 system.

## Current State

**Problems:**
1. Multiple policy types (response_length, tool_call, tool_response, compound_tool, llm_eval) are confusing
2. Two editors (Code Editor + No-Code Editor) create inconsistent UX
3. Policies can't be re-edited after creation
4. Complex policies are hard to express
5. Violation messages are generic and unhelpful

## New System Architecture

### Policy Structure

**Single Policy Type: `composite`**

All policies are now composite policies with:
- **Checks**: List of atomic checks (8 types available)
- **Violation Logic**: How checks combine to determine violations (5 logic types)

```javascript
{
  "name": "High Value Invoice Approval",
  "description": "Invoices over $1,000 require approval",
  "policy_type": "composite",
  "config": {
    "checks": [
      {
        "id": "check_1",
        "name": "High value invoice created",
        "type": "tool_call",
        "tool_name": "create_invoice",
        "params": { "total": { "gt": 1000 } },
        "violation_message": "Invoice ${params.total} exceeds $1,000"  // Optional
      },
      {
        "id": "check_2",
        "name": "Approval requested",
        "type": "tool_call",
        "tool_name": "request_human_approval"
      },
      {
        "id": "check_3",
        "name": "Approval granted",
        "type": "llm_tool_response",
        "tool_name": "request_human_approval",
        "parameter": "status",
        "validation_prompt": "Validate status indicates approval",
        "llm_provider": "anthropic"
      }
    ],
    "violation_logic": {
      "type": "IF_ANY_THEN_ALL",
      "triggers": ["check_1"],
      "requirements": ["check_2", "check_3"]
    }
  },
  "_nocode_nodes": [ /* UI state for re-editing */ ]
}
```

### 8 Core Check Types

1. **tool_call** - Tool called with specific parameters
2. **tool_response** - Tool response has specific values
3. **llm_tool_response** - LLM validates tool response parameter
4. **response_length** - Final response token count
5. **tool_call_count** - Count of tool calls (prevent excessive HITL)
6. **llm_response_validation** - LLM validates agent response (PII, tone, etc.)
7. **response_contains** - Response has/doesn't have keywords
8. **tool_absence** - Tool must NOT be called

### 5 Violation Logic Types

1. **IF_ANY_THEN_ALL** - If any trigger fires, all requirements must pass
2. **IF_ALL_THEN_ALL** - If all triggers fire, all requirements must pass
3. **REQUIRE_ALL** - All checks must pass (simple AND)
4. **REQUIRE_ANY** - At least one check must pass (simple OR)
5. **FORBID_ALL** - Forbidden checks must not pass (unless authorized)

## Migration Steps

### Phase 1: Backend (Completed)
- ✅ Created `check_types.py` with 8 check types
- ✅ Created `composite_policy_evaluator.py` with 5 violation logics
- ⏳ Update `policy_evaluator.py` to use new system
- ⏳ Update policy routes to handle new schema
- ⏳ Create migration for existing policies

### Phase 2: Frontend (In Progress)
- ⏳ Create new unified Policy Builder UI
- ⏳ Create check type selector with icons/descriptions
- ⏳ Create violation logic selector
- ⏳ Remove old Code Editor and No-Code Editor
- ⏳ Update violation display with structured output

### Phase 3: Testing & Documentation
- ⏳ Test with all sample memories
- ⏳ Update documentation
- ⏳ Create migration guide for existing users

## UI Design

### New Policy Builder

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Create Policy                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Policy Name: [High Value Invoice Approval              ]   │
│ Description: [Invoices over $1,000 require approval    ]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ CHECKS                                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [+ Add Check ▼]                                     │   │
│ │   • Tool Call                                        │   │
│ │   • Tool Response                                    │   │
│ │   • LLM Tool Response Validation                    │   │
│ │   • Response Length                                  │   │
│ │   • Tool Call Count                                  │   │
│ │   • LLM Response Validation                         │   │
│ │   • Response Contains Keywords                      │   │
│ │   • Tool Absence                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🔧 Check #1: High value invoice created              │ │
│ │ ───────────────────────────────────────────────────── │ │
│ │ Type: Tool Call                                       │ │
│ │ Tool: create_invoice                                  │ │
│ │ Condition: total > 1000                              │ │
│ │ ☐ Custom message (optional)                          │ │
│ │     [Invoice ${params.total} exceeds limit        ]  │ │
│ │                                        [↑] [↓] [×]   │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🤖 Check #2: Approval granted                        │ │
│ │ ───────────────────────────────────────────────────── │ │
│ │ Type: LLM Tool Response Validation                   │ │
│ │ Tool: request_human_approval                         │ │
│ │ Parameter: status                                     │ │
│ │ Prompt: [Validate status indicates approval...    ]  │ │
│ │ Provider: Anthropic ▼   Model: sonnet-4.5 ▼         │ │
│ │                                        [↑] [↓] [×]   │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ VIOLATION LOGIC                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Type: [IF_ANY_THEN_ALL ▼]                          │   │
│ │                                                      │   │
│ │ When These Trigger:                                 │   │
│ │   [×] Check #1: High value invoice created          │   │
│ │                                                      │   │
│ │ Then These Must Pass:                               │   │
│ │   [×] Check #2: Approval granted                    │   │
│ │                                                      │   │
│ │ ℹ Meaning: If a high-value invoice is created,     │   │
│ │   then approval must be granted                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                    [Cancel] [Save Policy]  │
└─────────────────────────────────────────────────────────────┘
```

### Check Type Selector

When clicking "+ Add Check", show a visual selector:

```
┌─────────────────────────────────────────────────────────────┐
│ Select Check Type                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│ │ 🔧 Tool     │ │ ✓ Tool      │ │ 🤖 LLM Tool │          │
│ │   Call      │ │   Response  │ │   Response  │          │
│ │             │ │             │ │             │          │
│ │ Check if a  │ │ Validate    │ │ Use AI to   │          │
│ │ specific    │ │ tool result │ │ validate    │          │
│ │ tool is     │ │ parameters  │ │ response    │          │
│ │ called      │ │             │ │ values      │          │
│ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│ │ 📏 Response │ │ 🔢 Tool     │ │ 🤖 LLM      │          │
│ │   Length    │ │   Call      │ │   Response  │          │
│ │             │ │   Count     │ │   Validation│          │
│ │ Limit final │ │ Limit how   │ │ Check agent │          │
│ │ response    │ │ many times  │ │ response    │          │
│ │ token count │ │ tool called │ │ for PII etc │          │
│ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ 🔍 Contains │ │ 🚫 Tool     │                           │
│ │   Keywords  │ │   Absence   │                           │
│ │             │ │             │                           │
│ │ Check for   │ │ Ensure tool │                           │
│ │ required    │ │ is NOT      │                           │
│ │ keywords    │ │ called      │                           │
│ └─────────────┘ └─────────────┘                           │
│                                                             │
│                                            [Cancel]         │
└─────────────────────────────────────────────────────────────┘
```

## Violation Output Format

### Old Format
```json
{
  "is_compliant": false,
  "violations": [
    {
      "message_index": 147,
      "violation_type": "if_then_violation",
      "description": "Tool requirement not met"
    }
  ]
}
```

### New Format
```json
{
  "is_compliant": false,
  "violations": [
    {
      "policy_name": "High Value Invoice Approval",
      "policy_description": "Invoices over $1,000 require approval",
      "violation_type": "IF_ANY_THEN_ALL",
      "summary": "Trigger condition met but required checks failed",

      "triggered_checks": [
        {
          "check_id": "check_1",
          "check_name": "High value invoice created",
          "check_type": "tool_call",
          "passed": true,
          "message": "Invoice total $5,000 exceeds $1,000 limit",
          "details": { "tool_name": "create_invoice", "params": { "total": 5000 } }
        }
      ],

      "failed_requirements": [
        {
          "check_id": "check_3",
          "check_name": "Approval granted",
          "check_type": "llm_tool_response",
          "passed": false,
          "message": "LLM validation failed: status shows 'rejected'",
          "details": { "llm_response": "The status 'rejected' indicates denial, not approval. VIOLATION." }
        }
      ],

      "violation_message": "Trigger 'High value invoice created' activated, but required check 'Approval granted' failed"
    }
  ]
}
```

## Benefits

1. **Single Unified Editor** - One way to create policies
2. **Visual & Intuitive** - Card-based UI with clear hierarchy
3. **Extensible** - Easy to add new check types
4. **Re-editable** - All policies can be edited after creation
5. **Better Violations** - Structured, detailed violation messages
6. **Template Messages** - Optional custom violation messages with variable substitution

## Next Steps

1. Update main `policy_evaluator.py` to integrate composite evaluator
2. Build new frontend Policy Builder
3. Test thoroughly with sample memories
4. Deploy and document

---

**Status**: Phase 1 (Backend) 60% complete
**Est. Completion**: Next 2-3 hours of focused work
