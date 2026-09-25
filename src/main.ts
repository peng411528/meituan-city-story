import './style.css'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { storyCards, cardArtwork } from './cards'
import { interfaceSound } from './sound'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

const canvas = document.querySelector<HTMLCanvasElement>('#city-canvas')!
const sceneShell = document.querySelector<HTMLElement>('#scene')!
const progressFill = document.querySelector<HTMLElement>('#route-progress-fill')!
const chapterNum = document.querySelector<HTMLElement>('#chapter-num')!
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Free the viewport while moving down, and bring navigation back on the way up.
const siteHeader = document.querySelector<HTMLElement>('.site-header')!
let previousScrollY = window.scrollY
let headerScrollQueued = false
function syncHeaderOnScroll() {
  const currentScrollY = Math.max(0, window.scrollY)
  const delta = currentScrollY - previousScrollY
  if (currentScrollY < 48) siteHeader.classList.remove('is-collapsed')
  else if (delta > 3) siteHeader.classList.add('is-collapsed')
  else if (delta < -3) siteHeader.classList.remove('is-collapsed')
  previousScrollY = currentScrollY
  headerScrollQueued = false
}
window.addEventListener('scroll', () => {
  if (!headerScrollQueued) {
    headerScrollQueued = true
    requestAnimationFrame(syncHeaderOnScroll)
  }
}, { passive: true })
siteHeader.addEventListener('focusin', () => siteHeader.classList.remove('is-collapsed'))

const scene = new THREE.Scene()
scene.background = new THREE.Color('#fffdf5')
scene.fog = new THREE.Fog('#fffdf5', 30, 90)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05

const camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 170)
const hemi = new THREE.HemisphereLight('#ffffff', '#938c72', 1.45)
scene.add(hemi)
const sun = new THREE.DirectionalLight('#fff4dd', 1.65)
sun.position.set(-12, 24, 15)
scene.add(sun)

const C = {
  yellow: '#ffcf24', ink: '#20362f', ground: '#fff0cc', platform: '#fff9e7',
  cream: '#ffe2aa', coral: '#ff795e', blue: '#45b4e8', green: '#46ca98',
  teal: '#3ccac3', orange: '#ff9e36', brown: '#b87956', white: '#fffef8',
  lake: '#33bfd8', leaf: '#44c77b', road: '#ffdc91', shadow: '#b4b19a'
}
const mat = (color: string, roughness = 0.86) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
const mats = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, mat(v)])) as Record<keyof typeof C, THREE.MeshStandardMaterial>
const transparent = (color: string, opacity: number) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })

const root = new THREE.Group()
scene.add(root)
const city = new THREE.Group()
root.add(city)
const activeLandmarks: THREE.Group[] = []
const animatedFlags: THREE.Object3D[] = []
const movingObjects: { mesh: THREE.Object3D; origin: number; range: number; speed: number }[] = []
const focusLight = new THREE.PointLight('#ffd65a', 0, 10, 2)
scene.add(focusLight)
const focusRingGeometry = new THREE.RingGeometry(2.83, 3.12, 56)

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(x, y, z)
  parent.add(m)
  return m
}
function box(parent: THREE.Object3D, w: number, h: number, d: number, color: keyof typeof C, x = 0, y = h / 2, z = 0, radius = 0.08) {
  const geo = radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d)
  return mesh(geo, mats[color], parent, x, y, z)
}
function circle(parent: THREE.Object3D, radius: number, height: number, color: keyof typeof C, x = 0, y = height / 2, z = 0, sides = 24) {
  return mesh(new THREE.CylinderGeometry(radius, radius, height, sides), mats[color], parent, x, y, z)
}
function plane(parent: THREE.Object3D, w: number, d: number, color: keyof typeof C, x = 0, y = 0, z = 0) {
  const m = mesh(new THREE.PlaneGeometry(w, d), mats[color], parent, x, y, z)
  m.rotation.x = -Math.PI / 2
  return m
}
function shadow(parent: THREE.Object3D, w: number, d: number, x = 0, z = 0) {
  const m = mesh(new THREE.PlaneGeometry(w, d), transparent('#5e6258', .09), parent, x + .18, .012, z + .24)
  m.rotation.x = -Math.PI / 2
  return m
}
function signTexture(label: string, bg = '#ffce00', fg = '#262a22') {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 128)
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = '900 72px "Noto Sans SC", sans-serif'
  ctx.fillText(label, 128, 61)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
