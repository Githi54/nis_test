class CancelablePromise {
  constructor(executor) {
    if (typeof executor !== "function" && typeof executor !== "object") {
      throw new Error("wrong constructor arguments");
    }

    this.isCanceled = false;
    this.state = "pending";
    this.value = null;
    this.handlers = [];

    const resolve = (value) => {
      if (this.state !== "pending" || this.isCanceled) {
        return;
      }

      this.state = "fulfilled";
      this.value = value;

      for (const handler of this.handlers) {
        this.executeHandler(handler);
      }
    };

    const reject = (value) => {
      if (this.state !== "pending" || this.isCanceled) {
        return;
      }

      this.state = "rejected";
      this.value = value;

      for (const handler of this.handlers) {
        this.executeHandler(handler);
      }
    };

    const cancel = () => {
      this.isCanceled = true;
      this.state = "rejected";
      this.value = { isCanceled: true };

      for (const handler of this.handlers) {
        this.executeHandler(handler);
      }
    };

    try {
      executor(resolve, reject, cancel);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onReject) {
    if (
      typeof onFulfilled === "boolean" ||
      typeof onFulfilled === "string" ||
      typeof onFulfilled === "symbol" ||
      typeof onReject === "boolean" ||
      typeof onReject === "string" ||
      typeof onReject === "symbol"
    ) {
      throw new Error("wrong argument");
    }

    return new CancelablePromise((resolve, reject) => {
      const handleResolve = (value) => {
        if (typeof onFulfilled === "function") {
          try {
            const result = onFulfilled(value);
            if (result instanceof CancelablePromise) {
              result.then(resolve, reject).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(value);
        }
      };

      const handleReject = (reason) => {
        if (typeof onReject === "function") {
          try {
            const result = onReject(reason);

            if (result instanceof CancelablePromise) {
              result.then(resolve, reject).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          reject(reason);
        }
      };

      if (this.state === "fulfilled") {
        handleResolve(this.value);
      } else if (this.state === "rejected") {
        handleReject(this.value);
      } else {
        this.handlers.push({ resolve: handleResolve, reject: handleReject });
      }
    });
  }

  catch(onReject) {
    return this.then(null, onReject);
  }

  cancel() {
    this.state = "rejected";
    this.isCanceled = true;
    this.handlers = [];
    this.value = { isCanceled: true }

    return this;
  }

  executeHandler(handler) {
    if (this.isCanceled) {
      handler.reject({ isCanceled: true });
    } else if (this.state === "fulfilled") {
      handler.resolve(this.value);
    } else if (this.state === "rejected") {
      handler.reject(this.value);
    }
  }
}

module.exports = CancelablePromise;
