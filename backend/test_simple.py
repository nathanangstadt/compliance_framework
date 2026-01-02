#!/usr/bin/env python3
"""Simple test of composite policy system with embedded test data."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.policy_evaluator import PolicyEvaluator


def test_basic_checks():
    """Test basic check types without LLM."""

    print("\n" + "="*80)
    print("TEST 1: Tool Call Check")
    print("="*80)

    # Simple message with tool call
    messages = [
        {
            "role": "user",
            "content": "Create an invoice for $5000"
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "tool_123",
                    "name": "create_invoice",
                    "input": {
                        "customer_id": 67890,
                        "total": 5000.00
                    }
                }
            ]
        }
    ]

    # Policy: Detect high-value invoices
    policy_config = {
        "checks": [
            {
                "id": "high_value",
                "name": "High value invoice",
                "type": "tool_call",
                "tool_name": "create_invoice",
                "params": {
                    "total": {"gt": 1000}
                }
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["high_value"]
        }
    }

    evaluator = PolicyEvaluator()
    is_compliant, violations = evaluator.evaluate(
        messages=messages,
        policy_type="composite",
        config=policy_config
    )

    print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    if is_compliant:
        print("✓ PASS: High-value invoice detected correctly")
    else:
        print("✗ FAIL: Should have passed")
        print(violations)

    print("\n" + "="*80)
    print("TEST 2: IF_ANY_THEN_ALL Logic")
    print("="*80)

    # Messages with invoice but no approval
    messages_no_approval = [
        {
            "role": "user",
            "content": "Create invoice"
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "tool_1",
                    "name": "create_invoice",
                    "input": {"total": 5000.00}
                }
            ]
        }
    ]

    # Policy: IF high-value invoice THEN must have approval
    policy_config_2 = {
        "checks": [
            {
                "id": "trigger",
                "name": "High-value invoice",
                "type": "tool_call",
                "tool_name": "create_invoice",
                "params": {"total": {"gt": 1000}}
            },
            {
                "id": "requirement",
                "name": "Approval requested",
                "type": "tool_call",
                "tool_name": "request_human_approval"
            }
        ],
        "violation_logic": {
            "type": "IF_ANY_THEN_ALL",
            "triggers": ["trigger"],
            "requirements": ["requirement"]
        }
    }

    is_compliant, violations = evaluator.evaluate(
        messages=messages_no_approval,
        policy_type="composite",
        config=policy_config_2
    )

    print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    if not is_compliant:
        print("✓ PASS: Correctly detected missing approval")
        print(f"  Violation: {violations[0]['violation_message']}")
    else:
        print("✗ FAIL: Should have detected missing approval")

    print("\n" + "="*80)
    print("TEST 3: Tool Absence Check")
    print("="*80)

    # Messages WITHOUT delete operation
    messages_safe = [
        {
            "role": "user",
            "content": "Update customer"
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "tool_1",
                    "name": "update_customer",
                    "input": {"customer_id": 123}
                }
            ]
        }
    ]

    # Policy: Must NOT delete customer
    policy_config_3 = {
        "checks": [
            {
                "id": "no_delete",
                "name": "No customer deletion",
                "type": "tool_absence",
                "tool_name": "delete_customer"
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["no_delete"]
        }
    }

    is_compliant, violations = evaluator.evaluate(
        messages=messages_safe,
        policy_type="composite",
        config=policy_config_3
    )

    print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    if is_compliant:
        print("✓ PASS: Correctly validated no deletion occurred")
    else:
        print("✗ FAIL: Should have passed (no deletion)")

    print("\n" + "="*80)
    print("TEST 4: Tool Call Count")
    print("="*80)

    # Messages with 3 approval requests (exceeds limit)
    messages_many_approvals = [
        {
            "role": "user",
            "content": "Process orders"
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "tool_1",
                    "name": "request_human_approval",
                    "input": {"reason": "First approval"}
                }
            ]
        },
        {
            "role": "user",
            "content": [{"type": "tool_result", "tool_use_id": "tool_1", "content": "approved"}]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "tool_2",
                    "name": "request_human_approval",
                    "input": {"reason": "Second approval"}
                }
            ]
        },
        {
            "role": "user",
            "content": [{"type": "tool_result", "tool_use_id": "tool_2", "content": "approved"}]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "tool_3",
                    "name": "request_human_approval",
                    "input": {"reason": "Third approval"}
                }
            ]
        }
    ]

    # Policy: Max 2 approval requests
    policy_config_4 = {
        "checks": [
            {
                "id": "limit_approvals",
                "name": "Approval request limit",
                "type": "tool_call_count",
                "tool_name": "request_human_approval",
                "max_count": 2
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["limit_approvals"]
        }
    }

    is_compliant, violations = evaluator.evaluate(
        messages=messages_many_approvals,
        policy_type="composite",
        config=policy_config_4
    )

    print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    if not is_compliant:
        print("✓ PASS: Correctly detected excessive approval requests")
        print(f"  Violation: {violations[0]['violation_message']}")
    else:
        print("✗ FAIL: Should have detected too many approvals")

    print("\n" + "="*80)
    print("TEST 5: Response Length")
    print("="*80)

    # Messages with long final response
    messages_long = [
        {
            "role": "user",
            "content": "Tell me about the system"
        },
        {
            "role": "assistant",
            "content": "Here is a very detailed explanation. " * 200  # Long response
        }
    ]

    # Policy: Response must be under 100 tokens
    policy_config_5 = {
        "checks": [
            {
                "id": "short_response",
                "name": "Concise response",
                "type": "response_length",
                "max_tokens": 100
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["short_response"]
        }
    }

    is_compliant, violations = evaluator.evaluate(
        messages=messages_long,
        policy_type="composite",
        config=policy_config_5
    )

    print(f"Result: {'COMPLIANT' if is_compliant else 'VIOLATED'}")
    if not is_compliant:
        print("✓ PASS: Correctly detected long response")
        if violations:
            print(f"  Violation: {violations[0]['violation_message']}")
    else:
        print("✗ FAIL: Should have detected long response")

    print("\n" + "="*80)
    print("ALL TESTS COMPLETED")
    print("="*80 + "\n")


if __name__ == "__main__":
    try:
        test_basic_checks()
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
