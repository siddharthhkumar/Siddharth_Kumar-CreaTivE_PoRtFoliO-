import gsap from "gsap"
import ScrollToPlugin from "gsap/ScrollToPlugin"
import Observer from "gsap/Observer"
import { SECTIONS } from "./config.js"

gsap.registerPlugin(ScrollToPlugin, Observer)

const root = document.documentElement
const header = document.querySelector("header")

// Filled by initNavigation(): the slides in DOM order, so adding/removing/reordering slides
// needs no code change. Not collected at import time because project slides are generated later.
let sections = []
let navLinks = []
let onSectionEnter = () => {}
let onSectionLeave = () => {}

let currentIndex = 0
let isAnimating = false
let pendingIndex = null
let scrollTween = null

let slidesActive = false
let wheelObserver = null
let dragObserver = null

// Sets the header colour from the section's config.
const applyHeaderTheme = (section) => {
  header.classList.toggle("header-dark", SECTIONS[section.dataset.section].header === "dark")
}

// Marks the header link of the section on screen (the underline under it is a CSS transition on this attribute).
const setActiveNav = (section) => {
  const current = SECTIONS[section.dataset.section].nav

  navLinks.forEach((link) => {
    if (link.dataset.nav === current) link.setAttribute("aria-current", "location")
    else link.removeAttribute("aria-current")
  })
}

// --------------------------------
// POSITIONS (read from the layout, never assumed to be one viewport per slide)
// --------------------------------

// Scroll position that puts a slide at the top of the viewport.
const scrollTargetFor = (index) => {
  // the first slide sits under the intro box's top gap: its target is the top of the page
  if (index === 0) return 0

  const top = sections[index].getBoundingClientRect().top + window.scrollY
  // the last slide may be shorter than the viewport: never aim past the end of the page
  return Math.min(top, root.scrollHeight - window.innerHeight)
}

// Index of the section behind the header (the last one whose top has passed that line).
const indexAtHeader = () => {
  const line = Math.min(header.offsetHeight / 2, 60)

  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].getBoundingClientRect().top <= line) return i
  }
  return 0
}

const snapTo = (index) => {
  window.scrollTo({ top: scrollTargetFor(index), left: 0, behavior: "instant" })
}

// --------------------------------
// SLIDES MODE: one gesture = one slide, moved by GSAP
// --------------------------------

// While a transition runs, input is ignored (one gesture = one slide). A keyboard focus jump is the
// exception: with { queue: true } it is replayed once the transition ends.
const goToSection = (index, { queue = false } = {}) => {
  if (!slidesActive || index < 0 || index >= sections.length) {
    return
  }

  if (isAnimating) {
    if (queue) pendingIndex = index
    return
  }

  const previous = sections[currentIndex]
  const dir = index > currentIndex ? 1 : -1

  isAnimating = true
  pendingIndex = null
  currentIndex = index

  const section = sections[index]

  applyHeaderTheme(section)
  setActiveNav(section)

  // the old slide's content goes the way the page goes, the new slide's content arrives from that side
  onSectionLeave(previous, { dir })
  onSectionEnter(section, { dir })

  scrollTween = gsap.to(window, {
    scrollTo: { y: scrollTargetFor(index) },
    duration: 0.55,
    ease: "power2.inOut",
    onComplete: () => {
      isAnimating = false
      if (pendingIndex !== null && pendingIndex !== currentIndex) goToSection(pendingIndex)
    },
  })
}

// Wheel gestures come from a fixed device: they are relayed as-is.
const wheelNext = () => goToSection(currentIndex + 1)
const wheelPrevious = () => goToSection(currentIndex - 1)

// Keyboard: overflow is hidden in slides mode, so the browser will not scroll for us.
const onKeydown = (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.target.closest("input, textarea, select, [contenteditable]")) return
  // an opened case study uses the keys to scroll; Space on a disclosure button toggles it
  if (event.target.closest(".project-details-body")) return
  if (event.key === " " && event.target.closest("summary")) return

  let index
  switch (event.key) {
    case "ArrowDown":
    case "PageDown":
      index = currentIndex + 1
      break
    case "ArrowUp":
    case "PageUp":
      index = currentIndex - 1
      break
    case " ":
      index = currentIndex + (event.shiftKey ? -1 : 1)
      break
    case "Home":
      index = 0
      break
    case "End":
      index = sections.length - 1
      break
    default:
      return
  }

  event.preventDefault()
  goToSection(index)
}

