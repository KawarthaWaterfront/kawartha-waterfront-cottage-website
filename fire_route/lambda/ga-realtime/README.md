# ga-realtime Lambda

Not part of the site's build (this repo is otherwise a static SPA with no
backend - see the root `CLAUDE.md`). This is the source for the Lambda
behind whatever endpoint you set `VITE_ANALYTICS_REALTIME_API_URL` to in
`.env` - `src/pages/Analytics.jsx` fetches from it to show "active users
right now" without any Google credentials ever reaching the browser.

## One-time Google Cloud setup

1. In the [Google Cloud Console](https://console.cloud.google.com/), create
   (or reuse) a project, then **IAM & Admin → Service Accounts → Create
   Service Account**. No roles need to be granted in Cloud IAM itself - GA4
   access is granted separately, in step 3.
2. On that service account, open **Keys → Add Key → Create new key → JSON**
   and download it. This file's *entire contents* is what
   `GA_SERVICE_ACCOUNT_KEY` holds - treat it like a password, never commit
   it to this repo.
3. Enable the **Analytics Data API** for that same Cloud project
   (console.cloud.google.com → APIs & Services → Library → search "Google
   Analytics Data API" → Enable).
4. In the GA4 property itself: **Admin → Property Access Management → Add
   users**, and add the service account's email (looks like
   `something@project-id.iam.gserviceaccount.com`, found in the JSON key's
   `client_email` field) as a **Viewer**.
5. Also in **Admin → Property Settings**, copy the **Property ID** (a plain
   number like `123456789`) - this is *not* the `G-XXXXXXXXXX` Measurement
   ID already in this repo's `.env`; the Data API addresses properties by
   this numeric ID instead.

## Deploy

1. Create a Lambda (Node.js 18+ or 20+ runtime) and paste in `index.mjs` -
   it only uses Node's built-in `crypto`/`fetch`, so no dependency install
   or layer is needed.
2. Set its environment variables:
   - `GA_PROPERTY_ID` - the numeric ID from step 5 above.
   - `GA_SERVICE_ACCOUNT_KEY` - the full JSON key file's contents from step
     2, as a single-line string.
3. Expose it via a Function URL (simplest) or API Gateway, and put that URL
   in this repo's `.env` as `VITE_ANALYTICS_REALTIME_API_URL`.
4. `curl` the endpoint - `Analytics.jsx` treats any response without an
   `activeUsers` field as "not working yet" and says so on the page, so
   you'll know from the page itself whether this step succeeded.

## CORS

`index.mjs` sends `Access-Control-Allow-Origin: *` itself. If API Gateway
also has its own CORS configuration for this route, make sure it isn't
stripping or overriding that header. Tighten the `*` to the site's real
origin once you've confirmed it works end to end.
