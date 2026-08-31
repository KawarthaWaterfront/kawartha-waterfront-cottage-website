#!/usr/bin/env python3
"""Scrapes property reviews from cottagesincanada.com, Airbnb, and VRBO, and
writes them to fire_route/public/reviews.json for the site to consume.

Airbnb and VRBO reviews are fetched via Apify actors rather than direct HTML
scraping - both listing pages load review data client-side (Airbnb from a
private API, VRBO behind a bot-detection challenge) rather than serving it in
the initial HTML. Requires an APIFY_TOKEN (env var, or a reviews/.env file
with APIFY_TOKEN=...).
"""

import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

COTTAGESINCANADA_URL = "https://www.cottagesincanada.com/42737"
AIRBNB_LISTING_URL = "https://www.airbnb.ca/rooms/1331967211097025994"
VRBO_LISTING_URL = "https://www.vrbo.com/en-ca/cottage-rental/p20158487"
APIFY_AIRBNB_ACTOR = "tri_angle~airbnb-reviews-scraper"
APIFY_VRBO_ACTOR = "powerai~vrbo-reviews-scraper"

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "fire_route" / "public" / "reviews.json"
ENV_PATH = Path(__file__).resolve().parent / ".env"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}


def load_env_file(path):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


load_env_file(ENV_PATH)
APIFY_TOKEN = os.environ.get("APIFY_TOKEN")


def run_apify_actor(actor, run_input, timeout=600, poll_interval=5):
    """Starts the actor asynchronously and polls for completion, rather than
    using the run-sync-get-dataset-items endpoint - that endpoint's own wait
    window is shorter than these actors' typical runtime (VRBO's routinely
    takes ~2-3 minutes to get past bot-detection retries), so it was
    returning an empty result while the run kept going in the background."""
    response = requests.post(
        f"https://api.apify.com/v2/acts/{actor}/runs",
        params={"token": APIFY_TOKEN},
        json=run_input,
        timeout=60,
    )
    response.raise_for_status()
    run = response.json()["data"]
    run_id = run["id"]

    deadline = time.time() + timeout
    while run["status"] not in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
        if time.time() >= deadline:
            raise TimeoutError(f"Apify actor {actor} run {run_id} did not finish within {timeout}s")
        time.sleep(poll_interval)
        status_response = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}",
            params={"token": APIFY_TOKEN},
            timeout=30,
        )
        status_response.raise_for_status()
        run = status_response.json()["data"]

    if run["status"] != "SUCCEEDED":
        raise RuntimeError(f"Apify actor {actor} run {run_id} ended with status {run['status']}")

    items_response = requests.get(
        f"https://api.apify.com/v2/datasets/{run['defaultDatasetId']}/items",
        params={"token": APIFY_TOKEN},
        timeout=60,
    )
    items_response.raise_for_status()
    return items_response.json()


def fetch_html(url):
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.text


def parse_cottagesincanada_reviews(html):
    soup = BeautifulSoup(html, "html.parser")

    reviews = []
    for node in soup.select('div[itemprop="review"]'):
        author_el = node.select_one('[itemprop="author"] [itemprop="name"]') or node.select_one(
            '[itemprop="name"]'
        )
        rating_el = node.select_one('[itemprop="reviewRating"] meta[itemprop="ratingValue"]')
        body_el = node.select_one('[itemprop="reviewBody"]')
        stayed_label = node.find(string=lambda s: s and "Stayed:" in s)
        date_el = stayed_label.find_next("strong") if stayed_label else None

        reviews.append(
            {
                "source": "cottagesincanada",
                "author": author_el.get_text(strip=True) if author_el else None,
                "rating": float(rating_el["content"]) if rating_el and rating_el.has_attr("content") else None,
                "text": body_el.get_text(strip=True) if body_el else None,
                "date": date_el.get_text(strip=True) if date_el else None,
                # New reviews start hidden until a human reviews and
                # curates them in - see merge_reviews, which preserves
                # whatever this ends up set to on later reruns.
                "include": False,
            }
        )

    aggregate_el = soup.select_one('[itemprop="aggregateRating"]')
    aggregate = None
    if aggregate_el:
        rating_meta = aggregate_el.select_one('meta[itemprop="ratingValue"]')
        count_meta = aggregate_el.select_one('meta[itemprop="reviewCount"]')
        aggregate = {
            "rating": float(rating_meta["content"]) if rating_meta and rating_meta.has_attr("content") else None,
            "count": int(count_meta["content"]) if count_meta and count_meta.has_attr("content") else None,
        }

    return aggregate, reviews


