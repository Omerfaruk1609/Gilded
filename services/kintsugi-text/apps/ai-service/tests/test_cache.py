import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from cache import AICacheService

@pytest.fixture(scope="module")
def cache():
    return AICacheService()

def test_cache_initialization(cache):
    assert cache is not None
    assert isinstance(cache.local_cache, dict)

def test_cache_set_and_get(cache):
    sample_text = "Önbellek Test Metni 123"
    payload = {"provider": "test_provider", "scores": {"toxicity": 0.1}}

    cache.set(sample_text, payload)
    retrieved = cache.get(sample_text)

    assert retrieved is not None
    assert retrieved["provider"] == "test_provider"
    assert retrieved["scores"]["toxicity"] == 0.1

def test_cache_miss_for_unseen_text(cache):
    retrieved = cache.get("Henüz taranmamış benzersiz rastgele metin xyz 9999")
    assert retrieved is None

def test_cache_key_generation(cache):
    key1 = cache._get_key("Metin")
    key2 = cache._get_key("metin ")
    assert key1 == key2
    assert key1.startswith("{cache}:mod:")
