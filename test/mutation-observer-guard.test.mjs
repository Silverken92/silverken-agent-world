import test from 'node:test'
import assert from 'node:assert/strict'

import { createGuardedMutationObserverClass } from '../src/ui/mutation-observer-guard.js'

class FakeNativeObserver {
  static latest = null

  constructor(callback) {
    this.callback = callback
    this.observed = []
    this.disconnects = 0
    FakeNativeObserver.latest = this
  }

  observe(target, options) {
    this.observed.push([target, options])
  }

  disconnect() {
    this.disconnects += 1
  }

  takeRecords() {
    return []
  }

  emit(records = [{ type: 'childList' }]) {
    this.callback(records, this)
  }
}

test('guard disconnects during mutation callback and reconnects on the next microtask', () => {
  const queued = []
  const Guarded = createGuardedMutationObserverClass(FakeNativeObserver, (fn) => queued.push(fn))
  const target = { id: 'app' }
  const options = { childList: true, subtree: true, characterData: true }
  let callbacks = 0

  const observer = new Guarded(() => {
    callbacks += 1
  })
  observer.observe(target, options)

  const native = FakeNativeObserver.latest
  native.emit()

  assert.equal(callbacks, 1)
  assert.equal(native.disconnects, 1)
  assert.equal(native.observed.length, 1)
  assert.equal(queued.length, 1)

  queued.shift()()
  assert.equal(native.observed.length, 2)
  assert.deepEqual(native.observed[1], [target, options])
})

test('explicit disconnect inside callback prevents automatic reconnect', () => {
  const queued = []
  const Guarded = createGuardedMutationObserverClass(FakeNativeObserver, (fn) => queued.push(fn))
  const observer = new Guarded(() => observer.disconnect())
  observer.observe({ id: 'app' }, { childList: true })

  const native = FakeNativeObserver.latest
  native.emit()
  queued.shift()()

  assert.equal(native.observed.length, 1)
  assert.equal(native.disconnects, 2)
})
