"""
Check type definitions and base classes for the extensible policy system.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass


def calculate_llm_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """
    Calculate the cost of an LLM API call based on model pricing.

    Pricing as of January 2025 (per million tokens):
    - Claude Sonnet 4.5: $3 input / $15 output
    - Claude Opus 4: $15 input / $75 output
    - Claude Haiku 3.5: $0.80 input / $4 output
    - GPT-4o: $2.50 input / $10 output
    - GPT-4o-mini: $0.150 input / $0.600 output

    Returns cost in USD.
    """
    pricing = {
        # Anthropic models
        'claude-sonnet-4-5-20250929': {'input': 3.00, 'output': 15.00},
        'claude-opus-4-20250514': {'input': 15.00, 'output': 75.00},
        'claude-haiku-3-5-20241022': {'input': 0.80, 'output': 4.00},
        # OpenAI models
        'gpt-4o': {'input': 2.50, 'output': 10.00},
        'gpt-4o-mini': {'input': 0.150, 'output': 0.600},
    }

    # Get pricing for model, default to Sonnet 4.5 if unknown
    model_pricing = pricing.get(model, pricing['claude-sonnet-4-5-20250929'])

    # Calculate cost (pricing is per million tokens)
    input_cost = (input_tokens / 1_000_000) * model_pricing['input']
    output_cost = (output_tokens / 1_000_000) * model_pricing['output']

    return input_cost + output_cost


@dataclass
class CheckResult:
    """Result of evaluating a single check."""
    passed: bool
    check_id: str
    check_name: str
    check_type: str
    message: str
    details: Optional[Dict[str, Any]] = None
    matched_items: Optional[List[Dict[str, Any]]] = None  # Tool calls, messages, etc. that matched
    llm_usage: Optional[Dict[str, Any]] = None  # LLM token usage and cost information


class BaseCheck(ABC):
    """Base class for all check types."""

    def __init__(self, check_id: str, name: str, config: Dict[str, Any]):
        self.check_id = check_id
        self.name = name
        self.config = config

    @abstractmethod
    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        """
        Evaluate this check against agent memory.

        Args:
            messages: List of messages from agent memory
            memory_metadata: Metadata about the agent memory

        Returns:
            CheckResult with pass/fail status and details
        """
        pass

    def generate_violation_message(self, details: Dict[str, Any]) -> str:
        """
        Generate a violation message using the custom template or auto-generate.

        Args:
            details: Context for template substitution

        Returns:
            Formatted violation message
        """
        custom_message = self.config.get('violation_message')
        if custom_message:
            return self._substitute_template(custom_message, details)
        return self._auto_generate_message(details)

    def _substitute_template(self, template: str, details: Dict[str, Any]) -> str:
        """Substitute template variables like ${params.total}"""
        import re

        def replace_var(match):
            var_path = match.group(1)
            parts = var_path.split('.')
            value = details
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part, f"<{var_path}>")
                else:
                    value = f"<{var_path}>"
                    break
            return str(value)

        return re.sub(r'\$\{([^}]+)\}', replace_var, template)

    @abstractmethod
    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        """Auto-generate a violation message based on check type."""
        pass


class ToolCallCheck(BaseCheck):
    """Check if a specific tool was called with certain parameters."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        tool_name = self.config.get('tool_name')
        param_conditions = self.config.get('params', {})

        # Find all tool calls
        tool_calls = []
        for idx, message in enumerate(messages):
            if message.get('role') == 'assistant':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == tool_name:
                            tool_input = block.get('input', {})
                            # Check if parameters match conditions
                            if self._params_match(tool_input, param_conditions):
                                tool_calls.append({
                                    'message_index': idx,
                                    'tool_id': block.get('id'),
                                    'params': tool_input
                                })

        passed = len(tool_calls) > 0
        details = {
            'tool_name': tool_name,
            'expected_params': param_conditions,
            'found_calls': tool_calls
        }

        message = self.generate_violation_message(details) if not passed else f"Tool '{tool_name}' called with matching parameters"

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='tool_call',
            message=message,
            details=details,
            matched_items=tool_calls
        )

    def _params_match(self, actual_params: Dict[str, Any], conditions: Dict[str, Any]) -> bool:
        """Check if actual parameters match the conditions."""
        if not conditions:
            return True

        for param_name, condition in conditions.items():
            if param_name not in actual_params:
                return False

            actual_value = actual_params[param_name]

            if isinstance(condition, dict):
                # Handle operators: gt, lt, eq, gte, lte
                for op, expected_value in condition.items():
                    if not self._compare(actual_value, op, expected_value):
                        return False
            else:
                # Direct equality
                if actual_value != condition:
                    return False

        return True

    def _compare(self, actual: Any, operator: str, expected: Any) -> bool:
        """Compare values using operator."""
        try:
            if operator == 'gt':
                return float(actual) > float(expected)
            elif operator == 'gte':
                return float(actual) >= float(expected)
            elif operator == 'lt':
                return float(actual) < float(expected)
            elif operator == 'lte':
                return float(actual) <= float(expected)
            elif operator == 'eq':
                return actual == expected
            elif operator == 'ne':
                return actual != expected
            else:
                return False
        except (ValueError, TypeError):
            return str(actual) == str(expected) if operator == 'eq' else str(actual) != str(expected)

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        tool_name = details['tool_name']
        conditions = details['expected_params']

        if conditions:
            cond_str = ', '.join([f"{k}: {v}" for k, v in conditions.items()])
            return f"Tool '{tool_name}' was not called with required parameters ({cond_str})"
        return f"Tool '{tool_name}' was not called"


