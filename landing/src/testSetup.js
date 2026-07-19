import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback
  }

  observe(element) {
    this.callback([{ isIntersecting: true, target: element }])
  }

  unobserve() {}
  disconnect() {}
}

globalThis.IntersectionObserver = IntersectionObserverMock
globalThis.matchMedia = globalThis.matchMedia || (() => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
}))
