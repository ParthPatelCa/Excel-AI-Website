import hashlib
import json
import time
from typing import Any, Optional


class InMemoryTTLCache:
    def __init__(self):
        self._store = {}

    def _now(self) -> float:
        return time.time()

    def set(self, key: str, value: Any, ttl_seconds: int = 86400):
        self._store[key] = (value, self._now() + ttl_seconds)

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        value, expires_at = item
        if self._now() > expires_at:
            try:
                del self._store[key]
            except Exception:
                pass
            return None
        return value


cache = InMemoryTTLCache()


def cache_key(task: str, payload: dict, model_chain: list[str]) -> str:
    """Stable cache key based on task + normalized payload + model tier order."""
    normalized = {
        'task': task,
        'payload': payload,
        'models': model_chain,
    }
    blob = json.dumps(normalized, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(blob.encode('utf-8')).hexdigest()


