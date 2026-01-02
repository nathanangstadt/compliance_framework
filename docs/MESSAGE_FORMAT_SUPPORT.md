# Multi-Vendor Message Format Support

This compliance framework supports agent memory messages in multiple LLM vendor formats, making it vendor-agnostic for auditing various AI systems.

## Supported Message Formats

### OpenAI Format (Default)

The framework now uses OpenAI's message format as the default standard:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Process this order"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "I'll process the order"
        },
        {
          "type": "tool_use",
          "id": "call_abc123",
          "name": "create_invoice",
          "input": {"amount": 1500}
        }
      ]
    },
    {
      "role": "tool",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "call_abc123",
          "content": "{\"invoice_id\": \"INV-001\"}"
        }
      ]
    }
  ]
}
```

**Key characteristics:**
- Tool responses use `role: "tool"`
- Can contain single tool result or array of tool results
- Tool results reference the original tool call via `tool_use_id`

### Anthropic Format (Also Supported)

The framework also supports Anthropic's Claude message format:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Process this order"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "I'll process the order"
        },
        {
          "type": "tool_use",
          "id": "toolu_abc123",
          "name": "create_invoice",
          "input": {"amount": 1500}
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_abc123",
          "content": "{\"invoice_id\": \"INV-001\"}"
        }
      ]
    }
  ]
}
```

**Key characteristics:**
- Tool responses use `role: "user"` with `type: "tool_result"`
- Actual user messages also use `role: "user"` but with text content
- Tool results reference the original tool call via `tool_use_id`

## Implementation Details

The framework automatically detects and handles both formats in the following components:

### Check Types (`check_types.py`)

Both `ToolResponseCheck` and `LLMToolResponseCheck` classes have updated `_find_tool_results()` methods that:

1. **Detect message role**: Check if `role` is `"user"` (Anthropic) or `"tool"` (OpenAI)
2. **Parse content structure**: Handle both list-based and string-based content
3. **Extract tool results**: Map tool responses back to their originating tool calls
4. **Normalize data**: Convert both formats into a common internal representation

### Sample Memories

All sample memory files in `sample_memories/` now use the OpenAI format with `role: "tool"` for clarity and alignment with the widely-adopted OpenAI standard.

### Migration Script

The `convert_to_openai_format.py` script can convert existing Anthropic-format memories to OpenAI format:

```bash
python3 convert_to_openai_format.py
```

This script:
- Identifies messages with `role: "user"` containing only `tool_result` content
- Converts them to `role: "tool"` format
- Preserves all other message structure unchanged

## Why Both Formats?

Supporting multiple formats makes this compliance framework:

1. **Vendor-agnostic**: Audit agent memories from any LLM provider
2. **Future-proof**: Easy to add support for new formats as standards evolve
3. **Flexible**: Organizations can use their existing message format without conversion
4. **Interoperable**: Works with agent frameworks using different LLM providers

## Testing

All policy checks are tested with the OpenAI format. The test suite in `test_composite_policy.py` validates:

- IF_ANY_THEN_ALL logic with tool response validation
- REQUIRE_ALL with multiple tool checks
- Tool absence checks
- Tool call count limits
- LLM-based validation of tool response parameters

All tests pass with the OpenAI `role: "tool"` format.

## Best Practices

### For New Implementations

Use the **OpenAI format** with `role: "tool"` for tool responses:
- More widely adopted standard
- Clearer separation between user messages and tool responses
- Better alignment with emerging industry standards

### For Existing Systems

Keep your current format - the framework supports both automatically. No migration required unless you want to standardize on OpenAI format for clarity.

### For Framework Extensions

When adding new check types that parse tool responses:
1. Use the `_find_tool_results()` pattern from existing checks
2. Check for both `role: "user"` and `role: "tool"`
3. Handle both list and string content structures
4. Test with both formats if possible

## Future Format Support

To add support for additional LLM vendor formats:

1. Identify the vendor's message structure for tool calls and responses
2. Update `_find_tool_results()` methods in relevant check classes
3. Add detection logic for the new format's role/type identifiers
4. Normalize to the common internal representation
5. Add test cases with the new format

The framework's architecture makes it straightforward to add new format support without breaking existing functionality.
