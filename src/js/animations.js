import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { TextPlugin } from "gsap/TextPlugin"
import { SECTIONS } from "./config.js"

gsap.registerPlugin(SplitText, TextPlugin)

const root = document.documentElement

// What moves on each slide, as selectors (the markup carries no animation attributes):
//   words    the oversized typographic elements. They travel further and a little slower than the slide.
//   media    the picture (or the mark on the hero): a small scale + mask reveal
//   items    the content, in a small stagger
//   details  lists that follow their card once it is in place
//   after    a closing line
// Only transform and opacity are animated (and a clip-path on the case-study picture).
const CHOREOGRAPHY = {
  hero: { words: ".hero-name-line, .hero-role-line", items: ".hero-eyebrow, .hero-statement > p, .hero-keywords, .hero-actions" },
  services: { words: ".services-title", items: ".service", details: ".service .capabilities" },
  process: { words: ".process-title", items: ".process-steps li", stagger: 0.1, after: ".process-ai" },
  work: { items: ".work-title, .work-note" },
  project: { words: ".project-number", media: ".project-media", items: ".project-meta" },
  writing: { words: ".writing-intro h3", items: ".writing-intro p, .writing-intro .button, .writing-card" },
  about: { statement: ".about-statement", items: ".about-heading, .about-copy, .about-facts > div" },
  clubs: { words: ".clubs-intro h3", items: ".clubs-intro p, .club" },
  recognition: { items: ".recognition-card" },
  contact: { words: ".footer-contact-text", items: ".footer-heading, .footer-available, .footer-follow-circle" },
}

const choreographyFor = (section) => {
  const name = section.dataset.section
  return CHOREOGRAPHY[name.startsWith("project-") ? "project" : name]
}

const all = (section, selector) => (selector ? gsap.utils.toArray(section.querySelectorAll(selector)) : [])

// --- Contact: looping typewriter, only runs while the footer is on screen ---
const createTypewriter = (element, fullText) => {
  const tl = gsap.timeline({
    paused: true,
    repeat: -1,
    repeatDelay: 1,
  })

  tl.to(element, {
    duration: 1.5,
    text: fullText,
    ease: "none",
  })
    .to({}, { duration: 2 })
    .to(element, {
      duration: 1,
      text: "",
      ease: "none",
    })
    .to({}, { duration: 0.5 })

  return tl
}