class ToolResponseCheck(BaseCheck):
    """Check tool response for specific parameter values."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        tool_name = self.config.get('tool_name')
        expect_success = self.config.get('expect_success', True)
        response_params = self.config.get('response_params', {})

        # Find tool calls and their results
        tool_results = self._find_tool_results(messages, tool_name)

        matching_results = []
        for result in tool_results:
            if expect_success and result.get('is_error'):
                continue

            # Check response parameters
            if self._response_matches(result.get('content'), response_params):
                matching_results.append(result)

        passed = len(matching_results) > 0
        details = {
            'tool_name': tool_name,
            'expect_success': expect_success,
            'expected_params': response_params,
            'found_results': matching_results
        }

        message = self.generate_violation_message(details) if not passed else f"Tool '{tool_name}' response matched criteria"

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='tool_response',
            message=message,
            details=details,
            matched_items=matching_results
        )

    def _find_tool_results(self, messages: List[Dict[str, Any]], tool_name: str) -> List[Dict[str, Any]]:
        """Find all tool results for the specified tool.

        Supports both formats:
        - Anthropic: role: "user" with type: "tool_result"
        - OpenAI: role: "tool" with tool_call_id
        """
        # First, find tool calls
        tool_call_ids = {}
        for idx, message in enumerate(messages):
            if message.get('role') == 'assistant':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == tool_name:
                            tool_call_ids[block.get('id')] = idx

        # Now find results - support both Anthropic and OpenAI formats
        results = []
        for idx, message in enumerate(messages):
            role = message.get('role')

            # Anthropic format: role: "user" with type: "tool_result"
            if role == 'user':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_result':
                            tool_use_id = block.get('tool_use_id')
                            if tool_use_id in tool_call_ids:
                                import json
                                content_str = block.get('content', '')
                                try:
                                    content_json = json.loads(content_str) if isinstance(content_str, str) else content_str
                                except:
                                    content_json = {'raw': content_str}

                                results.append({
                                    'message_index': idx,
                                    'tool_use_id': tool_use_id,
                                    'content': content_json,
                                    'is_error': block.get('is_error', False)
                                })

            # OpenAI format: role: "tool"
            elif role == 'tool':
                content = message.get('content', [])

                # Handle both single tool result and list of tool results
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get('type') == 'tool_result':
                            tool_use_id = block.get('tool_use_id')
                            if tool_use_id in tool_call_ids:
                                import json
                                content_str = block.get('content', '')
                                try:
                                    content_json = json.loads(content_str) if isinstance(content_str, str) else content_str
                                except:
                                    content_json = {'raw': content_str}

                                results.append({
                                    'message_index': idx,
                                    'tool_use_id': tool_use_id,
                                    'content': content_json,
                                    'is_error': block.get('is_error', False)
                                })
                elif isinstance(content, str):
                    # Simple OpenAI format with tool_call_id
                    tool_call_id = message.get('tool_call_id')
                    if tool_call_id in tool_call_ids:
                        import json
                        try:
                            content_json = json.loads(content) if isinstance(content, str) else content
                        except:
                            content_json = {'raw': content}

                        results.append({
                            'message_index': idx,
                            'tool_use_id': tool_call_id,
                            'content': content_json,
                            'is_error': False
                        })

        return results

    def _response_matches(self, content: Any, expected_params: Dict[str, Any]) -> bool:
        """Check if response content matches expected parameters."""
        if not expected_params:
            return True

        if not isinstance(content, dict):
            return False

        for param_name, condition in expected_params.items():
            if param_name not in content:
                return False

            actual_value = content[param_name]

            if isinstance(condition, dict):
                for op, expected_value in condition.items():
                    if not self._compare(actual_value, op, expected_value):
                        return False
            else:
                if actual_value != condition:
                    return False

        return True

    def _compare(self, actual: Any, operator: str, expected: Any) -> bool:
        """Same as ToolCallCheck._compare"""
        try:
            if operator == 'gt':
                return float(actual) > float(expected)
            elif operator == 'gte':
                return float(actual) >= float(expected)
            elif operator == 'lt':
                return float(actual) < float(expected)
            elif operator == 'lte':
                return float(actual) <= float(expected)
            elif operator == 'eq':
                return actual == expected
            elif operator == 'ne':
                return actual != expected
            elif operator == 'contains':
                return expected in str(actual)
            else:
                return False
        except (ValueError, TypeError):
            if operator == 'contains':
                return expected in str(actual)
            return str(actual) == str(expected) if operator == 'eq' else str(actual) != str(expected)

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        tool_name = details['tool_name']
        return f"Tool '{tool_name}' response did not match expected criteria"


class LLMToolResponseCheck(BaseCheck):
    """Use LLM to validate tool response parameter."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        tool_name = self.config.get('tool_name')
        target_parameter = self.config.get('parameter')
        validation_prompt = self.config.get('validation_prompt')
        llm_provider = self.config.get('llm_provider', 'anthropic')
        model = self.config.get('model', 'claude-sonnet-4-5-20250929')

        # Find tool results
        tool_results = self._find_tool_results(messages, tool_name)

        passed_validations = []
        failed_validations = []
        all_usage = []  # Track all LLM API calls

        for result in tool_results:
            content = result.get('content', {})
            param_value = content.get(target_parameter) if isinstance(content, dict) else str(content)

            # Validate with LLM
            llm_result = self._validate_with_llm(param_value, validation_prompt, llm_provider, model)

            # Track usage if available
            if llm_result.get('usage'):
                all_usage.append(llm_result['usage'])

            validation_info = {
                'message_index': result['message_index'],
                'param_value': str(param_value),
                'llm_response': llm_result['response'],
                'passed': llm_result['passed']
            }

            if llm_result['passed']:
                passed_validations.append(validation_info)
            else:
                failed_validations.append(validation_info)

        passed = len(passed_validations) > 0 and len(failed_validations) == 0

        # Build params dict for template substitution
        # Use first failed validation's param_value, or first passed one if all passed
        param_value = None
        if failed_validations:
            param_value = failed_validations[0].get('param_value')
        elif passed_validations:
            param_value = passed_validations[0].get('param_value')

        details = {
            'tool_name': tool_name,
            'parameter': target_parameter,
            'passed_validations': passed_validations,
            'failed_validations': failed_validations,
            'params': {target_parameter: param_value} if param_value is not None else {}
        }

        message = self.generate_violation_message(details) if not passed else f"LLM validation passed for '{tool_name}.{target_parameter}'"

        # Aggregate LLM usage across all API calls
        total_usage = None
        if all_usage:
            total_input = sum(u['input_tokens'] for u in all_usage)
            total_output = sum(u['output_tokens'] for u in all_usage)
            total_cost = sum(u['cost_usd'] for u in all_usage)

            total_usage = {
                'provider': all_usage[0]['provider'],
                'model': all_usage[0]['model'],
                'api_calls': len(all_usage),
                'total_input_tokens': total_input,
                'total_output_tokens': total_output,
                'total_tokens': total_input + total_output,
                'total_cost_usd': round(total_cost, 6),
                'per_call': all_usage
            }

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='llm_tool_response',
            message=message,
            details=details,
            matched_items=passed_validations if passed else failed_validations,
            llm_usage=total_usage
        )

    def _find_tool_results(self, messages: List[Dict[str, Any]], tool_name: str) -> List[Dict[str, Any]]:
        """Find all tool results for the specified tool.

        Supports both formats:
        - Anthropic: role: "user" with type: "tool_result"
        - OpenAI: role: "tool" with tool_call_id
        """
        tool_call_ids = {}
        for idx, message in enumerate(messages):
            if message.get('role') == 'assistant':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == tool_name:
                            tool_call_ids[block.get('id')] = idx

        # Now find results - support both Anthropic and OpenAI formats
        results = []
        for idx, message in enumerate(messages):
            role = message.get('role')

            # Anthropic format: role: "user" with type: "tool_result"
            if role == 'user':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_result':
                            tool_use_id = block.get('tool_use_id')
                            if tool_use_id in tool_call_ids:
                                import json
                                content_str = block.get('content', '')
                                try:
                                    content_json = json.loads(content_str) if isinstance(content_str, str) else content_str
                                except:
                                    content_json = {'raw': content_str}

                                results.append({
                                    'message_index': idx,
                                    'tool_use_id': tool_use_id,
                                    'content': content_json,
                                    'is_error': block.get('is_error', False)
                                })

            # OpenAI format: role: "tool"
            elif role == 'tool':
                content = message.get('content', [])

                # Handle both single tool result and list of tool results
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get('type') == 'tool_result':
                            tool_use_id = block.get('tool_use_id')
                            if tool_use_id in tool_call_ids:
                                import json
                                content_str = block.get('content', '')
                                try:
                                    content_json = json.loads(content_str) if isinstance(content_str, str) else content_str
                                except:
                                    content_json = {'raw': content_str}

                                results.append({
                                    'message_index': idx,
                                    'tool_use_id': tool_use_id,
                                    'content': content_json,
                                    'is_error': block.get('is_error', False)
                                })
                elif isinstance(content, str):
                    # Simple OpenAI format with tool_call_id
                    tool_call_id = message.get('tool_call_id')
                    if tool_call_id in tool_call_ids:
                        import json
                        try:
                            content_json = json.loads(content) if isinstance(content, str) else content
                        except:
                            content_json = {'raw': content}

                        results.append({
                            'message_index': idx,
                            'tool_use_id': tool_call_id,
                            'content': content_json,
                            'is_error': False
                        })

        return results

    def _validate_with_llm(self, value: str, prompt: str, provider: str, model: str) -> Dict[str, Any]:
        """Call LLM to validate the value.

        The user's natural language prompt is automatically enhanced with:
        1. Clear binary decision instructions (compliant or not)
        2. Request for structured JSON output
        3. Format enforcement (no markdown, just JSON)

        This ensures reliable parsing while keeping prompt writing simple for users.
        Falls back to keyword detection only if JSON parsing fails.
        """
        import os
        import json

        try:
            # Enhance user's prompt with binary decision instructions and structured output request
            structured_prompt = f"""You are a compliance validator. Evaluate the following value against the criteria below.

USER CRITERIA:
{prompt}

VALUE TO EVALUATE:
{value}

INSTRUCTIONS:
1. Make a binary decision: does the value meet the criteria or not?
2. Provide a brief explanation for your decision
3. Respond ONLY with valid JSON in this exact format:

{{"compliant": true, "reason": "your explanation"}}

OR

{{"compliant": false, "reason": "your explanation"}}

Do not include any text outside the JSON. Do not use markdown code blocks."""

            # Track token usage and cost
            usage_info = None

            if provider == 'anthropic':
                from anthropic import Anthropic
                api_key = os.getenv('ANTHROPIC_API_KEY')
                if not api_key:
                    return {'passed': False, 'response': 'Anthropic API key not configured', 'error': True}

                client = Anthropic(api_key=api_key)
                response = client.messages.create(
                    model=model,
                    max_tokens=1000,
                    messages=[{
                        'role': 'user',
                        'content': structured_prompt
                    }]
                )
                eval_result = response.content[0].text

                # Extract token usage from Anthropic response
                input_tokens = response.usage.input_tokens
                output_tokens = response.usage.output_tokens
                cost = calculate_llm_cost(model, input_tokens, output_tokens)

                usage_info = {
                    'provider': 'anthropic',
                    'model': model,
                    'input_tokens': input_tokens,
                    'output_tokens': output_tokens,
                    'total_tokens': input_tokens + output_tokens,
                    'cost_usd': round(cost, 6)
                }

            elif provider == 'openai':
                from openai import OpenAI
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    return {'passed': False, 'response': 'OpenAI API key not configured', 'error': True}

                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=model,
                    messages=[{
                        'role': 'user',
                        'content': structured_prompt
                    }]
                )
                eval_result = response.choices[0].message.content

                # Extract token usage from OpenAI response
                input_tokens = response.usage.prompt_tokens
                output_tokens = response.usage.completion_tokens
                cost = calculate_llm_cost(model, input_tokens, output_tokens)

                usage_info = {
                    'provider': 'openai',
                    'model': model,
                    'input_tokens': input_tokens,
                    'output_tokens': output_tokens,
                    'total_tokens': input_tokens + output_tokens,
                    'cost_usd': round(cost, 6)
                }
            else:
                return {'passed': False, 'response': f'Unknown LLM provider: {provider}', 'error': True}

            # Try to parse structured JSON response
            try:
                # Handle markdown code blocks that LLMs often add
                eval_cleaned = eval_result.strip()
                if eval_cleaned.startswith('```'):
                    # Extract JSON from code block
                    lines = eval_cleaned.split('\n')
                    eval_cleaned = '\n'.join(lines[1:-1]) if len(lines) > 2 else eval_cleaned
                    eval_cleaned = eval_cleaned.replace('```json', '').replace('```', '').strip()

                result_json = json.loads(eval_cleaned)

                # Check for compliant field (boolean)
                if 'compliant' in result_json:
                    passed = bool(result_json['compliant'])
                    reason = result_json.get('reason', eval_result)
                    return {'passed': passed, 'response': reason, 'error': False, 'usage': usage_info}

            except (json.JSONDecodeError, ValueError):
                # Fall back to keyword detection if JSON parsing fails
                pass

            # Fallback: Check for rejection/approval keywords
            eval_lower = eval_result.lower()

            # Check for explicit approval first
            approval_keywords = ['compliant', 'approved', 'yes', 'pass', 'valid', 'correct', 'acceptable']
            has_approval = any(word in eval_lower for word in approval_keywords)

            # Check for rejection keywords
            rejection_keywords = ['violation', 'non-compliant', 'does not comply', 'fails', 'rejected', 'denied', 'invalid', 'incorrect']
            has_rejection = any(word in eval_lower for word in rejection_keywords)

            # Determine result based on keywords
            if has_rejection and not has_approval:
                passed = False
            elif has_approval and not has_rejection:
                passed = True
            elif has_rejection and has_approval:
                # Both present - rejection takes precedence for safety
                passed = False
            else:
                # No clear keywords - treat as rejection for safety
                passed = False

            return {'passed': passed, 'response': eval_result, 'error': False, 'usage': usage_info}

        except Exception as e:
            return {'passed': False, 'response': f'LLM validation error: {str(e)}', 'error': True, 'usage': None}

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        tool_name = details['tool_name']
        parameter = details['parameter']
        failed = details.get('failed_validations', [])

        if failed:
            first_failure = failed[0]
            return f"LLM validation failed for '{tool_name}.{parameter}': {first_failure['llm_response']}"

        return f"LLM validation failed for '{tool_name}.{parameter}'"


