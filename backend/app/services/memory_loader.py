"""
File-based memory loader service.

Loads agent memories directly from JSON files in the filesystem
instead of requiring database uploads.
"""
import os
import json
from typing import List, Dict, Any, Optional
from pathlib import Path


class MemoryLoader:
    """Loads agent memories from the filesystem."""

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

    def list_memories(self) -> List[Dict[str, Any]]:
        """
        List all available memory files.

        Returns:
            List of memory metadata dicts with id, name, file_path, etc.
        """
        memories = []

        if not self.memories_dir.exists():
            return memories

        for file_path in sorted(self.memories_dir.glob("*.json")):
            try:
                # Use filename (without extension) as the ID
                memory_id = file_path.stem
                stat = file_path.stat()

                # Read file to get message count
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    messages = data.get("messages", []) if isinstance(data, dict) else data

                memories.append({
                    "id": memory_id,
                    "name": file_path.name,
                    "file_path": str(file_path),
                    "uploaded_at": stat.st_mtime,
                    "messages": messages,
                    "message_count": len(messages)
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
                messages = data.get("messages", []) if isinstance(data, dict) else data

            return {
                "id": memory_id,
                "name": file_path.name,
                "file_path": str(file_path),
                "uploaded_at": stat.st_mtime,
                "messages": messages,
                "message_count": len(messages)
            }
        except Exception as e:
            print(f"Error loading memory {file_path}: {e}")
            return None


# Global instance
memory_loader = MemoryLoader()
