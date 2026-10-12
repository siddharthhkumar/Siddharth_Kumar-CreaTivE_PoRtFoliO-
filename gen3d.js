import * as THREE from "three"
import VanillaTilt from "vanilla-tilt"

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches

// UI/UX plugin: depth tilt + glare on cards (desktop pointers only).
if (!reduceMotion && finePointer) {
  VanillaTilt.init(document.querySelectorAll(".metric-card, .arsenal-card, .pub-card, .lt-link-card"), {
    max: 8, speed: 400, scale: 1.02, glare: true, "max-glare": 0.25, perspective: 900,
  })
}

// Interactive 3D Poké Balls floating beside the content. Hover to enlarge, click (on the open
// background) to pop one: it spins up, bursts into sparkles and a new ball drops back in.
const host = document.getElementById("gen3d")
const scroller = document.getElementById("info")
if (host && scroller) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 14

  const ambient = new THREE.AmbientLight(0xffffff, 1.1)
  const key = new THREE.DirectionalLight(0xffffff, 1.8)
  key.position.set(4, 6, 8)
  scene.add(ambient, key)

  // ball types: [top colour, band colour]
  const TYPES = [
    [0xe3350d, 0x1b1b1b], // Poké Ball
    [0x2a74d6, 0x1b1b1b], // Great Ball
    [0x2b2b33, 0xf2c14e], // Ultra Ball
    [0x7b3fc4, 0x1b1b1b], // Master Ball
    [0xf4f4f4, 0xe3350d], // Premier Ball
  ]
  const hemiTop = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const hemiBottom = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
  const core = new THREE.SphereGeometry(0.985, 24, 16)
  const band = new THREE.TorusGeometry(1, 0.065, 12, 48)
  const buttonRing = new THREE.CylinderGeometry(0.27, 0.27, 0.14, 32)
  const buttonDot = new THREE.CylinderGeometry(0.16, 0.16, 0.18, 32)
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.4 })
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f6, roughness: 0.25, clearcoat: 1 })
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0x444444 })

  const makeBall = (type) => {
    const [topColor, bandColor] = TYPES[type % TYPES.length]
    const g = new THREE.Group()
    const topMat = new THREE.MeshPhysicalMaterial({ color: topColor, roughness: 0.2, clearcoat: 1, side: THREE.DoubleSide })
    const bandMat = bandColor === 0x1b1b1b ? dark : new THREE.MeshStandardMaterial({ color: bandColor, roughness: 0.35 })
    g.add(new THREE.Mesh(hemiTop, topMat), new THREE.Mesh(hemiBottom, white), new THREE.Mesh(core, dark))
    const b = new THREE.Mesh(band, bandMat)
    b.rotation.x = Math.PI / 2
    g.add(b)
    const ring = new THREE.Mesh(buttonRing, bandMat)
    ring.rotation.x = Math.PI / 2
    ring.position.z = 0.97
    const dot = new THREE.Mesh(buttonDot, buttonMat)
    dot.rotation.x = Math.PI / 2
    dot.position.z = 1.02
    g.add(ring, dot)
    return g
  }

  const count = window.innerWidth < 700 ? 8 : 14
  const balls = []
  const place = (ball, fresh) => {
    const side = ball.userData.side
    const x = side * (5.2 + Math.random() * 8)
    const y = (Math.random() - 0.5) * 14
    ball.position.set(x, fresh ? y + 12 : y, -3 - Math.random() * 8)
    ball.userData.baseY = y
    ball.userData.baseScale = 0.45 + Math.random() * 0.55
    ball.userData.depth = ball.position.z
    ball.scale.setScalar(ball.userData.baseScale)
  }
  for (let i = 0; i < count; i++) {
    const ball = makeBall(i)
    ball.userData = {
      side: i % 2 ? 1 : -1, phase: Math.random() * Math.PI * 2,
      spin: 0.004 + Math.random() * 0.006, boost: 0, hover: 0, popping: 0,
    }
    place(ball, false)
    ball.rotation.set(Math.random() * 3, Math.random() * 3, 0)
    balls.push(ball)
    scene.add(ball)
  }

  // sparkle burst
  const sparkles = []
  const sparkGeo = new THREE.SphereGeometry(0.07, 6, 6)
  const burst = (pos, color) => {
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: i % 3 ? color : 0xfff2a8, transparent: true }))
      m.position.copy(pos)
      m.userData = { v: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.28), life: 1 }
      sparkles.push(m)
      scene.add(m)
    }
  }

  const applyMode = (night) => {
    ambient.intensity = night ? 0.55 : 1.1
    ambient.color.set(night ? 0x8fa6ff : 0xffffff)
    key.intensity = night ? 1.4 : 1.8
    key.color.set(night ? 0xbcd0ff : 0xffffff)
  }
  applyMode(scroller.classList.contains("night-mode"))
  window.addEventListener("nightmodechange", (e) => applyMode(e.detail.on))

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener("resize", resize, { passive: true })

  // pointer: hover raycast + click-to-pop, only over open background (not cards)
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  let mx = 0, my = 0, hovered = null
  const pick = (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(balls, true)[0]
    if (!hit) return null
    let o = hit.object
    while (o.parent && o.parent !== scene) o = o.parent
    return o
  }
  const openArea = (e) => e.target === scroller || e.target.classList?.contains("site")
  scroller.addEventListener("pointermove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2
    my = (e.clientY / window.innerHeight - 0.5) * 2
    hovered = openArea(e) ? pick(e) : null
    scroller.style.cursor = hovered ? "pointer" : ""
  }, { passive: true })
  scroller.addEventListener("pointerdown", (e) => {
    if (!openArea(e)) return
    const ball = pick(e)
    if (!ball || ball.userData.popping) return
    ball.userData.popping = 1
    ball.userData.boost = 0.35
    burst(ball.position, TYPES[balls.indexOf(ball) % TYPES.length][0])
  })

  let running = true
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) frame(0) })

  const frame = (t) => {
    if (!running) return
    const scroll = scroller.scrollTop * 0.004
    balls.forEach((m) => {
      const d = m.userData
      d.boost *= 0.96
      d.hover += ((m === hovered ? 1 : 0) - d.hover) * 0.15
      m.rotation.y += d.spin + d.boost
      m.rotation.x += d.spin * 0.5
      m.position.y += (d.baseY + Math.sin(t * 0.0006 + d.phase) * 0.8 + scroll * (1 + d.depth * -0.05) - m.position.y) * 0.1
      let s = d.baseScale * (1 + d.hover * 0.25)
      if (d.popping) {
        d.popping *= 0.93
        s *= d.popping > 0.5 ? 1 + (1 - d.popping) * 1.2 : d.popping * 2
        if (d.popping < 0.02) { d.popping = 0; place(m, true); s = 0.01 }
      }
      m.scale.setScalar(Math.max(s, 0.01))
    })
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const p = sparkles[i]
      p.position.add(p.userData.v)
      p.userData.life -= 0.025
      p.material.opacity = Math.max(p.userData.life, 0)
      if (p.userData.life <= 0) { scene.remove(p); p.material.dispose(); sparkles.splice(i, 1) }
    }
    camera.position.x += (mx * 1.2 - camera.position.x) * 0.04
    camera.position.y += (-my * 0.8 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(frame)
  }
  frame(0)
}
