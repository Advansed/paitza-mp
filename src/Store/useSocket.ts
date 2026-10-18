// src/Store/useSocket.ts

import { useCallback } from 'react'
import socketService from '../services/socketService'
import { socketActions, useSocketStore } from './socketStore'

// ============================================
// HOOK
// ============================================

export function useSocket() {

  const isConnected = useSocketStore((state) => state.isConnected)


  const connect     = useCallback(async (token: string) => {
    try {
      socketActions.setConnecting(true)
      const success = await socketService.connect(token)
      
      socketActions.updateStatus(
        success && socketService.isSocketConnected(),
        false
      )
      
      return success
    } catch (error) {
      console.error('Socket connection failed:', error)
      socketActions.updateStatus(false, false)
      return false
    }
  }, [])

  const disconnect  = useCallback(() => {
    socketService.disconnect()
    socketActions.updateStatus(false, false)
  }, [])

  const emit        = useCallback((event: string, data?: any) => {
    return socketService.emit(event, data)
  }, [])

  const on          = useCallback((event: string, callback: Function) => {
    const socket = socketService.getSocket()
    if (socket) {
      socket.on(event, callback as any)
    }
    
    return () => {
      const currentSocket = socketService.getSocket()
      if (currentSocket) {
        currentSocket.off(event, callback as any)
      }
    }
  }, [])

  const off         = useCallback((event: string, callback?: any) => {
    const socket = socketService.getSocket()
    if(callback) socket?.off(event, callback)
    else socket?.off(event)
  }, [])

  const once        = useCallback((event: string, callback?: any) => {
    const socket = socketService.getSocket()
    if(callback) socket?.once(event, callback)
  }, [])

  const socket      = socketService.getSocket()

  return {
    isConnected,
    socket,
    connect,
    disconnect,
    emit,
    on,
    off,
    once
  }
}
