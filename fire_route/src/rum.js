import { AwsRum } from 'aws-rum-web'

// AWS CloudWatch RUM (Real User Monitoring) - collects page load
// performance, JS errors, and HTTP timing from real visitors. Imported as
// the very first thing in main.jsx (before React/react-dom/anything else)
// so it starts capturing timing data as early as possible in the page's
// lifecycle rather than after the rest of the app has already loaded.
try {
  const config = {
    sessionSampleRate: 1,
    identityPoolId: 'us-east-1:cc0daca0-a78d-43c4-953a-57392b09657a',
    endpoint: 'https://dataplane.rum.us-east-1.amazonaws.com',
    telemetries: ['performance', 'errors', 'http'],
    allowCookies: true,
    enableXRay: false,
    signing: true, // If you have a public resource policy and wish to send unsigned requests please set this to false
  }

  const APPLICATION_ID = 'fd9154c9-8fe1-44ff-a52f-e5c721c0ec14'
  const APPLICATION_VERSION = '1.0.0'
  const APPLICATION_REGION = 'us-east-1'

  // eslint-disable-next-line no-new
  new AwsRum(APPLICATION_ID, APPLICATION_VERSION, APPLICATION_REGION, config)
} catch {
  // Ignore errors thrown during CloudWatch RUM web client initialization
}
