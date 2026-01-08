"""
Agent and session generation service using LLM.

This service provides LLM-powered generation of:
1. Agent configurations (use case, tools, business identifiers)
2. Realistic session data with multi-turn conversations and tool use
"""
import json
import os
from typing import Dict, Any, List, Optional
from anthropic import Anthropic
from openai import OpenAI


class AgentGenerator:
    """Generate agent configurations and simulated sessions using LLM."""

    def __init__(self, llm_provider: str = "openai", model: str = "gpt-4o"):
        """
        Initialize the agent generator.

        Args:
            llm_provider: "anthropic" or "openai"
            model: Model identifier (e.g., "claude-sonnet-4-5-20250929", "gpt-4o")
        """
        self.llm_provider = llm_provider
        self.model = model

    def generate_agent_config(
        self,
        agent_name: str,
        description: str,
        tools_input: Optional[str] = None,
        business_identifiers_desc: Optional[str] = None,
        ensure_tools: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Use LLM to generate agent configuration from natural language description.

        Args:
            agent_name: Human-readable name for the agent
            description: Natural language description of agent's workflow/use case
            tools_input: Either None (auto-generate) or comma-separated tool names
            business_identifiers_desc: Natural language description of business IDs needed
            ensure_tools: List of tool names that must be included

        Returns:
            Dict with keys: use_case (str), tools (List[Dict]), business_identifiers (Dict)

        Raises:
            Exception: If LLM call fails or response is invalid
        """

        ensure_tools_text = ""
        if ensure_tools:
            ensure_tools_text = f"\nREQUIRED TOOLS: {', '.join(ensure_tools)}\nThese tools MUST be included in your tool list."

        prompt = f"""You are an AI agent architect. Generate a structured configuration for an AI agent based on this description:

AGENT NAME: {agent_name}

DESCRIPTION:
{description}

TOOLS INPUT: {tools_input or "Auto-generate appropriate tools based on the use case"}

BUSINESS IDENTIFIERS: {business_identifiers_desc or "Auto-generate based on use case"}
{ensure_tools_text}

Generate a JSON configuration with:
1. "use_case": A clear, structured description of what this agent does (2-3 sentences)
2. "tools": A list of 5-12 tool objects, each with:
   - "name": snake_case tool name (e.g., "get_customer_account", "check_inventory", "send_notification")
   - "description": Brief description of what the tool does, including inputs/outputs
   - "inputs": JSON-style schema describing expected fields and example values
   - "outputs": JSON-style schema describing returned fields and example values (include any evaluation prompts/criteria for LLM-backed tools)
   - If a step requires natural language judgment or summarization, add an LLM-backed tool (e.g., "..._validation") and include the evaluation prompt/criteria in description/outputs.
   - If a step needs deterministic checks (e.g., a status field must equal "success"), add a tool that performs that check and describe the condition in description/outputs.
   - If tools were specified in TOOLS INPUT, use those names
   - If REQUIRED TOOLS are specified, ensure they are included
   - Make tool names realistic and domain-appropriate for the use case
3. "business_identifiers": An object mapping field names to descriptions (e.g., {{"customer_id": "Unique customer identifier", "order_id": "Order reference number"}})
   - Include 3-6 identifier fields relevant to the use case

Output ONLY valid JSON in this exact format:
{{
  "use_case": "...",
  "tools": [{{"name": "tool_name", "description": "...", "inputs": {{"field": "description or example"}}, "outputs": {{"field": "description or example"}}}}, ...],
  "business_identifiers": {{"field": "description", ...}}
}}

Do not include markdown code blocks or any text outside the JSON. Output raw JSON only."""

        response_text = self._call_llm(prompt, max_tokens=2000)

        # Parse JSON response
        try:
            # Clean markdown if present
            response_text = self._strip_markdown(response_text)

            config = json.loads(response_text)

            # Validate structure
            if not all(k in config for k in ["use_case", "tools", "business_identifiers"]):
                raise ValueError("Missing required fields in LLM response (expected: use_case, tools, business_identifiers)")

            if not isinstance(config["tools"], list) or len(config["tools"]) < 3:
                raise ValueError(f"Invalid tools list - expected at least 3 tools, got {len(config.get('tools', []))}")

            if not isinstance(config["business_identifiers"], dict) or len(config["business_identifiers"]) < 2:
                raise ValueError("Invalid business_identifiers - expected at least 2 fields")

            # Validate each tool has name/description and input/output hints
            for i, tool in enumerate(config["tools"]):
                if not isinstance(tool, dict) or "name" not in tool or "description" not in tool:
                    raise ValueError(f"Tool {i} missing 'name' or 'description' fields")
                if "inputs" not in tool or not isinstance(tool["inputs"], dict):
                    raise ValueError(f"Tool {i} missing 'inputs' schema")
                if "outputs" not in tool or not isinstance(tool["outputs"], dict):
                    raise ValueError(f"Tool {i} missing 'outputs' schema")

            return config

        except (json.JSONDecodeError, ValueError) as e:
            raise Exception(f"Failed to parse LLM response: {str(e)}\nResponse: {response_text[:500]}")

    def generate_policy_suggestions(
        self,
        agent_metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate suggested compliance policies for an agent based on its configuration.

        Args:
            agent_metadata: Agent metadata dict with agent_name, use_case, tools, business_identifiers

        Returns:
            List of policy dicts with policy_name, policy_type, config, severity

        Raises:
            Exception: If LLM call fails or response is invalid
        """
        tools_desc = "\n".join([f"- {t['name']}: {t['description']}" for t in agent_metadata["tools"]])
        biz_ids = agent_metadata["business_identifiers"]

        prompt = f"""You are a compliance policy architect. Generate 3-5 relevant compliance policies for this AI agent.

AGENT: {agent_metadata["agent_name"]}
USE CASE: {agent_metadata["use_case"]}

AVAILABLE TOOLS:
{tools_desc}

BUSINESS IDENTIFIERS:
{json.dumps(biz_ids, indent=2)}

Generate compliance policies that are appropriate for this agent's workflow. Consider:
1. Tool usage patterns that require approval or validation
2. Data privacy and PII concerns
3. Response quality and safety
4. Business logic constraints (include required outputs/fields)
5. Error handling and edge cases

Create 3-5 policies covering different aspects. policy_type is always "composite". The config MUST have this exact structure:
{{
  "checks": [
    {{"id": "check_1", "type": "tool_call", "name": "Check Description", "tool_name": "...", ...}},
    {{"id": "check_2", "type": "tool_response", "name": "Check Description", "tool_name": "...", ...}}
  ],
  "violation_logic": {{
    "type": "IF_ANY_THEN_ALL" | "IF_ALL_THEN_ALL" | "REQUIRE_ALL" | "REQUIRE_ANY" | "FORBID_ALL",
    "triggers": ["check_1"],  // For IF_ANY/IF_ALL logic types
    "requirements": ["check_2"]  // For IF_ANY/IF_ALL logic types
  }}
}}

Check types available (aligned with the UI):
- tool_call: {{"id": "check_1", "type": "tool_call", "name": "...", "tool_name": "...", "params_filter": {{...}}}}
- tool_response: {{"id": "check_2", "type": "tool_response", "name": "...", "tool_name": "...", "response_filter": {{...}}}}
- llm_tool_response (AI Validated Tool Response): {{"id": "check_3", "type": "llm_tool_response", "name": "...", "tool_name": "...", "parameter": "...", "validation_prompt": "...", "llm_provider": "openai", "model": "gpt-4o"}}
- response_length: {{"id": "check_4", "type": "response_length", "name": "...", "min_tokens": N, "max_tokens": N}}
- tool_call_count: {{"id": "check_5", "type": "tool_call_count", "name": "...", "tool_name": "...", "min_count": N, "max_count": N}}
- response_contains (Agent Response): {{"id": "check_6", "type": "response_contains", "name": "...", "must_contain": "...", "must_not_contain": "..."}}
- llm_response_validation (AI Validated Agent Response): {{"id": "check_7", "type": "llm_response_validation", "name": "...", "validation_prompt": "...", "llm_provider": "openai", "model": "gpt-4o"}}
- tool_absence: {{"id": "check_8", "type": "tool_absence", "name": "...", "tool_name": "..."}}

Guidance:
- Every policy must include a non-empty description (2 sentences) explaining what it enforces.
- Use the provided tool inputs/outputs to define concrete response filters (e.g., require output.status == "success" AND required fields are non-empty).
- Ensure each check has a meaningful name and, when applicable, a validation_prompt or response_filter tied to tool outputs.
- Use llm_tool_response when a tool output needs natural-language validation; include a clear validation_prompt referencing the tool output fields.
- Use response_length/response_contains/llm_response_validation for the final agent reply when needed.
- Each policy should have clear triggers and requirements so violation_logic is meaningful and evaluable.

Output ONLY this JSON array (no markdown, no code blocks):
[
  {{
    "policy_name": "Descriptive Policy Name",
    "policy_type": "composite",
    "config": {{
      "checks": [...],
      "violation_logic": {{"type": "...", "triggers": [...], "requirements": [...]}}
    }},
    "severity": "high" | "medium" | "low",
    "enabled": true
  }},
  ...
]

Use different violation_logic types to achieve different behaviors (IF_ANY_THEN_ALL, IF_ALL_THEN_ALL, REQUIRE_ALL, REQUIRE_ANY, FORBID_ALL).

Make policies realistic and relevant to the agent's use case. Use proper JSON syntax. Output raw JSON only."""

        response_text = self._call_llm(prompt, max_tokens=3000)

        # Parse and validate
        try:
            response_text = self._strip_markdown(response_text)
            policies = json.loads(response_text)

            if not isinstance(policies, list) or len(policies) < 3:
                raise ValueError(f"Expected at least 3 policies, got {len(policies) if isinstance(policies, list) else 0}")

            # Validate each policy has required fields
            for i, policy in enumerate(policies):
                if not isinstance(policy, dict):
                    raise ValueError(f"Policy {i} is not a dict")

                required_fields = ["policy_name", "policy_type", "config", "severity"]
                missing = [f for f in required_fields if f not in policy]
                if missing:
                    raise ValueError(f"Policy {i} missing fields: {missing}")

                # Validate policy_type - must be composite
                if policy["policy_type"] != "composite":
                    raise ValueError(f"Policy {i} has invalid type '{policy['policy_type']}'. All policies must be type 'composite'.")

                # Validate composite structure
                config = policy.get("config", {})
                if "checks" not in config or "violation_logic" not in config:
                    raise ValueError(f"Policy {i} missing required config fields 'checks' or 'violation_logic'")

            return policies

        except (json.JSONDecodeError, ValueError) as e:
            raise Exception(f"Failed to parse policy suggestions: {str(e)}\nResponse: {response_text[:500]}")

    def generate_session(
        self,
        agent_metadata: Dict[str, Any],
        session_number: int,
        scenario_hint: Optional[str] = None,
        session_time_definition: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a single simulated session with realistic conversation flow.

        Args:
            agent_metadata: Agent metadata dict with use_case, tools, business_identifiers
            session_number: Session number (used for ID and varied timestamp)
            scenario_hint: Optional scenario description to focus the session
            session_time_definition: Optional human-readable constraints for when the session occurs (e.g., "randomly between Monday and Friday, 08:00-17:00 UTC")

        Returns:
            Session dict with metadata and messages array in Claude conversation format

        Raises:
            Exception: If LLM call fails or response is invalid
        """

        tools_desc = "\n".join([f"- {t['name']}: {t['description']}" for t in agent_metadata["tools"]])
        biz_ids = agent_metadata["business_identifiers"]

        scenario_text = f"\nSCENARIO FOCUS: {scenario_hint}\nMake this session demonstrate this specific scenario." if scenario_hint else ""

        # Calculate varied timestamp components
        day = (session_number % 28) + 1
        hour = 8 + (session_number % 12)

        time_guidance = "\nSESSION TIME CONSTRAINTS:\n"
        if session_time_definition:
            time_guidance += f"- Generate a timestamp within these constraints: {session_time_definition}\n"
            time_guidance += "- Vary day/time within the allowed window across sessions\n"
        else:
            # Fall back to deterministic-but-varied schedule
            time_guidance += f"- Default to a realistic weekday timestamp: 2026-01-{day:02d}T{hour:02d}:00:00Z (UTC)\n"
            time_guidance += "- Keep within typical business hours (08:00-19:00 UTC) when possible\n"

        prompt = f"""You are simulating a realistic AI agent conversation. Generate a complete session JSON.

AGENT: {agent_metadata["agent_name"]}
USE CASE: {agent_metadata["use_case"]}

AVAILABLE TOOLS:
{tools_desc}

BUSINESS IDENTIFIERS TO POPULATE:
{json.dumps(biz_ids, indent=2)}
{scenario_text}
{time_guidance}

Generate a realistic conversation session with:
1. A user request that fits the agent's use case
2. 3-6 assistant responses with tool_use blocks
3. Tool results that are realistic (mix of success, errors, edge cases if appropriate)
4. Final assistant summary message

Use Claude's conversation format:
- role: "user" | "assistant" | "tool"
- user messages: {{"role": "user", "content": "the user's request text"}}
- assistant messages with tools: {{"role": "assistant", "content": [{{"type": "text", "text": "..."}}, {{"type": "tool_use", "id": "toolu_XYZ", "name": "tool_name", "input": {{...}}}}]}}
- tool result messages: {{"role": "tool", "content": [{{"type": "tool_result", "tool_use_id": "toolu_XYZ", "content": "JSON string or text result"}}]}}
- final assistant message: {{"role": "assistant", "content": "summary text"}}

IMPORTANT:
- Vary the scenario - include edge cases, errors, partial data, etc. based on the scenario focus
- Make tool inputs realistic and appropriate
- Tool results should be realistic (JSON strings for data, text for errors)
- Use realistic values for business identifiers
- Each tool_use needs a unique ID like "toolu_01ABC123"

Output ONLY this JSON structure (no markdown, no code blocks):
{{
  "metadata": {{
    "session_id": "session_{session_number:05d}",
    "timestamp": "<ISO 8601 UTC timestamp that satisfies the session time constraints (e.g., 2026-01-{day:02d}T{hour:02d}:00:00Z)>",
    "duration_seconds": <realistic float between 10 and 120>,
    "business_identifiers": {{<populate with realistic values based on the biz_ids schema>}}
  }},
  "messages": [<array of conversation messages following the format above>]
}}

Do not include markdown. Output raw JSON only."""

        response_text = self._call_llm(prompt, max_tokens=4000)

        # Parse and validate
        try:
            response_text = self._strip_markdown(response_text)

            session = json.loads(response_text)

            # Validate structure
            if "metadata" not in session or "messages" not in session:
                raise ValueError("Missing metadata or messages in session JSON")

            if not isinstance(session["messages"], list) or len(session["messages"]) < 3:
                raise ValueError(f"Invalid messages array - expected at least 3 messages, got {len(session.get('messages', []))}")

            # Validate metadata has required fields
            metadata = session["metadata"]
            if not all(k in metadata for k in ["session_id", "timestamp", "business_identifiers"]):
                raise ValueError("Metadata missing required fields (session_id, timestamp, business_identifiers)")

            return session

        except (json.JSONDecodeError, ValueError) as e:
            raise Exception(f"Failed to parse session JSON: {str(e)}\nResponse: {response_text[:500]}")

    def _call_llm(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Call LLM API.

        Args:
            prompt: The prompt to send
            max_tokens: Maximum tokens to generate

        Returns:
            Response text from LLM

        Raises:
            Exception: If API key is missing or API call fails
        """
        if self.llm_provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise Exception("ANTHROPIC_API_KEY not configured in environment")

            client = Anthropic(api_key=api_key)
            response = client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text

        elif self.llm_provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise Exception("OPENAI_API_KEY not configured in environment")

            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        else:
            raise Exception(f"Unsupported LLM provider: {self.llm_provider}")

    def _strip_markdown(self, text: str) -> str:
        """
        Strip markdown code blocks from response text.

        Args:
            text: Raw response text that may contain markdown

        Returns:
            Clean text with markdown removed
        """
        text = text.strip()

        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines if they're markdown markers
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)

        # Remove json language specifier if present
        text = text.replace("```json", "").replace("```", "").strip()

        return text
