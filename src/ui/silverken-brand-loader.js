import { createGuardedMutationObserverClass } from './mutation-observer-guard.js'

async function loadBranding() {
  const NativeMutationObserver = globalThis.MutationObserver
  if (typeof NativeMutationObserver !== 'function') {
    await import('./silverken-brand.js')
    return
  }

  globalThis.MutationObserver = createGuardedMutationObserverClass(NativeMutationObserver)
  try {
    await import('./silverken-brand.js')
  } finally {
    globalThis.MutationObserver = NativeMutationObserver
  }
}

loadBranding().catch((error) => {
  console.error('silverken-agent-world: branding failed to initialize', error)
})
