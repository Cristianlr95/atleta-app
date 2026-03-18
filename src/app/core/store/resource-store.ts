import { computed, signal } from '@angular/core';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface ResourceEntry<T> extends ResourceState<T> {
  inFlight?: Promise<T | null>;
}

export interface ResourceLoadOptions {
  force?: boolean;
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 20000;

export abstract class ResourceStore<T> {
  private readonly entriesStore = signal<Record<string, ResourceEntry<T>>>({});
  readonly entries = this.entriesStore.asReadonly();

  selectState = (key: string) =>
    computed<ResourceState<T>>(() => {
      const entry = this.entriesStore()[key];
      return {
        data: entry?.data ?? null,
        loading: entry?.loading ?? false,
        error: entry?.error ?? null,
        lastUpdated: entry?.lastUpdated ?? null,
      };
    });

  getStateSnapshot(key: string): ResourceState<T> {
    const entry = this.entriesStore()[key];
    return {
      data: entry?.data ?? null,
      loading: entry?.loading ?? false,
      error: entry?.error ?? null,
      lastUpdated: entry?.lastUpdated ?? null,
    };
  }

  protected getEntry(key: string): ResourceEntry<T> {
    return this.entriesStore()[key] ?? this.createEmptyEntry();
  }

  protected getData(key: string): T | null {
    return this.getEntry(key).data;
  }

  protected setData(key: string, data: T): void {
    this.patchEntry(key, {
      data,
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      inFlight: undefined,
    });
  }

  protected setError(key: string, error: string): void {
    this.patchEntry(key, {
      loading: false,
      error,
      inFlight: undefined,
    });
  }

  clear(key?: string): void {
    if (!key) {
      this.entriesStore.set({});
      return;
    }

    this.entriesStore.update((state) => {
      const clone = { ...state };
      delete clone[key];
      return clone;
    });
  }

  protected async loadWithPolicy(
    key: string,
    loader: () => Promise<T | null>,
    options?: ResourceLoadOptions,
  ): Promise<T | null> {
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    const entry = this.getEntry(key);
    const now = Date.now();
    const hasFreshCache =
      !!entry.data &&
      !options?.force &&
      !!entry.lastUpdated &&
      now - entry.lastUpdated <= ttlMs;

    if (hasFreshCache) {
      return entry.data;
    }

    if (entry.inFlight) {
      return entry.inFlight;
    }

    const inFlight = this.executeLoad(key, loader);
    this.patchEntry(key, {
      loading: true,
      error: null,
      inFlight,
    });

    return inFlight;
  }

  private async executeLoad(key: string, loader: () => Promise<T | null>): Promise<T | null> {
    try {
      const loaded = await loader();
      if (loaded) {
        this.setData(key, loaded);
      } else {
        this.patchEntry(key, {
          loading: false,
          inFlight: undefined,
        });
      }
      return loaded;
    } catch (error) {
      this.setError(key, this.toMessage(error));
      return null;
    }
  }

  private patchEntry(key: string, partial: Partial<ResourceEntry<T>>): void {
    this.entriesStore.update((state) => ({
      ...state,
      [key]: {
        ...(state[key] ?? this.createEmptyEntry()),
        ...partial,
      },
    }));
  }

  private createEmptyEntry(): ResourceEntry<T> {
    return {
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    };
  }

  private toMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'No se pudo cargar la informacion.';
  }
}
