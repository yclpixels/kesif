#!/usr/bin/env python3
"""Pull places out of an OpenStreetMap XML extract (.osm or .osm.gz) without any extra packages.

Use this when the Overpass servers are too slow. It writes the same cache files that
build_places.py reads, so afterwards run:

    python3 tools/extract_osm.py istanbul data/.raw/Istanbul.osm.gz
    python3 tools/build_places.py istanbul --cached

City extracts: https://download.bbbike.org/osm/bbbike/  (Istanbul is there, Ankara is not)
Data © OpenStreetMap contributors, ODbL.
"""
import gzip
import json
import os
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_places import CITIES, ROOT  # noqa: E402

# Same filters as build_places.KINDS, written as tests on a tag dict.
TESTS = {
    "worship": ("core", lambda t: t.get("amenity") == "place_of_worship" and "name" in t),
    "mall": ("core", lambda t: t.get("shop") == "mall" and "name" in t),
    "hospital": ("core", lambda t: t.get("amenity") == "hospital" and "name" in t),
    "police": ("core", lambda t: t.get("amenity") == "police"),
    "pharmacy": ("core", lambda t: t.get("amenity") == "pharmacy"),
    "food": ("food", lambda t: t.get("amenity") == "restaurant" and "name" in t),
}


def open_any(path):
    return gzip.open(path, "rb") if path.endswith(".gz") else open(path, "rb")


def elements(path):
    """Stream finished <node>/<way>/<relation> elements, freeing memory as we go."""
    ctx = ET.iterparse(open_any(path), events=("start", "end"))
    _, root = next(ctx)
    for ev, el in ctx:
        if ev == "end" and el.tag in ("node", "way", "relation"):
            yield el
            root.clear()


def kinds_for(tags):
    return [k for k, (_, test) in TESTS.items() if test(tags)]


def inside(box, lat, lon):
    s, w, n, e = box
    return s <= lat <= n and w <= lon <= e


def main(city, path):
    cfg = CITIES[city]
    hits = {k: [] for k in TESTS}
    way_nodes = {}  # way id -> (tags, kinds, node refs) for tagged ways

    # Pass 1: tagged nodes directly, tagged ways remember their node refs.
    print("pass 1: reading tags…", file=sys.stderr)
    for el in elements(path):
        if el.tag == "relation":
            break  # relations come last; we only use nodes and ways
        tags = {t.get("k"): t.get("v") for t in el.findall("tag")}
        ks = kinds_for(tags) if tags else []
        if ks:
            if el.tag == "node":
                lat, lon = float(el.get("lat")), float(el.get("lon"))
                for k in ks:
                    hits[k].append({"type": "node", "lat": lat, "lon": lon, "tags": tags})
            else:
                way_nodes[el.get("id")] = (tags, ks, [nd.get("ref") for nd in el.findall("nd")])

    # Pass 2: coordinates for the nodes of tagged ways, then a simple centre.
    need = {ref for _, _, refs in way_nodes.values() for ref in refs}
    coords = {}
    print(f"pass 2: {len(way_nodes)} buildings, {len(need)} corner points…", file=sys.stderr)
    for el in elements(path):
        if el.tag != "node":
            break  # nodes come before ways in OSM files
        if el.get("id") in need:
            coords[el.get("id")] = (float(el.get("lat")), float(el.get("lon")))
    for tags, ks, refs in way_nodes.values():
        pts = [coords[r] for r in refs if r in coords]
        if not pts:
            continue
        lat = sum(p[0] for p in pts) / len(pts)
        lon = sum(p[1] for p in pts) / len(pts)
        for k in ks:
            hits[k].append({"type": "way", "center": {"lat": lat, "lon": lon}, "tags": tags})

    os.makedirs(os.path.join(ROOT, "data", ".raw"), exist_ok=True)
    for k, (area, _) in TESTS.items():
        box = cfg[area]
        els = [e for e in hits[k] if inside(box, e.get("lat") or e["center"]["lat"], e.get("lon") or e["center"]["lon"])]
        out = os.path.join(ROOT, "data", ".raw", f"{city}-{k}.json")
        with open(out, "w", encoding="utf-8") as f:
            json.dump({"elements": els, "source": os.path.basename(path)}, f)
        print(f"  {k}: {len(els)}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in CITIES:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
