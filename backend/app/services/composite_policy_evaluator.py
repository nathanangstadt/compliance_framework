"""
Composite policy evaluator with extensible violation logic types.
"""
from typing import Dict, Any, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from .check_types import CHECK_REGISTRY, CheckResult


class CompositePolicyEvaluator:
    """Evaluates composite policies with multiple checks and violation logic."""

    VIOLATION_LOGIC_TYPES = [
        'IF_ANY_THEN_ALL',      # If any trigger fires, all requirements must pass
        'IF_ALL_THEN_ALL',      # If all triggers fire, all requirements must pass
        'REQUIRE_ALL',          # All checks must pass (simple AND)
        'REQUIRE_ANY',          # At least one check must pass (simple OR)
        'FORBID_ALL',           # None of the forbidden checks should pass (unless requirements met)
    ]

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any], policy_config: Dict[str, Any]) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Evaluate a composite policy against agent memory.

        Args:
            messages: List of messages from agent memory
            memory_metadata: Metadata about the agent memory
            policy_config: Policy configuration with checks and violation_logic

        Returns:
            Tuple of (is_compliant, violations)
        """
        checks_config = policy_config.get('checks', [])
        violation_logic = policy_config.get('violation_logic', {})

        # Evaluate all checks in parallel
        check_results = {}

        def evaluate_check(check_config):
            """Helper function to evaluate a single check."""
            check_id = check_config.get('id')
            check_type = check_config.get('type')
            check_name = check_config.get('name', f'Check {check_id}')

            # Get check class from registry
            check_class = CHECK_REGISTRY.get(check_type)
            if not check_class:
                # Unknown check type - skip
                return check_id, None

            # Create and evaluate check
            check_instance = check_class(check_id, check_name, check_config)
            result = check_instance.evaluate(messages, memory_metadata)
            return check_id, result

        # Execute checks in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all check evaluations
            future_to_check = {executor.submit(evaluate_check, check_config): check_config
                             for check_config in checks_config}

            # Collect results as they complete
            for future in as_completed(future_to_check):
                check_id, result = future.result()
                if result is not None:
                    check_results[check_id] = result

        # Apply violation logic
        is_compliant, violation_details = self._apply_violation_logic(
            check_results,
            violation_logic,
            policy_config.get('name', 'Unnamed Policy'),
            policy_config.get('description', '')
        )

        return is_compliant, violation_details

    def _apply_violation_logic(
        self,
        check_results: Dict[str, CheckResult],
        violation_logic: Dict[str, Any],
        policy_name: str,
        policy_description: str
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Apply the specified violation logic to check results.

        Returns:
            Tuple of (is_compliant, violations_list)
        """
        logic_type = violation_logic.get('type', 'REQUIRE_ALL')

        if logic_type == 'IF_ANY_THEN_ALL':
            return self._evaluate_if_any_then_all(check_results, violation_logic, policy_name, policy_description)
        elif logic_type == 'IF_ALL_THEN_ALL':
            return self._evaluate_if_all_then_all(check_results, violation_logic, policy_name, policy_description)
        elif logic_type == 'REQUIRE_ALL':
            return self._evaluate_require_all(check_results, violation_logic, policy_name, policy_description)
        elif logic_type == 'REQUIRE_ANY':
            return self._evaluate_require_any(check_results, violation_logic, policy_name, policy_description)
        elif logic_type == 'FORBID_ALL':
            return self._evaluate_forbid_all(check_results, violation_logic, policy_name, policy_description)
        else:
            # Unknown logic type - default to REQUIRE_ALL
            return self._evaluate_require_all(check_results, violation_logic, policy_name, policy_description)

    def _evaluate_if_any_then_all(
        self,
        check_results: Dict[str, CheckResult],
        violation_logic: Dict[str, Any],
        policy_name: str,
        policy_description: str
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        IF_ANY_THEN_ALL: If any trigger passes, then all requirements must pass.

        Example: If high-value invoice is created, then approval must be requested AND granted.
        """
        trigger_ids = violation_logic.get('triggers', [])
        requirement_ids = violation_logic.get('requirements', [])

        # Check if any trigger passed
        triggers_passed = []
        triggers_failed = []
        for trigger_id in trigger_ids:
            result = check_results.get(trigger_id)
            if result:
                if result.passed:
                    triggers_passed.append(result)
                else:
                    triggers_failed.append(result)

        # If no triggers passed, policy is compliant (condition not met)
        if not triggers_passed:
            # Get requirement checks (unevaluated, but show for context)
            all_requirements = []
            for req_id in requirement_ids:
                result = check_results.get(req_id)
                if result:
                    all_requirements.append(result)

            details = {
                'policy_name': policy_name,
                'policy_description': policy_description,
                'violation_type': 'IF_ANY_THEN_ALL',
                'triggered_checks': [],
                'failed_triggers': [self._check_result_to_dict(r) for r in triggers_failed],
                'unevaluated_requirements': [self._check_result_to_dict(r) for r in all_requirements],
                'failed_requirements': [],
                'passed_requirements': [],
                'summary': 'Trigger condition not triggered',
                'violation_message': f'None of {len(trigger_ids)} trigger(s) triggered, policy requirements not evaluated'
            }
            return True, [details]

        # Triggers passed, now check requirements
        failed_requirements = []
        passed_requirements = []

        for req_id in requirement_ids:
            result = check_results.get(req_id)
            if result:
                if result.passed:
                    passed_requirements.append(result)
                else:
                    failed_requirements.append(result)
            else:
                # Requirement check doesn't exist
                failed_requirements.append(CheckResult(
                    passed=False,
                    check_id=req_id,
                    check_name=f"Unknown check {req_id}",
                    check_type='unknown',
                    message=f"Check '{req_id}' not found"
                ))

        # All requirements must pass
        is_compliant = len(failed_requirements) == 0

        # Build details (for both compliant and non-compliant cases)
        details = {
            'policy_name': policy_name,
            'policy_description': policy_description,
            'violation_type': 'IF_ANY_THEN_ALL',
            'triggered_checks': [self._check_result_to_dict(r) for r in triggers_passed],
            'failed_triggers': [self._check_result_to_dict(r) for r in triggers_failed],
            'failed_requirements': [self._check_result_to_dict(r) for r in failed_requirements],
            'passed_requirements': [self._check_result_to_dict(r) for r in passed_requirements],
        }

        if is_compliant:
            # Return compliance details instead of empty array
            details['summary'] = 'All requirements met when trigger condition triggered'
            details['violation_message'] = f"Trigger '{triggers_passed[0].check_name}' triggered and all {len(passed_requirements)} required checks passed"
            return True, [details]

        # Build violation
        details['summary'] = 'Trigger condition met but required checks failed'
        details['violation_message'] = self._generate_if_any_then_all_message(triggers_passed, failed_requirements, passed_requirements)

        # Create per-message violations for UI
        per_message_violations = self._create_per_message_violations(details, failed_requirements)

        return False, per_message_violations

    def _evaluate_if_all_then_all(
        self,
        check_results: Dict[str, CheckResult],
        violation_logic: Dict[str, Any],
        policy_name: str,
        policy_description: str
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        IF_ALL_THEN_ALL: If all triggers pass, then all requirements must pass.

        Example: If creating invoice AND customer is new, then credit check AND approval required.
        """
        trigger_ids = violation_logic.get('triggers', [])
        requirement_ids = violation_logic.get('requirements', [])

        # Check if ALL triggers passed
        triggers_passed = []
        triggers_failed = []
        for trigger_id in trigger_ids:
            result = check_results.get(trigger_id)
            if result:
                if result.passed:
                    triggers_passed.append(result)
                else:
                    triggers_failed.append(result)

        # If not all triggers passed, policy is compliant (condition not fully met)
        if len(triggers_passed) != len(trigger_ids):
            # Get requirement checks (unevaluated, but show for context)
            all_requirements = []
            for req_id in requirement_ids:
                result = check_results.get(req_id)
                if result:
                    all_requirements.append(result)

            details = {
                'policy_name': policy_name,
                'policy_description': policy_description,
                'violation_type': 'IF_ALL_THEN_ALL',
                'triggered_checks': [self._check_result_to_dict(r) for r in triggers_passed],
                'failed_triggers': [self._check_result_to_dict(r) for r in triggers_failed],
                'unevaluated_requirements': [self._check_result_to_dict(r) for r in all_requirements],
                'failed_requirements': [],
                'passed_requirements': [],
                'summary': 'Not all trigger conditions triggered',
                'violation_message': f'{len(triggers_passed)} of {len(trigger_ids)} triggers triggered, policy requirements not evaluated'
            }
            return True, [details]

        # All triggers passed, now check requirements
        failed_requirements = []
        passed_requirements = []

        for req_id in requirement_ids:
            result = check_results.get(req_id)
            if result:
                if result.passed:
                    passed_requirements.append(result)
                else:
                    failed_requirements.append(result)

        # All requirements must pass
        is_compliant = len(failed_requirements) == 0

        if is_compliant:
            details = {
                'policy_name': policy_name,
                'policy_description': policy_description,
                'violation_type': 'IF_ALL_THEN_ALL',
                'triggered_checks': [self._check_result_to_dict(r) for r in triggers_passed],
                'failed_requirements': [],
                'passed_requirements': [self._check_result_to_dict(r) for r in passed_requirements],
                'summary': 'All requirements met when all trigger conditions triggered',
                'violation_message': f"All {len(triggers_passed)} triggers triggered and all {len(passed_requirements)} required checks passed"
            }
            return True, [details]

        # Build violation
        violation = {
            'policy_name': policy_name,
            'policy_description': policy_description,
            'violation_type': 'IF_ALL_THEN_ALL',
            'summary': 'All trigger conditions met but required checks failed',
            'triggered_checks': [self._check_result_to_dict(r) for r in triggers_passed],
            'failed_requirements': [self._check_result_to_dict(r) for r in failed_requirements],
            'passed_requirements': [self._check_result_to_dict(r) for r in passed_requirements],
            'violation_message': self._generate_if_all_then_all_message(triggers_passed, failed_requirements, passed_requirements)
        }

        return False, [violation]

    def _evaluate_require_all(
        self,
        check_results: Dict[str, CheckResult],
        violation_logic: Dict[str, Any],
        policy_name: str,
        policy_description: str
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        REQUIRE_ALL: All specified checks must pass (simple AND).

        Example: Transaction must have validation AND logging AND audit trail.
        """
        requirement_ids = violation_logic.get('requirements', [])

        failed_checks = []
        passed_checks = []

        for req_id in requirement_ids:
            result = check_results.get(req_id)
            if result:
                if result.passed:
                    passed_checks.append(result)
                else:
                    failed_checks.append(result)

        is_compliant = len(failed_checks) == 0

        # Build details (for both compliant and non-compliant cases)
        details = {
            'policy_name': policy_name,
            'policy_description': policy_description or 'All specified checks must pass',
            'violation_type': 'REQUIRE_ALL',
            'failed_requirements': [self._check_result_to_dict(r) for r in failed_checks],
            'passed_requirements': [self._check_result_to_dict(r) for r in passed_checks],
        }

        if is_compliant:
            # Return compliance details instead of empty array
            details['summary'] = 'All required checks passed'
            details['violation_message'] = f"All {len(passed_checks)} required checks passed successfully"
            return True, [details]

        # Build violation
        details['summary'] = 'One or more required checks failed'
        details['violation_message'] = self._generate_require_all_message(failed_checks, passed_checks)

        return False, [details]

    def _evaluate_require_any(
        self,
        check_results: Dict[str, CheckResult],
        violation_logic: Dict[str, Any],
        policy_name: str,
        policy_description: str
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        REQUIRE_ANY: At least one of the specified checks must pass (simple OR).

        Example: Payment must use one of: credit card OR ACH OR wire transfer.
        """
        requirement_ids = violation_logic.get('requirements', [])

        failed_checks = []
        passed_checks = []

        for req_id in requirement_ids:
            result = check_results.get(req_id)
            if result:
                if result.passed:
                    passed_checks.append(result)
                else:
                    failed_checks.append(result)

        is_compliant = len(passed_checks) > 0

        # Build details (for both compliant and non-compliant cases)
        details = {
            'policy_name': policy_name,
            'policy_description': policy_description or 'At least one check must pass',
            'violation_type': 'REQUIRE_ANY',
            'failed_requirements': [self._check_result_to_dict(r) for r in failed_checks],
            'passed_requirements': [self._check_result_to_dict(r) for r in passed_checks],
        }

        if is_compliant:
            # Return compliance details instead of empty array
            details['summary'] = 'At least one alternative check passed'
            details['violation_message'] = f"{len(passed_checks)} of {len(requirement_ids)} alternative check(s) passed"
            return True, [details]

        # Build violation
        details['summary'] = 'None of the alternative checks passed'
        details['violation_message'] = self._generate_require_any_message(failed_checks)

        return False, [details]

    def _evaluate_forbid_all(
        self,
        check_results: Dict[str, CheckResult],
        violation_logic: Dict[str, Any],
        policy_name: str,
        policy_description: str
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        FORBID_ALL: None of the forbidden checks should pass, unless requirements are met.

        Example: Must not access sensitive data UNLESS authorization is granted.
        """
        forbidden_ids = violation_logic.get('forbidden', [])
        requirement_ids = violation_logic.get('requirements', [])

        # Check forbidden items
        forbidden_passed = []
        forbidden_avoided = []
        for forbidden_id in forbidden_ids:
            result = check_results.get(forbidden_id)
            if result:
                if result.passed:
                    forbidden_passed.append(result)
                else:
                    forbidden_avoided.append(result)

        # If no forbidden items passed, compliant
        if not forbidden_passed:
            # Return compliance details
            details = {
                'policy_name': policy_name,
                'policy_description': policy_description or 'No forbidden actions should occur',
                'violation_type': 'FORBID_ALL',
                'summary': 'No forbidden actions detected',
                'forbidden_checks_avoided': [self._check_result_to_dict(r) for r in forbidden_avoided],
                'violation_message': f"All {len(forbidden_ids)} forbidden action(s) were successfully avoided"
            }
            return True, [details]

        # Forbidden items found - check if requirements are met
        if requirement_ids:
            all_requirements_met = True
            failed_requirements = []
            passed_requirements = []

            for req_id in requirement_ids:
                result = check_results.get(req_id)
                if not result or not result.passed:
                    all_requirements_met = False
                    if result:
                        failed_requirements.append(result)
                else:
                    passed_requirements.append(result)

            # If all requirements met, the forbidden items are allowed
            if all_requirements_met:
                # Return compliance details
                details = {
                    'policy_name': policy_name,
                    'policy_description': policy_description or 'Forbidden actions allowed with proper authorization',
                    'violation_type': 'FORBID_ALL',
                    'summary': 'Forbidden actions detected but properly authorized',
                    'forbidden_checks': [self._check_result_to_dict(r) for r in forbidden_passed],
                    'passed_requirements': [self._check_result_to_dict(r) for r in passed_requirements],
                    'violation_message': f"{len(forbidden_passed)} forbidden action(s) detected but authorized by {len(passed_requirements)} requirement(s)"
                }
                return True, [details]

            # Build violation
            violation = {
                'policy_name': policy_name,
                'policy_description': policy_description,
                'violation_type': 'FORBID_ALL',
                'summary': 'Forbidden actions detected without required authorization',
                'forbidden_checks': [self._check_result_to_dict(r) for r in forbidden_passed],
                'failed_requirements': [self._check_result_to_dict(r) for r in failed_requirements],
                'violation_message': self._generate_forbid_all_message(forbidden_passed, failed_requirements)
            }

            return False, [violation]

        else:
            # No exceptions allowed - forbidden items are violations
            violation = {
                'policy_name': policy_name,
                'policy_description': policy_description,
                'violation_type': 'FORBID_ALL',
                'summary': 'Forbidden actions detected',
                'forbidden_checks': [self._check_result_to_dict(r) for r in forbidden_passed],
                'violation_message': self._generate_forbid_all_strict_message(forbidden_passed)
            }

            return False, [violation]

    def _check_result_to_dict(self, result: CheckResult) -> Dict[str, Any]:
        """Convert CheckResult to dictionary for JSON serialization."""
        return {
            'check_id': result.check_id,
            'check_name': result.check_name,
            'check_type': result.check_type,
            'passed': result.passed,
            'message': result.message,
            'details': result.details,
            'matched_items': result.matched_items,
            'llm_usage': result.llm_usage
        }

    # Violation message generators
    def _generate_if_any_then_all_message(self, triggers: List[CheckResult], failed: List[CheckResult], passed: List[CheckResult]) -> str:
        trigger_names = [t.check_name for t in triggers]
        failed_names = [f.check_name for f in failed]

        if len(trigger_names) == 1:
            trigger_text = f"'{trigger_names[0]}'"
        else:
            trigger_text = f"one of [{', '.join(trigger_names)}]"

        if len(failed) == 1:
            return f"Trigger {trigger_text} activated, but required check '{failed_names[0]}' failed"
        else:
            return f"Trigger {trigger_text} activated, but {len(failed)} required checks failed: {', '.join(failed_names)}"

    def _generate_if_all_then_all_message(self, triggers: List[CheckResult], failed: List[CheckResult], passed: List[CheckResult]) -> str:
        trigger_names = [t.check_name for t in triggers]
        failed_names = [f.check_name for f in failed]

        if len(failed) == 1:
            return f"All triggers activated [{', '.join(trigger_names)}], but required check '{failed_names[0]}' failed"
        else:
            return f"All triggers activated [{', '.join(trigger_names)}], but {len(failed)} required checks failed: {', '.join(failed_names)}"

    def _generate_require_all_message(self, failed: List[CheckResult], passed: List[CheckResult]) -> str:
        failed_names = [f.check_name for f in failed]

        if len(failed) == 1:
            return f"Required check '{failed_names[0]}' failed"
        else:
            return f"{len(failed)} required checks failed: {', '.join(failed_names)}"

    def _generate_require_any_message(self, failed: List[CheckResult]) -> str:
        failed_names = [f.check_name for f in failed]
        return f"At least one check must pass, but all {len(failed)} checks failed: {', '.join(failed_names)}"

    def _generate_forbid_all_message(self, forbidden: List[CheckResult], failed_requirements: List[CheckResult]) -> str:
        forbidden_names = [f.check_name for f in forbidden]
        req_names = [r.check_name for r in failed_requirements]

        if len(forbidden) == 1:
            forbidden_text = f"Forbidden action '{forbidden_names[0]}' detected"
        else:
            forbidden_text = f"Forbidden actions detected: {', '.join(forbidden_names)}"

        if failed_requirements:
            return f"{forbidden_text}, but authorization checks failed: {', '.join(req_names)}"
        else:
            return f"{forbidden_text} without required authorization"

    def _generate_forbid_all_strict_message(self, forbidden: List[CheckResult]) -> str:
        forbidden_names = [f.check_name for f in forbidden]

        if len(forbidden) == 1:
            return f"Forbidden action '{forbidden_names[0]}' was performed"
        else:
            return f"Forbidden actions performed: {', '.join(forbidden_names)}"

    def _create_per_message_violations(self, base_violation: Dict[str, Any], failed_requirements: List[CheckResult]) -> List[Dict[str, Any]]:
        """
        Create per-message violations for UI display.
        Extract message indices from failed requirements and create separate violation records for each message.
        """
        message_indices = set()

        # Collect all message indices from failed requirements
        for req in failed_requirements:
            if req.matched_items:
                for item in req.matched_items:
                    if isinstance(item, dict) and 'message_index' in item:
                        message_indices.add(item['message_index'])

        # If we have specific message indices, create per-message violations
        if message_indices:
            violations = []
            for msg_idx in message_indices:
                violation_copy = {
                    **base_violation,
                    'message_index': msg_idx
                }
                violations.append(violation_copy)
            return violations

        # Otherwise, return the base violation without a message_index
        return [base_violation]
