#!/usr/bin/env python3
"""Add phone, address, cuisine and diet details to every city pack from a full OpenStreetMap .pbf file.

The free shapefiles (extract_shp.py) only carry names and categories. This reads Geofabrik's
complete Türkiye file with a tiny stdlib-only PBF reader and merges the extra tags in:

    curl -L -o data/.raw/turkey-latest.osm.pbf https://download.geofabrik.de/europe/turkey-latest.osm.pbf
    python3 tools/extract_pbf.py data/.raw/turkey-latest.osm.pbf
    python3 tools/build_places.py --cached

Only nodes (points) are read in full; buildings drawn as areas keep what the shapefile gave them.
Data © OpenStreetMap contributors, ODbL.
"""
import json
import os
import struct
import sys
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_places import CITIES, ROOT  # noqa: E402

KIND = {b"restaurant": "food", b"pharmacy": "pharmacy", b"hospital": "hospital", b"police": "police", b"place_of_worship": "worship",
        b"cafe": "cafe", b"atm": "atm", b"toilets": "toilets"}
WANT = set(KIND) | {b"mall"}
KEEP = {"name", "name:en", "phone", "contact:phone", "addr:street", "addr:housenumber", "cuisine", "diet:halal",
        "diet:vegetarian", "diet:vegan", "diet:kosher", "religion", "emergency", "amenity", "shop", "opening_hours",
        "website", "contact:website", "brand", "operator", "fee", "contact:instagram", "wheelchair", "outdoor_seating"}


# ---- minimal protobuf ----
def varint(b, i):
    r = s = 0
    while True:
        c = b[i]
        i += 1
        r |= (c & 0x7F) << s
        if c < 0x80:
            return r, i
        s += 7


def fields(b):
    """Yield (field number, value) where value is an int or a memoryview slice."""
    i, n = 0, len(b)
    while i < n:
        key, i = varint(b, i)
        f, wt = key >> 3, key & 7
        if wt == 0:
            v, i = varint(b, i)
        elif wt == 2:
            ln, i = varint(b, i)
            v = b[i:i + ln]
            i += ln
        elif wt == 5:
            v = b[i:i + 4]
            i += 4
        elif wt == 1:
            v = b[i:i + 8]
            i += 8
        else:
            raise ValueError("unsupported wire type")
        yield f, v


def packed(b):
    out, i, n = [], 0, len(b)
    ap = out.append
    while i < n:
        r = s = 0
        while True:
            c = b[i]
            i += 1
            r |= (c & 0x7F) << s
            if c < 0x80:
                break
            s += 7
        ap(r)
    return out


def zigzag_delta(vals):
    out, acc = [], 0
    ap = out.append
    for v in vals:
        acc += (v >> 1) ^ -(v & 1)
        ap(acc)
    return out


# ---- reader ----
def blocks(path):
    with open(path, "rb") as f:
        while True:
            head = f.read(4)
            if len(head) < 4:
                return
            hdr = memoryview(f.read(struct.unpack(">I", head)[0]))
            kind, size = b"", 0
            for fn, v in fields(hdr):
                if fn == 1:
                    kind = bytes(v)
                elif fn == 3:
                    size = v
            blob = memoryview(f.read(size))
            if len(blob) < size:
                return  # truncated file (still downloading?)
            if kind != b"OSMData":
                continue
            data = None
            for fn, v in fields(blob):
                if fn == 1:
                    data = bytes(v)
                elif fn == 3:
                    data = zlib.decompress(v)
            if data:
                yield memoryview(data)


