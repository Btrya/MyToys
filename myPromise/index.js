const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  FULFILLED_CALLBACK_LIST = []
  REJECTED_CALLBACK_LIST = []
  _status = PENDING

  constructor(fn) {
    this.value = null
    this.reason = null
    this.status = PENDING
    try {
      fn(this.resolve.bind(this), this.reject.bind(this))
    } catch (e) {
      this.reject(e)
    }
  }

  get status() {
    return this._status
  }
  set status(newStatus) {
    this._status = newStatus
    switch(newStatus) {
      case FULFILLED: {
        this.FULFILLED_CALLBACK_LIST.forEach(cb => cb(this.value))
        break
      }
      case REJECTED: {
        this.REJECTED_CALLBACK_LIST.forEach(cb => cb(this.reason))
        break
      }
    }
  }

  resolve(value) {
    if (this.status === PENDING) {
      this.value = value
      this.status = FULFILLED
    }
  }
  reject(reason) {
    if (this.status === PENDING) {
      this.reason = reason
      this.status = REJECTED
    }
  }
  then(onFulfilled, onRejected) {
    const fulfilledFn = this.isFunction(onFulfilled) ? onFulfilled : value => value
    const rejectedFn = this.isFunction(onRejected) ? onRejected : (reason) => {
      throw reason
    }
    const fulfilledFnWithCatch = (resolve, reject, newPromise) => {
      queueMicrotask(() => {
        try {
          if (!this.isFunction(onFulfilled)) {
            resolve(this.value)
          } else {
            const x = fulfilledFn(this.value)
            this.resolvePromise(newPromise, x, resolve, reject)
          }
        } catch (e) {
          reject(e)
        }
      })
    }
    const rejectedFnWithCatch = (resolve, reject, newPromise) => {
      queueMicrotask(() => {
        try {
          if (!this.isFunction(onRejected)) {
            reject(this.reason)
          } else {
            const x = rejectedFn(this.reason)
            this.resolvePromise(newPromise, x, resolve, reject)
          }
        } catch (e) {
          reject(e)
        }
      })
    }
    switch(this.status) {
      case FULFILLED: {
        const newPromise = new MyPromise((resolve, reject) => fulfilledFnWithCatch(resolve, reject, newPromise))
        return newPromise
      }
      case REJECTED: {
        const newPromise = new MyPromise((resolve, reject) => rejectedFnWithCatch(resolve, reject, newPromise))
        return newPromise
      }
      case PENDING: {
        const newPromise = new MyPromise((resolve, reject) => {
          this.FULFILLED_CALLBACK_LIST.push(() => fulfilledFnWithCatch(resolve, reject, newPromise))
          this.REJECTED_CALLBACK_LIST.push(() => rejectedFnWithCatch(resolve, reject, newPromise))
        })
        return newPromise
      }
    }
  }
  isFunction(param) {
    return typeof param === 'function'
  }
  resolvePromise(newPromise, x, resolve, reject) {
    if (newPromise === x) return reject(new TypeError('promise with return value are the same'))
    if (x instanceof MyPromise) {
      x.then((y) => {
        this.resolvePromise(newPromise, y, resolve, reject)
      }, reject)
    } else if (typeof x === 'object' || this.isFunction(x)) {
      if (x === null) return resolve(x)
      let then = null
      try {
        then = x.then
      } catch (e) {
        reject(e)
      }
      if (this.isFunction(then)) {
        let called = false
        try {
          then.call(
            x,
            (y) => {
              if (called) return
              called = true
              this.resolvePromise(newPromise, y, resolve, reject)
            },
            (r) => {
              if (called) return
              called = true
              this.reject(r)
            }
          )
        } catch (e) {
          if (called) return
          reject(e)
        }
      } else {
        resolve(x)
      }
    } else {
      resolve(x)
    }
  }
}

const test = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    reject(11111)
  }, 1000);
}).then(console.log)

console.log(test)

setTimeout(() => {
  console.log(test)
}, 2000);