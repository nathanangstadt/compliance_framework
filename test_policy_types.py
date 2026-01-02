#!/usr/bin/env python3
"""
Test script to verify all policy types work correctly.
Creates test policies and evaluates them against a sample agent conversation.
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def create_test_memory() -> str:
    """Create a test memory with sample conversation by writing to filesystem."""
    import os

    memory_data = {
        "name": "Policy Type Test Instance",
        "messages": [
            {"role": "user", "content": "Create a high-value invoice for $50,000"},
            {"role": "assistant", "content": [
                {"type": "text", "text": "I'll create the invoice for you."},
                {"type": "tool_use", "id": "tool_1", "name": "create_invoice", "input": {"amount": 50000, "customer_id": "C123"}}
            ]},
            {"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": "tool_1", "content": "Invoice created successfully"}
            ]},
            {"role": "assistant", "content": "The invoice has been created. Now I'll request approval."},
            {"role": "assistant", "content": [
                {"type": "tool_use", "id": "tool_2", "name": "request_approval", "input": {"invoice_id": "INV-001"}}
            ]},
            {"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": "tool_2", "content": "Approval requested"}
            ]},
            {"role": "assistant", "content": "I have requested approval for the invoice."}
        ]
    }

    # Write to agent_memories directory
    memory_id = "policy_type_test"
    memories_dir = os.path.join(os.path.dirname(__file__), "agent_memories")
    os.makedirs(memories_dir, exist_ok=True)

    filepath = os.path.join(memories_dir, f"{memory_id}.json")
    with open(filepath, 'w') as f:
        json.dump(memory_data, f, indent=2)

    print(f"Created memory file: {filepath}")
    return memory_id

def create_policy(name: str, policy_type_config: Dict[str, Any]) -> str:
    """Create a test policy."""
    response = requests.post(f"{BASE_URL}/api/policies", json={
        "name": name,
        "description": f"Test policy for {policy_type_config['violation_logic']['type']}",
        "policy_type": "composite",
        "enabled": True,
        "severity": "error",
        "config": policy_type_config
    })
    response.raise_for_status()
    return response.json()["id"]

def evaluate_policy(memory_id: str, policy_id: str) -> Dict[str, Any]:
    """Evaluate a policy against a memory."""
    response = requests.post(f"{BASE_URL}/api/compliance/evaluate", json={
        "memory_id": memory_id,
        "policy_ids": [policy_id]
    })
    response.raise_for_status()

    # Get evaluation results
    eval_response = requests.get(f"{BASE_URL}/api/compliance/memory/{memory_id}")
    eval_response.raise_for_status()
    evaluations = eval_response.json()

    # Find our policy's evaluation
    for eval in evaluations:
        if eval["policy_id"] == policy_id:
            return eval

    return None

def test_if_any_then_all(memory_id: str):
    """Test IF_ANY_THEN_ALL: If ANY trigger fires, ALL requirements must pass."""
    print("\n" + "="*80)
    print("Testing IF_ANY_THEN_ALL")
    print("="*80)

    config = {
        "checks": [
            {
                "id": "check_1",
                "name": "High Value Invoice Created",
                "type": "tool_call",
                "tool_name": "create_invoice"
            },
            {
                "id": "check_2",
                "name": "Approval Requested",
                "type": "tool_call",
                "tool_name": "request_approval"
            }
        ],
        "violation_logic": {
            "type": "IF_ANY_THEN_ALL",
            "triggers": ["check_1"],
            "requirements": ["check_2"]
        }
    }

    policy_id = create_policy("Test IF_ANY_THEN_ALL", config)
    print(f"Created policy: {policy_id}")

    result = evaluate_policy(memory_id, policy_id)
    print(f"Evaluation result: {'COMPLIANT' if result['is_compliant'] else 'NON-COMPLIANT'}")
    print(f"Expected: COMPLIANT (invoice created triggers policy, approval requested satisfies requirement)")
    print(f"Violations: {json.dumps(result.get('violations', []), indent=2)}")

    return result['is_compliant']

def test_if_all_then_all(memory_id: str):
    """Test IF_ALL_THEN_ALL: If ALL triggers fire, ALL requirements must pass."""
    print("\n" + "="*80)
    print("Testing IF_ALL_THEN_ALL")
    print("="*80)

    config = {
        "checks": [
            {
                "id": "check_1",
                "name": "Invoice Created",
                "type": "tool_call",
                "tool_name": "create_invoice"
            },
            {
                "id": "check_2",
                "name": "Approval Requested",
                "type": "tool_call",
                "tool_name": "request_approval"
            },
            {
                "id": "check_3",
                "name": "Delete Customer Called",
                "type": "tool_call",
                "tool_name": "delete_customer"
            }
        ],
        "violation_logic": {
            "type": "IF_ALL_THEN_ALL",
            "triggers": ["check_1", "check_3"],  # Both must fire
            "requirements": ["check_2"]
        }
    }

    policy_id = create_policy("Test IF_ALL_THEN_ALL", config)
    print(f"Created policy: {policy_id}")

    result = evaluate_policy(memory_id, policy_id)
    print(f"Evaluation result: {'COMPLIANT' if result['is_compliant'] else 'NON-COMPLIANT'}")
    print(f"Expected: COMPLIANT (only invoice created, not delete_customer, so triggers not ALL satisfied)")
    print(f"Violations: {json.dumps(result.get('violations', []), indent=2)}")

    return result['is_compliant']

def test_require_all(memory_id: str):
    """Test REQUIRE_ALL: ALL checks must pass."""
    print("\n" + "="*80)
    print("Testing REQUIRE_ALL")
    print("="*80)

    config = {
        "checks": [
            {
                "id": "check_1",
                "name": "Invoice Created",
                "type": "tool_call",
                "tool_name": "create_invoice"
            },
            {
                "id": "check_2",
                "name": "Approval Requested",
                "type": "tool_call",
                "tool_name": "request_approval"
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ALL",
            "requirements": ["check_1", "check_2"]
        }
    }

    policy_id = create_policy("Test REQUIRE_ALL", config)
    print(f"Created policy: {policy_id}")

    result = evaluate_policy(memory_id, policy_id)
    print(f"Evaluation result: {'COMPLIANT' if result['is_compliant'] else 'NON-COMPLIANT'}")
    print(f"Expected: COMPLIANT (both invoice and approval tools called)")
    print(f"Violations: {json.dumps(result.get('violations', []), indent=2)}")

    return result['is_compliant']

def test_require_any(memory_id: str):
    """Test REQUIRE_ANY: At least ONE check must pass."""
    print("\n" + "="*80)
    print("Testing REQUIRE_ANY")
    print("="*80)

    config = {
        "checks": [
            {
                "id": "check_1",
                "name": "Delete Customer Called",
                "type": "tool_call",
                "tool_name": "delete_customer"
            },
            {
                "id": "check_2",
                "name": "Approval Requested",
                "type": "tool_call",
                "tool_name": "request_approval"
            }
        ],
        "violation_logic": {
            "type": "REQUIRE_ANY",
            "requirements": ["check_1", "check_2"]
        }
    }

    policy_id = create_policy("Test REQUIRE_ANY", config)
    print(f"Created policy: {policy_id}")

    result = evaluate_policy(memory_id, policy_id)
    print(f"Evaluation result: {'COMPLIANT' if result['is_compliant'] else 'NON-COMPLIANT'}")
    print(f"Expected: COMPLIANT (approval requested, even though delete not called)")
    print(f"Violations: {json.dumps(result.get('violations', []), indent=2)}")

    return result['is_compliant']

def test_forbid_all(memory_id: str):
    """Test FORBID_ALL: NONE of the forbidden checks should pass."""
    print("\n" + "="*80)
    print("Testing FORBID_ALL")
    print("="*80)

    config = {
        "checks": [
            {
                "id": "check_1",
                "name": "Delete Customer Should Not Be Called",
                "type": "tool_call",
                "tool_name": "delete_customer"
            }
        ],
        "violation_logic": {
            "type": "FORBID_ALL",
            "forbidden": ["check_1"]
        }
    }

    policy_id = create_policy("Test FORBID_ALL", config)
    print(f"Created policy: {policy_id}")

    result = evaluate_policy(memory_id, policy_id)
    print(f"Evaluation result: {'COMPLIANT' if result['is_compliant'] else 'NON-COMPLIANT'}")
    print(f"Expected: COMPLIANT (delete_customer was not called)")
    print(f"Violations: {json.dumps(result.get('violations', []), indent=2)}")

    return result['is_compliant']

def main():
    print("Starting Policy Type Tests")
    print("="*80)

    # Use existing test memory
    memory_id = "policy_type_test"
    print(f"\nUsing test memory: {memory_id}")

    # Run all tests
    results = {
        "IF_ANY_THEN_ALL": test_if_any_then_all(memory_id),
        "IF_ALL_THEN_ALL": test_if_all_then_all(memory_id),
        "REQUIRE_ALL": test_require_all(memory_id),
        "REQUIRE_ANY": test_require_any(memory_id),
        "FORBID_ALL": test_forbid_all(memory_id)
    }

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    for policy_type, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{policy_type}: {status}")

    all_passed = all(results.values())
    print("\n" + "="*80)
    if all_passed:
        print("✓ All policy types working correctly!")
    else:
        print("✗ Some policy types failed. Check output above for details.")
    print("="*80)

if __name__ == "__main__":
    main()
