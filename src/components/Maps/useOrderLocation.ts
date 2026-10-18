import { useEffect, useState } from 'react'
import socketService from '../../services/socketService'
import { loginGetters } from '../../Store/loginStore'
import { useSocketStore } from '../../Store/socketStore'
import type { Coordinates } from './MapTypes'

function sameId(a?: string | null, b?: string | null) {
  if (!a || !b) return false
  return a.replace(/[{}]/g, '').toUpperCase() === b.replace(/[{}]/g, '').toUpperCase()
}

function readPoint(payload: unknown, cargoId: string): Coordinates | null | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const row = payload as Record<string, unknown>
  if (row.success === false) return undefined
  const id = String(row.cargo_id ?? row.cargo ?? '')
  if (id && !sameId(id, cargoId)) return undefined
  const lat = Number(row.lat)
  const lon = Number(row.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, long: lon }
}

export function useOrderLocation(cargoId: string | undefined, enabled: boolean): Coordinates | null {
  const isConnected = useSocketStore((state) => state.isConnected)
  const [point, setPoint] = useState<Coordinates | null>(null)

  useEffect(() => {
    if (!enabled || !cargoId || !isConnected) {
      setPoint(null)
      return
    }
    const socket = socketService.getSocket()
    if (!socket) return

    const apply = (payload: unknown) => {
      const next = readPoint(payload, cargoId)
      if (next === undefined) return
      setPoint(next)
    }

    socket.on('get_order_location', apply)
    socket.on('order_location', apply)
    socketService.emit('get_order_location', {
      token: loginGetters.getToken(),
      cargo_id: cargoId,
    })

    return () => {
      socket.off('get_order_location', apply)
      socket.off('order_location', apply)
    }
  }, [cargoId, enabled, isConnected])

  return point
}
