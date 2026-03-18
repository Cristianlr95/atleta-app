import { ResourceStore } from './resource-store';

class TestResourceStore extends ResourceStore<number> {
  loadValue(key: string, loader: () => Promise<number | null>, force = false, ttlMs = 1000) {
    return this.loadWithPolicy(key, loader, { force, ttlMs });
  }

  snapshot(key: string) {
    return this.getStateSnapshot(key);
  }
}

describe('ResourceStore', () => {
  it('dedupes in-flight requests for the same key', async () => {
    const store = new TestResourceStore();
    let calls = 0;

    const loader = async () => {
      calls += 1;
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      return 7;
    };

    const [a, b] = await Promise.all([
      store.loadValue('match-1', loader),
      store.loadValue('match-1', loader),
    ]);

    expect(a).toBe(7);
    expect(b).toBe(7);
    expect(calls).toBe(1);
  });

  it('respects TTL cache and avoids duplicate fetches while fresh', async () => {
    const store = new TestResourceStore();
    let calls = 0;

    const loader = async () => {
      calls += 1;
      return 10;
    };

    await store.loadValue('match-2', loader, false, 5000);
    await store.loadValue('match-2', loader, false, 5000);

    expect(calls).toBe(1);
    expect(store.snapshot('match-2').data).toBe(10);
  });

  it('force refresh bypasses TTL cache', async () => {
    const store = new TestResourceStore();
    let next = 1;

    const loader = async () => next++;

    const first = await store.loadValue('match-3', loader, false, 5000);
    const second = await store.loadValue('match-3', loader, true, 5000);

    expect(first).toBe(1);
    expect(second).toBe(2);
  });
});