class ResponseLengthCheck(BaseCheck):
    """Check if assistant response meets token count criteria (min, max, or range)."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        min_tokens = self.config.get('min_tokens')
        max_tokens = self.config.get('max_tokens')
        scope = self.config.get('scope', 'final_message')  # final_message, all_messages, any_message

        violations = []

        if scope == 'final_message':
            # Find last assistant message
            for idx in range(len(messages) - 1, -1, -1):
                if messages[idx].get('role') == 'assistant':
                    token_count = self._count_tokens(messages[idx])

                    # Check both min and max constraints
                    if min_tokens is not None and token_count < min_tokens:
                        violations.append({
                            'message_index': idx,
                            'token_count': token_count,
                            'min_tokens': min_tokens,
                            'violation_type': 'below_minimum'
                        })
                    elif max_tokens is not None and token_count > max_tokens:
                        violations.append({
                            'message_index': idx,
                            'token_count': token_count,
                            'max_tokens': max_tokens,
                            'violation_type': 'above_maximum'
                        })
                    break

        passed = len(violations) == 0

        # Get actual token count for the message (even when passing)
        actual_token_count = None
        if scope == 'final_message':
            for idx in range(len(messages) - 1, -1, -1):
                if messages[idx].get('role') == 'assistant':
                    actual_token_count = self._count_tokens(messages[idx])
                    break

        details = {
            'min_tokens': min_tokens,
            'max_tokens': max_tokens,
            'scope': scope,
            'violations': violations,
            'actual_token_count': actual_token_count
        }

        if passed and actual_token_count is not None:
            if min_tokens is not None and max_tokens is not None:
                message = f"Response length {actual_token_count} tokens within range {min_tokens}-{max_tokens}"
            elif min_tokens is not None:
                message = f"Response length {actual_token_count} tokens meets minimum of {min_tokens}"
            elif max_tokens is not None:
                message = f"Response length {actual_token_count} tokens within {max_tokens} token limit"
            else:
                message = f"Response length {actual_token_count} tokens"
        elif passed:
            message = "Response length meets criteria"
        else:
            message = self.generate_violation_message(details)

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='response_length',
            message=message,
            details=details,
            matched_items=violations
        )

    def _count_tokens(self, message: Dict[str, Any]) -> int:
        """Estimate token count for a message."""
        content = message.get('content', [])
        if isinstance(content, list):
            text = ' '.join([block.get('text', '') for block in content if block.get('type') == 'text'])
        else:
            text = str(content)

        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        violations = details.get('violations', [])
        if violations:
            v = violations[0]
            violation_type = v.get('violation_type')

            if violation_type == 'below_minimum':
                shortfall = v['min_tokens'] - v['token_count']
                return f"Response length {v['token_count']} tokens below minimum of {v['min_tokens']} tokens (short by {shortfall} tokens)"
            elif violation_type == 'above_maximum':
                exceeded_by = v['token_count'] - v['max_tokens']
                return f"Response length {v['token_count']} tokens exceeds limit of {v['max_tokens']} tokens (exceeded by {exceeded_by} tokens)"

        min_tokens = details.get('min_tokens')
        max_tokens = details.get('max_tokens')

        if min_tokens and max_tokens:
            return f"Response length outside allowed range of {min_tokens}-{max_tokens} tokens"
        elif min_tokens:
            return f"Response length below minimum of {min_tokens} tokens"
        elif max_tokens:
            return f"Response length exceeds {max_tokens} token limit"

        return "Response length check failed"


class ToolCallCountCheck(BaseCheck):
    """Check if tool call count meets threshold."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        tool_name = self.config.get('tool_name')
        operator = self.config.get('operator', 'lte')  # lt, lte, gt, gte, eq
        count_threshold = self.config.get('count', 1)

        # Count tool calls
        actual_count = 0
        tool_calls = []

        for idx, message in enumerate(messages):
            if message.get('role') == 'assistant':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == tool_name:
                            actual_count += 1
                            tool_calls.append({
                                'message_index': idx,
                                'tool_id': block.get('id')
                            })

        # Compare count
        passed = self._compare_count(actual_count, operator, count_threshold)

        details = {
            'tool_name': tool_name,
            'actual_count': actual_count,
            'operator': operator,
            'threshold': count_threshold,
            'tool_calls': tool_calls
        }

        message = self.generate_violation_message(details) if not passed else f"Tool '{tool_name}' call count {actual_count} meets criteria"

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='tool_call_count',
            message=message,
            details=details,
            matched_items=tool_calls
        )

    def _compare_count(self, actual: int, operator: str, threshold: int) -> bool:
        if operator == 'lt':
            return actual < threshold
        elif operator == 'lte':
            return actual <= threshold
        elif operator == 'gt':
            return actual > threshold
        elif operator == 'gte':
            return actual >= threshold
        elif operator == 'eq':
            return actual == threshold
        return False

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        tool_name = details['tool_name']
        actual = details['actual_count']
        operator = details['operator']
        threshold = details['threshold']

        op_text = {'lt': '<', 'lte': '≤', 'gt': '>', 'gte': '≥', 'eq': '='}
        return f"Tool '{tool_name}' called {actual} times (expected: {op_text.get(operator, operator)} {threshold})"