function sign(parent: THREE.Object3D, label: string, x: number, y: number, z: number, bg = '#ffce00', fg = '#262a22', width = 1.2) {
  const material = new THREE.MeshBasicMaterial({ map: signTexture(label, bg, fg), side: THREE.DoubleSide })
  const m = mesh(new THREE.PlaneGeometry(width, width / 2), material, parent, x, y, z)
  return m
}
function tree(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  const g = new THREE.Group()
  g.position.set(x, 0, z); g.scale.setScalar(scale); parent.add(g)
  circle(g, .12, .65, 'brown', 0, .33, 0, 9)
  const crown = mesh(new THREE.IcosahedronGeometry(.5, 1), mats.leaf, g, 0, 1.05, 0)
  crown.scale.set(1, 1.17, 1)
  return g
}
function person(parent: THREE.Object3D, x: number, z: number, shirt: keyof typeof C) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g)
  circle(g, .11, .38, shirt, 0, .36, 0, 8)
  mesh(new THREE.SphereGeometry(.12, 8, 6), mats.brown, g, 0, .67, 0)
  box(g, .08, .28, .08, 'ink', -.08, .14, 0, 0)
  box(g, .08, .28, .08, 'ink', .08, .14, 0, 0)
  return g
}
function awning(parent: THREE.Object3D, width: number, y: number, z: number, color: keyof typeof C) {
  box(parent, width, .16, .65, color, 0, y, z, .035)
  const stripCount = 6
  for (let i = 0; i < stripCount; i++) {
    box(parent, width / stripCount - .015, .18, .1, i % 2 ? 'white' : color, -width / 2 + width / stripCount * (i + .5), y - .13, z + .33, .025)
  }
}
function building(parent: THREE.Object3D, x: number, z: number, w: number, h: number, d: number, color: keyof typeof C, roof: keyof typeof C = 'cream') {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g)
  shadow(g, w + .4, d + .4)
  box(g, w, h, d, color, 0, h / 2, 0, .11)
  box(g, w + .14, .18, d + .13, roof, 0, h + .05, 0, .045)
  return g
}
function facadeWindows(g: THREE.Object3D, cols: number, rows: number, w: number, h: number, z: number, tint: keyof typeof C = 'blue') {
  const geo = new THREE.BoxGeometry(w, h, .035)
  const count = cols * rows
  const inst = new THREE.InstancedMesh(geo, mats[tint], count)
  const dummy = new THREE.Object3D(); let index = 0
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    dummy.position.set((i - (cols - 1) / 2) * (w + .2), .9 + j * (h + .3), z)
    dummy.updateMatrix(); inst.setMatrixAt(index++, dummy.matrix)
  }
  inst.instanceMatrix.needsUpdate = true
  g.add(inst)
}
function platform(parent: THREE.Object3D, x: number, z: number, w = 6.5, d = 6.5) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g)
  shadow(g, w + .1, d + .1, 0, 0)
  box(g, w, .28, d, 'platform', 0, .08, 0, .2)
  box(g, w - .35, .025, d - .35, 'ground', 0, .235, 0, .05)
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#ffc700',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})
  const ring=mesh(focusRingGeometry,ringMaterial,g,0,.265,0)
  ring.rotation.x=-Math.PI/2
  ring.renderOrder=2
  g.userData.focusRing=ring
  return g
}
function streetLamp(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g)
  circle(g, .04, 1.5, 'ink', 0, .75, 0, 8)
  mesh(new THREE.SphereGeometry(.17, 10, 8), mats.yellow, g, 0, 1.56, 0)
  return g
}
function bike(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, .27, z); g.scale.setScalar(scale); parent.add(g)
  const wheelGeo = new THREE.TorusGeometry(.25, .045, 6, 18)
  const a = mesh(wheelGeo, mats.ink, g, -.4, 0, 0); a.rotation.y = Math.PI / 2
  const b = mesh(wheelGeo, mats.ink, g, .4, 0, 0); b.rotation.y = Math.PI / 2
  const frame = box(g, .74, .055, .055, 'yellow', 0, .22, 0, .025); frame.rotation.z = -.25
  box(g, .26, .055, .1, 'ink', -.1, .47, 0, .02)
  box(g, .06, .37, .06, 'ink', .33, .36, 0, .02)
  return g
}

// One reusable city world: low-detail blocks, shared materials, and instanced windows.
plane(city, 55, 24, 'ground', 0, -.1, 0)
box(city, 54, .025, 1.6, 'road', 0, .015, -5.6, .04)
box(city, 54, .025, 1.6, 'road', 0, .015, 5.5, .04)
const stops = [
  { x: -15, z: 0, type: 'delivery' }, { x: -9, z: 2.4, type: 'dine' },
  { x: -3, z: -1.6, type: 'shopping' }, { x: 3, z: 2.3, type: 'hotel' },
  { x: 9, z: -1.8, type: 'health' }, { x: 15, z: 1.9, type: 'mobility' }
] as const

