import gsap from "gsap"
import { getMode, canHover, prefersReducedMotion } from "./mode.js"

// In-page links (header, hero buttons, ...): <a href="#<id>"> where the id is a section or lives inside one.
// Slides mode moves the page with GSAP (directional transition, active link kept in step); otherwise the
// anchor's native behaviour scrolls (and works without JS, with the keyboard and with focus handling for free).
const initAnchors = (goTo) => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (getMode() !== "slides") return

      const target = document.getElementById(link.getAttribute("href").slice(1))
      const section = target?.closest("[data-section]")
      if (!section) return

      event.preventDefault()
      goTo(section.dataset.section)
    })
  })
}

// Scales an element on hover. Skipped on touch screens (no real hover) and with reduced motion.
const initHoverScale = (selector, scale, duration) => {
  const animate = (el, to) => {
    if (!canHover() || prefersReducedMotion()) return
    gsap.to(el, { scale: to, duration, ease: "power2.out" })
  }

  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener("mouseenter", () => animate(el, scale))
    el.addEventListener("mouseleave", () => animate(el, 1))
  })
}

// --------------------------------
// CASE STUDIES: the story opens and closes with a short motion; with reduced motion it is instant
// --------------------------------
const closing = new WeakSet()

const partsOf = (details) => {
  const body = details.querySelector(".project-details-body")
  return {
    body,
    // one motion per section of the story, not per paragraph
    parts: gsap.utils.toArray(body.querySelectorAll(".case-part")),
    figures: gsap.utils.toArray(body.querySelectorAll(".case-figure img")),
    word: details.closest(".project-item").querySelector(".project-number"),
  }
}

const openMotion = (details) => {
  if (prefersReducedMotion()) return

  const { body, parts, figures, word } = partsOf(details)

  gsap.killTweensOf([body, ...parts, ...figures])
  gsap.fromTo(body, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "opacity,transform" })
  if (parts.length) {
    gsap.fromTo(
      parts,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, delay: 0.08, ease: "power2.out", clearProps: "opacity,transform" }
    )
  }
  if (figures.length) gsap.fromTo(figures, { scale: 1.02 }, { scale: 1, duration: 0.5, ease: "power2.out", clearProps: "transform" })

  // on the stage the project number steps back so the story is in focus
  if (word && getMode() === "slides") gsap.to(word, { opacity: 0.3, duration: 0.3, ease: "power2.out" })
}

const closeStory = (details, { returnFocus = false } = {}) => {
  if (!details.open || closing.has(details)) return

  const { body, parts, word } = partsOf(details)

  const finish = () => {
    closing.delete(details)
    details.open = false
    gsap.set([body, ...parts], { clearProps: "opacity,transform" })
    if (returnFocus) details.querySelector("summary").focus()
  }

  if (word && getMode() === "slides") gsap.to(word, { opacity: 1, duration: 0.3, ease: "power2.out" })

  if (prefersReducedMotion()) {
    finish()
    return
  }

  closing.add(details)
  gsap.to(body, { opacity: 0, y: 12, duration: 0.25, ease: "power2.in", onComplete: finish })
}

const initCaseStudies = () => {
  document.querySelectorAll(".project-details").forEach((details) => {
    // opening is the browser's own toggle; closing is intercepted so it can animate
    details.querySelector("summary").addEventListener("click", (event) => {
      if (!details.open) return

      event.preventDefault()
      closeStory(details)
    })

    details.addEventListener("toggle", () => {
      if (details.open) openMotion(details)
    })
  })

  // Escape closes an opened case study and puts focus back on its toggle.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return

    const details = document.querySelector(".project-details[open]")
    if (details) closeStory(details, { returnFocus: true })
  })

  // On the stage the story is a panel: a click anywhere outside it (and outside the caption) closes it.
  document.addEventListener("click", (event) => {
    if (getMode() !== "slides") return
    if (event.target.closest(".project-details-body, .project-meta")) return

    const details = document.querySelector(".project-details[open]")
    if (details) closeStory(details)
  })
}

export const initInteractions = ({ goTo }) => {
  initCaseStudies()
  initAnchors(goTo)
  initHoverScale(".project-item .project-media", 1.02, 0.4)
}
