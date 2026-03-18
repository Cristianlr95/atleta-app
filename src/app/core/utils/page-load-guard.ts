export class PageLoadGuard {
  private inFlight: Promise<unknown> | null = null;

  async runSingle<T>(task: () => Promise<T>): Promise<T> {
    if (this.inFlight) {
      return this.inFlight as Promise<T>;
    }

    this.inFlight = task().finally(() => {
      this.inFlight = null;
    });

    return this.inFlight as Promise<T>;
  }

  hasInFlight(): boolean {
    return this.inFlight !== null;
  }
}