stops.forEach(({ x, z, type }, idx) => {
  const g = platform(city, x, z)
  activeLandmarks.push(g)
  if (type === 'delivery') {
    const b = building(g, 0, -.35, 2.6, 2.0, 2.1, 'coral', 'orange')
    awning(b, 2.6, 1.43, 1.07, 'yellow'); sign(b, '外卖', 0, 1.9, 1.086, '#ffce00', '#22251c', 1.3)
    box(b, .62, .9, .06, 'blue', -.6, .47, 1.09); box(b, .62, .9, .06, 'blue', .6, .47, 1.09)
    const scooter = new THREE.Group(); scooter.position.set(1.65, .35, 1.55); g.add(scooter)
    circle(scooter, .14, .12, 'yellow', 0, .26, 0, 12); box(scooter, .6, .13, .3, 'ink', .05, .25, 0)
    circle(scooter, .21, .15, 'ink', -.32, .12, 0); circle(scooter, .21, .15, 'ink', .38, .12, 0)
    box(scooter, .45, .42, .42, 'yellow', -.05, .57, 0)
    movingObjects.push({ mesh: scooter, origin: scooter.position.x, range: .25, speed: .8 })
    person(g, -1.9, 1.45, 'yellow')
  } else if (type === 'dine') {
    const b = building(g, -.3, -.65, 3.0, 2.35, 1.9, 'cream', 'coral')
    awning(b, 3.05, 1.66, .98, 'coral'); sign(b, '到店', 0, 2.15, 1.0, '#f8f3e5', '#3b4034', 1.3)
    box(b, 1.15, 1.05, .06, 'blue', 0, .61, 1.0)
    circle(g, .48, .12, 'brown', 1.78, .7, 1.2); circle(g, .05, .65, 'ink', 1.78, .35, 1.2)
    circle(g, .48, .07, 'yellow', 1.78, 1.73, 1.2)
    person(g, -1.7, 1.5, 'blue'); person(g, .9, 1.8, 'green')
  } else if (type === 'shopping') {
    const b = building(g, 0, -.45, 3, 2.1, 2.2, 'blue', 'white')
    awning(b, 3, 1.46, 1.13, 'yellow'); sign(b, '闪购', 0, 1.91, 1.15, '#ffce00', '#22251c', 1.35)
    box(b, 2.2, .84, .06, 'teal', 0, .59, 1.15)
    for (let i=0;i<3;i++) box(g, .55, .55 + i*.08, .5, i%2 ? 'orange':'yellow', 1.72+i*.1, .5+i*.04, 1.15+i*.5)
    person(g, -1.75, 1.58, 'coral')
  } else if (type === 'hotel') {
    const b = building(g, 0, -.5, 2.6, 4.4, 2.3, 'cream', 'blue')
    facadeWindows(b, 3, 3, .38, .55, 1.17, 'blue')
    sign(b, '酒店', 0, 4.04, 1.175, '#ffce00', '#22251c', 1.5)
    box(b, .72, .93, .05, 'brown', 0, .49, 1.18)
    tree(g, -1.95, 1.22, .8); tree(g, 1.8, 1.55, .72)
    person(g, 1.3, 1.65, 'coral')
  } else if (type === 'health') {
    const b = building(g, 0, -.45, 2.65, 2.6, 2.1, 'white', 'green')
    box(b, 1.23, .26, .05, 'coral', 0, 2.05, 1.09)
    box(b, .28, 1.13, .05, 'coral', 0, 2.05, 1.1)
    box(b, 1.15, 1.0, .05, 'teal', 0, .64, 1.1)
    sign(b, '药房', 0, 3.02, .2, '#ffce00', '#22251c', 1.1)
    tree(g, -1.85, 1.6, .7)
    person(g, 1.65, 1.46, 'blue')
  } else {
    box(g, 2.3, .17, 1.2, 'blue', -.2, 1.68, -.8)
    box(g, .12, 1.68, .12, 'ink', -1.17, .84, -.8)
    box(g, .12, 1.68, .12, 'ink', .78, .84, -.8)
    sign(g, '出行', -.2, 1.85, -.19, '#ffce00', '#22251c', 1.1)
    bike(g, -1.1, 1.25, 1.1); bike(g, -.03, 1.25, 1.1)
    const car = new THREE.Group(); car.position.set(1.75, 0, 1.5); g.add(car)
    box(car, 1.5, .52, .83, 'yellow', 0, .52, 0, .16)
    box(car, .8, .38, .7, 'white', -.12, .95, 0, .11)
    circle(car, .15, .12, 'ink', -.48, .19, -.47); circle(car, .15, .12, 'ink', .5, .19, -.47)
    movingObjects.push({ mesh: car, origin: car.position.x, range: .34, speed: .5 })
  }
  // Street furniture makes each stop a recognizable place rather than an icon on a card.
  if (idx !== 3 && idx !== 4) tree(g, -2.45, -1.9, .62)
  streetLamp(g, 2.55, -2.15)
})

// Sparse city blocks create depth without a dense mesh budget.
for (let i=0;i<18;i++) {
  const x = -23 + i*2.7
  const z = i%2 ? -8.6 : 8.6
  const h = .7 + (i%4)*.35
  const b = building(city, x, z, 1.1+(i%3)*.2, h, 1.1, i%3===0?'cream':i%3===1?'blue':'brown', 'white')
  b.rotation.y = i%3===0 ? .12 : -.1
}

const cityPoints = stops.map(s => new THREE.Vector3(s.x, .34, s.z + 2.1))
cityPoints.unshift(new THREE.Vector3(-20, .34, -1.5))
const cityCurve = new THREE.CatmullRomCurve3(cityPoints, false, 'catmullrom', .2)
const routeTube = new THREE.TubeGeometry(cityCurve, 160, .12, 8, false)
mesh(routeTube, mats.yellow, city)
const routeEdge = new THREE.TubeGeometry(cityCurve, 160, .18, 8, false)
const edgeMesh = mesh(routeEdge, transparent('#fffdfa', .55), city)
edgeMesh.renderOrder = -1

function createArrow(parent: THREE.Object3D) {
  const g = new THREE.Group(); parent.add(g)
  const shape = new THREE.Shape()
  shape.moveTo(0, .9); shape.lineTo(-.55, .1); shape.lineTo(-.22, .1)
  shape.lineTo(-.22, -.73); shape.lineTo(.22, -.73); shape.lineTo(.22, .1)
  shape.lineTo(.55, .1); shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .18, bevelEnabled: true, bevelThickness: .055, bevelSize: .055, bevelSegments: 2, steps: 1 })
  const m = mesh(geo, mats.yellow, g)
  m.rotation.x = -Math.PI/2
  g.scale.setScalar(.75)
  const disc = mesh(new THREE.CylinderGeometry(.62,.62,.055,24), transparent('#24271b', .15), g, 0, -.15, 0)
  disc.rotation.y = .4
  return g
}
const cityArrow = createArrow(city)
function positionArrow(arrow: THREE.Group, curve: THREE.CatmullRomCurve3, t: number) {
  const p = curve.getPointAt(THREE.MathUtils.clamp(t,0,1))
  const tangent = curve.getTangentAt(THREE.MathUtils.clamp(t,0,1))
  arrow.position.set(p.x, p.y + .26, p.z)
  arrow.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI
}

const view = { x:-18, z:0, zoom:1, cityT:0 }
const pointer = { x:0, y:0, easedX:0, easedY:0 }
let activeStage = 'start'
let paused = false

const stageInfo: Record<string,{x:number,z:number,zoom:number,cityT?:number}> = {
  start:{x:0,z:0,zoom:.48,cityT:.45}, hero:{x:-18,z:0,zoom:.95,cityT:0}, delivery:{x:-15,z:0,zoom:1.2,cityT:.1},
  dine:{x:-9,z:2.4,zoom:1.25,cityT:.27}, shopping:{x:-3,z:-1.6,zoom:1.25,cityT:.44},
  hotel:{x:3,z:2.3,zoom:1.25,cityT:.62}, health:{x:9,z:-1.8,zoom:1.25,cityT:.78},
  mobility:{x:15,z:1.9,zoom:1.18,cityT:.94}, how:{x:15,z:1.9,zoom:1.1},
  weekend:{x:15,z:1.9,zoom:1.1},
  closing:{x:0,z:0,zoom:.42,cityT:.94}
}

