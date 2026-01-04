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

    def __init__(self, llm_provider: str = "anthropic", model: str = "claude-sonnet-4-5-20250929"):
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
   - "description": Brief description of what the tool does
   - If tools were specified in TOOLS INPUT, use those names
   - If REQUIRED TOOLS are specified, ensure they are included
   - Make tool names realistic and domain-appropriate for the use case
3. "business_identifiers": An object mapping field names to descriptions (e.g., {{"customer_id": "Unique customer identifier", "order_id": "Order reference number"}})
   - Include 3-6 identifier fields relevant to the use case

Output ONLY valid JSON in this exact format:
{{
  "use_case": "...",
  "tools": [{{"name": "tool_name", "description": "..."}}, ...],
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

            # Validate each tool has name and description
            for i, tool in enumerate(config["tools"]):
                if not isinstance(tool, dict) or "name" not in tool or "description" not in tool:
                    raise ValueError(f"Tool {i} missing 'name' or 'description' fields")

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
4. Business logic constraints
5. Error handling and edge cases

Create 3-5 policies covering different aspects. ALL policies MUST be type "composite".

The policy_type MUST always be "composite". The config MUST have this exact structure:
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

Check types available:
- tool_call: {{"id": "check_1", "type": "tool_call", "name": "...", "tool_name": "...", "params_filter": {{...}}}}
- tool_response: {{"id": "check_2", "type": "tool_response", "name": "...", "tool_name": "...", "response_filter": {{...}}}}
- response_contains: {{"id": "check_3", "type": "response_contains", "name": "...", "pattern": "...", "message_filter": {{...}}}}
- tool_call_count: {{"id": "check_4", "type": "tool_call_count", "name": "...", "tool_name": "...", "min": N, "max": N}}
- response_length: {{"id": "check_5", "type": "response_length", "name": "...", "max_tokens": N}}
- tool_absence: {{"id": "check_6", "type": "tool_absence", "name": "...", "tool_name": "..."}}
- llm_check: {{"id": "check_7", "type": "llm_check", "name": "...", "evaluation_prompt": "...", "message_filter": {{}}, "llm_provider": "anthropic", "model": "claude-sonnet-4-5-20250929"}}

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

IMPORTANT: policy_type MUST always be "composite". Use different violation_logic types to achieve different behaviors.

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
        scenario_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a single simulated session with realistic conversation flow.

        Args:
            agent_metadata: Agent metadata dict with use_case, tools, business_identifiers
            session_number: Session number (used for ID and varied timestamp)
            scenario_hint: Optional scenario description to focus the session

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

        prompt = f"""You are simulating a realistic AI agent conversation. Generate a complete session JSON.

AGENT: {agent_metadata["agent_name"]}
USE CASE: {agent_metadata["use_case"]}

AVAILABLE TOOLS:
{tools_desc}

BUSINESS IDENTIFIERS TO POPULATE:
{json.dumps(biz_ids, indent=2)}
{scenario_text}

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
    "timestamp": "2026-01-{day:02d}T{hour:02d}:00:00Z",
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