class LLMResponseValidationCheck(BaseCheck):
    """Use LLM to validate agent response content."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        scope = self.config.get('scope', 'final_message')
        validation_prompt = self.config.get('validation_prompt')
        llm_provider = self.config.get('llm_provider', 'anthropic')
        model = self.config.get('model', 'claude-sonnet-4-5-20250929')

        # Find messages to validate
        messages_to_check = []

        if scope == 'final_message':
            for idx in range(len(messages) - 1, -1, -1):
                if messages[idx].get('role') == 'assistant':
                    messages_to_check.append((idx, messages[idx]))
                    break

        validations = []
        all_usage = []  # Track all LLM API calls

        for idx, message in messages_to_check:
            content_text = self._extract_text(message)
            llm_result = self._validate_with_llm(content_text, validation_prompt, llm_provider, model)

            # Track usage if available
            if llm_result.get('usage'):
                all_usage.append(llm_result['usage'])

            validations.append({
                'message_index': idx,
                'llm_response': llm_result['response'],
                'passed': llm_result['passed'],
                'content_preview': content_text[:200]
            })

        passed = all(v['passed'] for v in validations)
        details = {
            'scope': scope,
            'validations': validations
        }

        message = self.generate_violation_message(details) if not passed else "LLM response validation passed"

        # Aggregate LLM usage across all API calls
        total_usage = None
        if all_usage:
            total_input = sum(u['input_tokens'] for u in all_usage)
            total_output = sum(u['output_tokens'] for u in all_usage)
            total_cost = sum(u['cost_usd'] for u in all_usage)

            total_usage = {
                'provider': all_usage[0]['provider'],
                'model': all_usage[0]['model'],
                'api_calls': len(all_usage),
                'total_input_tokens': total_input,
                'total_output_tokens': total_output,
                'total_tokens': total_input + total_output,
                'total_cost_usd': round(total_cost, 6),
                'per_call': all_usage
            }

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='llm_response_validation',
            message=message,
            details=details,
            matched_items=validations,
            llm_usage=total_usage
        )

    def _extract_text(self, message: Dict[str, Any]) -> str:
        """Extract text from message content."""
        content = message.get('content', [])
        if isinstance(content, list):
            return ' '.join([block.get('text', '') for block in content if block.get('type') == 'text'])
        return str(content)

    def _validate_with_llm(self, content: str, prompt: str, provider: str, model: str) -> Dict[str, Any]:
        """Call LLM to validate response content.

        The user's natural language prompt is automatically enhanced with:
        1. Clear binary decision instructions (compliant or not)
        2. Request for structured JSON output
        3. Format enforcement (no markdown, just JSON)

        This ensures reliable parsing while keeping prompt writing simple for users.
        Falls back to keyword detection only if JSON parsing fails.
        """
        import os
        import json

        try:
            # Enhance user's prompt with binary decision instructions and structured output request
            structured_prompt = f"""You are a compliance validator. Evaluate the following content against the criteria below.

