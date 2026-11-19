#!/usr/bin/env python3
"""Pull places out of Geofabrik's free shapefile package for Türkiye, without extra packages.

Use this when the Overpass servers are down. It reads only the point-of-interest and
place-of-worship layers from the zip and writes the same cache files build_places.py reads:

    curl -L -o data/.raw/turkey-latest-free.shp.zip https://download.geofabrik.de/europe/turkey-latest-free.shp.zip
    python3 tools/extract_shp.py data/.raw/turkey-latest-free.shp.zip ankara izmir antalya kapadokya
    python3 tools/build_places.py --cached

The free layers carry name, category and religion only (no phone, street or cuisine).
Data © OpenStreetMap contributors, ODbL.
"""
import io
import json
import os
import struct
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_places import CITIES, ROOT  # noqa: E402

# Geofabrik "fclass" → our kind and the OSM tags build_places.compact() expects.
POI = {
    "restaurant": ("food", {"amenity": "restaurant"}),
    "pharmacy": ("pharmacy", {"amenity": "pharmacy"}),
    "hospital": ("hospital", {"amenity": "hospital"}),
    "police": ("police", {"amenity": "police"}),
    "mall": ("mall", {"shop": "mall"}),
}


def religion_of(fclass):
    for r in ("muslim", "christian", "jewish", "buddhist", "hindu", "sikh"):
        if fclass.startswith(r):
            return r
    return ""


def read_dbf(data):
    """Yield one dict per record of a dBASE III file (UTF-8 text, as Geofabrik writes it)."""
    n, header_len, rec_len = struct.unpack("<xxxxIHH", data[:12])
    fields, pos = [], 32
    while data[pos] != 0x0D:
        name = data[pos:pos + 11].split(b"\0")[0].decode()
        flen = data[pos + 16]
        fields.append((name, flen))
        pos += 32
    for i in range(n):
        off = header_len + i * rec_len + 1  # skip the deletion flag
        rec = {}
        for name, flen in fields:
            rec[name] = data[off:off + flen].decode("utf-8", "replace").strip()
            off += flen
        yield rec


def read_shp(data):
    """Yield (lon, lat) for each record: the point itself, or the centre of a polygon's box."""
    pos = 100
    while pos < len(data):
        _, length = struct.unpack(">ii", data[pos:pos + 8])
        shape = struct.unpack("<i", data[pos + 8:pos + 12])[0]
        body = pos + 12
        if shape == 1:
            yield struct.unpack("<dd", data[body:body + 16])
        elif shape in (3, 5):
            xmin, ymin, xmax, ymax = struct.unpack("<dddd", data[body:body + 32])
            yield ((xmin + xmax) / 2, (ymin + ymax) / 2)
        else:
            yield None
        pos += 8 + length * 2


def layer(z, name):
    shp = next((n for n in z.namelist() if n.endswith(name + ".shp")), None)
    if not shp:
        return
    base = shp[:-4]
    for coords, rec in zip(read_shp(z.read(shp)), read_dbf(z.read(base + ".dbf"))):
        if coords:
            yield coords, rec


def inside(box, lat, lon):
    s, w, n, e = box
    return s <= lat <= n and w <= lon <= e


def main(path, cities):
    z = zipfile.ZipFile(path)
    hits = {k: [] for k in ("worship", "food", "mall", "hospital", "pharmacy", "police")}
    boxes = [CITIES[c]["core"] for c in cities]
    near = lambda lat, lon: any(inside(b, lat, lon) for b in boxes)
    for lname in ("gis_osm_pois_free_1", "gis_osm_pois_a_free_1"):
        print(f"reading {lname}…", file=sys.stderr)
        for (lon, lat), rec in layer(z, lname):
            m = POI.get(rec.get("fclass", ""))
            if m and near(lat, lon):
                kind, tags = m
                hits[kind].append({"type": "node", "lat": lat, "lon": lon, "tags": {**tags, "name": rec.get("name", "")}})
    for lname in ("gis_osm_pofw_free_1", "gis_osm_pofw_a_free_1"):
        print(f"reading {lname}…", file=sys.stderr)
        for (lon, lat), rec in layer(z, lname):
            if rec.get("name") and near(lat, lon):
                hits["worship"].append({"type": "node", "lat": lat, "lon": lon, "tags": {"amenity": "place_of_worship", "name": rec["name"], "religion": religion_of(rec.get("fclass", ""))}})
    os.makedirs(os.path.join(ROOT, "data", ".raw"), exist_ok=True)
    areas = {"food": "food"}
    for city in cities:
        cfg = CITIES[city]
        for kind, els in hits.items():
            box = cfg[areas.get(kind, "core")]
            mine = [e for e in els if inside(box, e["lat"], e["lon"])]
            if kind in ("worship", "food", "mall", "hospital"):
                mine = [e for e in mine if e["tags"].get("name")]
            out = os.path.join(ROOT, "data", ".raw", f"{city}-{kind}.json")
            with open(out, "w", encoding="utf-8") as f:
                json.dump({"elements": mine, "source": os.path.basename(path)}, f)
            print(f"  {city} {kind}: {len(mine)}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) < 3 or any(c not in CITIES for c in sys.argv[2:]):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
