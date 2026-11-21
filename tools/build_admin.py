#!/usr/bin/env python3
"""District borders for "which district am I in?", worked out on the phone without asking a server.

Reads the 81 provinces and 973 districts (OpenStreetMap boundary relations) from Geofabrik's
Türkiye .pbf, joins each district's border ways into rings, simplifies them to ~80 m, and writes
one small file per 0.25° square: data/admin/<y>_<x>.json = [[province, district, [rings]], ...]
holding every district whose border box touches that square. stdlib only:

    python3 tools/build_admin.py data/.raw/turkey-latest.osm.pbf

Data © OpenStreetMap contributors, ODbL.
"""
import json
import math
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_places import ROOT  # noqa: E402
from extract_pbf import blocks, fields, packed, zigzag_delta  # noqa: E402

CELL = 0.25
TOL = 0.0008  # simplification tolerance in degrees (~80 m)
KEEP_EVERY = 4  # keep every 4th border point before simplifying (borders are dense)


def read_relations(path):
    rels = {}
    for blk in blocks(path):
        strings, groups = [], []
        for fn, v in fields(blk):
            if fn == 1:
                strings = [bytes(s) for f2, s in fields(v) if f2 == 1]
            elif fn == 2:
                groups.append(v)
        if b"admin_level" not in strings:
            continue
        for g in groups:
            for fn, v in fields(g):
                if fn != 4:
                    continue
                rid, keys, vals, roles, mem, typ = 0, None, None, None, None, None
                for f2, w in fields(v):
                    if f2 == 1:
                        rid = w
                    elif f2 == 2:
                        keys = packed(w)
                    elif f2 == 3:
                        vals = packed(w)
                    elif f2 == 8:
                        roles = packed(w)
                    elif f2 == 9:
                        mem = zigzag_delta(packed(w))
                    elif f2 == 10:
                        typ = packed(w)
                if not keys:
                    continue
                t = {strings[k].decode(): strings[x].decode("utf-8", "replace") for k, x in zip(keys, vals)}
                if t.get("boundary") != "administrative" or t.get("admin_level") not in ("4", "6"):
                    continue
                ms = list(zip([strings[r].decode() for r in roles or []], mem or [], typ or []))
                rels[rid] = {"lvl": t["admin_level"], "name": t.get("name", ""), "iso": t.get("ISO3166-2", ""),
                             "ways": [m for r, m, ty in ms if ty == 1 and r in ("outer", "")],
                             "sub": [m for r, m, ty in ms if ty == 2 and r == "subarea"]}
    return rels


def read_ways(path, want):
    ways = {}
    for blk in blocks(path):
        for fn, v in fields(blk):
            if fn != 2:
                continue
            for f2, w in fields(v):
                if f2 != 3:
                    continue  # ways only
                wid, refs = 0, None
                for f3, x in fields(w):
                    if f3 == 1:
                        wid = x
                    elif f3 == 8:
                        refs = x
                if wid in want and refs is not None:
                    ways[wid] = zigzag_delta(packed(refs))
    return ways


def read_nodes(path, want):
    found = {}
    for blk in blocks(path):
        gran, lat_off, lon_off, groups = 100, 0, 0, []
        for fn, v in fields(blk):
            if fn == 2:
                groups.append(v)
            elif fn == 17:
                gran = v
            elif fn == 19:
                lat_off = v
            elif fn == 20:
                lon_off = v
        for g in groups:
            for fn, v in fields(g):
                if fn != 2:
                    continue
                ids = lats = lons = None
                for f2, w in fields(v):
                    if f2 == 1:
                        ids = zigzag_delta(packed(w))
                    elif f2 == 8:
                        lats = w
                    elif f2 == 9:
                        lons = w
                hit = [i for i, nid in enumerate(ids) if nid in want]
                if not hit:
                    continue
                la, lo = zigzag_delta(packed(lats)), zigzag_delta(packed(lons))
                for i in hit:
                    found[ids[i]] = ((lat_off + gran * la[i]) / 1e9, (lon_off + gran * lo[i]) / 1e9)
    return found


def rings_of(way_lists):
    """Join ways (lists of node ids) end to end into closed rings."""
    pool = [list(w) for w in way_lists if len(w) >= 2]
    rings = []
    while pool:
        ring = pool.pop()
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, w in enumerate(pool):
                if w[0] == ring[-1]:
                    ring += w[1:]
                elif w[-1] == ring[-1]:
                    ring += w[-2::-1]
                elif w[-1] == ring[0]:
                    ring = w[:-1] + ring
                elif w[0] == ring[0]:
                    ring = w[:0:-1] + ring
                else:
                    continue
                pool.pop(i)
                changed = True
                break
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def simplify(pts, tol):
    if len(pts) < 4:
        return pts
    if pts[0] == pts[-1]:  # closed ring: split at the farthest point so both halves have a real baseline
        k = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
        return _dp(pts[:k + 1], tol) + _dp(pts[k:], tol)[1:]
    return _dp(pts, tol)


