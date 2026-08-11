import Footer from '../components/Footer'
import './Activities.css'

const IMG_BASE = `${import.meta.env.BASE_URL}images/activities/`

export default function Activities() {
  return (
    <div className="layout-wrap">
      <h1>Activities</h1>
      <div className="activities-tagline">On the property, in town, and around the lakes</div>

      <section className="activities-section">
        <h2>The Cottage</h2>
        <div className="activities-grid">
          <p>
            This ½ acre property stretches across 230 ft of waterfront with both south and east
            facing lake views. The south lawn is great for just enjoying the view of the lake,
            roasting marshmallows in the fire pit, or gathering for dinner on the picnic table.
            The dock area is another great view of the lake, provides a safe anchor point for
            swimming, and can moor small to medium-size boats. While you can catch small fish off
            the dock, exploring Pigeon Lake and surrounding lakes by boat is what experienced
            anglers do. The east shoreline includes a private walk-in sandy beach that is ideal
            for launching watercraft and floaties or wading/swimming in shallow water. It is also
            an area where you can relax in the hammock right by the water under the shade of
            trees. The property gets a lot of sun but is well treed so finding shade is never an
            issue. There is also ample open lawn space to enjoy the outdoor activities provided or
            ones that you bring.
          </p>
          <img
            className="activities-image"
            src={`${IMG_BASE}cottage-from-water.jpg`}
            alt="The cottage and dock from the water"
            loading="lazy"
          />
        </div>
      </section>

      <section className="activities-section">
        <h2>Bobcaygeon and Area</h2>
        <div className="activities-grid">
          <div className="activities-text">
            <p>
              The closest town is Bobcaygeon and it's a 10 min drive from the property. A
              highlight of Bobcaygeon is that it's the home of Kawartha Dairy. Visiting their
              store at 89 Prince St W to get some ice cream is a must.
            </p>
            <p>
              You will find major chains like Foodland, Tim Hortons, Shoppers Drug Mart, LCBO,
              Home Hardware and Subway, along with many local establishments to shop at.
            </p>
            <p>
              Other places to visit include the Trent–Severn Waterway – Lock 32 at 15 Bolton St,
              Bobcaygeon, ON K0M 1A0. One of the most popular attractions in town. A great place
              to walk around, watch the boats pass through the locks, and enjoy the waterfront
              atmosphere.
            </p>
          </div>
          <img
            className="activities-image"
            src={`${IMG_BASE}kawartha-dairy.jpg`}
            alt="Visiting Kawartha Dairy in Bobcaygeon"
            loading="lazy"
          />
        </div>
      </section>

      <section className="activities-section">
        <h2>The Surrounding Kawartha Lakes Area</h2>
        <div className="activities-grid activities-grid--center">
          <p>
            The area around this property has many places to explore. Fenelon Falls and Buckhorn
            are within 20 minutes. This video from a popular travel photographer provides a great
            overview.{' '}
            <a href="https://www.youtube.com/watch?v=K9_V5vwP5gc" target="_blank" rel="noreferrer">
              https://www.youtube.com/watch?v=K9_V5vwP5gc
            </a>
          </p>
          <img
            className="activities-image"
            src={`${IMG_BASE}kawartha-lakes-map.png`}
            alt="Map of the Kawartha Lakes region"
            loading="lazy"
          />
        </div>
      </section>

      <Footer />
    </div>
  )
}
