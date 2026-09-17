export function createGuardedMutationObserverClass(NativeMutationObserver, queue = queueMicrotask) {
  if (typeof NativeMutationObserver !== 'function') {
    throw new TypeError('NativeMutationObserver must be a constructor')
  }

  return class GuardedMutationObserver {
    constructor(callback) {
      this._target = null
      this._options = null
      this._connected = false
      this._native = new NativeMutationObserver((records) => {
        if (!this._connected) return

        const target = this._target
        const options = this._options
        this._native.disconnect()
        this._connected = false

        callback(records, this)

        queue(() => {
          if (!target || this._connected) return
          if (this._target !== target || this._options !== options) return
          this._native.observe(target, options)
          this._connected = true
        })
      })
    }

    observe(target, options) {
      this._target = target
      this._options = options
      this._native.observe(target, options)
      this._connected = true
    }

    disconnect() {
      this._target = null
      this._options = null
      this._native.disconnect()
      this._connected = false
    }

    takeRecords() {
      return this._native.takeRecords()
    }
  }
}
