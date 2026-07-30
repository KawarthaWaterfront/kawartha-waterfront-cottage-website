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
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

COTTAGESINCANADA_URL = "https://www.cottagesincanada.com/42737"
AIRBNB_LISTING_URL = "https://www.airbnb.ca/rooms/1331967211097025994"
VRBO_LISTING_URL = "https://www.vrbo.com/en-ca/cottage-rental/p20158487?dateless=true"
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


def run_apify_actor(actor, run_input):
    response = requests.post(
        f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items",
        params={"token": APIFY_TOKEN},
        json=run_input,
        timeout=600,
    )
    response.raise_for_status()
    return response.json()


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


def month_year(text):
    """Normalizes a "Mon YYYY"/"Month YYYY" substring found anywhere in
    `text` to a consistent "Month YYYY" string, e.g. "Sep 2025" -> "September
    2025". Falls back to the raw text if no such substring is found."""
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
                "date": month_year(item.get("createdAt")),
            }
        )
    return reviews


def fetch_vrbo_reviews():
    if not APIFY_TOKEN:
        print("APIFY_TOKEN not set (env var or reviews/.env); skipping VRBO reviews.")
        return []

    items = run_apify_actor(APIFY_VRBO_ACTOR, {"searchUrl": VRBO_LISTING_URL})

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
                "date": month_year(item.get("stayedText")),
            }
        )
    return reviews


def load_existing():
    if not OUTPUT_PATH.exists():
        return None
    return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))


def merge_reviews_by_id(existing_data, new_reviews, source):
    """Apify actors only return what they were asked to fetch this run (e.g.
    Airbnb's `sinceDate`, or VRBO's `maxItems` cutoff), so previously-fetched
    reviews for `source` have to be carried forward here rather than
    re-fetched every time."""
    by_id = {}
    if existing_data:
        for r in existing_data.get("reviews", []):
            if r.get("source") == source and r.get("id"):
                by_id[r["id"]] = r
    for r in new_reviews:
        if r.get("id"):
            by_id[r["id"]] = r
    return list(by_id.values())


def main():
    existing_data = load_existing()
    since_date = None
    if existing_data and existing_data.get("scrapedAt"):
        since_date = existing_data["scrapedAt"][:10]

    html = fetch_html(COTTAGESINCANADA_URL)
    aggregate, cottage_reviews = parse_cottagesincanada_reviews(html)

    airbnb_reviews = merge_reviews_by_id(
        existing_data, fetch_airbnb_reviews(since_date), "airbnb"
    )
    vrbo_reviews = merge_reviews_by_id(
        existing_data, fetch_vrbo_reviews(), "vrbo"
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
