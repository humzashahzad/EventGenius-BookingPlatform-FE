class SoundService {
  private enabled: boolean = true
  private volume: number = 0.5

  // Data URIs for notification and message sounds (create new Audio on each play for reliable playback)
  private readonly NOTIFICATION_SRC = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIGWi777edTAwNUKfk77RgGgU7k9nxxnksBSpzy/DXjT4KFl+z6OunUxQJSKDh8sFsIAUrlM3y2oo2CBtpu+7mm0wNDlKo5O+zXxkGPJLY8sV5KwYqcs7v1os+CRZftejqplEUCUqg4vO/ax8FKpPM8tqLNQgbaLnu5ppMDA5SqOTwsl4ZBjyS2PLGeSoGKnHN79aKPgkVXrXo6qZSEwlJn+HyvmsgBSuVzPLbiTUIGmm67OWaTQwOUqjk77JeGQY7kdjywXgpBipxzu/WiT0KFV6z5+qnUhMKSaDh8sFrIAUrlM3y2ok2BhppuuvmmkwMDlKn5PCyXhoFO5LZ8sB4KQUqcs3w1Yk+ChVfsufrplETCkmg4vLAax4FKpTN8tuJNQYaabrs5ZpNDA5SqOTwsl4ZBjuS2fHBeSkFKnHM8NWJPgkVX7Lm6qdSEwlKoOLywGwfBSuUzvLaiTYGG2i56+aaTQwOUqjk77JfGQY6ktnywXgpBSp0ze/WiT4JFV+y5+umUhIJSp/h88FrHgUrkM3y2Yk2Bhppuuzlmk0MDlOo5O+yXhkGPJPY8cJ4KQUqccvv1oo9CRZfsufqp1MSCEqf4fPBbB8FK5PN8tuJNgYbaLjr5ppNDA5TqOTvsV4ZBT2S2/LBeCgFK3HN8NSJPggWX7Ln6qdTEglJoODywWseByqTzvLZijYGG2m56+WaTQwOUqjk77FfGgU8ktnywXgpBCt0zO/ViT4IFl6y5+qmUxMJSZ/h8sFsHwUqlM3y2ok2Bhto'
  private readonly MESSAGE_SRC = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIGWi777edTAwNUKfk77RgGgU7k9nxxnksBSpzy/DXjT4KFl+z6OunUxQJSKDh8sFsIAUrlM3y2oo2CBtpu+7mm0wNDlKo5O+zXxkGPJLY8sV5KwYqcs7v1os+CRZftejqplEUCUqg4vO/ax8FKpPM8tqLNQgbaLnu5ppMDA5SqOTwsl4ZBjyS2PLGeSoGKnHN79aKPgkVXrXo6qZSEwlJn+HyvmsgBSuVzPLbiTUIGmm67OWaTQwOUqjk77JeGQY7kdjywXgpBipxzu/WiT0KFV6z5+qnUhMKSaDh8sFrIAUrlM3y2ok2BhppuuvmmkwMDlKn5PCyXhoFO5LZ8sB4KQUqcs3w1Yk+ChVfsufrplETCkmg4vLAax4FKpTN8tuJNQYaabrs5ZpNDA5SqOTwsl4ZBjuS2fHBeSkFKnHM8NWJPgkVX7Lm6qdSEwlKoOLywGwfBSuUzvLaiTYGG2i56+aaTQwOUqjk77JfGQY6ktnywXgpBSp0ze/WiT4JFV+y5+umUhIJSp/h88FrHgUrkM3y2Yk2Bhppuuzlmk0MDlOo5O+yXhkGPJPY8cJ4KQUqccvv1oo9CRZfsufqp1MSCEqf4fPBbB8FK5PN8tuJNgYbaLjr5ppNDA5TqOTvsV4ZBT2S2/LBeCgFK3HN8NSJPggWX7Ln6qdTEglJoODywWseByqTzvLZijYGG2m56+WaTQwOUqjk77FfGgU8ktnywXgpBCt0zO/ViT4IFl6y5+qmUxMJSZ/h8sFsHwUqlM3y2ok2Bhto'

  constructor() {
    // Check localStorage for user preferences
    const savedEnabled = localStorage.getItem('soundEnabled')
    const savedVolume = localStorage.getItem('soundVolume')

    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true'
    }

    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume)
    }
  }

  playNotification() {
    if (!this.enabled) return

    try {
      const audio = new Audio(this.NOTIFICATION_SRC)
      audio.volume = this.volume
      audio.play().catch(err => {
        console.warn('Failed to play notification sound:', err)
      })
    } catch (error) {
      console.warn('Error playing notification sound:', error)
    }
  }

  playMessage() {
    if (!this.enabled) return

    try {
      const audio = new Audio(this.MESSAGE_SRC)
      audio.volume = this.volume
      audio.play().catch(err => {
        console.warn('Failed to play message sound:', err)
      })
    } catch (error) {
      console.warn('Error playing message sound:', error)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    localStorage.setItem('soundEnabled', String(enabled))
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('soundVolume', String(this.volume))
  }

  getEnabled(): boolean {
    return this.enabled
  }

  getVolume(): number {
    return this.volume
  }
}

export const soundService = new SoundService()
