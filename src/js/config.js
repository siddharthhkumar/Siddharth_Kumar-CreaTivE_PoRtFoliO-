// Media queries that decide how the page behaves (see mode.js).
// The 1100px here must match the desktop breakpoint in style.css.
export const MEDIA = {
  // full-screen slides driven by wheel/drag: only for a wide screen used with a mouse
  slides: "(min-width: 1100px) and (hover: hover) and (pointer: fine)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
  canHover: "(hover: hover)",
}

// The page content (services, process, case studies, writing, clubs, contact) is plain HTML in index.html, so
// search engines and screen readers get it without running any script. This file only holds what the
// scripts need to know about each slide.
//
// Slide order is defined by the DOM (every slide carries data-section="<name>"); the names here must
// match the HTML.
//   header  colour of the fixed header while this slide is on screen ("light" over the gradient
//           slides, "dark" over white ones)
//   nav     which header link is "current" while this slide is on screen (its data-nav), or null
//   motion  how the slide enters (see animations.js):
//             "stage"    the full choreography: oversized word, picture, then the content in a small stagger
//             "calm"     the same order, smaller and quicker: supporting evidence, not the main event
//             "about"    the statement types in character by character, then its details
//             "contact"  the footer: the typed line and the closing call to action
//           the hero has no entry here on purpose: it plays its own intro when the page loads
export const SECTIONS = {
  hero: { header: "light", nav: null },
  services: { header: "dark", nav: null, motion: "stage" },
  process: { header: "dark", nav: null, motion: "stage" },
  work: { header: "dark", nav: "work", motion: "stage" },
  "project-1": { header: "dark", nav: "work", motion: "stage" },
  "project-2": { header: "dark", nav: "work", motion: "stage" },
  "project-3": { header: "dark", nav: "work", motion: "stage" },
  writing: { header: "dark", nav: "writing", motion: "stage" },
  about: { header: "dark", nav: "about", motion: "about" },
  clubs: { header: "dark", nav: "about", motion: "calm" },
  recognition: { header: "dark", nav: "about", motion: "calm" },
  // the top strip of the footer sits on the white page background, so the header stays dark
  contact: { header: "dark", nav: "contact", motion: "contact" },
}
