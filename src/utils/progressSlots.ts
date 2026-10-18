export const PROGRESS_POINT_LIMIT = 7

export type ProgressRole = 'prev' | 'current' | 'next' | 'last'

export type ProgressSlot<T> =
  | { type: 'status'; status: T; role: ProgressRole }
  | { type: 'ellipsis' }

/** Окно прогресса: до 7 точек, с «…» только если хвост маршрута не влезает. */
export function buildProgressSlots<T>(
  flow: readonly T[],
  currentIndex: number,
  limit = PROGRESS_POINT_LIMIT
): ProgressSlot<T>[] {
  if (currentIndex < 0 || flow.length === 0) return []

  const lastIndex = flow.length - 1
  const roleFor = (index: number): ProgressRole => {
    if (index < currentIndex) return 'prev'
    if (index === currentIndex) return 'current'
    if (index === lastIndex) return 'last'
    return 'next'
  }
  const statusSlot = (index: number): ProgressSlot<T> => ({
    type: 'status',
    status: flow[index],
    role: roleFor(index),
  })

  if (flow.length <= limit) {
    return flow.map((_, index) => statusSlot(index))
  }

  if (currentIndex >= flow.length - limit) {
    const start = flow.length - limit
    return Array.from({ length: limit }, (_, offset) => statusSlot(start + offset))
  }

  const headCount = limit - 2
  let start = Math.max(0, currentIndex - 1)
  if (currentIndex >= start + headCount) {
    start = currentIndex - headCount + 1
  }
  start = Math.max(0, Math.min(start, lastIndex - headCount))

  const slots: ProgressSlot<T>[] = []
  for (let index = start; index < start + headCount; index += 1) {
    slots.push(statusSlot(index))
  }
  slots.push({ type: 'ellipsis' })
  slots.push(statusSlot(lastIndex))
  return slots
}