USER CRITERIA:
{prompt}

CONTENT TO EVALUATE:
{content}

INSTRUCTIONS:
1. Make a binary decision: does the content meet the criteria or not?
2. Provide a brief explanation for your decision
3. Respond ONLY with valid JSON in this exact format:

{{"compliant": true, "reason": "your explanation"}}

OR

{{"compliant": false, "reason": "your explanation"}}

Do not include any text outside the JSON. Do not use markdown code blocks."""

            # Track token usage and cost
            usage_info = None

            if provider == 'anthropic':
                from anthropic import Anthropic
                api_key = os.getenv('ANTHROPIC_API_KEY')
                if not api_key:
                    return {'passed': False, 'response': 'Anthropic API key not configured', 'error': True}

                client = Anthropic(api_key=api_key)
                response = client.messages.create(
                    model=model,
                    max_tokens=1000,
                    messages=[{
                        'role': 'user',
                        'content': structured_prompt
                    }]
                )
                eval_result = response.content[0].text

                # Extract token usage from Anthropic response
                input_tokens = response.usage.input_tokens
                output_tokens = response.usage.output_tokens
                cost = calculate_llm_cost(model, input_tokens, output_tokens)

                usage_info = {
                    'provider': 'anthropic',
                    'model': model,
                    'input_tokens': input_tokens,
                    'output_tokens': output_tokens,
                    'total_tokens': input_tokens + output_tokens,
                    'cost_usd': round(cost, 6)
                }

            elif provider == 'openai':
                from openai import OpenAI
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    return {'passed': False, 'response': 'OpenAI API key not configured', 'error': True}

                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=model,
                    messages=[{
                        'role': 'user',
                        'content': structured_prompt
                    }]
                )
                eval_result = response.choices[0].message.content

                # Extract token usage from OpenAI response
                input_tokens = response.usage.prompt_tokens
                output_tokens = response.usage.completion_tokens
                cost = calculate_llm_cost(model, input_tokens, output_tokens)

                usage_info = {
                    'provider': 'openai',
                    'model': model,
                    'input_tokens': input_tokens,
                    'output_tokens': output_tokens,
                    'total_tokens': input_tokens + output_tokens,
                    'cost_usd': round(cost, 6)
                }
            else:
                return {'passed': False, 'response': f'Unknown LLM provider: {provider}', 'error': True}

            # Try to parse structured JSON response
            try:
                # Handle markdown code blocks that LLMs often add
                eval_cleaned = eval_result.strip()
                if eval_cleaned.startswith('```'):
                    # Extract JSON from code block
                    lines = eval_cleaned.split('\n')
                    eval_cleaned = '\n'.join(lines[1:-1]) if len(lines) > 2 else eval_cleaned
                    eval_cleaned = eval_cleaned.replace('```json', '').replace('```', '').strip()

                result_json = json.loads(eval_cleaned)

                # Check for compliant field (boolean)
                if 'compliant' in result_json:
                    passed = bool(result_json['compliant'])
                    reason = result_json.get('reason', eval_result)
                    return {'passed': passed, 'response': reason, 'error': False, 'usage': usage_info}

            except (json.JSONDecodeError, ValueError):
                # Fall back to keyword detection if JSON parsing fails
                pass

            # Fallback: Check for rejection/approval keywords
            eval_lower = eval_result.lower()

            # Check for explicit approval first
            approval_keywords = ['compliant', 'approved', 'yes', 'pass', 'valid', 'correct', 'acceptable']
            has_approval = any(word in eval_lower for word in approval_keywords)

            # Check for rejection keywords
            rejection_keywords = ['violation', 'non-compliant', 'does not comply', 'fails', 'rejected', 'denied', 'invalid', 'incorrect']
            has_rejection = any(word in eval_lower for word in rejection_keywords)

            # Determine result based on keywords
            if has_rejection and not has_approval:
                passed = False
            elif has_approval and not has_rejection:
                passed = True
            elif has_rejection and has_approval:
                # Both present - rejection takes precedence for safety
                passed = False
            else:
                # No clear keywords - treat as rejection for safety
                passed = False

            return {'passed': passed, 'response': eval_result, 'error': False, 'usage': usage_info}

        except Exception as e:
            return {'passed': False, 'response': f'LLM validation error: {str(e)}', 'error': True, 'usage': None}

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        validations = details.get('validations', [])
        failed = [v for v in validations if not v['passed']]

        if failed:
            return f"LLM response validation failed: {failed[0]['llm_response']}"
        return "LLM response validation failed"


class ResponseContainsCheck(BaseCheck):
    """Check if response contains specific keywords."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        scope = self.config.get('scope', 'final_message')
        keywords = self.config.get('keywords', [])
        mode = self.config.get('mode', 'any')  # all, any, none

        # Find messages to check
        messages_to_check = []

        if scope == 'final_message':
            for idx in range(len(messages) - 1, -1, -1):
                if messages[idx].get('role') == 'assistant':
                    messages_to_check.append((idx, messages[idx]))
                    break

        results = []
        for idx, message in messages_to_check:
            content_text = self._extract_text(message).lower()
            found_keywords = [kw for kw in keywords if kw.lower() in content_text]

            if mode == 'all':
                check_passed = len(found_keywords) == len(keywords)
            elif mode == 'any':
                check_passed = len(found_keywords) > 0
            elif mode == 'none':
                check_passed = len(found_keywords) == 0
            else:
                check_passed = False

            results.append({
                'message_index': idx,
                'found_keywords': found_keywords,
                'missing_keywords': [kw for kw in keywords if kw not in found_keywords],
                'passed': check_passed
            })

        passed = all(r['passed'] for r in results)
        details = {
            'keywords': keywords,
            'mode': mode,
            'results': results
        }

        message = self.generate_violation_message(details) if not passed else "Response contains required keywords"

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='response_contains',
            message=message,
            details=details,
            matched_items=results
        )

    def _extract_text(self, message: Dict[str, Any]) -> str:
        content = message.get('content', [])
        if isinstance(content, list):
            return ' '.join([block.get('text', '') for block in content if block.get('type') == 'text'])
        return str(content)

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        mode = details['mode']
        keywords = details['keywords']
        results = details.get('results', [])

        if results and not results[0]['passed']:
            if mode == 'all':
                missing = results[0].get('missing_keywords', [])
                return f"Response missing required keywords: {', '.join(missing)}"
            elif mode == 'any':
                return f"Response does not contain any of: {', '.join(keywords)}"
            elif mode == 'none':
                found = results[0].get('found_keywords', [])
                return f"Response contains forbidden keywords: {', '.join(found)}"

        return "Response keyword check failed"


