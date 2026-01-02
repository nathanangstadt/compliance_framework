#!/usr/bin/env python3
"""
Test script for the new composite policy system.
Tests the backend policy evaluator with sample memories.
"""

import json
import sys
import os

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.policy_evaluator import PolicyEvaluator


def load_memory(filename):
    """Load a memory file."""
    filepath = os.path.join(os.path.dirname(__file__), '..', 'sample_memories', filename)
    with open(filepath, 'r') as f:
        return json.load(f)


def print_violation_details(violations):
    """Pretty print violation details."""
    if not violations:
        print("  ✓ No violations")
        return

    for i, violation in enumerate(violations, 1):
        print(f"\n  Violation {i}:")
        print(f"    Policy: {violation.get('policy_name')}")
        print(f"    Type: {violation.get('violation_type')}")
        print(f"    Summary: {violation.get('summary')}")
        print(f"    Message: {violation.get('violation_message')}")

        if 'triggered_checks' in violation:
            print(f"\n    Triggered Checks:")
            for check in violation['triggered_checks']:
                print(f"      - {check['check_name']}: {check['message']}")

        if 'failed_requirements' in violation:
            print(f"\n    Failed Requirements:")
            for check in violation['failed_requirements']:
                print(f"      - {check['check_name']}: {check['message']}")

        if 'passed_requirements' in violation:
            print(f"\n    Passed Requirements:")
            for check in violation['passed_requirements']:
                print(f"      - {check['check_name']}: {check['message']}")


def test_high_value_invoice_approval():
    """
    Test: High-value invoices require approval with approved status.

    Policy: IF create_invoice with total > 1000
            THEN must have request_human_approval
            AND LLM-validated approval status showing 'approved'
    """
    print("\n" + "="*80)
    print("TEST 1: High Value Invoice Approval Policy")
    print("="*80)

    # Define the composite policy
    policy_config = {
        "checks": [
            {
                "id": "high_value_invoice",
                "name": "High value invoice created",
                "type": "tool_call",
                "tool_name": "create_invoice",
                "params": {
                    "total": {"gt": 1000}
                },
                "violation_message": "Invoice with amount ${params.total} exceeds $1,000 threshold"
            },
            {
                "id": "approval_requested",
                "name": "Approval was requested",
                "type": "tool_call",
                "tool_name": "request_human_approval"
            },
            {
                "id": "approval_status_valid",
                "name": "Approval status indicates approval",
                "type": "llm_tool_response",
                "tool_name": "request_human_approval",
                "parameter": "status",
                "validation_prompt": "Validate that the status indicates approval (approved, granted, yes, confirmed). Respond with 'compliant' if approved, 'violation' if rejected or denied.",
                "llm_provider": "anthropic",
                "model": "claude-sonnet-4-5-20250929"
            }
        ],
        "violation_logic": {
            "type": "IF_ANY_THEN_ALL",
            "triggers": ["high_value_invoice"],
            "requirements": ["approval_requested", "approval_status_valid"]
        }
    }

    evaluator = PolicyEvaluator()

    # Test with rejection sample
    print("\nTest 1a: Memory with REJECTED approval status")
    print("-" * 80)
    memory = load_memory('backoffice_with_rejection.json')
    messages = memory['messages']

    is_compliant, violations = evaluator.evaluate(
        messages=messages,
        policy_type="composite",
        config=policy_config,
        memory_metadata={}
    )

    print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    print_violation_details(violations)

    # Expected: VIOLATED (approval status is "rejected")
    if not is_compliant:
        print("\n✓ Test 1a PASSED: Correctly detected rejection")
    else:
        print("\n✗ Test 1a FAILED: Should have detected rejection")

    # Test with approval sample (if exists)
    print("\n\nTest 1b: Memory with APPROVED approval status")
    print("-" * 80)
    try:
        memory = load_memory('backoffice_with_approval.json')
        messages = memory['messages']

        is_compliant, violations = evaluator.evaluate(
            messages=messages,
            policy_type="composite",
            config=policy_config,
            memory_metadata={}
        )

        print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
        print_violation_details(violations)

        # Expected: COMPLIANT
        if is_compliant:
            print("\n✓ Test 1b PASSED: Correctly accepted approval")
        else:
            print("\n✗ Test 1b FAILED: Should have accepted approval")
    except FileNotFoundError:
        print("  (Skipped - backoffice_with_approval.json not found)")