// Tabbing to a control that lives in another slide must bring that slide on screen.
const onFocusIn = (event) => {
  const section = event.target.closest("[data-section]")
  const index = sections.indexOf(section)

  if (index !== -1 && index !== currentIndex) goToSection(index, { queue: true })
}

const enableSlides = () => {
  slidesActive = true
  root.classList.add("slides-mode")

  currentIndex = indexAtHeader()
  applyHeaderTheme(sections[currentIndex])
  setActiveNav(sections[currentIndex])
  snapTo(currentIndex)
  // the slide we land on (page load, or coming from native scrolling) gets its entrance
  onSectionEnter(sections[currentIndex], { dir: 1, initial: true })

  wheelObserver = Observer.create({
    type: "wheel",
    preventDefault: true,
    // an opened case study scrolls on its own instead of moving the slides
    ignore: ".project-details-body",
    onUp: wheelPrevious,
    onDown: wheelNext,
    tolerance: 10,
  })

  // Touch and mouse drag follow the gesture: dragging up brings the next slide (natural direction).
  dragObserver = Observer.create({
    type: "touch,pointer",
    preventDefault: true,
    ignore: ".project-details-body",
    onUp: wheelNext,
    onDown: wheelPrevious,
    tolerance: 10,
  })

  window.addEventListener("keydown", onKeydown)
  document.addEventListener("focusin", onFocusIn)
}

const disableSlides = () => {
  slidesActive = false

  wheelObserver?.kill()
  dragObserver?.kill()
  wheelObserver = dragObserver = null

  scrollTween?.kill()
  isAnimating = false
  pendingIndex = null

  window.removeEventListener("keydown", onKeydown)
  document.removeEventListener("focusin", onFocusIn)
  root.classList.remove("slides-mode")
}

// --------------------------------
// NATIVE MODE: the browser scrolls, we only follow along for the header colour
// --------------------------------

let scrollFrame = 0

const syncFromScroll = () => {
  currentIndex = indexAtHeader()
  applyHeaderTheme(sections[currentIndex])
  setActiveNav(sections[currentIndex])
}

const onScroll = () => {
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    syncFromScroll()
  })
}

const startNativeSync = () => {
  window.addEventListener("scroll", onScroll, { passive: true })
  syncFromScroll()
}

const stopNativeSync = () => {
  window.removeEventListener("scroll", onScroll)
  cancelAnimationFrame(scrollFrame)
  scrollFrame = 0
}

// --------------------------------
// RESIZE: re-align the current slide with the new layout
// --------------------------------

let resizeFrame = 0

const onResize = () => {
  if (resizeFrame) return
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0
    if (!slidesActive) return

    // a running tween aims at a position computed for the old layout
    scrollTween?.kill()
    isAnimating = false
    snapTo(currentIndex)
  })
}

// --------------------------------
// PUBLIC API
// --------------------------------

export const initNavigation = ({ onSectionEnter: onEnter, onSectionLeave: onLeave }) => {
  sections = gsap.utils.toArray("[data-section]")
  navLinks = gsap.utils.toArray("header nav [data-nav]")
  onSectionEnter = onEnter
  onSectionLeave = onLeave

  window.addEventListener("resize", onResize)

  return {
    // Jumps to the first slide with the given section name (e.g. "projects"). Slides mode only:
    // in native mode the header links are plain anchors and the browser scrolls.
    goTo: (name) => {
      const index = sections.findIndex((section) => section.dataset.section === name)
      goToSection(index)
    },

    setMode: (mode) => {
      if (mode === "slides") {
        stopNativeSync()
        enableSlides()
      } else {
        disableSlides()
        startNativeSync()
      }
    },
  }
}
