from app.integrations.supabase.storage import SignedUrlCache


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def test_cache_hits_until_ten_minutes_before_expiry():
    clock = Clock()
    cache = SignedUrlCache(clock)
    cache.put_many({"a.png": "https://signed/a"}, ttl=3600)

    assert cache.get_many(["a.png", "b.png"]) == {"a.png": "https://signed/a"}
    clock.now += 3600 - 601          # 10 min + 1 s left -> still served
    assert cache.get_many(["a.png"]) == {"a.png": "https://signed/a"}
    clock.now += 2                    # under 10 min left -> re-sign
    assert cache.get_many(["a.png"]) == {}


def test_forget_removes_entries():
    cache = SignedUrlCache(Clock())
    cache.put_many({"a.png": "u1", "b.png": "u2"})
    cache.forget(["a.png"])
    assert cache.get_many(["a.png", "b.png"]) == {"b.png": "u2"}
