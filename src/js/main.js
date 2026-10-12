import { getMode, onModeChange } from "./mode.js"
import { initAnimations } from "./animations.js"
import { initNavigation } from "./navigation.js"
import { initInteractions } from "./interactions.js"

const animations = initAnimations()
const navigation = initNavigation({
  onSectionEnter: animations.onSectionEnter,
  onSectionLeave: animations.onSectionLeave,
})
initInteractions({ goTo: navigation.goTo })

// One place decides how the page behaves (slides / native / reduced) and re-applies it when the
// viewport, the input device or the motion preference changes.
const applyMode = (mode) => {
  animations.setMode(mode)
  navigation.setMode(mode)
}

applyMode(getMode())
onModeChange(applyMode)

// the hero plays its own intro (or simply stays as it is with reduced motion)
animations.playHeroIntro()
