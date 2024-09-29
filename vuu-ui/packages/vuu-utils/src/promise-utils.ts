export class DeferredPromise<T = unknown> {
  #promise: Promise<T>;
  #resolve: (value: T) => void = () => console.log("resolve was not set");
  #reject: (err: unknown) => void = () => console.log("reject was not set");
  #resolved = false;

  constructor() {
    this.#promise = new Promise<T>((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }

  get promise() {
    return this.#promise;
  }

  get isResolved() {
    return this.#resolved;
  }

  resolve(value: T) {
    this.#resolved = true;
    return this.#resolve(value);
  }

  get reject() {
    return this.#reject;
  }
}
