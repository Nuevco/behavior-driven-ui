import { createHash } from 'node:crypto'
import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

type NodeCryptoWithHash = typeof globalThis.crypto & {
  hash?: (
    algorithm: string,
    data: BinaryLike | ArrayBuffer | ArrayBufferView,
    outputEncoding?: BinaryToTextEncoding,
  ) => string | Buffer
}

const maybeCrypto = globalThis.crypto as NodeCryptoWithHash | undefined

if (maybeCrypto && typeof maybeCrypto.hash !== 'function') {
  const asBuffer = (data: BinaryLike | ArrayBuffer | ArrayBufferView): Buffer => {
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

  maybeCrypto.hash = (
    algorithm: string,
    data: BinaryLike | ArrayBuffer | ArrayBufferView,
    outputEncoding?: BinaryToTextEncoding,
  ) => {
    const digest = createHash(algorithm).update(asBuffer(data))

    if (outputEncoding) {
      return digest.digest(outputEncoding)
    }

    return digest.digest('hex')
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
