export function businessHoursBetween(start: Date, end: Date): number {
  if (end <= start) return 0

  const WORK_START = 8
  const WORK_END = 17

  function toWorkMoment(d: Date): Date {
    const r = new Date(d)
    for (let guard = 0; guard < 10; guard++) {
      const day = r.getDay()
      if (day === 0) {
        r.setDate(r.getDate() + 1)
        r.setHours(WORK_START, 0, 0, 0)
        continue
      }
      if (day === 6) {
        r.setDate(r.getDate() + 2)
        r.setHours(WORK_START, 0, 0, 0)
        continue
      }
      const h = r.getHours() + r.getMinutes() / 60 + r.getSeconds() / 3600
      if (h < WORK_START) {
        r.setHours(WORK_START, 0, 0, 0)
      } else if (h >= WORK_END) {
        r.setDate(r.getDate() + 1)
        r.setHours(WORK_START, 0, 0, 0)
        continue
      }
      break
    }
    return r
  }

  const effectiveStart = toWorkMoment(new Date(start))
  if (effectiveStart >= end) return 0

  let total = 0
  const cur = new Date(effectiveStart)

  while (cur < end) {
    const day = cur.getDay()
    if (day === 0 || day === 6) {
      cur.setDate(cur.getDate() + (day === 0 ? 1 : 2))
      cur.setHours(WORK_START, 0, 0, 0)
      continue
    }
    const workEndToday = new Date(cur)
    workEndToday.setHours(WORK_END, 0, 0, 0)
    const segmentEnd = end < workEndToday ? end : workEndToday
    total += (segmentEnd.getTime() - cur.getTime()) / 3_600_000
    cur.setDate(cur.getDate() + 1)
    cur.setHours(WORK_START, 0, 0, 0)
  }

  return total
}