def nodes_in(block):
    """Yield (lat, lon, tags) for tagged points we care about."""
    strings, groups, gran, lat_off, lon_off = [], [], 100, 0, 0
    for fn, v in fields(block):
        if fn == 1:
            strings = [bytes(s) for f2, s in fields(v) if f2 == 1]
        elif fn == 2:
            groups.append(v)
        elif fn == 17:
            gran = v
        elif fn == 19:
            lat_off = v
        elif fn == 20:
            lon_off = v
    if not WANT.intersection(strings):
        return  # nothing interesting anywhere in this block
    for g in groups:
        for fn, v in fields(g):
            if fn != 2:
                continue  # only dense nodes
            lat_raw = lon_raw = kv_raw = None
            for f2, w in fields(v):
                if f2 == 8:
                    lat_raw = w
                elif f2 == 9:
                    lon_raw = w
                elif f2 == 10:
                    kv_raw = w
            if kv_raw is None:
                continue
            kv = packed(kv_raw)
            hits, idx, i, cur = [], 0, 0, {}
            while i < len(kv):
                k = kv[i]
                if k == 0:
                    if cur:
                        hits.append((idx, cur))
                    cur, idx, i = {}, idx + 1, i + 1
                    continue
                key, val = strings[k], strings[kv[i + 1]]
                if (key == b"amenity" and val in KIND) or (key == b"shop" and val == b"mall"):
                    cur["_hit"] = True
                if cur is not None:
                    cur[key] = val
                i += 2
            hits = [(n, t) for n, t in hits if t.get("_hit")]
            if not hits:
                continue
            lats, lons = zigzag_delta(packed(lat_raw)), zigzag_delta(packed(lon_raw))
            for n, t in hits:
                lat = (lat_off + gran * lats[n]) / 1e9
                lon = (lon_off + gran * lons[n]) / 1e9
                tags = {k.decode("utf-8", "replace"): v.decode("utf-8", "replace") for k, v in t.items() if k != "_hit" and k.decode("utf-8", "replace") in KEEP}
                yield lat, lon, tags


def inside(box, lat, lon):
    s, w, n, e = box
    return s <= lat <= n and w <= lon <= e


def near_m(a, b):
    return ((a[0] - b[0]) * 111000) ** 2 + ((a[1] - b[1]) * 85000) ** 2 < 150 ** 2


def kind_of(tags):
    if tags.get("shop") == "mall":
        return "mall"
    return KIND.get(tags.get("amenity", "").encode())


def main(path):
    boxes = {c: cfg["core"] for c, cfg in CITIES.items()}
    found = {c: {} for c in CITIES}
    n = 0
    for blk in blocks(path):
        n += 1
        if n % 500 == 0:
            print(f"  {n} blocks…", file=sys.stderr)
        for lat, lon, tags in nodes_in(blk):
            for c, box in boxes.items():
                if inside(box, lat, lon):
                    k = kind_of(tags)
                    if k:
                        found[c].setdefault(k, []).append({"type": "node", "lat": lat, "lon": lon, "tags": tags})
    raw = os.path.join(ROOT, "data", ".raw")
    for c, kinds in found.items():
        for k in ("worship", "food", "mall", "hospital", "pharmacy", "police", "cafe", "atm", "toilets"):
            pts = kinds.get(k, [])
            area = CITIES[c]["food"] if k in ("food", "cafe") else CITIES[c]["core"]
            pts = [p for p in pts if inside(area, p["lat"], p["lon"])]
            path_raw = os.path.join(raw, f"{c}-{k}.json")
            old = []
            # Cafés, ATMs and toilets only ever come from this file: start them fresh (unnamed ATMs can't be matched).
            if os.path.exists(path_raw) and k not in ("cafe", "atm", "toilets"):
                with open(path_raw, encoding="utf-8") as f:
                    old = json.load(f).get("elements", [])
            # Keep earlier places (e.g. buildings from the shapefile) unless a detailed point is the same place.
            keep = []
            for e in old:
                la, lo = e.get("lat") or e.get("center", {}).get("lat"), e.get("lon") or e.get("center", {}).get("lon")
                nm = e.get("tags", {}).get("name", "")
                if la is None or any(nm and p["tags"].get("name") == nm and near_m((la, lo), (p["lat"], p["lon"])) for p in pts):
                    continue
                keep.append(e)
            with open(path_raw, "w", encoding="utf-8") as f:
                json.dump({"elements": pts + keep, "source": os.path.basename(path)}, f)
            detail = sum(1 for p in pts if p["tags"].get("phone") or p["tags"].get("contact:phone") or p["tags"].get("addr:street"))
            print(f"  {c} {k}: {len(pts)} detailed points ({detail} with phone or street) + {len(keep)} kept", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
