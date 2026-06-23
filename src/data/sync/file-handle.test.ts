import { describe, it, expect } from 'vitest'
import { ensureWritable, type PermissionedHandle } from './file-handle'

describe('ensureWritable', () => {
  it('returns true without prompting when permission is already granted', async () => {
    let requested = false
    const handle: PermissionedHandle = {
      async queryPermission() {
        return 'granted'
      },
      async requestPermission() {
        requested = true
        return 'granted'
      },
    }
    expect(await ensureWritable(handle)).toBe(true)
    expect(requested).toBe(false)
  })

  it('requests permission when not yet granted and reports the result', async () => {
    const handle: PermissionedHandle = {
      async queryPermission() {
        return 'prompt'
      },
      async requestPermission() {
        return 'granted'
      },
    }
    expect(await ensureWritable(handle)).toBe(true)
  })

  it('returns false when the request is denied', async () => {
    const handle: PermissionedHandle = {
      async queryPermission() {
        return 'prompt'
      },
      async requestPermission() {
        return 'denied'
      },
    }
    expect(await ensureWritable(handle)).toBe(false)
  })
})