export const initAnimations = () => {
  const sections = gsap.utils.toArray("[data-section]")

  const statementSplit = new SplitText(".about-statement", { type: "chars, words" })
  const statementChars = statementSplit.chars

  const typewriterElement = document.querySelector(".footer-project-text")
  const typewriterText = typewriterElement.textContent
  const typewriter = createTypewriter(typewriterElement, typewriterText)

  // every element some entrance fades in (the hero is handled separately: it must be visible at first paint)
  const targetsOf = (section) => {
    const c = choreographyFor(section)
    if (!c) return []
    const list = [c.words, c.media, c.items, c.details, c.after].flatMap((s) => all(section, s))
    if (c.statement) list.push(...statementChars)
    return list
  }
  const heroSection = sections.find((section) => section.dataset.section === "hero")
  const contentSections = sections.filter((section) => section !== heroSection)
  const allTargets = () => contentSections.flatMap(targetsOf)
  // the hero's own pieces also move when the page leaves it / comes back, so a mode change must reset them too
  const heroTargets = () => targetsOf(heroSection)

  // timelines in flight, so a mode change or a reduced-motion switch can stop them all
  const running = new Set()
  const timeline = (vars = {}) => {
    const tl = gsap.timeline({
      ...vars,
      onComplete: () => {
        running.delete(tl)
        vars.onComplete?.()
      },
    })
    running.add(tl)
    return tl
  }

  let played = new WeakSet()
  let revealObserver = null
  let mode = null
  let heroStarted = false
  let heroSplits = []

  // ---- entering a slide -------------------------------------------------------------------------
  // dir: 1 when the slide arrives from below (moving forward), -1 from above.
  // light: native scrolling (phones, tablets): the same order, but short and small.
  const enter = (section, { dir = 1, light = false } = {}) => {
    const c = choreographyFor(section)
    if (!c) return

    const name = section.dataset.section
    const calm = SECTIONS[name]?.motion === "calm"

    // Motion supports the interface: everything here travels a short, deliberate distance and settles quickly.
    const shift = (light ? 14 : calm ? 16 : 24) * dir
    const wordShift = (light ? 16 : 32) * dir

    const words = all(section, c.words)
    const media = all(section, c.media)
    const items = all(section, c.items)
    const details = all(section, c.details)
    const after = all(section, c.after)
    const touched = [...words, ...media, ...items, ...details, ...after]

    const tl = timeline({ delay: light ? 0.04 : 0.08 })

    if (words.length) {
      tl.fromTo(
        words,
        { opacity: 0, y: wordShift },
        { opacity: 1, y: 0, duration: light ? 0.35 : 0.45, stagger: 0.05, ease: "power2.out" },
        0
      )
    }

    // the case-study picture: a short scale-down under a mask, never more than a hint of movement
    if (media.length) {
      tl.fromTo(
        media,
        { opacity: 0, y: 20 * dir, scale: 1.03, clipPath: "inset(6% 4% 6% 4% round 8%)" },
        { opacity: 1, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0% round 8%)", duration: light ? 0.35 : 0.5, ease: "power2.out" },
        0.06
      )
    }

    if (c.statement) {
      tl.fromTo(
        statementChars,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.004, ease: "power1.out" },
        0.04
      )
    }

    if (items.length) {
      tl.fromTo(
        items,
        { opacity: 0, y: shift },
        { opacity: 1, y: 0, duration: 0.4, stagger: c.stagger ?? 0.06, ease: "power2.out" },
        c.statement ? 0.22 : 0.14
      )
    }

    // capabilities appear once their card is in place (one fade per list, not per bullet)
    if (details.length) {
      tl.fromTo(details, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1, ease: "power2.out" }, 0.4)
    }

    if (after.length) {
      tl.fromTo(after, { opacity: 0, y: shift / 2 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, ">-0.2")
    }

    // nothing should keep a transform once it is in place (a leftover one would trap a fixed panel inside it)
    tl.add(() => gsap.set([...touched, ...(c.statement ? statementChars : [])], { clearProps: "transform,clipPath" }))

    played.add(section)
  }

  // ---- leaving a slide (slides mode): the content goes the way the page goes -------------------
  const leave = (section, { dir = 1 } = {}) => {
    const c = choreographyFor(section)
    if (!c) return

    const words = all(section, c.words)
    const others = [c.media, c.items, c.details, c.after].flatMap((s) => all(section, s))

    const tl = timeline({ defaults: { ease: "power2.in" } })
    if (words.length) tl.to(words, { y: -dir * 30, opacity: 0.2, duration: 0.35 }, 0)
    if (others.length) tl.to(others, { y: -dir * 16, opacity: 0.35, duration: 0.3 }, 0)
  }

  // ---- hero: the page load ------------------------------------------------------------------
  // A quiet, editorial entrance: the wrapper fades in, the eyebrow and name/role rise into place,
  // then the statement, keywords and buttons settle in a short stagger. Nothing travels far.
  const heroCleanup = () => {
    heroSplits.forEach((split) => split.revert())
    heroSplits = []
    gsap.set(
      [".intro-wrapper", ".hero-name-line", ".hero-role-line", ...heroTargets()],
      { clearProps: "opacity,transform" }
    )
  }

  const playHeroIntro = async () => {
    heroStarted = true

    if (mode === "reduced") {
      root.classList.remove("motion-pending")
      return
    }

    // measure the lines with the real font, but never make the page wait for it
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 700))])
    if (mode === "reduced") {
      root.classList.remove("motion-pending")
      return
    }

    // Lines are measured with the real font. If it has not arrived (slow network) the name and role simply rise as blocks.
    const measured = document.fonts.status === "loaded"
    heroSplits = measured
      ? [".hero-name-line", ".hero-role-line"].map((selector) => new SplitText(selector, { type: "lines", mask: "lines", aria: "none" }))
      : []
    const lines = measured ? heroSplits.flatMap((split) => split.lines) : gsap.utils.toArray(".hero-name-line, .hero-role-line")
    const eyebrow = gsap.utils.toArray(".hero-eyebrow")
    const statement = gsap.utils.toArray(".hero-statement > p")
    const keywords = gsap.utils.toArray(".hero-keywords")
    const buttons = gsap.utils.toArray(".hero-actions .button")

    gsap.set(".intro-wrapper", { opacity: 0 })
    gsap.set(eyebrow, { opacity: 0, y: 10 })
    gsap.set(lines, measured ? { yPercent: 106 } : { opacity: 0, y: 18 })
    gsap.set([...statement, ...keywords], { opacity: 0, y: 14 })
    gsap.set(buttons, { opacity: 0, y: 10 })
    root.classList.remove("motion-pending")

    timeline({ onComplete: heroCleanup })
      .to(".intro-wrapper", { opacity: 1, duration: 0.4, ease: "power1.out" }, 0)
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.05)
      .to(lines, { ...(measured ? { yPercent: 0 } : { opacity: 1, y: 0 }), duration: 0.5, stagger: 0.08, ease: "power2.out" }, 0.15)
      .to(statement, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.3)
      .to(keywords, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.38)
      .to(buttons, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }, 0.4)
  }

  // ---- called by navigation (slides mode) ------------------------------------------------------
  const onSectionEnter = (section, { dir = 1, initial = false } = {}) => {
    document.querySelectorAll(".project-details[open]").forEach((details) => {
      if (!section.contains(details)) details.open = false
    })

    const name = section.dataset.section
    // the hero plays its own intro on load
    if (name !== "hero" || (heroStarted && !initial)) enter(section, { dir })

    if (SECTIONS[name].motion === "contact") typewriter.play()
    else typewriter.pause()
  }

  const onSectionLeave = (section, { dir = 1 } = {}) => leave(section, { dir })

  // ---- native mode: entrances play, once, as their section scrolls into view --------------------
  const startRevealObserver = () => {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (SECTIONS[target.dataset.section].motion === "contact") {
            if (isIntersecting) typewriter.play()
            else typewriter.pause()
          }
          if (isIntersecting && !played.has(target)) enter(target, { light: true })
        })
      },
      { threshold: 0.3 }
    )

    contentSections.forEach((section) => revealObserver.observe(section))
  }

  const stopRevealObserver = () => {
    revealObserver?.disconnect()
    revealObserver = null
  }

  const stopEverything = () => {
    running.forEach((tl) => tl.kill())
    running.clear()
    gsap.killTweensOf([...allTargets(), ...heroTargets()])
  }

  // Reduced motion: everything is simply there, nothing moves.
  const showEverything = () => {
    stopEverything()
    heroCleanup()
    gsap.set(allTargets(), { clearProps: "opacity,transform,clipPath" })
    typewriter.pause()
    typewriterElement.textContent = typewriterText
    root.classList.remove("motion-pending")
  }

  const setMode = (next) => {
    if (next === mode) return
    mode = next

    stopRevealObserver()
    stopEverything()
    typewriter.pause()

    if (next === "reduced") {
      showEverything()
      return
    }

    // slides / native: what entrances will bring in starts hidden. If the hero intro was cut short, finish it cleanly.
    if (heroStarted) heroCleanup()
    gsap.set(heroTargets(), { clearProps: "opacity,transform" })
    played = new WeakSet()
    gsap.set(allTargets(), { opacity: 0 })

    if (next === "native") startRevealObserver()
  }

  return { onSectionEnter, onSectionLeave, setMode, playHeroIntro }
}
