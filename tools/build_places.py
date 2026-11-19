#!/usr/bin/env python3
"""Download place data from OpenStreetMap (Overpass API) into data/places-<city>.json.

The public Overpass servers are often overloaded, so the app ships this snapshot
instead of querying live. Run it again every few weeks to refresh:

    python3 tools/build_places.py            # all cities
    python3 tools/build_places.py ankara     # one city
    python3 tools/build_places.py --cached   # only rebuild from what is already downloaded

Data © OpenStreetMap contributors, ODbL. Keep the credit line in the app.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ENDPOINTS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]
ROUNDS = 4  # full passes over all servers before giving up

# bbox = (south, west, north, east). "core" covers the city, "food" only the visitor areas.
CITIES = {
    "istanbul": {"core": (40.80, 28.60, 41.25, 29.40), "food": (40.975, 28.930, 41.050, 29.045)},
    "ankara": {"core": (39.80, 32.65, 40.05, 33.00), "food": (39.880, 32.815, 39.950, 32.890)},
}

KINDS = {
    "worship": ("core", '[amenity=place_of_worship][name]'),
    "mall": ("core", '[shop=mall][name]'),
    "hospital": ("core", '[amenity=hospital][name]'),
    "police": ("core", '[amenity=police]'),
    "pharmacy": ("core", '[amenity=pharmacy]'),
    "food": ("food", '[amenity=restaurant][name]'),
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def overpass(query):
    body = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for rnd in range(ROUNDS):
        for ep in ENDPOINTS:
            try:
                req = urllib.request.Request(ep, data=body, headers={
                    "User-Agent": "Mozilla/5.0 (compatible; damga-data-builder/1.0)",
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                })
                with urllib.request.urlopen(req, timeout=200) as r:
                    return json.load(r)
            except Exception as e:  # noqa: BLE001 - try the next server
                last = e
                print(f"  {ep} failed ({e})", file=sys.stderr)
        wait = 30 * (rnd + 1)
        print(f"  all servers busy, waiting {wait}s…", file=sys.stderr)
        time.sleep(wait)
    raise RuntimeError(f"all Overpass servers failed: {last}")


def yes(v):
    return v in ("yes", "only")


def compact(el, kind):
    t = el.get("tags", {})
    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")
    if lat is None:
        return None
    p = {"n": t.get("name:en") or t.get("name", ""), "a": round(lat, 5), "o": round(lon, 5)}
    if t.get("name") and t.get("name") != p["n"]:
        p["l"] = t["name"]
    # Street address helps Google Maps open the right branch of a chain.
    street = t.get("addr:street")
    if street:
        p["s"] = f"{street} {t['addr:housenumber']}" if t.get("addr:housenumber") else street
    phone = t.get("phone") or t.get("contact:phone")
    if phone:
        p["p"] = phone
    if kind == "worship":
        p["r"] = t.get("religion", "")
    if kind == "hospital" and t.get("emergency") == "yes":
        p["e"] = 1
    if kind == "food":
        if t.get("cuisine"):
            p["c"] = t["cuisine"].replace(";", ", ")
        flags = ""
        if yes(t.get("diet:halal", "")): flags += "h"
        if yes(t.get("diet:vegetarian", "")) or yes(t.get("diet:vegan", "")): flags += "v"
        if yes(t.get("diet:kosher", "")): flags += "k"
        if flags:
            p["d"] = flags
    return p


def build(city, cached_only=False):
    cfg = CITIES[city]
    out = {"built": time.strftime("%Y-%m-%d"), "source": "OpenStreetMap contributors, ODbL"}
    for kind, (area, flt) in KINDS.items():
        s, w, n, e = cfg[area]
        q = f"[out:json][timeout:170];nwr{flt}({s},{w},{n},{e});out center tags;"
        raw = os.path.join(ROOT, "data", ".raw", f"{city}-{kind}.json")
        if os.path.exists(raw):
            print(f"{city}: {kind} (cached)", file=sys.stderr)
            with open(raw, encoding="utf-8") as f:
                data = json.load(f)
        elif cached_only:
            print(f"{city}: {kind} (not downloaded yet, skipped)", file=sys.stderr)
            continue
        else:
            # Busy servers time out on big boxes, so ask for four quarters and keep each one as it arrives.
            print(f"{city}: {kind}…", file=sys.stderr)
            elements, seen = [], set()
            mid_lat, mid_lon = (s + n) / 2, (w + e) / 2
            quarters = [(s, w, mid_lat, mid_lon), (s, mid_lon, mid_lat, e), (mid_lat, w, n, mid_lon), (mid_lat, mid_lon, n, e)]
            for i, (qs, qw, qn, qe) in enumerate(quarters):
                part = os.path.join(ROOT, "data", ".raw", "tiles", f"{city}-{kind}-{i}.json")
                if os.path.exists(part):
                    with open(part, encoding="utf-8") as f:
                        chunk = json.load(f)
                else:
                    chunk = overpass(f"[out:json][timeout:170];nwr{flt}({qs},{qw},{qn},{qe});out center tags;")
                    os.makedirs(os.path.dirname(part), exist_ok=True)
                    with open(part, "w", encoding="utf-8") as f:
                        json.dump(chunk, f)
                    time.sleep(3)
                for el in chunk.get("elements", []):
                    key = (el["type"], el["id"])
                    if key not in seen:
                        seen.add(key)
                        elements.append(el)
            data = {"elements": elements}
            os.makedirs(os.path.dirname(raw), exist_ok=True)
            with open(raw, "w", encoding="utf-8") as f:
                json.dump(data, f)
        items = [c for c in (compact(el, kind) for el in data.get("elements", [])) if c and (c["n"] or kind in ("police", "pharmacy"))]
        out[kind] = items
        print(f"  {len(items)} places", file=sys.stderr)
    path = os.path.join(ROOT, "data", f"places-{city}.json")
    if not any(k in out for k in KINDS):
        print(f"{city}: nothing downloaded yet, no file written", file=sys.stderr)
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {path} ({os.path.getsize(path) // 1024} KB)", file=sys.stderr)


if __name__ == "__main__":
    # --cached: write the app files from whatever is already downloaded, without contacting servers.
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for c in (args or list(CITIES)):
        build(c, cached_only="--cached" in sys.argv)
