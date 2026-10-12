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

// Generative 3D backdrop: a field of procedurally placed glass-like shapes that drift,
// react to the cursor and to scroll. Sits behind the content.
const host = document.getElementById("gen3d")
const scroller = document.getElementById("info")
if (host && scroller) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 14

  scene.add(new THREE.AmbientLight(0xffffff, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(4, 6, 8)
  scene.add(key)

  const palette = [0x2fa36b, 0x7fd6a8, 0x8fcdf0, 0xf2c14e, 0xe36a5a]
  const geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.8, 0.28, 16, 40),
    new THREE.TetrahedronGeometry(1.1, 0),
  ]
  const count = window.innerWidth < 700 ? 14 : 26
  const shapes = []
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: palette[i % palette.length], roughness: 0.15, metalness: 0.1,
      transmission: 0.35, transparent: true, opacity: 0.55, clearcoat: 1,
    })
    const mesh = new THREE.Mesh(geos[i % geos.length], mat)
    const side = i % 2 ? 1 : -1
    mesh.position.set(side * (5 + Math.random() * 9), (Math.random() - 0.5) * 14, -4 - Math.random() * 10)
    mesh.scale.setScalar(0.4 + Math.random() * 0.9)
    mesh.userData = {
      spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.004 + Math.random() * 0.006),
      phase: Math.random() * Math.PI * 2, baseY: mesh.position.y, depth: mesh.position.z,
    }
    shapes.push(mesh)
    scene.add(mesh)
  }

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener("resize", resize, { passive: true })

  let mx = 0, my = 0
  window.addEventListener("pointermove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2
    my = (e.clientY / window.innerHeight - 0.5) * 2
  }, { passive: true })

  let running = true
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) frame(0) })

  const frame = (t) => {
    if (!running) return
    const scroll = scroller.scrollTop * 0.004
    shapes.forEach((m) => {
      const d = m.userData
      m.rotation.x += d.spin.x
      m.rotation.y += d.spin.y
      m.rotation.z += d.spin.z
      m.position.y = d.baseY + Math.sin(t * 0.0006 + d.phase) * 0.8 + scroll * (1 + d.depth * -0.05)
    })
    camera.position.x += (mx * 1.2 - camera.position.x) * 0.04
    camera.position.y += (-my * 0.8 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
    if (!reduceMotion) requestAnimationFrame(frame)
  }
  frame(0)
}
