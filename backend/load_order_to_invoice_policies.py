#!/usr/bin/env python3
"""
Load order_to_invoice policies into the database.
"""
import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Policy

def load_policies():
    """Load order_to_invoice policies into the database."""

    # Define the agent_id
    agent_id = "order_to_invoice"

    # Policy definitions
    policies = [
        {
            "agent_id": agent_id,
            "name": "Large Invoice",
            "description": "Require approval for invoices more than $3,000.",
            "policy_type": "composite",
            "config": {
                "checks": [
                    {
                        "id": "check_1767136380813",
                        "name": "Create Invoice",
                        "type": "tool_call",
                        "params": {"amount": {"gt": "2000"}},
                        "tool_name": "create_invoice"
                    },
                    {
                        "id": "check_1767136421471",
                        "name": "Human Approval Requested",
                        "type": "tool_call",
                        "params": {},
                        "tool_name": "request_human_approval",
                        "violation_message": "Human approval was not requested"
                    },
                    {
                        "id": "check_1767137121409",
                        "name": "Is Reponse and Approval",
                        "type": "llm_tool_response",
                        "model": "claude-sonnet-4-5-20250929",
                        "llm_provider": "anthropic",
                        "tool_name": "request_human_approval",
                        "parameter": "status",
                        "validation_prompt": "Validate the response indicates approval.",
                        "violation_message": "Approval status validation failed with human response of '${params.status}'."
                    }
                ],
                "violation_logic": {
                    "type": "IF_ALL_THEN_ALL",
                    "triggers": ["check_1767136380813"],
                    "requirements": ["check_1767136421471", "check_1767137121409"],
                    "forbidden": []
                }
            },
            "enabled": True,
            "severity": "error",
            "_nocode_nodes": None
        },
        {
            "agent_id": agent_id,
            "name": "Concise Answer",
            "description": "Validates the agent responded with a concise answer both for clarity and efficiency.",
            "policy_type": "composite",
            "config": {
                "checks": [
                    {
                        "id": "check_1767145789693",
                        "name": "Small token response",
                        "type": "response_length",
                        "max_tokens": 350,
                        "min_tokens": 20
                    }
                ],
                "violation_logic": {
                    "type": "REQUIRE_ANY",
                    "triggers": [],
                    "requirements": ["check_1767145789693"],
                    "forbidden": []
                }
            },
            "enabled": True,
            "severity": "info",
            "_nocode_nodes": None
        },
        {
            "agent_id": agent_id,
            "name": "No PII Data",
            "description": "Validate PII data is not returned by the agent response.",
            "policy_type": "composite",
            "config": {
                "checks": [
                    {
                        "id": "check_1767153824554",
                        "name": "Check for PII",
                        "type": "llm_response_validation",
                        "llm_provider": "anthropic",
                        "validation_prompt": "Verify no PII data is present in the response to include any email addresses."
                    }
                ],
                "violation_logic": {
                    "type": "REQUIRE_ALL",
                    "triggers": [],
                    "requirements": ["check_1767153824554"],
                    "forbidden": []
                }
            },
            "enabled": True,
            "severity": "error",
            "_nocode_nodes": None
        },
        {
            "agent_id": agent_id,
            "name": "Response Quality",
            "description": "Comprehensive semantic validation ensuring professional, clear, and brand-compliant responses",
            "policy_type": "composite",
            "config": {
                "checks": [
                    {
                        "id": "check_clarity",
                        "name": "Clear & Simple Language",
                        "type": "llm_response_validation",
                        "scope": "final_message",
                        "validation_prompt": "Verify the response uses clear and simple language for a business operations audience familiar with process management, billing, and order management. Common domain terms are acceptable (invoice, order status, discount, credit limit, balance, ledger, reconciliation, approval). Avoid deep technical terms (for example: idempotency keys, downstream service, source system) unless briefly explained in plain language. Prefer concrete wording over corporate-speak and explain why the issue matters to the user.",
                        "llm_provider": "anthropic",
                        "model": "claude-sonnet-4-5-20250929"
                    },
                    {
                        "id": "check_positive_sentiment",
                        "name": "Positive & Constructive Sentiment",
                        "type": "llm_response_validation",
                        "scope": "final_message",
                        "validation_prompt": "Verify the response is helpful and solution-oriented. If the response reports an error, limitation, or that processing stopped, it must include actionable next steps (at least one) such as how to correct inputs, where to check status, or alternative paths. Neutral operational statements are acceptable when paired with guidance. Avoid dismissive phrasing like 'No actions were taken' unless followed by helpful next steps.",
                        "llm_provider": "anthropic",
                        "model": "claude-sonnet-4-5-20250929"
                    },
                    {
                        "id": "check_brand_voice",
                        "name": "Brand Voice Compliance",
                        "type": "llm_response_validation",
                        "scope": "final_message",
                        "validation_prompt": "Verify the response aligns with professional brand voice guidelines: helpful and informative, show expertise without arrogance, and be concise but thorough. For failure or stop outcomes, the response must include: (1) what happened, (2) what it means or common causes, and (3) recommended next steps with at least two specific actions. Use an advisor-like tone that guides resolution and offers help with the next step.",
                        "llm_provider": "anthropic",
                        "model": "claude-sonnet-4-5-20250929"
                    },
                    {
                        "id": "check_safety",
                        "name": "Safe & Appropriate Content",
                        "type": "llm_response_validation",
                        "scope": "final_message",
                        "validation_prompt": "Verify the response contains no offensive, discriminatory, or inappropriate content. It should be suitable for all audiences and free from profanity, controversial statements, or content that could be perceived as biased or insensitive.",
                        "llm_provider": "anthropic",
                        "model": "claude-sonnet-4-5-20250929"
                    }
                ],
                "violation_logic": {
                    "type": "REQUIRE_ALL",
                    "triggers": [],
                    "requirements": ["check_clarity", "check_positive_sentiment", "check_brand_voice", "check_safety"],
                    "forbidden": []
                }
            },
            "enabled": True,
            "severity": "warning",
            "_nocode_nodes": None
        }
    ]

    db = SessionLocal()
    try:
        print(f"Loading {len(policies)} policies for agent '{agent_id}'...")
        print()

        # Delete existing policies for this agent
        deleted_count = db.query(Policy).filter(Policy.agent_id == agent_id).delete()
        if deleted_count > 0:
            print(f"✓ Deleted {deleted_count} existing policies for agent '{agent_id}'")

        # Insert new policies
        for policy_data in policies:
            policy = Policy(
                agent_id=policy_data["agent_id"],
                name=policy_data["name"],
                description=policy_data["description"],
                policy_type=policy_data["policy_type"],
                config=policy_data["config"],
                enabled=policy_data["enabled"],
                severity=policy_data["severity"],
                _nocode_nodes=policy_data["_nocode_nodes"]
            )
            db.add(policy)
            print(f"✓ Added policy: {policy_data['name']} ({policy_data['severity']})")

        db.commit()
        print()
        print(f"✓ Successfully loaded {len(policies)} policies for agent '{agent_id}'")
        print()
        print("Next steps:")
        print(f"1. Navigate to http://localhost:3000/{agent_id}/dashboard")
        print("2. Go to the Policies page to verify")
        print("3. Process sessions to evaluate against these policies")

    except Exception as e:
        db.rollback()
        print(f"✗ Error loading policies: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    load_policies()
