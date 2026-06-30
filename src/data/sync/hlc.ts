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
      } else if (lastCounter < 999999) {
        lastCounter += 1
      } else {
        // counter would exceed 6 digits; advance the logical millisecond to
        // preserve fixed-width strings and strict monotonicity
        lastMillis += 1
        lastCounter = 0
      }
      return encode(lastMillis, lastCounter, nodeId)
    },
  }
}
