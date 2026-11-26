import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api, { setSocketIdProvider } from '@/lib/axios'

// Make Pusher available globally (required by Laravel Echo)
;(window as any).Pusher = Pusher

let echoInstance: Echo<'reverb'> | null = null
type StateListener = (current: string, previous: string) => void
const stateListeners = new Set<StateListener>()
type InstanceListener = (echo: Echo<'reverb'> | null) => void
const instanceListeners = new Set<InstanceListener>()

function notifyInstance(echo: Echo<'reverb'> | null) {
  instanceListeners.forEach(fn => {
    try { fn(echo) } catch (error) { console.error(error) }
  })
}

/** Called with the new Echo instance when one is created, and with null when it is torn down. */
export function onEchoInstance(fn: InstanceListener): () => void {
  instanceListeners.add(fn)
  return () => instanceListeners.delete(fn)
}

/** The current Echo instance, without creating one. */
export function currentEcho(): Echo<'reverb'> | null {
  return echoInstance
}

function resolveWsHost(): string {
  const browserHost = window.location.hostname || 'localhost'
  const envHost = import.meta.env.VITE_REVERB_HOST
  const local = ['localhost', '127.0.0.1']
  if (envHost && local.includes(envHost) && !local.includes(browserHost)) return browserHost
  return envHost || browserHost || 'localhost'
}

/**
 * Get or create the Laravel Echo instance (Laravel Reverb over the Pusher protocol).
 *
 * Private/presence channels are authorized through the shared axios instance, so every
 * (re)subscription uses the token of the active portal at that moment — including a token
 * that was rotated after the socket was opened.
 */
export function getEcho(): Echo<'reverb'> {
  if (echoInstance) return echoInstance

  const wsPort = parseInt(import.meta.env.VITE_REVERB_PORT || '8081')

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'eventgenius-key',
    wsHost: resolveWsHost(),
    wsPort,
    wssPort: wsPort,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    // Detect dead connections (sleeping laptops, dropped Wi-Fi) quickly.
    activityTimeout: 25000,
    pongTimeout: 8000,
    channelAuthorization: {
      endpoint: '/broadcasting/auth',
      transport: 'ajax',
      customHandler: (
        params: { socketId: string; channelName: string },
        callback: (error: Error | null, data: any) => void,
      ) => {
        api
          .post('/broadcasting/auth', { socket_id: params.socketId, channel_name: params.channelName })
          .then(({ data }) => callback(null, data))
          .catch((error) => callback(error instanceof Error ? error : new Error('Channel authorization failed'), null))
      },
    },
  } as any)

  const pusher = (echoInstance.connector as any).pusher
  pusher?.connection?.bind('state_change', (states: { current: string; previous: string }) => {
    stateListeners.forEach(fn => {
      try { fn(states.current, states.previous) } catch (error) { console.error(error) }
    })
  })

  // Lets the API skip echoing our own actions back to this socket (Laravel's toOthers()).
  setSocketIdProvider(() => echoInstance?.socketId() || null)

  notifyInstance(echoInstance)
  return echoInstance
}

/** Subscribe to websocket connection state changes. Returns an unsubscribe function. */
export function onEchoStateChange(fn: StateListener): () => void {
  stateListeners.add(fn)
  return () => stateListeners.delete(fn)
}

/** Current websocket state ('connected', 'connecting', 'unavailable', ...). */
export function echoState(): string {
  const pusher = echoInstance ? (echoInstance.connector as any).pusher : null
  return pusher?.connection?.state || 'disconnected'
}

/** Ask the socket to reconnect now (e.g. when the tab wakes up or the network returns). */
export function reconnectEcho(): void {
  const pusher = echoInstance ? (echoInstance.connector as any).pusher : null
  if (!pusher) return
  const state = pusher.connection?.state
  if (state !== 'connected' && state !== 'connecting') pusher.connect()
}

/** Kept for older callers: channel auth always reads the current token now. */
export function updateEchoAuth(): void {}

/**
 * Disconnect Echo and reset the instance.
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
    notifyInstance(null)
  }
  setSocketIdProvider(null)
}

/**
 * Check if Echo is connected.
 */
export function isEchoConnected(): boolean {
  return echoState() === 'connected'
}

export default getEcho