def iso_to_month_year(iso_text):
    """Converts an ISO 8601 timestamp (Airbnb's `createdAt`) to "Month YYYY",
    e.g. "2026-07-05T18:28:11Z" -> "July 2026"."""
    if not iso_text:
        return iso_text
    try:
        return datetime.fromisoformat(iso_text.replace("Z", "+00:00")).strftime("%B %Y")
    except ValueError:
        return iso_text


def extract_month_year(text):
    """Pulls a "Mon YYYY"/"Month YYYY" substring out of free text (VRBO's
    `stayedText`, e.g. "Stayed 7 nights in Jun 2026") and normalizes it to
    "Month YYYY". Falls back to the raw text if no such substring is found."""
    if not text:
        return text
    match = re.search(r"([A-Za-z]{3,9})\.?\s+(\d{4})", text)
    if not match:
        return text
    try:
        return datetime.strptime(f"{match.group(1)[:3]} {match.group(2)}", "%b %Y").strftime("%B %Y")
    except ValueError:
        return text


def fetch_airbnb_reviews(since_date=None):
    if not APIFY_TOKEN:
        print("APIFY_TOKEN not set (env var or reviews/.env); skipping Airbnb reviews.")
        return []

    run_input = {
        "startUrls": [{"url": AIRBNB_LISTING_URL}],
        "sortBy": "most-recent",
    }
    if since_date:
        run_input["sinceDate"] = since_date

    items = run_apify_actor(APIFY_AIRBNB_ACTOR, run_input)

    reviews = []
    for item in items:
        reviewer = item.get("reviewer") or {}
        reviews.append(
            {
                "source": "airbnb",
                "id": item.get("id"),
                "author": reviewer.get("firstName"),
                "rating": item.get("rating"),
                "text": item.get("text"),
                "date": iso_to_month_year(item.get("createdAt")),
                # New reviews start hidden until a human reviews and
                # curates them in - see merge_reviews, which preserves
                # whatever this ends up set to on later reruns.
                "include": False,
            }
        )
    return reviews


def fetch_vrbo_reviews(max_attempts=3):
    if not APIFY_TOKEN:
        print("APIFY_TOKEN not set (env var or reviews/.env); skipping VRBO reviews.")
        return []

    # VRBO blocks direct/datacenter requests with a bot-detection challenge
    # (HTTP 429) - the actor's default proxyConfiguration has useApifyProxy
    # off, so it needs to be turned on explicitly to get through.
    run_input = {
        "searchUrl": VRBO_LISTING_URL,
        "proxyConfiguration": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
    }

    # Even through the residential proxy, VRBO intermittently blocks the
    # actor's navigation entirely (run still reports SUCCEEDED, just with 0
    # items) - retry a few times rather than treating one empty run as "no
    # reviews".
    items = []
    for attempt in range(1, max_attempts + 1):
        items = run_apify_actor(APIFY_VRBO_ACTOR, run_input)
        if items:
            break
        print(f"VRBO actor returned 0 reviews on attempt {attempt}/{max_attempts}; retrying.")

    reviews = []
    for item in items:
        rating = item.get("rating")
        rating_max = item.get("ratingMax") or 10
        # Normalized to a 5-point scale to match cottagesincanada/Airbnb.
        rating_5 = round(rating / rating_max * 5, 1) if rating is not None else None

        reviews.append(
            {
                "source": "vrbo",
                "id": item.get("reviewId"),
                "author": item.get("author"),
                "rating": rating_5,
                "text": item.get("reviewText"),
                "date": extract_month_year(item.get("stayedText")),
                # New reviews start hidden until a human reviews and
                # curates them in - see merge_reviews, which preserves
                # whatever this ends up set to on later reruns.
                "include": False,
            }
        )
    return reviews


