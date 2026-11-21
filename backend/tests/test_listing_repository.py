"""ListingRepository behaviour that the in-memory fake can't cover."""

from types import SimpleNamespace

from postgrest.exceptions import APIError

from app.repositories.listing_repository import ListingRepository
from app.schemas.listing import ListingFilters


class FakeQuery:
    """Chainable stand-in for a PostgREST request builder."""

    def __init__(self, log, total):
        self.log, self.total, self.calls = log, total, []

    def __getattr__(self, name):
        def method(*args, **kwargs):
            self.calls.append((name, args))
            return self
        return method

    def execute(self):
        self.log.append(self.calls)
        rng = next(args for name, args in self.calls if name == "range")
        if rng[0] >= self.total and rng != (0, 0):
            raise APIError({"code": "PGRST103", "message": "Requested range not satisfiable"})
        return SimpleNamespace(data=[], count=self.total)


class FakeDb:
    def __init__(self, total):
        self.log, self.total = [], total

    def from_(self, table):
        return FakeQuery(self.log, self.total)


def test_page_past_the_end_returns_empty_page_with_total():
    db = FakeDb(total=7)
    rows, total = ListingRepository(db).search(ListingFilters(page=5, page_size=10))
    assert rows == [] and total == 7
    assert len(db.log) == 2  # original query + count query


def test_filters_are_applied():
    db = FakeDb(total=1)
    ListingRepository(db).search(
        ListingFilters(category="electronic", material="50%_off", location="Hyd"), owner_id="u1"
    )
    calls = dict((n, a) for n, a in db.log[0] if n in {"eq", "ilike"})
    names = [(n, a[0]) for n, a in db.log[0] if n in {"eq", "ilike"}]
    assert ("eq", "owner_id") in names and ("eq", "waste_category") in names
    ilikes = [a for n, a in db.log[0] if n == "ilike"]
    assert ("material_name", "%50\\%\\_off%") in ilikes  # wildcards escaped
    assert ("location", "%Hyd%") in ilikes
    assert calls  # sanity
