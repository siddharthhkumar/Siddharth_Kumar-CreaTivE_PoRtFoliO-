import { MEDIA } from "./config.js"

const slidesQuery = window.matchMedia(MEDIA.slides)
const reducedQuery = window.matchMedia(MEDIA.reducedMotion)
const hoverQuery = window.matchMedia(MEDIA.canHover)

// "slides"  : full-screen slides, wheel/drag navigation, GSAP entrances (wide screen + mouse)
// "native"  : normal browser scrolling, entrances play as sections scroll into view
// "reduced" : normal browser scrolling, no decorative motion (prefers-reduced-motion)
export const getMode = () => {
  if (reducedQuery.matches) return "reduced"
  return slidesQuery.matches ? "slides" : "native"
}

export const prefersReducedMotion = () => reducedQuery.matches
export const canHover = () => hoverQuery.matches

// Calls back with the new mode whenever it changes (breakpoint, input device or motion setting).
export const onModeChange = (callback) => {
  let mode = getMode()

  const check = () => {
    const next = getMode()
    if (next === mode) return
    mode = next
    callback(next)
  }

  slidesQuery.addEventListener("change", check)
  reducedQuery.addEventListener("change", check)
}
