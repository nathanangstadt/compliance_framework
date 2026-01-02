"""
Policy Evaluator - Main entry point for policy evaluation.
Now using the new composite policy system exclusively.
"""
from typing import List, Dict, Any, Tuple
from .composite_policy_evaluator import CompositePolicyEvaluator


class PolicyEvaluator:
    """Evaluates agent memories against defined policies."""

    def __init__(self):
        self.composite_evaluator = CompositePolicyEvaluator()

    def evaluate(
        self,
        messages: List[Dict[str, Any]],
        policy_type: str,
        config: Dict[str, Any],
        memory_metadata: Dict[str, Any] = None
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Evaluate messages against a policy.

        Args:
            messages: List of messages from agent memory
            policy_type: Type of policy (now only 'composite' supported)
            config: Policy configuration
            memory_metadata: Optional metadata about the memory

        Returns:
            Tuple of (is_compliant, violations)
        """
        if memory_metadata is None:
            memory_metadata = {}

        # New system: All policies are composite
        if policy_type == "composite":
            return self.composite_evaluator.evaluate(messages, memory_metadata, config)
        else:
            # Legacy policy types - not supported in new system
            raise ValueError(
                f"Policy type '{policy_type}' is not supported. "
                f"Please use 'composite' policy type with checks and violation_logic. "
                f"See POLICY_V2_MIGRATION.md for details."
            )
