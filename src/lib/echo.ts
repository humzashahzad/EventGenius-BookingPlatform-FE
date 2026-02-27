import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getToken } from '@/lib/portalToken'

// Make Pusher available globally (required by Laravel Echo)
;(window as any).Pusher = Pusher

let echoInstance: Echo<'reverb'> | null = null

/**
 * Get or create the Laravel Echo instance.
 * Connects to Laravel Reverb WebSocket server.
 */
export function getEcho(): Echo<'reverb'> {
  if (echoInstance) return echoInstance

  const token = getToken()

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'eventgenius-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,

    // Custom auth endpoint that uses JWT
    authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })

  return echoInstance
}

/**
 * Update the auth token on the Echo instance (e.g., after login).
 */
export function updateEchoAuth(): void {
  const token = getToken()
  if (echoInstance) {
    echoInstance.connector.options.auth = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  }
}

/**
 * Disconnect Echo and reset the instance.
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

/**
 * Check if Echo is connected.
 */
export function isEchoConnected(): boolean {
  if (!echoInstance) return false
  const socket = (echoInstance.connector as any).pusher
  return socket?.connection?.state === 'connected'
}

export default getEcho
