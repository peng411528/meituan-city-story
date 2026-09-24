export type StoryCard = { title: string; detail: string; art: string }

export const storyCards: Record<string, StoryCard[]> = {
  delivery: [
    { title: '先看看附近', detail: '从身边的餐厅开始，按口味与当下的心情寻找一顿饭。', art: '街角餐厅' },
    { title: '挑一份想吃的', detail: '浏览餐食与店铺信息，选好喜欢的内容再下单。', art: '热乎餐食' },
    { title: '等美味抵达', detail: '下单后在订单中查看信息，让日常一餐有了着落。', art: '骑手配送' }
  ],
  dine: [
    { title: '发现一间好店', detail: '餐厅、咖啡馆与休闲去处，都可以从附近慢慢找。', art: '街边好店' },
    { title: '看看店内体验', detail: '先了解环境、位置和营业信息，再决定要不要出门。', art: '到店体验' },
    { title: '参考真实评价', detail: '看看其他人的体验，为一次见面找到合适的地点。', art: '用户评价' }
  ],
  shopping: [
    { title: '补齐日常用品', detail: '想起需要的东西时，看看附近有哪些商品可选。', art: '便利商店' },
    { title: '准备一餐食材', detail: '从蔬果、生鲜到调味品，把今天要用的找齐。', art: '新鲜食材' },
    { title: '临时需要，也从容', detail: '生活里突然冒出的清单，也能从附近开始解决。', art: '日用商品' }
  ],
  hotel: [
    { title: '找到舒适住处', detail: '比较位置、房型与设施，为短途行程选个落脚点。', art: '旅途酒店' },
    { title: '把行李放下来', detail: '先安排好住宿，再留更多时间给沿途风景。', art: '轻装出发' },
    { title: '去看看新风景', detail: '浏览目的地与旅行体验，让周末多一点期待。', art: '山间风景' }
  ],
  health: [
    { title: '按需寻找药品', detail: '从药品名称或分类出发，查找所需的商品信息。', art: '附近药房' },
    { title: '了解附近选择', detail: '查看药店与商品详情，核对规格后再做决定。', art: '药品信息' },
    { title: '留意取用信息', detail: '以页面展示的实际信息为准，妥善安排下一步。', art: '药店位置' }
  ],
  mobility: [
    { title: '短途轻快骑行', detail: '距离合适时，骑行可以成为穿过街区的方式。', art: '城市骑行' },
    { title: '远一点也好出发', detail: '需要跨过几个街区时，可以看看打车选择。', art: '城市打车' },
    { title: '把行程连起来', detail: '把出行接在吃饭、购物或旅行之后，继续下一站。', art: '下一站路线' }
  ]
}

const palettes: Record<string, [string, string, string]> = {
  delivery: ['#ffe09a','#ffad42','#f36a4d'], dine: ['#ffd9b9','#f89881','#d45f5a'],
  shopping: ['#d4f5bd','#8cdea0','#3fb781'], hotel: ['#d3ebff','#8bc8f5','#488ed2'],
  health: ['#c8f4dd','#7cdbb7','#35b491'], mobility: ['#d5eeff','#88ccf6','#398ed4'],
  'weekend-hotel': ['#d8eaff','#96c7f1','#5a9dd5'], 'weekend-ticket': ['#c5f1e1','#70d5b4','#34a991'],
  'weekend-food': ['#ffe1b9','#ffb16c','#ec7856'], 'weekend-ride': ['#d9f6bb','#9dde7d','#60b64d']
}

