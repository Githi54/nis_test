class CancelablePromise {
  constructor(executor) {
    if (typeof executor !== "function") {
     throw new Error('wrong constructor arguments');
    }

    this.isCanceled = false;
    this.state = "pending";
    this.value = null;
    this.handlers = [];

    const resolve = (value) => {
      if (this.state === "pending") {
        this.state = "fulfilled";
        this.value = value;

        for (const handler of this.handlers) {
          this.executeHandler(handler);
        }
      }
    };

    const reject = (value) => {
      if (this.state === "pending") {
        this.state = "rejected";
        this.value = value;

        for (const handler of this.handlers) {
          this.executeHandler(handler);
        }
      }
    };

    const cancel = () => {
      if (this.state === "pending") {
        this.isCanceled = true;
        this.state = "rejected";
        this.value = { isCanceled: true };

        for (const handler of this.handlers) {
          this.executeHandler(handler);
        }
      }
    };

    try {
      executor(resolve, reject, cancel);
    } catch (error) {
      reject(error);
    }
  }
}

module.exports = CancelablePromise;
