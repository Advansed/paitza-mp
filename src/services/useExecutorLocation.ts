import { useEffect } from 'react'
import { useWorkStore } from '../components/Works/workStore'
import { normalizeWorkStatus } from '../components/Works/statusFlow'
import { WorkStatus } from '../components/Works/types'
import { useLoginStore } from '../Store/loginStore'
import { isExecutorRole } from '../Store/roles'
import socketService from './socketService'

const INTERVAL_MS = 15 * 60 * 1000

const ACTIVE_WORK = new Set<WorkStatus>([
  WorkStatus.TO_LOAD,
  WorkStatus.ON_LOAD,
  WorkStatus.LOADING,
  WorkStatus.LOADED,
  WorkStatus.IN_WORK,
  WorkStatus.TO_UNLOAD,
  WorkStatus.UNLOADING,
  WorkStatus.UNLOADED,
])

export function useExecutorLocation() {
  const token = useLoginStore((state) => state.token)
  const userType = useLoginStore((state) => state.user_type)
  const works = useWorkStore((state) => state.works)
  const tracking =
    Boolean(token) &&
    isExecutorRole(userType) &&
    works.some((work) => ACTIVE_WORK.has(normalizeWorkStatus(work.status)))

  useEffect(() => {
    if (!tracking || !token) return
    let stopped = false

    const send = () => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (stopped) return
          socketService.emit('set_location', {
            token,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          })
        },
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 60_000, timeout: 20_000 },
      )
    }

    send()
    const timer = window.setInterval(send, INTERVAL_MS)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [tracking, token])
}
