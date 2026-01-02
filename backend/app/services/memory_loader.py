"""
File-based memory loader service.

Loads agent memories (sessions) directly from JSON files in the filesystem
instead of requiring database uploads.

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

    def __init__(self, memories_dir: str = "/sample_memories"):
        """
        Initialize the memory loader.

        Args:
            memories_dir: Directory containing memory JSON files
        """
        self.memories_dir = Path(memories_dir)
        if not self.memories_dir.exists():
            # Fallback to local path for development
            self.memories_dir = Path(__file__).parent.parent.parent.parent / "sample_memories"

        print(f"MemoryLoader initialized with path: {self.memories_dir}")
        print(f"Path exists: {self.memories_dir.exists()}")

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

    def list_memories(self) -> List[Dict[str, Any]]:
        """
        List all available memory files.

        Returns:
            List of memory metadata dicts with id, name, file_path, metadata, etc.
        """
        memories = []

        if not self.memories_dir.exists():
            return memories

        for file_path in sorted(self.memories_dir.glob("*.json")):
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

    def get_memory(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific memory by ID (filename without extension).

        Args:
            memory_id: The memory ID (filename stem)

        Returns:
            Memory dict or None if not found
        """
        # Try to find file with this stem
        file_path = self.memories_dir / f"{memory_id}.json"

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