function fitCamera() {
  const aspect = window.innerWidth/window.innerHeight
  const height = window.innerWidth<720 ? 15 : 14
  camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setSize(window.innerWidth,window.innerHeight)
}
fitCamera()
window.addEventListener('resize',()=>{fitCamera();ScrollTrigger.refresh()})
window.addEventListener('pointermove',e=>{
  pointer.x=(e.clientX/window.innerWidth-.5)*2
  pointer.y=(e.clientY/window.innerHeight-.5)*2
},{passive:true})

function updateCamera(){
  const cityStages=['start','hero','delivery','dine','shopping','hotel','health','mobility']
  const sequence=cityStages.includes(activeStage)?cityStages:[]
  const activePanel=panels.find(p=>p.dataset.stage===activeStage)
  if(activePanel?.classList.contains('story-panel')){
    const next=panels[panels.indexOf(activePanel)+1]
    const a=stageInfo[activeStage],b=stageInfo[next?.dataset.stage??activeStage]
    const start=activePanel.offsetTop+activePanel.offsetHeight-window.innerHeight*1.05
    const end=activePanel.offsetTop+activePanel.offsetHeight-window.innerHeight*.48
    const mix=THREE.MathUtils.clamp((window.scrollY-start)/(end-start),0,1)
    view.x=THREE.MathUtils.lerp(a.x,b.x,mix)
    view.z=THREE.MathUtils.lerp(a.z,b.z,mix)
    view.zoom=THREE.MathUtils.lerp(a.zoom,b.zoom,mix)
    view.cityT=THREE.MathUtils.lerp(a.cityT??0,b.cityT??a.cityT??0,mix)
  }else if(sequence.length){
    const cursor=window.scrollY+window.innerHeight*.5
    let left=sequence[0],right=sequence[sequence.length-1],mix=0
    for(let i=0;i<sequence.length-1;i++){
      const a=panels.find(p=>p.dataset.stage===sequence[i])!
      const b=panels.find(p=>p.dataset.stage===sequence[i+1])!
      const ac=a.offsetTop+a.offsetHeight/2,bc=b.offsetTop+b.offsetHeight/2
      if(cursor>=ac&&cursor<=bc){left=sequence[i];right=sequence[i+1];mix=(cursor-ac)/(bc-ac);break}
      if(cursor<ac){left=right=sequence[i];break}
    }
    if(cursor>=panels.find(p=>p.dataset.stage===sequence[sequence.length-1])!.offsetTop+panels.find(p=>p.dataset.stage===sequence[sequence.length-1])!.offsetHeight/2){left=right=sequence[sequence.length-1]}
    const a=stageInfo[left],b=stageInfo[right]
    view.x=THREE.MathUtils.lerp(a.x,b.x,mix)
    view.z=THREE.MathUtils.lerp(a.z,b.z,mix)
    view.zoom=THREE.MathUtils.lerp(a.zoom,b.zoom,mix)
    view.cityT=THREE.MathUtils.lerp(a.cityT??0,b.cityT??0,mix)
  }else Object.assign(view,stageInfo[activeStage])
  pointer.easedX += (pointer.x-pointer.easedX)*.035
  pointer.easedY += (pointer.y-pointer.easedY)*.035
  const offsetX = reducedMotion ? 0 : pointer.easedX*.32
  const offsetY = reducedMotion ? 0 : pointer.easedY*.18
  camera.zoom = view.zoom
  camera.position.set(view.x+10+offsetX, 13+offsetY, view.z+15)
  camera.lookAt(view.x-2.4, 0, view.z)
  camera.updateProjectionMatrix()
  positionArrow(cityArrow,cityCurve,view.cityT)
}

let lastTime=0
function tick(time:number){
  requestAnimationFrame(tick)
  if(paused||document.hidden)return
  const delta=Math.min((time-lastTime)/1000,.05);lastTime=time
  updateCamera()
  if(!reducedMotion){
    animatedFlags.forEach(o=>{o.rotation.y+=delta*.3})
    movingObjects.forEach((item,i)=>{item.mesh.position.x=item.origin+Math.sin(time*.001*item.speed+i)*item.range})
  }
  renderer.render(scene,camera)
}
requestAnimationFrame(tick)
document.addEventListener('visibilitychange',()=>{lastTime=performance.now()})

