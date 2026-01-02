#!/usr/bin/env python3
"""
Convert sample memory files from Anthropic message format to OpenAI format.
- Changes role: "user" with tool_result content to role: "tool"
- Preserves all other message structure
"""

import json
import os
from pathlib import Path


def convert_message_to_openai(message):
    """Convert a single message from Anthropic to OpenAI format."""
    # If it's not a user message, return as-is
    if message.get("role") != "user":
        return message

    content = message.get("content")

    # If content is a string, it's a real user message - keep as-is
    if isinstance(content, str):
        return message

    # If content is a list, check if it contains tool_result
    if isinstance(content, list):
        # Check if all items are tool_result type
        all_tool_results = all(
            isinstance(item, dict) and item.get("type") == "tool_result"
            for item in content
        )

        if all_tool_results:
            # Convert to OpenAI format: role: "tool" with individual messages
            # For simplicity with existing code, we'll convert to a single tool message
            # with all tool_results in content array

            # If there's only one tool_result, make it simple
            if len(content) == 1:
                tool_result = content[0]
                return {
                    "role": "tool",
                    "tool_call_id": tool_result.get("tool_use_id"),
                    "content": tool_result.get("content")
                }
            else:
                # Multiple tool results - keep as list but change role
                # This maintains compatibility with the current parsing code
                return {
                    "role": "tool",
                    "content": content
                }

    # Default: return unchanged
    return message


def convert_memory_file(input_path, output_path=None):
    """Convert a memory file from Anthropic to OpenAI format."""
    if output_path is None:
        output_path = input_path

    with open(input_path, 'r') as f:
        memory = json.load(f)

    # Convert each message
    if "messages" in memory:
        memory["messages"] = [
            convert_message_to_openai(msg)
            for msg in memory["messages"]
        ]

    # Write back
    with open(output_path, 'w') as f:
        json.dump(memory, f, indent=2)

    print(f"✓ Converted: {input_path}")


def main():
    """Convert all sample memory files."""
    sample_dir = Path(__file__).parent / "sample_memories"

    if not sample_dir.exists():
        print(f"Error: {sample_dir} not found")
        return

    json_files = list(sample_dir.glob("*.json"))

    if not json_files:
        print(f"No JSON files found in {sample_dir}")
        return

    print(f"Converting {len(json_files)} memory files to OpenAI format...\n")

    for json_file in json_files:
        convert_memory_file(json_file)

    print(f"\n✓ Successfully converted {len(json_files)} files!")
    print("\nNote: Files now use role: 'tool' for tool responses (OpenAI standard)")


if __name__ == "__main__":
    main()