def test_require_all_logic():
    """
    Test: REQUIRE_ALL logic - all checks must pass.

    Policy: Every transaction must have validation AND logging.
    """
    print("\n" + "="*80)
    print("TEST 2: REQUIRE_ALL Logic")
    print("="*80)

    policy_config = {
        "checks": [
            {
                "id": "has_approval",
                "name": "Approval requested",
                "type": "tool_call",
                "tool_name": "request_human_approval"
            },
            {
                "id": "has_invoice",
                "name": "Invoice created",
                "type": "tool_call",
                "tool_name": "create_invoice"
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["has_approval", "has_invoice"]
        }
    }

    evaluator = PolicyEvaluator()
    memory = load_memory('backoffice_with_rejection.json')
    messages = memory['messages']

    is_compliant, violations = evaluator.evaluate(
        messages=messages,
        policy_type="composite",
        config=policy_config,
        memory_metadata={}
    )

    print(f"\nResult: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    print_violation_details(violations)

    # Expected: COMPLIANT (both tools are called)
    if is_compliant:
        print("\n✓ Test 2 PASSED: Both checks passed")
    else:
        print("\n✗ Test 2 FAILED: Both checks should have passed")


def test_tool_absence_check():
    """
    Test: Tool absence - ensure a tool was NOT called.

    Policy: Must not call delete_customer tool.
    """
    print("\n" + "="*80)
    print("TEST 3: Tool Absence Check")
    print("="*80)

    policy_config = {
        "checks": [
            {
                "id": "no_delete",
                "name": "Customer deletion forbidden",
                "type": "tool_absence",
                "tool_name": "delete_customer"
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["no_delete"]
        }
    }

    evaluator = PolicyEvaluator()
    memory = load_memory('backoffice_with_rejection.json')
    messages = memory['messages']

    is_compliant, violations = evaluator.evaluate(
        messages=messages,
        policy_type="composite",
        config=policy_config,
        memory_metadata={}
    )

    print(f"\nResult: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    print_violation_details(violations)

    # Expected: COMPLIANT (delete_customer is not called)
    if is_compliant:
        print("\n✓ Test 3 PASSED: Tool was correctly not called")
    else:
        print("\n✗ Test 3 FAILED: Tool was not called, should be compliant")


def test_tool_call_count():
    """
    Test: Tool call count limits.

    Policy: Limit human approvals to max 2 per conversation.
    """
    print("\n" + "="*80)
    print("TEST 4: Tool Call Count Limit")
    print("="*80)

    policy_config = {
        "checks": [
            {
                "id": "approval_limit",
                "name": "Maximum approval requests",
                "type": "tool_call_count",
                "tool_name": "request_human_approval",
                "max_count": 2
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["approval_limit"]
        }
    }

    evaluator = PolicyEvaluator()
    memory = load_memory('backoffice_with_rejection.json')
    messages = memory['messages']

    is_compliant, violations = evaluator.evaluate(
        messages=messages,
        policy_type="composite",
        config=policy_config,
        memory_metadata={}
    )

    print(f"\nResult: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    print_violation_details(violations)

    # Expected: COMPLIANT (only 1 approval request in memory)
    if is_compliant:
        print("\n✓ Test 4 PASSED: Call count within limit")
    else:
        print("\n✗ Test 4 FAILED: Call count should be within limit")


def test_response_length():
    """
    Test: Response length check.

    Policy: Final response must be under 500 tokens.
    """
    print("\n" + "="*80)
    print("TEST 5: Response Length Check")
    print("="*80)

    policy_config = {
        "checks": [
            {
                "id": "short_response",
                "name": "Concise final response",
                "type": "response_length",
                "max_tokens": 500,
                "violation_message": "Response exceeded ${actual_tokens} tokens (limit: ${max_tokens})"
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["short_response"]
        }
    }

    evaluator = PolicyEvaluator()
    memory = load_memory('backoffice_with_rejection.json')
    messages = memory['messages']

    is_compliant, violations = evaluator.evaluate(
        messages=messages,
        policy_type="composite",
        config=policy_config,
        memory_metadata={}
    )

    print(f"\nResult: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    print_violation_details(violations)

    # Expected: May vary depending on actual response length


def main():
    """Run all tests."""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "COMPOSITE POLICY SYSTEM TESTS" + " "*29 + "║")
    print("╚" + "="*78 + "╝")

    try:
        test_high_value_invoice_approval()
        test_require_all_logic()
        test_tool_absence_check()
        test_tool_call_count()
        test_response_length()

        print("\n" + "="*80)
        print("ALL TESTS COMPLETED")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