const startServices=[
  {stage:'delivery',href:'#services',name:'外卖',line:'把喜欢的味道带到身边',copy:'发现附近餐厅，挑选一顿想吃的饭。',art:2,tint:'#ffe4a5'},
  {stage:'dine',href:'#dine',name:'到店消费',line:'出门，去遇见好店',copy:'从餐厅到休闲去处，找到适合相聚的地方。',art:1,tint:'#ffd5c1'},
  {stage:'shopping',href:'#shopping',name:'即时购物',line:'当下想要的，就在附近',copy:'生鲜、日用和临时需要的东西，都能从身边找起。',art:1,tint:'#d8f3ba'},
  {stage:'hotel',href:'#hotel',name:'酒店旅行',line:'为下一次出发做好准备',copy:'选好住处，也发现新的风景与旅行体验。',art:0,tint:'#ceeaff'},
  {stage:'health',href:'#health',name:'买药健康',line:'需要关照时，找到方向',copy:'查找药品和附近药店，了解实际可选的信息。',art:0,tint:'#c7f3da'},
  {stage:'mobility',href:'#mobility',name:'出行服务',line:'下一站，轻松抵达',copy:'按距离与节奏，选择骑行或打车继续向前。',art:0,tint:'#d1edff'}
] as const
const startScreen=document.querySelector<HTMLElement>('#start')!
const startPointerLight=document.querySelector<HTMLElement>('.start-screen__pointer-light')!
const startAtlas=document.querySelector<HTMLElement>('#start-atlas')!
const startNodes=document.querySelector<HTMLElement>('#start-atlas-nodes')!
if(!reducedMotion){
  let pointerFrame=0
  let pointerX=0
  let pointerY=0
  startScreen.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return
    pointerX=event.clientX
    pointerY=event.clientY-startScreen.getBoundingClientRect().top
    startScreen.classList.add('has-pointer')
    if(pointerFrame)return
    pointerFrame=requestAnimationFrame(()=>{
      startPointerLight.style.transform=`translate3d(${pointerX}px,${pointerY}px,0) translate(-50%,-50%)`
      pointerFrame=0
    })
  },{passive:true})
  startScreen.addEventListener('pointerleave',()=>startScreen.classList.remove('has-pointer'))
  const orbitObserver=new IntersectionObserver(entries=>{
    startScreen.classList.toggle('is-orbiting',entries[0].isIntersecting&&!document.hidden)
  },{threshold:0.05})
  orbitObserver.observe(startScreen)
  document.addEventListener('visibilitychange',()=>{
    startScreen.classList.toggle('is-orbiting',!document.hidden&&startScreen.getBoundingClientRect().bottom>0&&startScreen.getBoundingClientRect().top<window.innerHeight)
  })
}
startNodes.innerHTML=startServices.map((item,i)=>`<a class="start-atlas__node" href="${item.href}" data-preview="${i}" aria-label="探索${item.name}：${item.line}"><span class="start-atlas__node-inner"><span class="start-atlas__node-art">${cardArtwork(item.stage,item.art,item.name)}</span><span class="start-atlas__node-meta"><small>0${i+1}</small><strong>${item.name}</strong><i aria-hidden="true">↗</i></span></span></a>`).join('')
const startNodeEls=[...startNodes.querySelectorAll<HTMLAnchorElement>('.start-atlas__node')]
const startPreviewNumber=document.querySelector<HTMLElement>('#start-preview-number')!
const startPreviewTitle=document.querySelector<HTMLElement>('#start-preview-title')!
const startPreviewCopy=document.querySelector<HTMLElement>('#start-preview-copy')!
function previewService(index:number|null){
  const item=startServices[index??0]
  startNodeEls.forEach((node,i)=>node.classList.toggle('is-active',i===index))
  startPreviewNumber.textContent=`0${(index??0)+1} / 06`
  startPreviewTitle.textContent=`${item.name} · ${item.line}`
  startPreviewCopy.textContent=item.copy
  startAtlas.style.setProperty('--active-tint',item.tint)
}
startNodeEls.forEach((node,i)=>{
  node.addEventListener('pointerenter',()=>{previewService(i);interfaceSound.play('card')})
  node.addEventListener('focus',()=>previewService(i))
})
startAtlas.addEventListener('pointerleave',()=>previewService(null))
if(!reducedMotion){
  const tiltX=gsap.quickTo(startAtlas,'rotationX',{duration:.42,ease:'power2.out'})
  const tiltY=gsap.quickTo(startAtlas,'rotationY',{duration:.42,ease:'power2.out'})
  startAtlas.addEventListener('pointermove',event=>{
    const rect=startAtlas.getBoundingClientRect()
    const x=THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width,0,1)
    const y=THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height,0,1)
    tiltX((.5-y)*4)
    tiltY((x-.5)*6)
  },{passive:true})
  startAtlas.addEventListener('pointerleave',()=>{tiltX(0);tiltY(0)})
}

const weekendDetails=[
  {stage:'weekend-hotel',name:'酒店住宿',copy:'确定日期与位置，再看看房型、设施和评价，让周末有一个舒适的起点。'},
  {stage:'weekend-ticket',name:'景点门票',copy:'了解景点、开放信息和门票安排，把最想看的风景放进行程。'},
  {stage:'weekend-food',name:'到店美食',copy:'到了新的街道，看看附近的餐厅与评价，挑一顿想吃的饭。'},
  {stage:'weekend-ride',name:'出行服务',copy:'连接住处、景点和餐厅，按距离选择骑行或打车，轻松去下一站。'}
] as const
const weekendCards=[...document.querySelectorAll<HTMLButtonElement>('.weekend-flat__card')]
const weekendDetailNumber=document.querySelector<HTMLElement>('#weekend-detail-number')!
const weekendDetailCopy=document.querySelector<HTMLElement>('#weekend-detail-copy')!
weekendCards.forEach((card,i)=>{
  card.querySelector<HTMLElement>('.weekend-flat__art')!.innerHTML=cardArtwork(weekendDetails[i].stage,0,weekendDetails[i].name)
})
let selectedWeekend=0
function showWeekend(index:number){
  const detail=weekendDetails[index]
  weekendDetailNumber.textContent=`0${index+1} / 04 · ${detail.name}`
  weekendDetailCopy.textContent=detail.copy
  weekendCards.forEach((card,i)=>{
    card.classList.toggle('is-selected',i===selectedWeekend)
    card.classList.toggle('is-previewed',i===index&&i!==selectedWeekend)
    card.setAttribute('aria-pressed',String(i===selectedWeekend))
  })
}
weekendCards.forEach((card,i)=>{
  card.addEventListener('pointerenter',()=>{showWeekend(i);interfaceSound.play('card')})
  card.addEventListener('focus',()=>showWeekend(i))
  card.addEventListener('click',()=>{selectedWeekend=i;showWeekend(i)})
  card.addEventListener('pointerleave',()=>showWeekend(selectedWeekend))
})
document.querySelector('.weekend-flat__cards')!.addEventListener('focusout',event=>{
  const next=(event as FocusEvent).relatedTarget
  if(!(next instanceof Node)||!event.currentTarget || !(event.currentTarget as Node).contains(next))showWeekend(selectedWeekend)
})

const panels = [...document.querySelectorAll<HTMLElement>('[data-stage]')]

