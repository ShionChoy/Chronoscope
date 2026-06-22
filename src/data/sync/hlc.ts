export interface Clock {
  now(): string
}

function encode(millis: number, counter: number, nodeId: string): string {
  return `${String(millis).padStart(15, '0')}-${String(counter).padStart(6, '0')}-${nodeId}`
}

export function createClock(nodeId: string, physicalNow: () => number = () => Date.now()): Clock {
  let lastMillis = 0
  let lastCounter = 0
  return {
    now(): string {
      const pt = physicalNow()
      if (pt > lastMillis) {
        lastMillis = pt
        lastCounter = 0
      } else {
        lastCounter += 1
      }
      return encode(lastMillis, lastCounter, nodeId)
    },
  }
}

export function compareHLC(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
