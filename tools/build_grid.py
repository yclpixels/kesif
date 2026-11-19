#!/usr/bin/env python3
"""Places for all of Türkiye, cut into small map squares, so every province and district works.

City packs (build_places.py) cover 15 cities. Everywhere else the app loads the squares around the
visitor from data/grid/. Each square is 0.25° (about 25 km) wide and holds the same compact records
as a city pack. Built from Geofabrik's free extracts, stdlib only:

    python3 tools/build_grid.py data/.raw/turkey-latest-free.shp.zip data/.raw/turkey-latest.osm.pbf

The shapefile gives every named place, including buildings drawn as areas; the .pbf adds phone,
address, opening hours and cuisine for places mapped as points.
Data © OpenStreetMap contributors, ODbL.
"""
import json
import math
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_places import ROOT, compact  # noqa: E402
from extract_pbf import blocks, kind_of, nodes_in  # noqa: E402
from extract_shp import layer, religion_of  # noqa: E402

CELL = 0.25
NAMED_ONLY = {"worship", "food", "mall", "hospital", "cafe"}
SHP_POI = {
    "restaurant": ("food", {"amenity": "restaurant"}), "cafe": ("cafe", {"amenity": "cafe"}),
    "pharmacy": ("pharmacy", {"amenity": "pharmacy"}), "hospital": ("hospital", {"amenity": "hospital"}),
    "police": ("police", {"amenity": "police"}), "mall": ("mall", {"shop": "mall"}),
    "atm": ("atm", {"amenity": "atm"}), "toilet": ("toilets", {"amenity": "toilets"}),
}


def cell_of(lat, lon):
    return f"{math.floor(lat / CELL)}_{math.floor(lon / CELL)}"


def near(a, b, m):
    return ((a[0] - b[0]) * 111000) ** 2 + ((a[1] - b[1]) * 85000) ** 2 < m * m


def main(shp_path, pbf_path):
    cells = {}  # cell -> kind -> [element]

    near_index = {}  # (kind, ~100 m square) -> elements, for quick duplicate checks

    def add(kind, el):
        cells.setdefault(cell_of(el["lat"], el["lon"]), {}).setdefault(kind, []).append(el)
        near_index.setdefault((kind, round(el["lat"], 3), round(el["lon"], 3)), []).append(el)

    # 1. Detailed points from the .pbf
    n = 0
    for blk in blocks(pbf_path):
        n += 1
        if n % 1000 == 0:
            print(f"  pbf {n} blocks…", file=sys.stderr)
        for lat, lon, tags in nodes_in(blk):
            k = kind_of(tags)
            if k:
                add(k, {"lat": lat, "lon": lon, "tags": tags})
    detail = sum(len(v) for c in cells.values() for v in c.values())
    print(f"pbf: {detail} detailed points", file=sys.stderr)

    # 2. Everything else from the shapefile (areas included), unless the .pbf already has it.
    import zipfile
    z = zipfile.ZipFile(shp_path)
    extra = 0

    def add_shp(kind, lat, lon, tags):
        nonlocal extra
        if kind in NAMED_ONLY and not tags.get("name"):
            return
        la, lo = round(lat, 3), round(lon, 3)
        mine = [e for dy in (-0.001, 0, 0.001) for dx in (-0.001, 0, 0.001) for e in near_index.get((kind, round(la + dy, 3), round(lo + dx, 3)), [])]
        nm = tags.get("name", "")
        for e in mine:
            if near((lat, lon), (e["lat"], e["lon"]), 60 if nm else 25) and (not nm or e["tags"].get("name") == nm):
                return
        add(kind, {"lat": lat, "lon": lon, "tags": tags})
        extra += 1

    for lname in ("gis_osm_pois_free_1", "gis_osm_pois_a_free_1"):
        print(f"reading {lname}…", file=sys.stderr)
        for (lon, lat), rec in layer(z, lname):
            m = SHP_POI.get(rec.get("fclass", ""))
            if m:
                add_shp(m[0], lat, lon, {**m[1], "name": rec.get("name", "")})
    for lname in ("gis_osm_pofw_free_1", "gis_osm_pofw_a_free_1"):
        print(f"reading {lname}…", file=sys.stderr)
        for (lon, lat), rec in layer(z, lname):
            add_shp("worship", lat, lon, {"amenity": "place_of_worship", "name": rec.get("name", ""), "religion": religion_of(rec.get("fclass", ""))})
    print(f"shapefile: {extra} more places", file=sys.stderr)

    # 3. Write one small file per square
    out_dir = os.path.join(ROOT, "data", "grid")
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir)
    total = size = 0
    for key, kinds in cells.items():
        out = {}
        for kind, els in kinds.items():
            items, seen = [], set()
            for el in els:
                c = compact(el, kind)
                if not c or (kind in NAMED_ONLY and not c["n"]):
                    continue
                k = (c["n"], round(c["a"], 4), round(c["o"], 4))
                if k not in seen:
                    seen.add(k)
                    items.append(c)
            if items:
                out[kind] = items
                total += len(items)
        if out:
            path = os.path.join(out_dir, f"{key}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
            size += os.path.getsize(path)
    # The app reads this list first, so it never asks for squares that don't exist (sea, empty land).
    keys = sorted(f[:-5] for f in os.listdir(out_dir))
    with open(os.path.join(out_dir, "index.json"), "w") as f:
        json.dump(keys, f, separators=(",", ":"))
    print(f"wrote {len(os.listdir(out_dir))} squares, {total} places, {size // 1024} KB", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