const shop = (accent: string) => `<rect x="78" y="69" width="164" height="113" rx="12" fill="#fff9e9"/><path d="M70 74h180l-13-24H83Z" fill="${accent}"/><path d="M80 79h160v22H80Z" fill="#fff"/><path d="M80 79h27v22H80Zm54 0h27v22h-27Zm54 0h27v22h-27Z" fill="${accent}" opacity=".8"/><rect x="95" y="113" width="55" height="69" rx="4" fill="#a6d5df"/><rect x="169" y="113" width="55" height="69" rx="4" fill="#a6d5df"/><path d="M78 69h164" stroke="#6a625b" stroke-width="5" stroke-linecap="round"/>`
const bowl = (accent: string) => `<ellipse cx="160" cy="173" rx="85" ry="13" fill="#38432d" opacity=".13"/><path d="M80 107h160c-6 48-32 69-80 69s-74-21-80-69Z" fill="${accent}"/><path d="M80 107h160" stroke="#fff9ee" stroke-width="13" stroke-linecap="round"/><path d="M115 85c-9-15 7-19 0-35m44 35c-9-15 7-19 0-35m44 35c-9-15 7-19 0-35" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/><circle cx="135" cy="113" r="11" fill="#f7dc76"/><circle cx="183" cy="115" r="10" fill="#f7dc76"/>`
const scooter = (accent: string) => `<path d="M76 157h166" stroke="#47504a" stroke-width="9" stroke-linecap="round"/><circle cx="108" cy="163" r="23" fill="#323b35"/><circle cx="210" cy="163" r="23" fill="#323b35"/><circle cx="108" cy="163" r="11" fill="#fff3ce"/><circle cx="210" cy="163" r="11" fill="#fff3ce"/><path d="M93 132h81l25 28H96Z" fill="${accent}"/><path d="M177 132h30l-12-28h-18" stroke="#323b35" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="106" y="89" width="55" height="43" rx="8" fill="#ffcb35"/><path d="M112 89V75h43v14" stroke="#a56c31" stroke-width="5" fill="none"/>`
const table = (accent: string) => `<ellipse cx="160" cy="179" rx="99" ry="12" fill="#38432d" opacity=".12"/><ellipse cx="160" cy="111" rx="80" ry="25" fill="${accent}"/><path d="M160 129v49M92 145l-17 32m153-32 17 32" stroke="#685b50" stroke-width="9" stroke-linecap="round"/><ellipse cx="160" cy="108" rx="38" ry="14" fill="#fff8e9"/><ellipse cx="160" cy="108" rx="23" ry="8" fill="#e5ad75"/><path d="M114 80V48m92 32V48" stroke="#6a5d55" stroke-width="5" stroke-linecap="round"/>`
const review = (accent: string) => `<rect x="79" y="52" width="162" height="124" rx="18" fill="#fffdf4" transform="rotate(-5 160 114)"/><circle cx="112" cy="88" r="16" fill="${accent}"/><path d="M139 80h69m-69 16h51M101 122h116m-116 17h92" stroke="#aab1a4" stroke-width="7" stroke-linecap="round"/><text x="99" y="164" font-size="27" font-weight="900" fill="#f8bc2e">★★★★★</text>`
const bag = (accent: string) => `<path d="M91 79h138l-12 105H103Z" fill="${accent}"/><path d="M124 83V65a36 36 0 0 1 72 0v18" fill="none" stroke="#fff9e8" stroke-width="12" stroke-linecap="round"/><circle cx="159" cy="130" r="23" fill="#fff3d1"/><path d="m146 130 10 11 19-24" stroke="#6d9b77" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
const produce = (accent: string) => `<path d="M72 155h176l-16 28H88Z" fill="#9b7050"/><circle cx="112" cy="124" r="34" fill="#ee8a67"/><circle cx="161" cy="118" r="38" fill="${accent}"/><circle cx="211" cy="126" r="31" fill="#ffc65c"/><path d="M96 90q12-20 25-8m31-4q12-25 26-14m23 34q13-17 24-8" stroke="#4e9b67" stroke-width="9" fill="none" stroke-linecap="round"/>`
const hotel = (accent: string) => `<rect x="101" y="41" width="118" height="143" rx="8" fill="#fff9ef"/><path d="M92 41h136v16H92Z" fill="${accent}"/><rect x="126" y="69" width="24" height="25" rx="3" fill="#8fc2d9"/><rect x="170" y="69" width="24" height="25" rx="3" fill="#8fc2d9"/><rect x="126" y="110" width="24" height="25" rx="3" fill="#8fc2d9"/><rect x="170" y="110" width="24" height="25" rx="3" fill="#8fc2d9"/><rect x="147" y="151" width="27" height="33" rx="4" fill="${accent}"/><path d="M96 184h128" stroke="#6e857e" stroke-width="7" stroke-linecap="round"/>`
const suitcase = (accent: string) => `<rect x="91" y="73" width="138" height="109" rx="17" fill="${accent}"/><rect x="139" y="52" width="42" height="25" rx="8" stroke="#fff9e8" stroke-width="9" fill="none"/><path d="M120 92v71m80-71v71" stroke="#fff5d7" stroke-width="9" opacity=".7"/><circle cx="119" cy="186" r="8" fill="#3a4b4a"/><circle cx="201" cy="186" r="8" fill="#3a4b4a"/>`
const mountains = (accent: string) => `<path d="M42 174 107 65l50 79 42-63 79 93Z" fill="${accent}"/><path d="m86 100 21-35 20 32-19-6Z" fill="#f9fbf0"/><path d="m180 111 19-30 23 35-21-7Z" fill="#f9fbf0"/><ellipse cx="160" cy="184" rx="135" ry="12" fill="#66b7b5"/><circle cx="235" cy="57" r="21" fill="#fff5c2"/>`
const pharmacy = (accent: string) => `<rect x="77" y="70" width="166" height="113" rx="10" fill="#fffdf4"/><path d="M72 70h176l-12-20H84Z" fill="${accent}"/><rect x="127" y="84" width="66" height="48" rx="7" fill="#e8f7ed"/><path d="M160 91v35m-17-17h34" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><rect x="95" y="142" width="52" height="41" rx="4" fill="#b9dfdc"/><rect x="173" y="142" width="52" height="41" rx="4" fill="#b9dfdc"/>`
const pill = (accent: string) => `<g transform="rotate(-28 160 116)"><rect x="72" y="79" width="176" height="76" rx="38" fill="#fffdf7"/><path d="M160 79h50a38 38 0 0 1 0 76h-50Z" fill="${accent}"/><path d="M160 80v74" stroke="#d5ded5" stroke-width="5"/></g><circle cx="99" cy="165" r="11" fill="#f9c16a"/><circle cx="221" cy="67" r="9" fill="#f9c16a"/>`
const pin = (accent: string) => `<path d="M160 42c-38 0-69 31-69 69 0 52 69 83 69 83s69-31 69-83c0-38-31-69-69-69Z" fill="${accent}"/><circle cx="160" cy="111" r="32" fill="#fffaf0"/><path d="M160 94v34m-17-17h34" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>`
const bike = (accent: string) => `<circle cx="92" cy="151" r="37" fill="none" stroke="#334f56" stroke-width="9"/><circle cx="226" cy="151" r="37" fill="none" stroke="#334f56" stroke-width="9"/><path d="m92 151 42-65 34 65 58-1-35-65h-57" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="m187 85 17-25h18m-94 25-14-12H99" fill="none" stroke="#334f56" stroke-width="9" stroke-linecap="round"/>`
const car = (accent: string) => `<path d="M63 132h194l-17 42H80Z" fill="${accent}"/><path d="m99 132 22-46h79l23 46Z" fill="${accent}"/><path d="m129 94-15 30h42V94Zm34 0v30h47l-16-30Z" fill="#bde4f0"/><circle cx="111" cy="171" r="21" fill="#344345"/><circle cx="209" cy="171" r="21" fill="#344345"/><circle cx="111" cy="171" r="9" fill="#fff9e4"/><circle cx="209" cy="171" r="9" fill="#fff9e4"/>`
const route = (accent: string) => `<path d="M63 165c47-75 87 31 138-57 14-24 35-35 56-39" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><circle cx="65" cy="164" r="19" fill="#fff9e9" stroke="#4c796e" stroke-width="7"/><path d="M256 42c-18 0-32 14-32 32 0 24 32 49 32 49s32-25 32-49c0-18-14-32-32-32Z" fill="#fff5d2"/><circle cx="256" cy="74" r="10" fill="${accent}"/>`
const bed = (accent: string) => `<rect x="68" y="105" width="184" height="70" rx="12" fill="${accent}"/><path d="M68 117V78h184v39" fill="#fff9ef"/><rect x="85" y="91" width="62" height="29" rx="8" fill="#f8e3bf"/><rect x="159" y="91" width="73" height="29" rx="8" fill="#f8e3bf"/><path d="M68 175v14m184-14v14" stroke="#545f59" stroke-width="9" stroke-linecap="round"/>`
const ticket = (accent: string) => `<path d="M65 71h190v38a22 22 0 0 0 0 44v35H65v-35a22 22 0 0 0 0-44Z" fill="#fffdf3"/><path d="M65 71h190v35H65Z" fill="${accent}"/><path d="M198 105v77" stroke="#b6beb0" stroke-width="5" stroke-dasharray="8 7"/><path d="m95 151 30-30 24 22 23-35 25 43Z" fill="${accent}"/><circle cx="145" cy="107" r="9" fill="#f6cb58"/>`
const arch = (accent: string) => `<path d="M69 181V83c0-21 17-38 38-38h106c21 0 38 17 38 38v98" fill="none" stroke="${accent}" stroke-width="24"/><path d="M91 181h138" stroke="#fffdf2" stroke-width="9" stroke-linecap="round"/><path d="m120 150 40-57 41 57Z" fill="#81bdb0"/><circle cx="213" cy="95" r="16" fill="#fff5ba"/>`
const cup = (accent: string) => `<path d="M90 77h130l-13 105H103Z" fill="${accent}"/><path d="M217 94h18c30 0 27 52-15 49" fill="none" stroke="${accent}" stroke-width="12"/><ellipse cx="155" cy="77" rx="65" ry="14" fill="#fff9ef"/><ellipse cx="155" cy="77" rx="42" ry="8" fill="#9d6c4b"/><path d="M125 48c-9-15 5-21 0-31m37 31c-9-15 5-21 0-31" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/>`

const artwork: Record<string, ((accent: string) => string)[]> = {
  delivery: [shop,bowl,scooter], dine: [shop,table,review], shopping: [shop,produce,bag],
  hotel: [hotel,suitcase,mountains], health: [pharmacy,pill,pin], mobility: [bike,car,route],
  'weekend-hotel': [hotel,bed,suitcase], 'weekend-ticket': [mountains,arch,ticket],
  'weekend-food': [shop,bowl,cup], 'weekend-ride': [route,bike,car]
}

export function cardArtwork(stage: string, variant: number, label: string): string {
  const [light,mid,accent]=palettes[stage]
  const id=`art-${stage}-${variant}`
  const motif=artwork[stage][variant](accent)
  return `<svg viewBox="0 0 320 210" role="img" aria-label="${label}插画" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs>
    <rect width="320" height="210" fill="url(#${id})"/>
    <circle cx="264" cy="42" r="36" fill="#fff" opacity=".35"/><circle cx="45" cy="181" r="57" fill="#fff" opacity=".18"/>
    <path d="M0 179q80-18 160 0t160 0v31H0Z" fill="#fff9ec" opacity=".38"/>
    <ellipse cx="160" cy="188" rx="114" ry="13" fill="#38432d" opacity=".09"/>
    ${motif}
    <path d="M22 22h27M22 22v27M298 161v27h-27" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>
  </svg>`
}
