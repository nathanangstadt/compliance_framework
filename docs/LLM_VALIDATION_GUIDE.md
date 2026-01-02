# LLM-Based Validation Guide

This guide explains how to write effective validation prompts for LLM-based policy checks in the compliance framework.

## Overview

The compliance framework supports two types of LLM-based validation:

1. **LLM Tool Response Validation** (`llm_tool_response`) - Validates specific fields from tool responses
2. **LLM Response Validation** (`llm_response_validation`) - Validates entire agent responses

Both use AI models (Claude or GPT) to understand natural language requirements and evaluate compliance.

## How LLM Validation Works

### Automatic Prompt Enhancement ✨

**You just write your criteria in natural language.** The framework automatically:

1. ✅ Frames it as a binary compliance decision (yes/no)
2. ✅ Requests structured JSON output: `{"compliant": true/false, "reason": "explanation"}`
3. ✅ Prevents markdown code block issues
4. ✅ Enforces clear explanations for decisions

**Example of what happens behind the scenes:**

Your simple prompt:
```
"Validate that the status indicates approval"
```

Framework automatically transforms it to:
```
You are a compliance validator. Evaluate the following value against the criteria below.

USER CRITERIA:
Validate that the status indicates approval

VALUE TO EVALUATE:
approved

INSTRUCTIONS:
1. Make a binary decision: does the value meet the criteria or not?
2. Provide a brief explanation for your decision
3. Respond ONLY with valid JSON in this exact format:

{"compliant": true, "reason": "your explanation"}
```

**You don't need to worry about any of the technical details** - just describe what you want validated!

### Writing Your Validation Prompt

Focus on clearly describing **WHAT** you want to validate. Write your prompt in plain English (or your language of choice).

#### ✅ Good Examples:

```
"Validate that the status indicates approval. The status should be 'approved', 'accepted', or 'authorized'."
```

```
"Check if the response mentions getting human approval before proceeding with the action."
```

```
"Ensure the amount is reasonable. Amounts over $10,000 should be flagged."
```

```
"Verify the response is professional and doesn't contain informal language or slang."
```

#### ❌ Bad Examples (Don't Do This):

```
"Respond with compliant if status is approved, violation if rejected"
```
*Why bad: Framework already handles this - you're just adding redundant instructions.*

```
"Return JSON with compliant true/false"
```
*Why bad: Framework auto-adds JSON formatting - this creates confusion.*

```
"status == 'approved'"
```
*Why bad: Use natural language, not code syntax. Say "status should be 'approved'".*

```
"Check status"
```
*Why bad: Too vague - specify what you're checking for.*

### 🎯 Key Takeaway: No Magic Words Required!

Unlike keyword-based systems, you **do NOT need to use special words** like "compliant", "violation", "approved", or "rejected" in your prompt. The LLM will make a binary decision based on your criteria and the framework handles the rest.

**This works:**
```
"The temperature should be between 60-75 degrees"
```

**This also works:**
```
"Ensure temperature falls within acceptable range of 60-75 degrees"
```

**This works too:**
```
"Check if temp is 60-75F"
```

All three prompts will work correctly because the framework ensures the LLM returns a structured yes/no decision!

## Configuration Examples

### Example 1: Approval Status Validation

Validates that a tool response field indicates approval:

```json
{
  "check_id": "approval_status",
  "check_type": "llm_tool_response",
  "name": "Approval status indicates approval",
  "config": {
    "tool_name": "request_human_approval",
    "response_field": "status",
    "validation_prompt": "Validate that the status indicates approval. Approved status should be 'approved', 'accepted', or similar affirmative values. Rejected or denied values should fail validation.",
    "llm_provider": "anthropic",
    "model": "claude-sonnet-4-5-20250929"
  }
}
```

### Example 2: Response Professionalism Check

Validates that the agent's response maintains professional tone:

```json
{
  "check_id": "professional_tone",
  "check_type": "llm_response_validation",
  "name": "Response maintains professional tone",
  "config": {
    "scope": "final_message",
    "validation_prompt": "Evaluate if this response maintains a professional business tone. It should avoid slang, excessive casualness, or unprofessional language. Brief friendliness is acceptable, but the overall tone should be business-appropriate.",
    "llm_provider": "anthropic",
    "model": "claude-sonnet-4-5-20250929"
  }
}
```

### Example 3: Sentiment Analysis

Validates that rejection messages are polite:

```json
{
  "check_id": "polite_rejection",
  "check_type": "llm_tool_response",
  "name": "Rejection message is polite",
  "config": {
    "tool_name": "send_rejection_email",
    "response_field": "message",
    "validation_prompt": "Check if this rejection message is polite and professional. It should acknowledge the request gracefully and provide a reason without being harsh or dismissive.",
    "llm_provider": "anthropic"
  }
}
```

## Fallback Keyword Detection

If the LLM doesn't return valid JSON, the framework falls back to keyword detection:

**Approval Keywords:** compliant, approved, yes, pass, valid, correct, acceptable

**Rejection Keywords:** violation, non-compliant, does not comply, fails, rejected, denied, invalid, incorrect

This fallback is reliable but less nuanced than structured output. Modern LLM models (Claude 3.5+, GPT-4+) consistently return proper JSON.

## Best Practices

### 1. Be Specific and Clear

**Good:**
```
"Validate that the email contains a proper greeting (Dear/Hi/Hello) and closing (Sincerely/Best regards/Thanks)."
```

