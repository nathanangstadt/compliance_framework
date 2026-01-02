"""
Pattern extraction service for Agent Variants feature.
Extracts, normalizes, and identifies unique tool usage patterns from agent memories.
"""
import hashlib
import json
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, field
from collections import defaultdict


@dataclass
class ToolStep:
    """Represents a single tool call in the sequence."""
    tool_name: str
    message_index: int
    is_parallel: bool = False
    parallel_group_id: Optional[str] = None


@dataclass
class PatternSignature:
    """Represents a normalized pattern signature."""
    hash: str
    normalized_sequence: List[str]
    display_string: str
    raw_sequence: List[str]
    tool_count: int


class PatternExtractor:
    """Extracts and normalizes tool usage patterns from agent memories."""

    def extract_tool_sequence(self, messages: List[Dict[str, Any]]) -> Tuple[List[str], List[ToolStep]]:
        """
        Extract ordered tool sequence from messages.

        For parallel tools (multiple tool_use blocks in same assistant message),
        they are treated as sequential steps sorted alphabetically, but parallelism
        metadata is preserved for future diagramming.

        Returns:
            Tuple of (raw_sequence as list of tool names, detailed steps with metadata)
        """
        raw_sequence = []
        detailed_steps = []
        parallel_group_counter = 0

        for idx, message in enumerate(messages):
            if message.get('role') != 'assistant':
                continue

            content = message.get('content', [])
            if not isinstance(content, list):
                continue

            # Collect all tool_use blocks in this message
            tools_in_message = []
            for block in content:
                if block.get('type') == 'tool_use':
                    tool_name = block.get('name', 'unknown')
                    tools_in_message.append(tool_name)

            if not tools_in_message:
                continue

            # Sort for consistent ordering (parallel tools sorted alphabetically)
            tools_in_message.sort()

            # Determine if parallel (more than one tool in same message)
            is_parallel = len(tools_in_message) > 1
            parallel_group_id = None
            if is_parallel:
                parallel_group_id = f"pg_{parallel_group_counter}"
                parallel_group_counter += 1

            # Add each tool to sequence
            for tool_name in tools_in_message:
                raw_sequence.append(tool_name)
                detailed_steps.append(ToolStep(
                    tool_name=tool_name,
                    message_index=idx,
                    is_parallel=is_parallel,
                    parallel_group_id=parallel_group_id
                ))

        return raw_sequence, detailed_steps

    def normalize_sequence(self, sequence: List[str]) -> List[str]:
        """
        Normalize sequence by removing cycles/loops.

        Example: [A, B, C, B, C, B, C, D] -> [A, B, C, D]

        Algorithm: Detect repeated subsequences and keep only the first occurrence.
        """
        if len(sequence) < 2:
            return sequence.copy()

        result = []
        i = 0

        while i < len(sequence):
            # Try to find cycles starting at position i
            found_cycle = False

            # Check for cycle lengths from 1 to half remaining length
            for cycle_len in range(1, (len(sequence) - i) // 2 + 1):
                cycle = sequence[i:i + cycle_len]

                # Count consecutive repetitions of this cycle
                j = i + cycle_len
                repetitions = 1

                while j + cycle_len <= len(sequence):
                    if sequence[j:j + cycle_len] == cycle:
                        j += cycle_len
                        repetitions += 1
                    else:
                        break

                # If we found at least one repetition, this is a cycle
                if repetitions > 1:
                    # Add cycle elements once (skip repetitions)
                    result.extend(cycle)
                    i = j
                    found_cycle = True
                    break

            if not found_cycle:
                result.append(sequence[i])
                i += 1

        return result

    def generate_signature(self, normalized_sequence: List[str]) -> PatternSignature:
        """
        Generate unique signature for a pattern.

        Returns PatternSignature with hash, display string, and metadata.
        """
        # Create deterministic hash
        sequence_json = json.dumps(normalized_sequence, sort_keys=True)
        hash_value = hashlib.sha256(sequence_json.encode()).hexdigest()

        # Create human-readable display string
        display_string = " → ".join(normalized_sequence) if normalized_sequence else "(empty)"

        # Count unique tools
        tool_count = len(set(normalized_sequence))

        return PatternSignature(
            hash=hash_value,
            normalized_sequence=normalized_sequence,
            display_string=display_string,
            raw_sequence=normalized_sequence,  # Same as normalized for this return
            tool_count=tool_count
        )

    def generate_pattern_name(self, normalized_sequence: List[str]) -> str:
        """
        Auto-generate a descriptive name for the pattern based on key tools.

        Uses simple rule-based approach to identify workflow characteristics.
        """
        if not normalized_sequence:
            return "Empty pattern"

        tools_set = set(normalized_sequence)
        parts = []

        # Check for approval workflow
        if 'request_human_approval' in tools_set:
            parts.append("Approval-required")
        else:
            parts.append("Standard")

        # Check for invoice operations
        invoice_count = normalized_sequence.count('create_invoice')
        if invoice_count > 1:
            parts.append("batch")
        elif invoice_count == 1:
            parts.append("single-order")

        # Check for completion indicators
        has_email = 'send_invoice_email' in tools_set
        has_balance = 'update_customer_balance' in tools_set
        has_invoice = 'create_invoice' in tools_set

        if has_email and has_balance:
            parts.append("fulfillment")
        elif has_invoice:
            parts.append("invoice processing")
        elif 'check_inventory' in tools_set:
            parts.append("inventory check")
        else:
            # Fallback: use first tool as descriptor
            first_tool = normalized_sequence[0].replace('_', ' ')
            parts.append(first_tool)

        return " ".join(parts)

    def compute_transitions(self, raw_sequences: List[List[str]]) -> Dict[Tuple[str, str], int]:
        """
        Compute transition counts between tools across all sequences.

        Args:
            raw_sequences: List of raw (non-normalized) tool sequences

        Returns:
            Dictionary mapping (from_tool, to_tool) to count
        """
        transitions = defaultdict(int)

        for sequence in raw_sequences:
            if not sequence:
                continue

            # Add start transition
            transitions[("_start", sequence[0])] += 1

            # Add internal transitions
            for i in range(len(sequence) - 1):
                transitions[(sequence[i], sequence[i + 1])] += 1

            # Add end transition
            transitions[(sequence[-1], "_end")] += 1

        return dict(transitions)

    def extract_pattern_from_memory(self, memory: Dict[str, Any]) -> PatternSignature:
        """
        Convenience method to extract and normalize pattern from a memory object.

        Args:
            memory: Memory dict with 'messages' key

        Returns:
            PatternSignature for the memory
        """
        messages = memory.get('messages', [])
        raw_sequence, _ = self.extract_tool_sequence(messages)
        normalized = self.normalize_sequence(raw_sequence)
        return self.generate_signature(normalized)


# Singleton instance for convenience
pattern_extractor = PatternExtractor()
