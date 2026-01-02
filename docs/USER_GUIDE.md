# Composite Policy System - User Guide

Welcome to the **Composite Policy Compliance Framework**! This guide will help you create powerful, flexible compliance policies using our intuitive visual policy builder.

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Understanding Composite Policies](#understanding-composite-policies)
4. [Check Types Reference](#check-types-reference)
5. [Violation Logic Types](#violation-logic-types)
6. [Creating Your First Policy](#creating-your-first-policy)
7. [Real-World Examples](#real-world-examples)
8. [Interpreting Violations](#interpreting-violations)
9. [Best Practices](#best-practices)

---

## Introduction

The **Composite Policy System** allows you to build sophisticated compliance policies by combining atomic checks with flexible violation logic. Think of it like building with LEGO blocks - each check is a simple, testable piece that you can combine in powerful ways.

### What Makes It Special?

- **Visual Builder**: No coding required - create policies through an intuitive interface
- **Atomic Checks**: 8 different check types cover all your compliance needs
- **Flexible Logic**: 5 violation logic types let you express complex requirements
- **Beautiful Violations**: See exactly what triggered and what failed with structured output
- **Extensible**: System designed to easily add new check types and logic patterns

---

## Quick Start

### Creating a Policy in 3 Steps

1. **Navigate to Policies** → Click "✨ Create Policy"
2. **Define Checks** → Add the conditions you want to monitor
3. **Set Violation Logic** → Choose when the policy should be violated

That's it! Let's walk through a real example.

---

## Understanding Composite Policies

A composite policy has three parts:

```
POLICY = BASIC INFO + CHECKS + VIOLATION LOGIC
```

### 1. Basic Information
- **Name**: Descriptive name (e.g., "High Value Invoice Approval")
- **Description**: What this policy ensures

### 2. Checks
Individual conditions that can be evaluated as **true** or **false**:
- ✓ Was tool X called?
- ✓ Did the response contain Y?
- ✓ Was the response length under Z tokens?

### 3. Violation Logic
How checks combine to determine compliance:
- **IF_ANY_THEN_ALL**: If trigger fires, requirements must pass
- **REQUIRE_ALL**: All checks must pass (AND logic)
- **FORBID_ALL**: Checks must NOT pass (prohibition logic)

---

## Check Types Reference

### 🔧 Tool Call
**What it does**: Detects when a specific tool is called with certain parameters

**Use cases**:
- Detect high-value transactions (`create_invoice` with `total > 1000`)
- Monitor sensitive operations (`delete_customer` called)
- Track approval requests

**Configuration**:
- **Tool Name**: Name of the tool to monitor (required)
- **Parameter Conditions**: Optional filters like `total > 1000`
  - Operators: `>`, `>=`, `<`, `<=`, `=`, `contains`

**Example**:
```
Tool Name: create_invoice
Parameter Conditions:
  - total > 1000
```

---

### ↩️ Tool Response
**What it does**: Validates the response/output from a tool

**Use cases**:
- Check that `get_customer` returned `status = "active"`
- Verify `check_inventory` shows `available > quantity_needed`
- Ensure operations succeeded

**Configuration**:
- **Tool Name**: Tool whose response to check (required)
- **Response Field**: Field to validate (required)
- **Expected Value**: Value to match (optional)

**Example**:
```
Tool Name: check_inventory
Response Field: status
Expected Value: in_stock
```

---

### 🤖 LLM Tool Response
**What it does**: Uses AI to semantically validate a tool response parameter

**Use cases**:
- Verify approval status actually means "approved" (not "rejected")
- Check that sentiment is positive
- Validate free-text fields meet requirements

**Configuration**:
- **Tool Name**: Tool to check (required)
- **Response Field**: Parameter to validate (required)
- **Validation Prompt**: Tell the AI what to look for (required)
- **AI Provider**: Anthropic or OpenAI
- **Model**: Which model to use

**Example**:
```
Tool Name: request_human_approval
Response Field: status
Validation Prompt: "Validate that the status indicates approval
(approved, granted, yes, confirmed). Respond with 'compliant' if
approved, 'violation' if rejected or denied."
AI Provider: Anthropic
Model: claude-sonnet-4-5-20250929
```

---

### 📏 Response Length
**What it does**: Limits the length of the final assistant response

**Use cases**:
- Ensure concise responses (customer service)
- Prevent token overuse
- Maintain response brevity

**Configuration**:
- **Maximum Tokens**: Token limit (required)

**Example**:
```
Maximum Tokens: 500
```

---

### 🔢 Tool Call Count
**What it does**: Limits how many times a tool can be called

**Use cases**:
- Limit human approval requests (max 2 per conversation)
- Prevent infinite loops
- Control API usage

**Configuration**:
- **Tool Name**: Tool to count (required)
- **Minimum Count**: Optional lower bound
- **Maximum Count**: Optional upper bound

**Example**:
```
Tool Name: request_human_approval
Maximum Count: 2
```

---

### 🔍 LLM Response Validation
**What it does**: Uses AI to validate the entire assistant response

**Use cases**:
- Check for PII in responses
- Validate tone/sentiment
- Ensure factual accuracy
- Detect inappropriate content

**Configuration**:
- **Validation Prompt**: What the AI should check (required)
- **AI Provider**: Anthropic or OpenAI

**Example**:
```
Validation Prompt: "Check if the response contains any personally
identifiable information (PII) like email addresses, phone numbers,
or social security numbers. Respond 'violation' if PII is found."
AI Provider: Anthropic
```

---

### 🔎 Response Contains
**What it does**: Checks if response contains or avoids specific keywords

**Use cases**:
- Ensure required disclaimers are present
- Forbid specific language
- Verify key information is included

**Configuration**:
- **Must Contain**: Keywords that must appear (comma-separated)
- **Must NOT Contain**: Keywords that must not appear (comma-separated)

**Example**:
```
Must Contain: approved, confirmed
Must NOT Contain: rejected, denied
```

---

### 🚫 Tool Absence
**What it does**: Ensures a specific tool is NOT called

**Use cases**:
- Forbid deletion operations
- Prevent dangerous actions
- Block unauthorized tools

**Configuration**:
- **Forbidden Tool Name**: Tool that must not be called (required)

**Example**:
```
Forbidden Tool Name: delete_customer
```

---

## Violation Logic Types

### 🎯 If Any → Then All
**Pattern**: If ANY trigger fires, then ALL requirements must pass

**Use cases**: Conditional requirements

**Example**: "IF high-value invoice is created, THEN approval must be requested AND granted"

**Configuration**:
- **Triggers**: Checks that activate the policy
- **Requirements**: Checks that must pass when triggered

---

### 🎯🎯 If All → Then All
**Pattern**: If ALL triggers fire, then ALL requirements must pass

**Use cases**: Multiple conditions required before enforcement

**Example**: "IF creating invoice AND customer is new, THEN credit check AND approval required"

**Configuration**:
- **Triggers**: All must fire to activate policy
- **Requirements**: Checks that must pass when all triggers fire

---

### ✅ Require All
**Pattern**: ALL specified checks must pass (simple AND)

**Use cases**: Multiple independent requirements

**Example**: "Transaction must have validation AND logging AND audit trail"

**Configuration**:
- **Requirements**: All checks that must pass

---

### ✓ Require Any
**Pattern**: At least ONE check must pass (simple OR)

**Use cases**: Alternative compliance paths

**Example**: "Payment must use credit card OR ACH OR wire transfer"

**Configuration**:
- **Requirements**: At least one must pass

---

### 🛡️ Forbid All
**Pattern**: NONE of the forbidden checks should pass (unless authorized)

**Use cases**: Prohibitions with optional exceptions

**Example**: "Must NOT access sensitive data UNLESS authorization is granted"

**Configuration**:
- **Forbidden**: Checks that should not pass
- **Authorization** (optional): Checks that permit forbidden actions

---

## Creating Your First Policy

Let's create a policy: **"High-value invoices require approved human authorization"**

### Step 1: Open Policy Builder

1. Navigate to **Policies** page
2. Click **"✨ Create Policy"**

### Step 2: Basic Information

```
Name: High Value Invoice Approval
Description: Invoices over $1,000 require human approval with approved status
```

### Step 3: Add Checks

**Check 1: Detect High-Value Invoice**
- Click **"+ Add Check"**
- Select **"🔧 Tool Call"**
- Configure:
  - Check Name: `High value invoice created`
  - Tool Name: `create_invoice`
  - Add Parameter Condition: `total > 1000`
- Click **"Save Check"**

**Check 2: Detect Approval Request**
- Click **"+ Add Check"**
- Select **"🔧 Tool Call"**
- Configure:
  - Check Name: `Approval was requested`
  - Tool Name: `request_human_approval`
- Click **"Save Check"**

**Check 3: Validate Approval Status**
- Click **"+ Add Check"**
- Select **"🤖 LLM Tool Response"**
- Configure:
  - Check Name: `Approval status indicates approval`
  - Tool Name: `request_human_approval`
  - Response Field: `status`
  - Validation Prompt: `Validate that the status indicates approval (approved, granted, yes, confirmed). Respond with 'compliant' if approved, 'violation' if rejected or denied.`
  - AI Provider: `Anthropic`
- Click **"Save Check"**

### Step 4: Set Violation Logic

1. Select **"🎯 If Any → Then All"** logic type
2. Configure roles:
   - **Triggers**: Click `High value invoice created`
   - **Requirements**: Click `Approval was requested` and `Approval status indicates approval`

### Step 5: Save Policy

Click **"Create Policy"** ✓

---

## Real-World Examples

### Example 1: Concise Customer Service Responses

**Policy**: "Customer service responses must be under 300 tokens"

**Checks**:
- Response Length (max: 300 tokens)

**Logic**: REQUIRE_ALL

---

### Example 2: No Customer Deletion

**Policy**: "Customer deletion is forbidden"

**Checks**:
- Tool Absence: `delete_customer`

**Logic**: REQUIRE_ALL

---

### Example 3: Multi-Approval for Large Invoices

**Policy**: "Invoices over $10,000 require approval from 2 different managers"

**Checks**:
1. Tool Call: `create_invoice` with `total > 10000`
2. Tool Call Count: `request_human_approval` (min: 2)

**Logic**: IF_ANY_THEN_ALL
- Triggers: Check 1
- Requirements: Check 2

---

### Example 4: PII Protection

**Policy**: "Agent responses must not contain personally identifiable information"

**Checks**:
- LLM Response Validation with prompt checking for PII

**Logic**: REQUIRE_ALL

---

### Example 5: Payment Method Compliance

**Policy**: "Payments must use one of the approved methods"

**Checks**:
1. Tool Call: `process_payment` with `method = credit_card`
2. Tool Call: `process_payment` with `method = ach_transfer`
3. Tool Call: `process_payment` with `method = wire_transfer`

**Logic**: REQUIRE_ANY

---

## Interpreting Violations

When a policy is violated, you'll see a beautiful structured breakdown:

### Violation Card Structure

```
┌─────────────────────────────────────────┐
│ 🎯 Policy Name                          │
│ Summary: Brief violation description    │
├─────────────────────────────────────────┤
│ ⚠️ Human-readable violation message    │
├─────────────────────────────────────────┤
│ 🎯 Triggered Checks                     │
│   ✓ Check that activated the policy    │
│                                         │
│ ❌ Failed Requirements                  │
│   ✗ Check that didn't pass             │
│                                         │
│ ✅ Passed Requirements                  │
│   ✓ Check that passed                  │
└─────────────────────────────────────────┘
```

### What Each Section Means

- **Triggered Checks**: These conditions were met, activating the policy
- **Failed Requirements**: These required checks didn't pass (causing violation)
- **Passed Requirements**: These required checks passed successfully
- **Forbidden Checks**: Actions that should not have happened

### Example Violation

```
Policy: High Value Invoice Approval
Summary: Trigger condition met but required checks failed

Trigger 'High value invoice created' activated, but required check
'Approval status indicates approval' failed

🎯 Triggered Checks:
  ✓ High value invoice created
    Tool 'create_invoice' called with matching parameters
    Matched: total = 5000 (> 1000 threshold)

❌ Failed Requirements:
  ✗ Approval status indicates approval
    LLM validation failed: Status "rejected" does not indicate approval

✅ Passed Requirements:
  ✓ Approval was requested
    Tool 'request_human_approval' called
```

---

## Best Practices

### 1. Start Simple
Begin with 1-2 checks and basic logic. You can always add complexity later.

### 2. Name Checks Clearly
Use descriptive names like "High value invoice created" instead of "Check 1"

### 3. Test Incrementally
Create policy → Test with sample memory → Refine → Repeat

### 4. Use Custom Violation Messages
Add context with template variables:
```
"Invoice amount ${params.total} exceeds $1,000 threshold"
```

### 5. Leverage LLM Checks for Ambiguity
When exact matching isn't enough, use LLM validation:
- Sentiment analysis
- Semantic meaning ("did they approve?")
- Free-text validation

### 6. Combine Logic Types Thoughtfully
- Use **IF_ANY_THEN_ALL** for "when X happens, ensure Y"
- Use **REQUIRE_ALL** for independent requirements
- Use **FORBID_ALL** for prohibitions with exceptions

### 7. Limit Tool Call Counts
Prevent excessive HITL (human-in-the-loop) requests that frustrate users

### 8. Document Complex Policies
Use the description field to explain the business logic

### 9. Monitor Policy Performance
Check the Compliance Summary tab to see how often policies trigger

### 10. Iterate Based on Violations
When you see unexpected violations, refine your checks or logic

---

## Troubleshooting

### "Policy has no effect" / Never triggers

**Check**:
- Tool names match exactly (case-sensitive)
- Parameter names are correct
- Thresholds are set appropriately

**Solution**: Test with a simple memory file first

---

### "Too many violations" / Policy too strict

**Check**:
- Are all checks necessary?
- Is the logic type appropriate?

**Solution**: Consider using REQUIRE_ANY instead of REQUIRE_ALL

---

### LLM checks failing unexpectedly

**Check**:
- Is your validation prompt clear?
- Are you using the right AI model?
- Is the API key configured?

**Solution**: Make prompts more specific with examples of compliant vs non-compliant values

---

### Can't edit policy

**Reason**: Policy was created with old system

**Solution**: Create a new composite policy with the desired configuration

---

## Need Help?

- **Documentation**: See [BACKEND_IMPLEMENTATION_STATUS.md](BACKEND_IMPLEMENTATION_STATUS.md) for technical details
- **Migration Guide**: See [POLICY_V2_MIGRATION.md](POLICY_V2_MIGRATION.md) for migrating from old policies
- **GitHub Issues**: Report bugs or request features

---

## Appendix: API Structure

For advanced users or API integration:

### Policy Structure
```json
{
  "name": "Policy Name",
  "description": "What this policy does",
  "policy_type": "composite",
  "enabled": true,
  "config": {
    "checks": [
      {
        "id": "check_1",
        "name": "Check Name",
        "type": "tool_call",
        "tool_name": "some_tool",
        "params": {
          "param_name": {"gt": 1000}
        }
      }
    ],
    "violation_logic": {
      "type": "IF_ANY_THEN_ALL",
      "triggers": ["check_1"],
      "requirements": ["check_2"]
    }
  }
}
```

### Parameter Operators
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `eq`: Equal to
- `contains`: String contains substring

---

**Happy policy building! 🎉**
