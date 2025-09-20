import { createHash } from 'node:crypto'
import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto'
import { createRequire } from 'node:module'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

type HashLike = {
  hash?: HashFunction
}

type HashFunction = (
  algorithm: string,
  data: BinaryLike | ArrayBuffer | ArrayBufferView,
  outputEncoding?: BinaryToTextEncoding,
) => Buffer | string

const require = createRequire(import.meta.url)
const nodeCrypto = require('node:crypto') as HashLike & { webcrypto?: unknown }

const toBuffer = (data: BinaryLike | ArrayBuffer | ArrayBufferView): Buffer => {
  if (typeof data === 'string') {
    return Buffer.from(data)
  }

  if (Buffer.isBuffer(data)) {
    return data
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data)
  }

  throw new TypeError('Unsupported data type for crypto.hash polyfill')
}

const ensureHash = (candidate: unknown): void => {
  if (!candidate || typeof candidate !== 'object') {
    return
  }

  const hashable = candidate as HashLike

  if (typeof hashable.hash === 'function') {
    return
  }

  Object.defineProperty(hashable, 'hash', {
    configurable: true,
    writable: true,
    value: (
      algorithm: string,
      data: BinaryLike | ArrayBuffer | ArrayBufferView,
      outputEncoding?: BinaryToTextEncoding,
    ): Buffer | string => {
      const digest = createHash(algorithm).update(toBuffer(data))

      if (outputEncoding) {
        return digest.digest(outputEncoding)
      }

      return digest.digest()
    },
  })
}

ensureHash(globalThis.crypto)

if (!globalThis.crypto && nodeCrypto.webcrypto) {
  Object.defineProperty(globalThis as typeof globalThis & { crypto?: unknown }, 'crypto', {
    configurable: true,
    writable: true,
    value: nodeCrypto.webcrypto,
  })
}

ensureHash(globalThis.crypto)
ensureHash(nodeCrypto.webcrypto)
ensureHash(nodeCrypto)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
