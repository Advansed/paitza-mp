// src/Store/socketStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================
// ТИПЫ
// ============================================

export interface SocketState {
  isConnected: boolean
  isConnecting: boolean
}

interface SocketActions {
  setConnected: (connected: boolean) => void
  setConnecting: (connecting: boolean) => void
  updateStatus: (isConnected: boolean, isConnecting: boolean) => void
}

type SocketStore = SocketState & SocketActions

// ============================================
// STORE
// ============================================

export const useSocketStore = create<SocketStore>()(
  devtools(
    (set) => ({
      isConnected: false,
      isConnecting: false,

      setConnected: (connected: boolean) => {
        set({ isConnected: connected })
      },

      setConnecting: (connecting: boolean) => {
        set({ isConnecting: connecting })
      },

      updateStatus: (isConnected: boolean, isConnecting: boolean) => {
        set({ isConnected, isConnecting })
      }
    }),
    { name: 'socket-store' }
  )
)

// ============================================
// GETTERS (совместимость)
// ============================================

export const socketGetters = {
  isConnected: () => useSocketStore.getState().isConnected,
  isConnecting: () => useSocketStore.getState().isConnecting
}

// ============================================
// ACTIONS (совместимость)
// ============================================

export const socketActions = {
  setConnected: (connected: boolean) => useSocketStore.getState().setConnected(connected),
  setConnecting: (connecting: boolean) => useSocketStore.getState().setConnecting(connecting),
  updateStatus: (isConnected: boolean, isConnecting: boolean) => 
    useSocketStore.getState().updateStatus(isConnected, isConnecting)
}