// Each service stop keeps its own three-part scroll story.
panels.forEach(panel=>{
  const stage=panel.dataset.stage!
  const cards=storyCards[stage]
  if(!cards)return
  panel.classList.add('story-panel')
  const content=panel.querySelector<HTMLElement>('.panel__content')!
  const layout=document.createElement('div')
  layout.className='story-layout'
  const deck=document.createElement('div')
  deck.className='story-cards'
  deck.setAttribute('aria-label',`${content.querySelector('h2')?.textContent??''}的三个生活片段`)
  deck.innerHTML=cards.map((card,i)=>`<article class="story-card" data-card="${i}" tabindex="-1"><div class="story-card__face"><div class="story-card__art">${cardArtwork(stage,i,card.art)}</div><div class="story-card__copy"><span class="story-card__number">0${i+1} / 03</span><h3>${card.title}</h3><p>${card.detail}</p></div></div></article>`).join('')
  const progress=document.createElement('div')
  progress.className='story-progress'
  progress.innerHTML='<span>继续滚动，看看三个生活片段</span><div class="story-progress__bars"><i></i><i></i><i></i></div>'
  content.append(progress)
  layout.append(content,deck)
  panel.append(layout)
  const cardEls=[...deck.querySelectorAll<HTMLElement>('.story-card')]
  const settleCard:(()=>void)[]=[]
  const offsets=[-36,2,40]
  const rotations=[-9,1,9]
  cardEls.forEach((card,i)=>{
    const face=card.querySelector<HTMLElement>('.story-card__face')!
    const artwork=card.querySelector<SVGSVGElement>('.story-card__art svg')!
    const straighten=()=>{
      card.style.zIndex='20'
      card.classList.add('is-inspected')
      if(!reducedMotion)gsap.to(face,{y:-8,scale:1.04,rotation:-rotations[i],duration:.32,ease:'power2.out',overwrite:'auto'})
    }
    const settle=()=>{
      card.style.zIndex=String(i+1)
      card.classList.remove('is-inspected')
      if(!reducedMotion){
        gsap.to(face,{y:0,scale:1,rotation:0,rotationX:0,rotationY:0,duration:.28,ease:'power2.out',overwrite:'auto'})
        gsap.to(artwork,{x:0,y:0,duration:.34,ease:'power2.out',overwrite:'auto'})
      }
    }
    settleCard[i]=settle
    card.addEventListener('pointerenter',()=>{straighten();interfaceSound.play('card')})
    card.addEventListener('focus',straighten)
    card.addEventListener('pointerleave',()=>{if(document.activeElement!==card)settle()})
    card.addEventListener('blur',settle)
    if(!reducedMotion){
      gsap.set(artwork,{scale:1.06})
      const tiltX=gsap.quickTo(face,'rotationX',{duration:.34,ease:'power2.out'})
      const tiltY=gsap.quickTo(face,'rotationY',{duration:.34,ease:'power2.out'})
      const artX=gsap.quickTo(artwork,'x',{duration:.38,ease:'power2.out'})
      const artY=gsap.quickTo(artwork,'y',{duration:.38,ease:'power2.out'})
      card.addEventListener('pointermove',event=>{
        const rect=card.getBoundingClientRect()
        const x=THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width,0,1)
        const y=THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height,0,1)
        tiltX((.5-y)*3)
        tiltY((x-.5)*4)
        artX((x-.5)*12)
        artY((y-.5)*8)
      },{passive:true})
    }else card.tabIndex=0
  })
  if(reducedMotion)return
  const bars=[...progress.querySelectorAll<HTMLElement>('i')]
  cardEls.forEach((card,i)=>{card.style.pointerEvents='none';gsap.set(card,{
    autoAlpha:0,xPercent:[-112,-50,12][i],yPercent:-50,
    y:offsets[i]+90,scale:.52,rotation:rotations[i]-6,zIndex:i+1,
    transformOrigin:'50% 75%'
  })})
  const timeline=gsap.timeline({scrollTrigger:{
    trigger:panel,start:'top top',end:'bottom bottom',scrub:.22
  }})
  timeline.to({},{duration:1})
  // Keep all three cards readable before the 70% chapter handoff.
  const cardStarts=[0,.2,.4]
  cardEls.forEach((card,i)=>{
    const start=cardStarts[i]
    timeline.to(card,{autoAlpha:1,y:offsets[i],scale:1.07,rotation:rotations[i],duration:.15,ease:'power3.out'},start)
    timeline.to(card,{scale:1,duration:.05,ease:'power2.out'},start+.15)
  })
  const updateCardState=()=>{
    const progress=timeline.progress()
    bars.forEach((bar,i)=>{bar.style.transform=`scaleX(${THREE.MathUtils.clamp((progress-cardStarts[i])/.2,0,1)})`})
    cardEls.forEach((card,i)=>{
      const entranceStart=cardStarts[i]
      const revealed=progress>=entranceStart+.2*.7
      card.style.pointerEvents=revealed?'auto':'none'
      card.tabIndex=revealed?0:-1
      if(!revealed&&card.classList.contains('is-inspected')){
        if(document.activeElement===card)card.blur()
        else settleCard[i]()
      }
    })
  }
  timeline.eventCallback('onUpdate',updateCardState)
  updateCardState()
})
// A water ripple marks entry into each chapter's open background.
const ripples = new Map<string, HTMLElement>()
panels.forEach(panel => {
  const ripple = document.createElement('div')
  ripple.className = 'module-ripple'
  ripple.setAttribute('aria-hidden', 'true')
  ripple.innerHTML = '<svg viewBox="0 0 600 600" fill="none"><circle cx="300" cy="300" r="105"/><circle cx="300" cy="300" r="185"/><circle cx="300" cy="300" r="265"/></svg>'
  const host = panel.querySelector<HTMLElement>('.story-layout') ?? panel
  host.prepend(ripple)
  ripples.set(panel.dataset.stage!, ripple)
})
let lastRippleStage = ''
panels.forEach((panel,index)=>{
  const stage=panel.dataset.stage!
  ScrollTrigger.create({trigger:panel,start:'top 48%',end:'bottom 48%',onEnter:()=>setActive(stage,index),onEnterBack:()=>setActive(stage,index)})
})
function pulseRipple(stage:string){
  if(stage===lastRippleStage)return
  lastRippleStage=stage
  if(reducedMotion)return
  const ripple=ripples.get(stage)
  if(ripple){
    ripple.classList.remove('is-rippling')
    void ripple.offsetWidth
    ripple.classList.add('is-rippling')
  }
}
function setActive(stage:string,index:number){
  if(stage!==activeStage)interfaceSound.play('transition')
  pulseRipple(stage)
  activeStage=stage
  chapterNum.textContent=String(index+1).padStart(2,'0')
  paused=stage==='how'||stage==='weekend'
  sceneShell.style.opacity=paused?'0':'1'
  // The closing scene follows opaque reading sections, so prepare its camera
  // before the WebGL canvas becomes visible again.
  if(stage==='closing'){
    Object.assign(view,stageInfo[stage])
    updateCamera()
    renderer.render(scene,camera)
  }
  const landmarkIndex=['delivery','dine','shopping','hotel','health','mobility'].indexOf(stage)
  activeLandmarks.forEach((landmark,i)=>{
    const selected=i===landmarkIndex
    const ring=landmark.userData.focusRing as THREE.Mesh<THREE.RingGeometry,THREE.MeshBasicMaterial>
    if(reducedMotion){landmark.position.y=selected ? .18 : 0;landmark.scale.setScalar(selected ? 1.04 : 1);ring.material.opacity=selected ? .76 : 0}
    else{
      gsap.to(landmark.position,{y:selected ? .18 : 0,duration:.52,ease:'power3.out',overwrite:'auto'})
      gsap.to(landmark.scale,{x:selected ? 1.04 : 1,y:selected ? 1.04 : 1,z:selected ? 1.04 : 1,duration:.52,ease:'power3.out',overwrite:'auto'})
      gsap.to(ring.material,{opacity:selected ? .76 : 0,duration:.4,overwrite:'auto'})
    }
  })
  if(landmarkIndex>=0){
    const point=stops[landmarkIndex]
    if(reducedMotion)focusLight.position.set(point.x,4,point.z)
    else gsap.to(focusLight.position,{x:point.x,y:4,z:point.z,duration:.55,ease:'power2.out',overwrite:'auto'})
  }
  if(reducedMotion)focusLight.intensity=landmarkIndex>=0?2.4:0
  else gsap.to(focusLight,{intensity:landmarkIndex>=0?2.4:0,duration:.4,overwrite:'auto'})
  const navMap:Record<string,string>={start:'',hero:'',delivery:'services',dine:'services',shopping:'services',hotel:'services',health:'services',mobility:'services',how:'how',weekend:'weekend',closing:'faq'}
  document.querySelectorAll<HTMLElement>('.nav a').forEach(a=>a.classList.toggle('is-current',a.getAttribute('href')==='#'+navMap[stage]&&!!navMap[stage]))
}

