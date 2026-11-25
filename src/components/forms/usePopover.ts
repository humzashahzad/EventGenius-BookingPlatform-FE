/**
 * Minimal popover positioning (no library): the panel is teleported to
 * <body> and placed with `position: fixed` under its anchor, flipping above
 * when there is no room. Closes on outside pointer-down and Escape is left
 * to the component. Works inside cards/tables with overflow hidden.
 */
import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function usePopover(
  anchor: Ref<HTMLElement | null>,
  panel: Ref<HTMLElement | null>,
  open: Ref<boolean>,
  opts: { matchWidth?: boolean; align?: 'start' | 'end'; onOutside?: () => void } = {},
) {
  const style = ref<Record<string, string>>({ position: 'fixed', top: '-9999px', left: '-9999px' })

  function update() {
    const a = anchor.value?.getBoundingClientRect()
    const p = panel.value
    if (!a || !p) return
    const ph = p.offsetHeight
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const width = opts.matchWidth ? Math.max(a.width, p.scrollWidth > a.width ? Math.min(p.scrollWidth, vw - 16) : a.width) : p.offsetWidth
    let top = a.bottom + 4
    if (top + ph > vh - 8 && a.top - ph - 4 > 8) top = a.top - ph - 4
    let left = opts.align === 'end' ? a.right - width : a.left
    left = Math.max(8, Math.min(left, vw - width - 8))
    style.value = {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      ...(opts.matchWidth ? { width: `${Math.round(Math.min(width, vw - 16))}px` } : {}),
    }
  }
  function onPointerDown(e: PointerEvent) {
    const t = e.target as Node
    if (anchor.value?.contains(t) || panel.value?.contains(t)) return
    opts.onOutside?.()
  }
  function bind() {
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('pointerdown', onPointerDown, true)
  }
  function unbind() {
    window.removeEventListener('scroll', update, true)
    window.removeEventListener('resize', update)
    document.removeEventListener('pointerdown', onPointerDown, true)
  }
  watch(open, async v => {
    if (v) { await nextTick(); update(); bind() } else unbind()
  })
  onBeforeUnmount(unbind)
  return { style, update }
}