**Avoid:**
```
"Check if email is formatted correctly"
```

### 2. Provide Examples When Helpful

**Good:**
```
"Check if the discount percentage is reasonable for the customer tier. Gold tier should get 10-15%, Silver 5-10%, Bronze 0-5%."
```

**Avoid:**
```
"Validate discount is appropriate"
```

### 3. Define Edge Cases

**Good:**
```
"Ensure the response time is within SLA. Standard requests: 24 hours, Urgent: 4 hours, Critical: 1 hour. Consider business hours only."
```

**Avoid:**
```
"Response time must meet SLA"
```

### 4. Be Objective Where Possible

**Good:**
```
"Verify the explanation contains at least 3 sentences and mentions the specific reason for the decision."
```

**Avoid:**
```
"Make sure the explanation is good enough"
```

## Configuration Options

### LLM Tool Response Validation

```json
{
  "check_type": "llm_tool_response",
  "config": {
    "tool_name": "string",              // Required: Tool to check
    "response_field": "string",         // Required: Field to validate
    "validation_prompt": "string",      // Required: Your validation instructions
    "llm_provider": "anthropic|openai", // Optional: Default is "anthropic"
    "model": "string",                  // Optional: Model name
    "expect_success": true              // Optional: Only check successful tool calls
  }
}
```

### LLM Response Validation

```json
{
  "check_type": "llm_response_validation",
  "config": {
    "validation_prompt": "string",      // Required: Your validation instructions
    "scope": "final_message",           // Optional: Which messages to check
    "llm_provider": "anthropic|openai", // Optional: Default is "anthropic"
    "model": "string"                   // Optional: Model name
  }
}
```

## Supported LLM Providers

### Anthropic (Recommended)

- **Provider ID:** `anthropic`
- **Default Model:** `claude-sonnet-4-5-20250929`
- **Environment Variable:** `ANTHROPIC_API_KEY`
- **Best For:** Nuanced understanding, following complex instructions

### OpenAI

- **Provider ID:** `openai`
- **Default Model:** Set your preferred GPT model
- **Environment Variable:** `OPENAI_API_KEY`
- **Best For:** Fast responses, cost optimization

## Troubleshooting

### LLM Always Returns "Non-Compliant"

**Issue:** Your prompt might be too strict or unclear.

**Solution:** Test your prompt directly with the LLM to see how it interprets it. Simplify or add examples.

### Inconsistent Results

**Issue:** Prompt is ambiguous and LLM interprets it differently each time.

**Solution:** Be more specific. Define what "good" and "bad" look like with examples.

### API Key Not Configured

**Error:** `Anthropic API key not configured`

**Solution:** Set the environment variable in `backend/.env`:
```bash
ANTHROPIC_API_KEY=your_key_here
```

### Slow Evaluations

**Issue:** LLM API calls add latency to policy evaluation.

**Solution:**
- Use caching where possible
- Consider evaluating policies asynchronously
- Use faster models (Haiku instead of Sonnet) for simple checks
- Batch multiple memories if possible

## Examples Library

### Business Rule Validation

```
"Validate that the pricing follows our tiered structure:
- Basic tier: $0-$99
- Professional: $100-$499
- Enterprise: $500+
The proposed price should fall within these ranges for the selected tier."
```

### Content Policy

```
"Check if the agent's response contains any personally identifiable information (PII) such as:
- Social Security Numbers
- Credit card numbers
- Email addresses
- Phone numbers
If PII is detected, fail validation."
```

### Tone and Sentiment

```
"Evaluate if the customer communication maintains an empathetic tone when delivering bad news.
The message should:
1. Acknowledge the customer's situation
2. Explain the decision clearly
3. Offer alternatives if possible
4. End on a positive or helpful note"
```

### Compliance Checks

```
"Verify that the response includes the required legal disclaimer about investment risks.
The disclaimer must mention:
- Past performance doesn't guarantee future results
- Investments carry risk of loss
- Not FDIC insured
The exact wording can vary but these concepts must be present."
```

## Advanced: Chaining LLM Checks

You can combine LLM checks with other check types in composite policies:

```json
{
  "checks": [
    {
      "check_id": "high_value",
      "check_type": "tool_call",
      "config": {
        "tool_name": "create_transaction",
        "params": {"amount": {"gt": 10000}}
      }
    },
    {
      "check_id": "approval_obtained",
      "check_type": "llm_tool_response",
      "config": {
        "tool_name": "get_approval",
        "response_field": "status",
        "validation_prompt": "Confirm the status indicates explicit approval from a manager or supervisor"
      }
    }
  ],
  "violation_logic": {
    "type": "IF_ANY_THEN_ALL",
    "triggers": ["high_value"],
    "requirements": ["approval_obtained"]
  }
}
```

This creates a policy: "If transaction exceeds $10K, then manager approval must be obtained."

## Summary

- **Write clear, natural language prompts** describing what you want to validate
- **Don't worry about output format** - the framework handles structured responses
- **Be specific** - include examples and edge cases
- **Test your prompts** - unclear prompts lead to inconsistent results
- **Use appropriate models** - Sonnet for complex logic, Haiku for speed
- **Set API keys** in environment variables before using LLM validation

The LLM validation feature makes it easy to enforce policies that would be difficult or impossible with traditional rule-based checks!