// Scroll gestures cross each editorial handoff once its content is readable.
// Pause the handoff while an in-page link is taking the reader elsewhere.
let ignoreSnapUntil = 0
let isSnapping = false
document.addEventListener('click', event => {
  const link=(event.target as Element).closest('a[href^="#"]')
  if(link)ignoreSnapUntil=performance.now()+1800
})
window.addEventListener('hashchange',()=>{ignoreSnapUntil=performance.now()+1800})
function snapTo(id:string,duration=.48){
  const destination=document.getElementById(id)
  if(!destination || isSnapping)return
  isSnapping=true
  interfaceSound.play('transition')
  ignoreSnapUntil=performance.now()+Math.max(1000,duration*1000+150)
  const root=document.documentElement
  const previousBehavior=root.style.scrollBehavior
  root.style.scrollBehavior='auto'
  const finish=()=>{isSnapping=false;root.style.scrollBehavior=previousBehavior}
  gsap.to(window,{
    scrollTo:{y:destination,autoKill:false},
    duration:reducedMotion?0:duration,
    ease:'power3.inOut',
    overwrite:'auto',
    onComplete:finish,
    onInterrupt:finish
  })
}
;([
  {from:'start',to:'hero',at:.5,end:'bottom top'},
  {from:'hero',to:'services',at:.5,end:'bottom top'},
  ...[
    ['services','dine'],
    ['dine','shopping'],
    ['shopping','hotel'],
    ['hotel','health'],
    ['health','mobility'],
    ['mobility','how']
  ].map(([from,to])=>({from,to,at:.7,end:'bottom bottom'})),
  {from:'how',to:'weekend',at:.7,end:'bottom top'},
  {from:'weekend',to:'closing',at:.7,end:'bottom top'}
]).forEach(({from,to,at,end})=>{
  ScrollTrigger.create({
    trigger:document.getElementById(from)!,start:'top top',end,
    onUpdate:self=>{
      if(self.direction===1 && self.progress>=at && performance.now()>ignoreSnapUntil){
        const betweenServices=['services','dine','shopping','hotel','health'].includes(from)
        snapTo(to,betweenServices ? .9 : .48)
      }
    }
  })
})
document.querySelectorAll<HTMLDetailsElement>('#faq details').forEach(detail=>{
  detail.addEventListener('toggle',()=>requestAnimationFrame(()=>ScrollTrigger.refresh()))
})
ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{progressFill.style.height=`${self.progress*100}%`}})

