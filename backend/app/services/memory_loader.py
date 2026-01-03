"""
File-based memory loader service.

Loads agent memories (sessions) directly from JSON files in the filesystem
instead of requiring database uploads.

Supports multi-agent structure with subdirectories under agent_data/:
- agent_data/order_to_invoice/*.json
- agent_data/hr_onboarding/*.json

Supports optional metadata block in JSON files:
{
    "metadata": {
        "session_id": "unique-id",
        "timestamp": "2025-01-15T10:30:00Z",
        "duration_seconds": 120.5,
        "user_id": "user123",
        "business_identifiers": {"order_id": "ORD-456"},
        "tags": ["production", "customer-support"],
        "custom": {}
    },
    "messages": [...]
}
"""
import os
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime


class MemoryLoader:
    """Loads agent memories (sessions) from the filesystem."""

    def __init__(self, base_dir: str = "/agent_data"):
        """
        Initialize the memory loader.

        Args:
            base_dir: Base directory containing agent subdirectories
        """
        self.base_dir = Path(base_dir)
        if not self.base_dir.exists():
            # Fallback to local path for development
            self.base_dir = Path(__file__).parent.parent.parent.parent / "agent_data"

        print(f"MemoryLoader initialized with base path: {self.base_dir}")
        print(f"Path exists: {self.base_dir.exists()}")

    def _format_agent_name(self, agent_id: str) -> str:
        """
        Format agent_id into human-readable name.

        Examples:
            "order_to_invoice" -> "Order To Invoice"
            "hr_onboarding" -> "HR Onboarding"
        """
        return " ".join(word.capitalize() for word in agent_id.split("_"))

    def list_agents(self) -> List[Dict[str, Any]]:
        """
        List all available agents based on subdirectories in base_dir.

        Returns:
            List of agent dicts with id, name, session_count
        """
        agents = []

        if not self.base_dir.exists():
            print(f"Base directory does not exist: {self.base_dir}")
            return agents

        for agent_dir in sorted(self.base_dir.iterdir()):
            if agent_dir.is_dir():
                agent_id = agent_dir.name
                sessions = list(agent_dir.glob("*.json"))

                agents.append({
                    "id": agent_id,
                    "name": self._format_agent_name(agent_id),
                    "session_count": len(sessions),
                    "path": str(agent_dir)
                })

        return agents

    def _parse_metadata(self, data: Dict[str, Any], memory_id: str) -> Optional[Dict[str, Any]]:
        """
        Parse metadata block from session JSON.

        Args:
            data: The loaded JSON data
            memory_id: Fallback session ID if not in metadata

        Returns:
            Parsed metadata dict or None if no metadata block
        """
        if not isinstance(data, dict) or "metadata" not in data:
            return None

        raw = data.get("metadata", {})
        if not raw:
            return None

        metadata = {}

        # Parse session_id (fallback to memory_id)
        metadata["session_id"] = raw.get("session_id", memory_id)

        # Parse timestamp
        ts = raw.get("timestamp")
        if ts:
            try:
                if isinstance(ts, str):
                    # Try ISO format
                    metadata["timestamp"] = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                elif isinstance(ts, (int, float)):
                    metadata["timestamp"] = datetime.fromtimestamp(ts)
            except (ValueError, OSError):
                pass

        # Parse duration
        duration = raw.get("duration_seconds")
        if duration is not None:
            try:
                metadata["duration_seconds"] = float(duration)
            except (ValueError, TypeError):
                pass

        # Copy string fields
        if raw.get("user_id"):
            metadata["user_id"] = str(raw["user_id"])

        # Copy dict/list fields
        if raw.get("business_identifiers") and isinstance(raw["business_identifiers"], dict):
            metadata["business_identifiers"] = raw["business_identifiers"]

        if raw.get("tags") and isinstance(raw["tags"], list):
            metadata["tags"] = raw["tags"]

        if raw.get("custom") and isinstance(raw["custom"], dict):
            metadata["custom"] = raw["custom"]

        return metadata if metadata else None

    def list_memories(self, agent_id: str = None) -> List[Dict[str, Any]]:
        """
        List all available memory files for a specific agent.

        Args:
            agent_id: The agent identifier (subdirectory name). If None, returns empty list for backward compatibility.

        Returns:
            List of memory metadata dicts with id, name, file_path, metadata, etc.
        """
        memories = []

        # Backward compatibility: if no agent_id, return empty list
        if agent_id is None:
            print("Warning: list_memories called without agent_id. Multi-agent support requires agent_id parameter.")
            return memories

        agent_dir = self.base_dir / agent_id

        if not agent_dir.exists():
            print(f"Agent directory does not exist: {agent_dir}")
            return memories

        for file_path in sorted(agent_dir.glob("*.json")):
            try:
                # Use filename (without extension) as the ID
                memory_id = file_path.stem
                stat = file_path.stat()

                # Read file to get messages and metadata
                with open(file_path, 'r') as f:
                    data = json.load(f)

                # Handle both formats: {"messages": [...]} or just [...]
                if isinstance(data, dict):
                    messages = data.get("messages", [])
                    metadata = self._parse_metadata(data, memory_id)
                else:
                    messages = data
                    metadata = None

                memories.append({
                    "id": memory_id,
                    "name": file_path.name,
                    "file_path": str(file_path),
                    "uploaded_at": stat.st_mtime,
                    "messages": messages,
                    "message_count": len(messages),
                    "metadata": metadata
                })
            except Exception as e:
                print(f"Error loading memory {file_path}: {e}")
                continue

        return memories

    def get_memory(self, agent_id: str = None, memory_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Get a specific memory by agent and ID.

        Args:
            agent_id: The agent identifier. If None, returns None for backward compatibility.
            memory_id: The memory ID (filename stem)

        Returns:
            Memory dict or None if not found
        """
        # Backward compatibility: if no agent_id, return None
        if agent_id is None or memory_id is None:
            print("Warning: get_memory called without agent_id or memory_id. Multi-agent support requires both parameters.")
            return None

        # Try to find file with this stem
        agent_dir = self.base_dir / agent_id
        file_path = agent_dir / f"{memory_id}.json"

        if not file_path.exists():
            return None

        try:
            stat = file_path.stat()
            with open(file_path, 'r') as f:
                data = json.load(f)

            # Handle both formats: {"messages": [...]} or just [...]
            if isinstance(data, dict):
                messages = data.get("messages", [])
                metadata = self._parse_metadata(data, memory_id)
            else:
                messages = data
                metadata = None

            return {
                "id": memory_id,
                "name": file_path.name,
                "file_path": str(file_path),
                "uploaded_at": stat.st_mtime,
                "messages": messages,
                "message_count": len(messages),
                "metadata": metadata
            }
        except Exception as e:
            print(f"Error loading memory {file_path}: {e}")
            return None


# Global instance
memory_loader = MemoryLoader()
