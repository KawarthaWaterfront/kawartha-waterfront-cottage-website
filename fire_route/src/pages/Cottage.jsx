import { useState, useEffect, useRef } from 'react'
import './Cottage.css'

const BG_SVG_SRC = `${import.meta.env.BASE_URL}backgrounds/stacked-waves-haikei(vertical).svg`
const CDN_BASE = import.meta.env.VITE_CDN_BASE
const JSON_PATH = `${import.meta.env.BASE_URL}images/72-Fire-Rte-98-1.json`

const BOXES = [
  {
    tag: 'Lakeside',
    title: 'Waterfront',
    desc: 'Escape to the water’s edge—nestled directly on the tranquil shores of Pigeon Lake, where morning coffees come with front-row water views.',
    icon: (
      <svg className="box-icon" role="presentation" aria-hidden="true" viewBox="0 -31.5 1087 1087" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
        <path d="M665.579712 1024c-151.483292 0-290.523313-52.47814-372.080835-140.527803-50.855105-54.912693-75.200634-118.616827-70.196275-184.349756s42.198917-113.477216 90.21371-167.98415c33.272223-37.600317 40.575882-62.892617 36.7888-73.983358-5.004359-13.525294-31.919694-24.480782-46.797517-27.050587-104.550522-0.811518-195.169991-34.354246-243.45529-90.213711a131.060098 131.060098 0 0 1-33.13697-107.390833C42.063664 134.982433 170.959715 61.404834 326.635847 61.404834c158.78695 0 279.703078 76.012152 281.326113 176.640338a139.986792 139.986792 0 0 1-37.329811 97.787875c-29.349888 32.190199-33.948488 54.101176-31.513935 59.105534 0 0 10.955488 23.398758 106.579316 26.103818 230.741514 6.627394 415.497028 122.539163 439.166292 275.510236a228.442214 228.442214 0 0 1-57.482499 187.32532c-75.200634 87.508651-210.588826 140.122045-361.801611 140.122045z m-338.132347-881.984414c-120.10461 0-212.076608 54.101176-219.51552 102.386474a51.125611 51.125611 0 0 0 14.472065 42.198917c31.784441 37.600317 104.415269 61.945846 184.079249 61.945846h6.356889c9.1972 1.487782 89.943204 15.959847 113.206709 81.151764 16.230353 45.174482-1.352529 97.382116-52.342887 155.135121-40.575882 45.715493-67.626469 78.852463-70.196275 120.375115a165.143838 165.143838 0 0 0 48.826311 122.944922c66.544446 71.684058 183.402985 114.559239 312.569541 114.559239s240.344472-42.063664 300.667283-112.395192a151.348039 151.348039 0 0 0 38.952847-121.727645C987.075948 596.059701 831.805574 507.198521 643.127724 501.788403c-100.087175-2.840312-158.651697-27.050588-178.939638-75.606393-17.718135-41.657905-1.487782-93.054022 45.580241-144.585391a59.240787 59.240787 0 0 0 16.771364-42.604676c-0.135253-45.985999-82.504293-96.976357-199.498085-96.976357zM875.762779 154.323603L810.706115 0l-57.482499 154.323603h41.116894V202.879408h40.440629v-48.555805h40.98164zM1029.139612 377.490952l-89.537446-212.211861-78.987716 212.211861h56.400475v66.814952h55.588958v-66.814952h56.535729zM168.525162 675.58843L79.122969 463.511821 0 675.58843h56.535728v66.950204h55.453705v-66.950204h56.535729zM238.450931 945.959054l-72.630828-172.176991-64.109893 172.176991h45.850746v54.101176h45.039229v-54.101176h45.850746zM753.223616 319.196936L693.847576 178.263373 641.234183 319.196936h37.600317v44.498217h36.788799V319.196936h37.600317zM698.716682 899.973055a33.813235 33.813235 0 1 1 0-67.626469c102.521728 0 192.464932-49.773081 192.464932-106.444063a65.462422 65.462422 0 0 0-15.959847-40.575882 33.82676 33.82676 0 1 1 52.883899-42.198917 133.088892 133.088892 0 0 1 30.702417 83.180558c-0.135253 97.11161-114.288733 173.664773-260.091401 173.664773z" />
      </svg>
    ),
  },
  {
    tag: 'Front View',
    title: 'Maximum Guests',
    desc: "Designed with groups and families in mind, this spacious 4-bedroom, 2-bathroom home comfortably accommodates up to 10 guests with flexible sleeping arrangements and all the essential comforts of home.",
    dark: true,
    icon: (
      <svg className="box-icon" role="presentation" aria-hidden="true" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" strokeWidth="1.5">
        <path d="M3 5V19M3 16H21M21 19V13.2C21 12.0799 21 11.5198 20.782 11.092C20.5903 10.7157 20.2843 10.4097 19.908 10.218C19.4802 10 18.9201 10 17.8 10H11V15.7273M7 12H7.01M8 12C8 12.5523 7.55228 13 7 13C6.44772 13 6 12.5523 6 12C6 11.4477 6.44772 11 7 11C7.55228 11 8 11.4477 8 12Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // {
  //   tag: 'Dock',
  //   title: 'Bathrooms',
  //   desc: '.',
  //   icon: (
  //     <svg className="box-icon" role="presentation" aria-hidden="true" viewBox="0 0 512 512" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
  //       <path fill="var(--ci-primary-color, #000000)" d="M464,280H80V100A51.258,51.258,0,0,1,95.113,63.515l.4-.4a51.691,51.691,0,0,1,58.6-10.162,79.1,79.1,0,0,0,11.778,96.627l10.951,10.951-20.157,20.158,22.626,22.626,20.157-20.157h0L311.157,71.471h0l20.157-20.157L308.687,28.687,288.529,48.844,277.578,37.893a79.086,79.086,0,0,0-100.929-8.976A83.61,83.61,0,0,0,72.887,40.485l-.4.4A83.054,83.054,0,0,0,48,100V280H16v32H48v30.7a23.95,23.95,0,0,0,1.232,7.589L79,439.589A23.969,23.969,0,0,0,101.766,456h12.9L103,496h33.333L148,456H356.1l12,40H401.5l-12-40h20.73A23.969,23.969,0,0,0,433,439.589l29.766-89.3A23.982,23.982,0,0,0,464,342.7V312h32V280ZM188.52,60.52a47.025,47.025,0,0,1,66.431,0L265.9,71.471,199.471,137.9,188.52,126.951A47.027,47.027,0,0,1,188.52,60.52ZM432,341.4,404.468,424H107.532L80,341.4V312H432Z" className="ci-primary" />
  //     </svg>
  //   ),
  // },
  {
    tag: 'Outdoor',
    title: 'Outdoor Living',
    desc: '.',
    dark: true,
    icon: (
      <svg className="box-icon" role="presentation" aria-hidden="true" viewBox="0 0 32 32" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="1.5">
        <path d="M11.57 19.945c1.271 0.812 2.819 1.297 4.479 1.305h0.002c0 0 0 0 0 0 0.36 0 0.714-0.023 1.061-0.069l-0.041 0.004c3.174-0.464 5.747-2.626 6.794-5.52l0.019-0.059c0.265-0.786 0.419-1.692 0.419-2.633 0-2.314-0.925-4.411-2.426-5.942l0.001 0.001c-0.226-0.225-0.538-0.364-0.882-0.364-0.405 0-0.764 0.192-0.993 0.49l-0.002 0.003c-0.122-0.822-0.35-1.563-0.673-2.25l0.021 0.049c-0.858-1.791-2.295-3.19-4.063-3.978l-0.052-0.021c-0.146-0.065-0.317-0.103-0.496-0.103-0.691 0-1.251 0.56-1.251 1.251 0 0.075 0.007 0.149 0.019 0.221l-0.001-0.008c-0.002 1.157-0.522 2.192-1.339 2.886l-0.005 0.005c-0.325 0.329-0.672 0.64-1.018 0.951-0.864 0.715-1.614 1.522-2.249 2.416l-0.026 0.039c-0.743 1.201-1.183 2.657-1.183 4.216 0 0.76 0.105 1.496 0.3 2.193l-0.014-0.057c0.516 2.114 1.815 3.861 3.565 4.954l0.034 0.020zM10.964 9.981c0.543-0.741 1.152-1.384 1.832-1.943l0.018-0.015c0.384-0.345 0.767-0.689 1.126-1.055 0.776-0.754 1.39-1.671 1.787-2.695l0.018-0.052c0.553 0.493 1.002 1.088 1.322 1.758l0.014 0.033c0.322 0.685 0.509 1.487 0.509 2.334 0 0.575-0.087 1.129-0.247 1.651l0.011-0.040c-0.035 0.109-0.055 0.235-0.055 0.366 0 0.69 0.559 1.249 1.249 1.249 0.168 0 0.329-0.033 0.476-0.094l-0.008 0.003c0.803-0.33 1.484-0.808 2.040-1.404l0.003-0.003c0.467 0.837 0.742 1.836 0.742 2.899 0 0.653-0.104 1.281-0.295 1.87l0.012-0.043c-0.76 2.056-2.554 3.562-4.734 3.899l-0.034 0.004c-0.203 0.025-0.438 0.039-0.677 0.039-1.179 0-2.278-0.343-3.203-0.934l0.024 0.014c-1.238-0.773-2.139-1.986-2.489-3.416l-0.008-0.038c-0.136-0.46-0.214-0.988-0.214-1.534 0-1.053 0.29-2.038 0.794-2.88l-0.014 0.026zM30.42 28.822l-10.702-3.822 10.702-3.822c0.488-0.178 0.83-0.638 0.83-1.178 0-0.691-0.56-1.25-1.25-1.25-0.151 0-0.295 0.027-0.429 0.075l0.009-0.003-13.58 4.85-13.579-4.85c-0.124-0.045-0.267-0.071-0.416-0.071-0.691 0-1.251 0.56-1.251 1.251 0 0.538 0.34 0.997 0.817 1.173l0.009 0.003 10.703 3.822-10.703 3.822c-0.487 0.178-0.829 0.638-0.829 1.177 0 0.69 0.559 1.25 1.25 1.251h0c0.151-0 0.296-0.027 0.43-0.075l-0.009 0.003 13.579-4.85 13.58 4.85c0.125 0.046 0.269 0.072 0.42 0.072h0c0 0 0 0 0 0 0.69 0 1.25-0.56 1.25-1.25 0-0.54-0.342-1-0.822-1.175l-0.009-0.003z" />
      </svg>
    ),
  },
  {
    tag: 'Campfire',
    title: 'Entertainment',
    desc: '.',
    dark: true,
    icon: (
      <svg className="box-icon" role="presentation" aria-hidden="true" viewBox="0 0 50 50" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
        <path d="M1,38h23v3H12v2h26v-2H26v-3h23V8H1V38z M3,10h44v26H3V10z" />
      </svg>
    ),
  },
]

function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

export default function Cottage() {
  const [boxesExpanded, setBoxesExpanded] = useState(false)
  const [tagImages, setTagImages] = useState({})
  const [heroRef, heroInView] = useInView()
  const [guestsRef, guestsInView] = useInView()

  useEffect(() => {
    fetch(JSON_PATH)
      .then(r => r.json())
      .then(data => {
        const map = {}
        data.forEach(item => {
          const tags = [item.tag].flat().filter(Boolean)
          tags.forEach(tag => {
            if (!map[tag]) map[tag] = `${CDN_BASE}${item.filename}?v=2`
          })
        })
        setTagImages(map)
      })
  }, [])

  return (
    <div className="layout-wrap">
      <img className="cottage-bg-svg" src={BG_SVG_SRC} alt="" aria-hidden="true" />
      <h1>Cottage</h1>

      <div className="waterfront-hero">
        {tagImages[BOXES[0].tag] && (
          <>
            <img className="waterfront-hero-image" src={tagImages[BOXES[0].tag]} alt="" loading="lazy" />
            <div className="waterfront-hero-fade" />
          </>
        )}
        <div ref={heroRef} className={`box waterfront-hero-box fade-up${heroInView ? ' in-view' : ''}`}>
          {BOXES[0].icon}
          <h3>{BOXES[0].title}</h3>
          <p>{BOXES[0].desc}</p>
        </div>
      </div>

      <section id="floating-boxes" className={boxesExpanded ? 'boxes-expanded' : ''}>
        {BOXES.slice(1).map((box, i) => {
          const isGuests = box.title === 'Maximum Guests'
          const boxEl = (
            <div
              ref={isGuests ? guestsRef : undefined}
              className={`box${isGuests ? ` fade-right${guestsInView ? ' in-view' : ''}` : ''}`}
            >
              {box.icon}
              <h3>{box.title}</h3>
              <p>{box.desc}</p>
            </div>
          )
          const imageEl = tagImages[box.tag] && (
            <img className="box-image" src={tagImages[box.tag]} alt="" loading="lazy" />
          )
          const boxOnLeft = i % 2 === 0

          return (
            <div
              className={`cottage-row${box.dark ? ' cottage-row--dark' : ''}`}
              key={box.title}
            >
              <div className="row-slot row-slot--left">{boxOnLeft ? boxEl : imageEl}</div>
              <div className="row-slot row-slot--right">{boxOnLeft ? imageEl : boxEl}</div>
            </div>
          )
        })}
      </section>

      <button
        className="boxes-toggle"
        onClick={() => setBoxesExpanded(e => !e)}
      >
        {boxesExpanded ? 'Show Less' : 'Show More'}
      </button>
    </div>
  )
}
