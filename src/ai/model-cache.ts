/** Share initialization; rejected attempts are never retained. */
export class ModelCache<T> {
  private pending: Promise<T> | null = null;
  get(load: () => Promise<T>): Promise<T> {
    if (!this.pending) {
      const attempt = Promise.resolve().then(load);
      this.pending = attempt;
      void attempt.catch(() => {
        if (this.pending === attempt) this.pending = null;
      });
    }
    return this.pending;
  }
  clear() {
    this.pending = null;
  }
}
