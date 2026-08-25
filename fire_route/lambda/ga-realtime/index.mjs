// Deployed separately from the site itself (this repo builds a static SPA
// with no backend - see CLAUDE.md) behind whatever Lambda Function URL /
// API Gateway route you point VITE_GA_REALTIME_API_URL at. Paste this
// file's contents into the Lambda console (or deploy via your usual
// tooling) to update it.
//
// Calls the GA4 Data API's runRealtimeReport - "realtime" specifically
// (active users right now, not historical trends; GA4's realtime data set
// only covers roughly the last 30 minutes and doesn't support the date
// ranges/dimensions the regular Data API does).
//
// Written against plain REST + a hand-signed JWT rather than Google's
// official @google-analytics/data client library on purpose: that library
// pulls in google-gax/protobuf and needs an actual npm install + zip
// upload (or a Lambda Layer) to deploy. This version only uses things
// Node's Lambda runtime already has built in (crypto, fetch), so - same as
// the old CloudWatch Lambda - you can paste it straight into the console
// with nothing else to install.
//
// Needs two environment variables set on the Lambda itself (never commit
// either to the repo):
//   GA_PROPERTY_ID          - GA4 Admin > Property Settings > "Property ID"
//                              (a plain number, NOT the G-XXXXXXXXXX
//                              Measurement ID used in index.html)
//   GA_SERVICE_ACCOUNT_KEY  - the full JSON key file contents (as one
//                              string) for a Google Cloud service account
//                              that's been added as a Viewer on this GA4
//                              property, with the Analytics Data API
//                              enabled on its project. See README.md.
import crypto from 'node:crypto'

const CORS_HEADERS = {
  // Tighten to the site's real origin once you've confirmed this works
  // end to end.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Service accounts don't get a user-consent OAuth flow - they mint their
// own short-lived access token by signing a JWT with the service account's
// private key and exchanging it with Google, proving they hold that key.
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), serviceAccount.private_key)
  const jwt = `${unsigned}.${base64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`)
  const { access_token } = await res.json()
  return access_token
}

async function runRealtimeReport(accessToken, propertyId, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`runRealtimeReport failed (${res.status}): ${await res.text()}`)
  return res.json()
}

export const handler = async () => {
  const propertyId = process.env.GA_PROPERTY_ID
  const rawKey = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!propertyId || !rawKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'GA_PROPERTY_ID / GA_SERVICE_ACCOUNT_KEY env vars are not set' }),
    }
  }

  try {
    const serviceAccount = JSON.parse(rawKey)
    const accessToken = await getAccessToken(serviceAccount)

    // Two calls: total active users right now, and the same broken down by
    // page/screen (GA4's realtime dimension set doesn't include a raw
    // pagePath - unifiedScreenName is its closest equivalent for web,
    // usually reflecting each page's <title>).
    const [totalReport, byPageReport] = await Promise.all([
      runRealtimeReport(accessToken, propertyId, {
        metrics: [{ name: 'activeUsers' }],
      }),
      runRealtimeReport(accessToken, propertyId, {
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),
    ])

    const activeUsers = Number(totalReport.rows?.[0]?.metricValues?.[0]?.value ?? 0)
    const byPage = (byPageReport.rows ?? []).map((row) => ({
      page: row.dimensionValues[0].value || '(not set)',
      activeUsers: Number(row.metricValues[0].value),
    }))

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ generatedAt: new Date().toISOString(), activeUsers, byPage }),
    }
  } catch (err) {
    console.error('GA4 runRealtimeReport failed', err)
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to fetch GA4 realtime data' }),
    }
  }
}