class ToolAbsenceCheck(BaseCheck):
    """Check that a tool was NOT called."""

    def evaluate(self, messages: List[Dict[str, Any]], memory_metadata: Dict[str, Any]) -> CheckResult:
        tool_name = self.config.get('tool_name')

        # Find any calls to this tool
        tool_calls = []
        for idx, message in enumerate(messages):
            if message.get('role') == 'assistant':
                content = message.get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if block.get('type') == 'tool_use' and block.get('name') == tool_name:
                            tool_calls.append({
                                'message_index': idx,
                                'tool_id': block.get('id')
                            })

        passed = len(tool_calls) == 0
        details = {
            'tool_name': tool_name,
            'forbidden_calls': tool_calls
        }

        message = self.generate_violation_message(details) if not passed else f"Tool '{tool_name}' was not called (as required)"

        return CheckResult(
            passed=passed,
            check_id=self.check_id,
            check_name=self.name,
            check_type='tool_absence',
            message=message,
            details=details,
            matched_items=tool_calls
        )

    def _auto_generate_message(self, details: Dict[str, Any]) -> str:
        tool_name = details['tool_name']
        count = len(details.get('forbidden_calls', []))
        return f"Forbidden tool '{tool_name}' was called {count} time(s)"


# Registry of all check types
CHECK_REGISTRY = {
    'tool_call': ToolCallCheck,
    'tool_response': ToolResponseCheck,
    'llm_tool_response': LLMToolResponseCheck,
    'response_length': ResponseLengthCheck,
    'tool_call_count': ToolCallCountCheck,
    'llm_response_validation': LLMResponseValidationCheck,
    'response_contains': ResponseContainsCheck,
    'tool_absence': ToolAbsenceCheck,
}