const phoneScreen=document.querySelector<HTMLElement>('#phone-screen')!
const screenBodies=[
  `<div class="screen-header">想做什么？<small>发现身边的生活</small></div><div class="screen-body"><div class="screen-search">搜索附近服务</div><div class="screen-chips"><span>美食</span><span>酒店</span><span>买药</span></div><div class="screen-card"><div class="screen-art"></div><div class="screen-card__text"><strong>附近的好去处</strong><small>从这里发现你的下一站</small></div></div></div>`,
  `<div class="screen-header">看看详情<small>了解服务，再做选择</small></div><div class="screen-body"><div class="screen-card"><div class="screen-art screen-art--blue"></div><div class="screen-card__text"><strong>周末的好去处</strong><small>营业信息 · 地点 · 介绍</small><div class="screen-stars">★★★★★</div></div></div><div class="screen-card"><div class="screen-card__text"><strong>用户评价</strong><small>看看其他人的体验</small></div></div></div>`,
  `<div class="screen-header">确认选择<small>准备好，就向前一步</small></div><div class="screen-body"><div class="screen-card"><div class="screen-art screen-art--blue"></div><div class="screen-card__text"><strong>你的周末计划</strong><small>核对日期与选择的内容</small></div></div><div class="screen-action">下单或预订</div></div>`,
  `<div class="screen-header">订单已记录<small>你的行程，一目了然</small></div><div class="screen-body"><div class="screen-order"><strong>周末行程</strong><span>预订信息与订单详情</span><div class="screen-order__line"></div><span>可在订单页面查看</span></div></div>`
]
phoneScreen.innerHTML=screenBodies[0]
const steps=[...document.querySelectorAll<HTMLElement>('.step')]
steps.forEach((step,index)=>{
  ScrollTrigger.create({trigger:step,start:'top 65%',end:'bottom 35%',onEnter:()=>activateStep(index),onEnterBack:()=>activateStep(index)})
})
function activateStep(index:number){
  steps.forEach((s,i)=>s.classList.toggle('is-active',i===index))
  if(phoneScreen.dataset.step===String(index))return
  phoneScreen.dataset.step=String(index)
  if(reducedMotion){phoneScreen.innerHTML=screenBodies[index];return}
  gsap.to(phoneScreen,{opacity:0,y:-8,duration:.16,onComplete:()=>{phoneScreen.innerHTML=screenBodies[index];gsap.fromTo(phoneScreen,{opacity:0,y:12},{opacity:1,y:0,duration:.28,ease:'power2.out'})}})
}

// Short intro only on the first visit; replay stays available as a real control.
const intro=document.querySelector<HTMLElement>('#intro')!
function playIntro(){
  intro.style.display='flex';intro.style.pointerEvents='auto'
  gsap.set(intro,{opacity:1})
  gsap.set('.intro__wordmark',{opacity:0,y:55,scale:.88})
  gsap.set('.intro__line span',{scaleX:0})
  gsap.set('.intro p',{opacity:0,y:12})
  const tl=gsap.timeline({onComplete:()=>{intro.style.display='none';intro.style.pointerEvents='none';try{localStorage.setItem('meituan-city-intro-seen','1')}catch{}}})
  tl.to('.intro__wordmark',{opacity:1,y:0,scale:1,duration:.72,ease:'power3.out'})
    .to('.intro__line span',{scaleX:1,stagger:.11,duration:.46,ease:'power2.out'},'-.28')
    .to('.intro p',{opacity:1,y:0,duration:.45},'-.1')
    .to(intro,{opacity:0,duration:.58,ease:'power2.inOut'},'+=.48')
}
if(reducedMotion){intro.style.display='none'}else{
  let seen=false;try{seen=localStorage.getItem('meituan-city-intro-seen')==='1'}catch{}
  if(seen)intro.style.display='none';else playIntro()
}
const replayButton=document.querySelector<HTMLButtonElement>('#replay-intro')!
replayButton.addEventListener('click',playIntro)
ScrollTrigger.create({
  trigger:'#closing',start:'top 60%',
  onEnter:()=>{replayButton.style.opacity='0';replayButton.style.pointerEvents='none';document.querySelector<HTMLElement>('.chapter-index')!.style.opacity='0'},
  onLeaveBack:()=>{replayButton.style.opacity='';replayButton.style.pointerEvents='';document.querySelector<HTMLElement>('.chapter-index')!.style.opacity=''}
})

// Sound is on by default; a user gesture unlocks playback where browsers require it.
const soundToggle=document.querySelector<HTMLButtonElement>('#sound-toggle')!
function updateSoundToggle(){
  const label=interfaceSound.enabled?'音效开启':'开启音效'
  soundToggle.setAttribute('aria-pressed',String(interfaceSound.enabled))
  soundToggle.setAttribute('aria-label',interfaceSound.enabled?'关闭音效':'开启音效')
  soundToggle.querySelector<HTMLElement>('.sound-toggle__label')!.textContent=label
}
updateSoundToggle()
soundToggle.addEventListener('click',()=>{
  if(interfaceSound.enabled){interfaceSound.setEnabled(false);updateSoundToggle();return}
  interfaceSound.setEnabled(true)
  void interfaceSound.arm().then(ready=>{updateSoundToggle();if(ready)interfaceSound.play('click')})
})
document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse' && event.button!==0)return
  void interfaceSound.arm().then(ready=>{
    updateSoundToggle()
    if(ready&&!soundToggle.contains(event.target as Node))interfaceSound.play('click')
  })
},{passive:true})
document.addEventListener('keydown',event=>{
  if(event.repeat || !['Enter',' '].includes(event.key) || !(event.target instanceof Element))return
  if(!event.target.closest('a,button,summary,.story-card'))return
  void interfaceSound.arm().then(ready=>{
    updateSoundToggle()
    if(ready&&!soundToggle.contains(event.target as Node))interfaceSound.play('click')
  })
})

// Keep the initial scene ready before a scroll or pointer event occurs.
updateCamera();renderer.render(scene,camera)
setActive(activeStage,Math.max(0,panels.findIndex(panel=>panel.dataset.stage===activeStage)))