def load_existing():
    if not OUTPUT_PATH.exists():
        return None
    return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))


def merge_reviews(existing_data, new_reviews, source, key_fn):
    """Merges freshly-scraped `new_reviews` for `source` with whatever was
    already on disk, keyed by `key_fn` (Airbnb/VRBO's own review id;
    cottagesincanada has no id at all, so it's matched on content instead -
    see main()).

    Two things this preserves across reruns:
    - The `include` curation flag. A freshly-scraped copy of a review
      already on disk always starts as `include: False` (see
      parse_cottagesincanada_reviews / fetch_airbnb_reviews /
      fetch_vrbo_reviews) - without this, a review a human had already
      reviewed and turned on would silently flip back off the next time
      the scraper happened to see it again.
    - Reviews this run didn't return at all. Apify actors only return what
      they were asked to fetch this run (e.g. Airbnb's `sinceDate`, or a
      VRBO run that just didn't resurface an older review), so anything
      previously fetched for `source` is carried forward rather than
      dropped.
    """
    existing_by_key = {}
    if existing_data:
        for r in existing_data.get("reviews", []):
            if r.get("source") == source:
                key = key_fn(r)
                if key is not None:
                    existing_by_key[key] = r

    merged_by_key = dict(existing_by_key)
    for r in new_reviews:
        key = key_fn(r)
        if key is None:
            continue
        existing = existing_by_key.get(key)
        if existing is not None:
            r["include"] = existing.get("include", r.get("include", False))
        merged_by_key[key] = r
    return list(merged_by_key.values())


def main():
    existing_data = load_existing()
    since_date = None
    if existing_data and existing_data.get("scrapedAt") and any(
        r.get("source") == "airbnb" for r in existing_data.get("reviews", [])
    ):
        # Only incrementally fetch once we've actually pulled Airbnb reviews
        # before - otherwise (e.g. first run, or a prior run with no token)
        # this would ask Apify for reviews "since today", getting nothing.
        since_date = existing_data["scrapedAt"][:10]

    html = fetch_html(COTTAGESINCANADA_URL)
    aggregate, cottage_reviews_scraped = parse_cottagesincanada_reviews(html)

    # cottagesincanada's markup has no per-review id, so reviews are matched
    # on content instead to preserve their "include" curation across reruns.
    cottage_reviews = merge_reviews(
        existing_data,
        cottage_reviews_scraped,
        "cottagesincanada",
        key_fn=lambda r: (r.get("author"), r.get("date"), r.get("text")),
    )
    airbnb_reviews = merge_reviews(
        existing_data, fetch_airbnb_reviews(since_date), "airbnb", key_fn=lambda r: r.get("id")
    )
    vrbo_reviews = merge_reviews(
        existing_data, fetch_vrbo_reviews(), "vrbo", key_fn=lambda r: r.get("id")
    )

    reviews = cottage_reviews + airbnb_reviews + vrbo_reviews

    data = {
        "sources": [COTTAGESINCANADA_URL, AIRBNB_LISTING_URL, VRBO_LISTING_URL],
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "aggregate": aggregate,
        "reviews": reviews,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(
        f"Wrote {len(reviews)} reviews to {OUTPUT_PATH} "
        f"({len(cottage_reviews)} cottagesincanada, {len(airbnb_reviews)} airbnb, "
        f"{len(vrbo_reviews)} vrbo)"
    )


if __name__ == "__main__":
    main()
