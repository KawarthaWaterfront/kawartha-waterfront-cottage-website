import Footer from '../components/Footer'
import './Cottage.css'

// Icon set copied from the mockup's amenities page (one per category).
const ICONS = {
  bed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5" />
      <path d="M12 11V8a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5" />
      <path d="M2 17h20" />
      <path d="M2 11h20v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 21h8" />
    </svg>
  ),
  utensils: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M7 3v7a2 2 0 1 0 4 0V3" />
      <path d="M9 10v11" />
      <path d="M17 3c-1.7 0-3 2.2-3 5s1.3 5 3 5v8" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M16.5 14.3c2.7.4 4.5 2.5 4.5 5.7" />
    </svg>
  ),
  paw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="9" r="1.6" />
      <circle cx="16" cy="9" r="1.6" />
      <circle cx="5.5" cy="13.5" r="1.4" />
      <circle cx="18.5" cy="13.5" r="1.4" />
      <path d="M12 13c-3 0-5 2.3-5 4.5S9 21 12 21s5-1.3 5-3.5S15 13 12 13z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6z" />
    </svg>
  ),
  access: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 8v6l4 4" />
      <path d="M8 12h8" />
      <path d="M12 14v6" />
    </svg>
  ),
}

const CATEGORIES = [
  {
    title: 'Bedrooms & Bathrooms',
    icon: 'bed',
    items: [
      '4 bedrooms',
      '3 queen beds',
      '1 double bed',
      '1 bunk bed (double and single top bunk)',
      '2 showers',
      '1 bathtub',
    ],
  },
  {
    title: 'Indoor Essentials & Comfort',
    icon: 'home',
    items: [
      'Wrap-around lake views (east facing sunrise)',
      'WiFi — high-speed Bell Fibre Internet (~1Gbps)',
      '75" Smart TV',
      'Air conditioning / heating',
      'Washer / dryer',
      'Dishwasher',
      'Common toiletry and linens (including hair dryer)',
      'Vacuum',
      'Workstation (monitor, keyboard etc.)',
      'Games table (double sided: flat-top and felt-top poker setup)',
      'Board games',
      'Puzzles',
      "Children's toys",
      'Books',
      'DVD player (assortment of DVDs and TV shows)',
    ],
  },
  {
    title: 'Outdoor Entertainment',
    icon: 'play',
    items: [
      'Parking for 4 cars (additional can be arranged)',
      'Water toys and floaties',
      'Adult and children life jackets',
      '2 sit-on kayaks',
      '2-seat canoe',
      'Large floating mat (15 ft long)',
      'Private walk-in sandy beach',
      'Dock — moors small/medium boats (boat launch 5 mins away, dedicated trailer parking spot)',
      'Swing set',
      'Hammock',
      'Propane BBQ',
      'Large picnic table',
      'Bench and foldable chairs',
      'Fire pit (firewood provided), metal fire poker',
      'Electrical outlets',
      'Assortment of outdoor games (plastic axe throwing, water shooters, cornhole etc.)',
    ],
  },
  {
    title: 'Kitchen',
    icon: 'utensils',
    items: [
      'Refrigerator / freezer',
      'Stove',
      'Dishwasher',
      'Microwave',
      'Rice cooker',
      'Air fryer',
      'Toaster',
      'Breakfast nook',
      'Coffee machine (ground coffee provided)',
      'Assortment of teas',
      'Dishes and utensils',
      'Pots and pans',
      'Kettle',
    ],
  },
  {
    title: 'Top Family-Friendly Amenities',
    icon: 'family',
    items: ['Highchair', 'Baby monitor', 'Games, toys and books for kids', 'Bunk bed', 'Swing set'],
  },
  {
    title: 'Pet Friendly',
    icon: 'paw',
    items: ['Welcoming dogs only (2 max)', 'Outdoor leash anchors available'],
  },
  {
    title: 'Safety',
    icon: 'shield',
    items: ['Outdoor security cameras', 'Fire extinguisher', 'Smoke detectors', 'Carbon monoxide detector', 'First aid kit'],
  },
  {
    title: 'Accessibility',
    icon: 'access',
    items: ['Aluminum ramp for wheelchairs / walkers', 'All primary amenities on main floor'],
  },
]

export default function Cottage() {
  return (
    <div className="layout-wrap">
      <div className="amenities-intro">
        <h1>Amenities</h1>
        <p>
          This property was originally built as a hunting lodge, so the design attempts to
          maintain the original character but enhance the experience with modern comforts and
          technology.
        </p>
        <p>
          The needs of a multi-generational family or a pair of young families influenced what
          this vacation rental includes.
        </p>
      </div>

      <div className="amenities-grid">
        {CATEGORIES.map(({ title, icon, items }) => (
          <div className="amenities-category" key={title}>
            <div className="amenities-category-header">
              <span className="amenities-icon-circle">{ICONS[icon]}</span>
              <h2>{title}</h2>
            </div>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  )
}
