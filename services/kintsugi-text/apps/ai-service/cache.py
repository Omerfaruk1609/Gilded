import os
import logging
import hashlib
import json
from typing import Optional, Dict, Any

logger = logging.getLogger("ai_service.cache")

try:
    import redis
    from redis.cluster import RedisCluster, ClusterNode
    from redis.exceptions import RedisError
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis package not installed. Operating in local memory fallback mode.")

class AICacheService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AICacheService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.local_cache: Dict[str, Any] = {}
        self.client = None
        self.is_cluster = False

        if not REDIS_AVAILABLE:
            return

        cluster_nodes_str = os.getenv("REDIS_CLUSTER_NODES", "").strip()
        redis_url_str = os.getenv("REDIS_URL", "").strip()
        redis_password = os.getenv("REDIS_PASSWORD", "").strip() or None

        if cluster_nodes_str:
            try:
                startup_nodes = []
                for node in cluster_nodes_str.split(","):
                    node = node.strip()
                    if node:
                        parts = node.split(":")
                        host = parts[0]
                        port = int(parts[1]) if len(parts) > 1 else 6379
                        startup_nodes.append(ClusterNode(host, port))

                logger.info(f"Initializing Python RedisCluster with {len(startup_nodes)} nodes...")
                self.client = RedisCluster(
                    startup_nodes=startup_nodes,
                    password=redis_password,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                self.is_cluster = True
            except Exception as e:
                logger.error(f"Failed to initialize RedisCluster: {e}. Falling back to local memory cache.")
                self.client = None
        elif redis_url_str:
            try:
                logger.info(f"Initializing Standalone Python Redis client at {redis_url_str}...")
                self.client = redis.Redis.from_url(
                    redis_url_str,
                    password=redis_password,
                    decode_responses=True,
                    socket_timeout=5
                )
            except Exception as e:
                logger.error(f"Failed to initialize Redis standalone: {e}. Falling back to local memory cache.")
                self.client = None

    def _get_key(self, text: str) -> str:
        text_hash = hashlib.sha256(text.strip().lower().encode('utf-8')).hexdigest()
        # Redis Cluster Hash Tag format for slot distribution: {cache}:mod:<hash>
        return f"{{cache}}:mod:{text_hash}"

    def get(self, text: str) -> Optional[Dict[str, Any]]:
        key = self._get_key(text)
        if self.client:
            try:
                val = self.client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}. Falling back to in-memory cache.")

        return self.local_cache.get(key)

    def set(self, text: str, data: Dict[str, Any], ttl_seconds: int = 3600):
        key = self._get_key(text)
        if self.client:
            try:
                self.client.setex(key, ttl_seconds, json.dumps(data))
            except Exception as e:
                logger.warning(f"Redis setex failed: {e}. Falling back to in-memory cache.")

        self.local_cache[key] = data
        if len(self.local_cache) > 10000:
            first_key = next(iter(self.local_cache))
            del self.local_cache[first_key]
