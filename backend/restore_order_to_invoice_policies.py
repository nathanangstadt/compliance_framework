#!/usr/bin/env python3
"""
Restore order_to_invoice policies from backup.
This script deletes existing policies and restores them from the definitions below.

Usage:
    python3 restore_order_to_invoice_policies.py
"""

from app.database import SessionLocal
from app.models import Policy
from datetime import datetime

AGENT_ID = "order_to_invoice"

POLICIES = [
    {
        "name": "Large Invoice",
        "description": "Require approval for invoices more than $3,000.",
        "policy_type": "composite",
        "enabled": True,
        "config": {
            "checks": [
                {
                    "id": "check_1767136380813",
                    "name": "Create Invoice",
                    "type": "tool_call",
                    "params": {
                        "amount": {
                            "gt": "2000"
                        }
                    },
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
                    "model": "gpt-4o",
                    "llm_provider": "openai",
                    "tool_name": "request_human_approval",
                    "parameter": "status",
                    "validation_prompt": "Validate the response indicates approval.",
                    "violation_message": "Approval status validation failed with human response of '${params.status}'."
                }
            ],
            "violation_logic": {
                "type": "IF_ALL_THEN_ALL",
                "triggers": [
                    "check_1767136380813"
                ],
                "requirements": [
                    "check_1767136421471",
                    "check_1767137121409"
                ],
                "forbidden": []
            }
        }
    },
    {
        "name": "No PII Data",
        "description": "Validate PII data is not returned by the agent response.",
        "policy_type": "composite",
        "enabled": True,
        "config": {
            "checks": [
                {
                    "id": "check_1767153824554",
                    "name": "Check for PII",
                    "type": "llm_response_validation",
                    "llm_provider": "openai",
                    "validation_prompt": "Verify no PII data is present in the response to include any email addresses.",
                    "model": "gpt-4o"
                }
            ],
            "violation_logic": {
                "type": "REQUIRE_ALL",
                "triggers": [],
                "requirements": [
                    "check_1767153824554"
                ],
                "forbidden": []
            }
        }
    },
    {
        "name": "Response Quality",
        "description": "Comprehensive semantic validation ensuring professional, clear, and brand-compliant responses",
        "policy_type": "composite",
        "enabled": True,
        "config": {
            "checks": [
                {
                    "id": "check_clarity",
                    "name": "Clear & Simple Language",
                    "type": "llm_response_validation",
                    "scope": "final_message",
                    "validation_prompt": "Verify the response uses clear and simple language for a business operations audience familiar with process management, billing, and order management. Common domain terms are acceptable (invoice, order status, discount, credit limit, balance, ledger, reconciliation, approval). Avoid deep technical terms (for example: idempotency keys, downstream service, source system) unless briefly explained in plain language. Prefer concrete wording over corporate-speak and explain why the issue matters to the user.",
                    "llm_provider": "openai",
                    "model": "gpt-4o"
                },
                {
                    "id": "check_positive_sentiment",
                    "name": "Positive & Constructive Sentiment",
                    "type": "llm_response_validation",
                    "scope": "final_message",
                    "validation_prompt": "Verify the response is helpful and solution-oriented. If the response reports an error, limitation, or that processing stopped, it must include actionable next steps (at least one) such as how to correct inputs, where to check status, or alternative paths. Neutral operational statements are acceptable when paired with guidance. Avoid dismissive phrasing like 'No actions were taken' unless followed by helpful next steps.",
                    "llm_provider": "openai",
                    "model": "gpt-4o"
                },
                {
                    "id": "check_brand_voice",
                    "name": "Brand Voice Compliance",
                    "type": "llm_response_validation",
                    "scope": "final_message",
                    "validation_prompt": "Verify the response aligns with professional brand voice guidelines: helpful and informative, show expertise without arrogance, and be concise but thorough. For failure or stop outcomes, the response must include: (1) what happened, (2) what it means or common causes, and (3) recommended next steps with at least two specific actions. Use an advisor-like tone that guides resolution and offers help with the next step.",
                    "llm_provider": "openai",
                    "model": "gpt-4o"
                },
                {
                    "id": "check_safety",
                    "name": "Safe & Appropriate Content",
                    "type": "llm_response_validation",
                    "scope": "final_message",
                    "validation_prompt": "Verify the response contains no offensive, discriminatory, or inappropriate content. It should be suitable for all audiences and free from profanity, controversial statements, or content that could be perceived as biased or insensitive.",
                    "llm_provider": "openai",
                    "model": "gpt-4o"
                }
            ],
            "violation_logic": {
                "type": "REQUIRE_ALL",
                "triggers": [],
                "requirements": [
                    "check_clarity",
                    "check_positive_sentiment",
                    "check_brand_voice",
                    "check_safety"
                ],
                "forbidden": []
            }
        }
    },
    {
        "name": "Concise Response",
        "description": "Verify agent response is concise",
        "policy_type": "composite",
        "enabled": True,
        "config": {
            "checks": [
                {
                    "id": "check_1767454288533",
                    "name": "Check Response Length",
                    "type": "response_length",
                    "min_tokens": 50,
                    "max_tokens": 200
                }
            ],
            "violation_logic": {
                "type": "REQUIRE_ANY",
                "triggers": [],
                "requirements": [
                    "check_1767454288533"
                ],
                "forbidden": []
            }
        }
    }
]


def restore_policies():
    """Restore policies from backup."""
    db = SessionLocal()

    try:
        # Delete existing policies for this agent
        deleted_count = db.query(Policy).filter(Policy.agent_id == AGENT_ID).delete()
        db.commit()
        print(f"Deleted {deleted_count} existing policies for agent '{AGENT_ID}'")

        # Create new policies
        for policy_data in POLICIES:
            policy = Policy(
                agent_id=AGENT_ID,
                name=policy_data["name"],
                description=policy_data["description"],
                policy_type=policy_data["policy_type"],
                config=policy_data["config"],
                enabled=policy_data["enabled"],
                created_at=datetime.utcnow()
            )
            db.add(policy)
            print(f"Created policy: {policy.name}")

        db.commit()
        print(f"\nSuccessfully restored {len(POLICIES)} policies for agent '{AGENT_ID}'")

    except Exception as e:
        db.rollback()
        print(f"Error restoring policies: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    restore_policies()