def _dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (y1, x1), (y2, x2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1e-12
        best, idx = 0, -1
        for i in range(a + 1, b):
            y, x = pts[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
            if d > best:
                best, idx = d, i
        if best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def main(path):
    cache = os.path.join(ROOT, "data", ".raw", "admin-cache.pkl")
    if path == "--cached":
        import pickle
        with open(cache, "rb") as f:
            districts, thin, coords = pickle.load(f)
        return write(districts, thin, coords)
    print("relations…", file=sys.stderr)
    rels = read_relations(path)
    provinces = [r for r in rels.values() if r["lvl"] == "4" and r["iso"].startswith("TR-")]
    districts = []
    for p in provinces:
        pn = p["name"].replace(" İli", "")
        for sid in p["sub"]:
            d = rels.get(sid)
            if d:
                districts.append((pn, d["name"], d["ways"]))
    print(f"{len(provinces)} provinces, {len(districts)} districts", file=sys.stderr)
    want_ways = {w for _, _, ws in districts for w in ws}
    print(f"ways ({len(want_ways)})…", file=sys.stderr)
    ways = read_ways(path, want_ways)
    # Thin each way but keep its ends, so rings still join.
    thin = {wid: [r for i, r in enumerate(refs) if i % KEEP_EVERY == 0 or i == len(refs) - 1] for wid, refs in ways.items()}
    want_nodes = {n for refs in thin.values() for n in refs}
    print(f"found {len(ways)} ways; nodes ({len(want_nodes)})…", file=sys.stderr)
    coords = read_nodes(path, want_nodes)
    print(f"found {len(coords)} nodes", file=sys.stderr)
    import pickle
    with open(os.path.join(ROOT, "data", ".raw", "admin-cache.pkl"), "wb") as f:
        pickle.dump((districts, thin, coords), f)
    write(districts, thin, coords)


def write(districts, thin, coords):

    out_dir = os.path.join(ROOT, "data", "admin")
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir)
    cells, missing = {}, []
    for pn, dn, ws in districts:
        polys = []
        for ring in rings_of([thin[w] for w in ws if w in thin]):
            pts = [coords[n] for n in ring if n in coords]
            pts = simplify(pts, TOL)
            if len(pts) >= 4:
                polys.append([[round(y, 4), round(x, 4)] for y, x in pts])
        if not polys:
            missing.append((pn, dn))
            continue
        ys = [p[0] for r in polys for p in r]
        xs = [p[1] for r in polys for p in r]
        for cy in range(math.floor(min(ys) / CELL), math.floor(max(ys) / CELL) + 1):
            for cx in range(math.floor(min(xs) / CELL), math.floor(max(xs) / CELL) + 1):
                cells.setdefault(f"{cy}_{cx}", []).append([pn, dn, polys])
    size = 0
    for key, items in cells.items():
        p = os.path.join(out_dir, f"{key}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, separators=(",", ":"))
        size += os.path.getsize(p)
    with open(os.path.join(out_dir, "index.json"), "w") as f:
        json.dump(sorted(cells), f, separators=(",", ":"))
    print(f"wrote {len(cells)} squares, {size // 1024} KB; no border for {missing}", file=sys.stderr)
    write_country_map(districts, thin, coords)


def write_country_map(districts, thin, coords):
    """A small drawing of Türkiye for the profile: every district as an SVG path, grouped by province."""
    k = math.cos(math.radians(39))  # keep shapes true at Türkiye's latitude
    W, minx, maxx, miny, maxy = 1000, 25.6, 44.9, 35.8, 42.2
    sx = W / ((maxx - minx) * k)
    H = round((maxy - miny) * sx)
    prov = {}
    for pn, dn, ws in districts:
        for ring in rings_of([thin[w] for w in ws if w in thin]):
            pts = simplify([coords[n] for n in ring if n in coords], 0.012)
            xy = []
            for y, x in pts:
                q = (round((x - minx) * k * sx), round((maxy - y) * sx))
                if not xy or xy[-1] != q:
                    xy.append(q)
            if len(xy) >= 4:
                prov.setdefault(pn, []).append("M" + "L".join(f"{a},{b}" for a, b in xy) + "Z")
    out = {"w": W, "h": H, "p": [[n, "".join(paths)] for n, paths in sorted(prov.items())]}
    path = os.path.join(ROOT, "data", "tr-map.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"country map: {len(prov)} provinces, {os.path.getsize(path) // 1024} KB", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
