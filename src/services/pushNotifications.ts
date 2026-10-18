import { Capacitor } from '@capacitor/core'
import type { NotificationClickEvent, NotificationWillDisplayEvent } from 'onesignal-cordova-plugin'
import { isExecutorRole } from '../Store/roles'

export const PUSH_ENABLED_KEY = 'gvrs.push'
const NAV_EVENT = 'paitza:push-nav'

type OneSignalSdk = typeof import('onesignal-cordova-plugin').default

let sdkPromise: Promise<OneSignalSdk | null> | null = null
let listenersReady = false
let identified = false
let pendingPath: string | null = null
const navListeners = new Set<(path: string) => void>()

export function isPushEnabled(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) !== '0'
}

export function setPushEnabled(enabled: boolean) {
  localStorage.setItem(PUSH_ENABLED_KEY, enabled ? '1' : '0')
  void applyPushPreference(enabled, enabled)
}

export function subscribePushNav(listener: (path: string) => void) {
  navListeners.add(listener)
  if (pendingPath) {
    const path = pendingPath
    pendingPath = null
    listener(path)
  }
  return () => {
    navListeners.delete(listener)
  }
}

function openPath(path: string) {
  if (navListeners.size === 0) {
    pendingPath = path
    return
  }
  for (const listener of navListeners) listener(path)
}

function pathFromPayload(data: Record<string, unknown>): string {
  const type = String(data.type ?? '')
  const cargoId = String(data.cargo_id ?? '').trim()
  if (type === 'chat' && cargoId) {
    const partner = String(data.partner ?? '').trim()
    if (!partner) return '/chats'
    return `/chats/${partner}:${cargoId}:`
  }
  return '/feed'
}

function onForeground(event: NotificationWillDisplayEvent) {
  event.preventDefault(true)
}

function onClick(event: NotificationClickEvent) {
  const raw = event.notification.additionalData
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  openPath(pathFromPayload(data))
}

async function loadSdk(): Promise<OneSignalSdk | null> {
  if (!Capacitor.isNativePlatform()) return null
  const appId = String(import.meta.env.VITE_ONESIGNAL_APP_ID ?? '').trim()
  if (!appId) return null
  if (!sdkPromise) {
    sdkPromise = import('onesignal-cordova-plugin')
      .then((mod) => {
        const sdk = mod.default
        sdk.initialize(appId)
        if (!listenersReady) {
          listenersReady = true
          sdk.Notifications.addEventListener('foregroundWillDisplay', onForeground)
          sdk.Notifications.addEventListener('click', onClick)
        }
        return sdk
      })
      .catch(() => null)
  }
  return sdkPromise
}

async function applyPushPreference(enabled = isPushEnabled(), askSettings = false) {
  const sdk = await loadSdk()
  if (!sdk || !identified) return
  if (enabled) {
    sdk.User.pushSubscription.optIn()
    void sdk.Notifications.requestPermission(askSettings)
    return
  }
  sdk.User.pushSubscription.optOut()
}

export function preparePush() {
  return loadSdk()
}

export async function syncPushUser(userId: string, userType: number | null | undefined) {
  const sdk = await loadSdk()
  if (!sdk) return
  const id = userId.trim()
  if (!id) {
    await pushLogout()
    return
  }
  sdk.login(id)
  identified = true
  sdk.User.addTag('role', isExecutorRole(userType) ? 'executor' : 'customer')
  await applyPushPreference()
}

export async function pushLogout() {
  if (!identified) return
  identified = false
  const sdk = await loadSdk()
  sdk?.logout()
}
