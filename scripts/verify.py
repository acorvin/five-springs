#!/usr/bin/env python3
"""Check src/lib/data.json against the raw files, and every fixed figure in the story.

    python3 scripts/verify.py

This walks the raw indicator rows directly, in the opposite direction from
build.py, and stops on the first failure.
"""
import json
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
data = json.loads((ROOT / "src" / "lib" / "data.json").read_text(encoding="utf-8"))
C = data["countries"]
RENAME = {"DR Congo": "Congo Democratic Republic", "Côte d'Ivoire": "Cote d'Ivoire"}
COLUMN = {"CM_ECMT_C_U5M": 1, "CM_ECMT_C_IMR": 2, "CM_ECMT_C_NNR": 3, "CN_NUTS_C_HA2": 4, "RH_DELP_C_DHF": 5}
raw = lambda n: json.loads((RAW / f"{n}.json").read_text(encoding="utf-8"))["Data"]


def check(ok, message):
    if not ok:
        raise SystemExit(f"FAILED: {message}")


dhs = [s for s in raw("surveys") if s["SurveyType"] == "DHS"]
check(all(s["SurveyStatus"] == "Completed" for s in dhs), "a listed survey is not completed")
index = {}
for name, c in C.items():
    for row in c["s"]:
        index[(RENAME.get(name, name), row[0])] = row

compared = 0
for indicator, col in COLUMN.items():
    for r in raw(indicator):
        if r["IsTotal"] == 1 and r["IsPreferred"] == 1 and (col > 3 or r["CharacteristicLabel"] == "0-4"):
            row = index[(r["CountryName"], int(r["SurveyYear"]))]
            check(row[col] == r["Value"], f"{r['SurveyId']} {indicator}: {row[col]} against {r['Value']}")
            compared += 1
stored = sum(v is not None for c in C.values() for row in c["s"] for v in row[1:])
check(compared == stored, f"{stored} stored values, {compared} in the raw files")

for name, c in C.items():
    for y, u5, im, nn, *_ in c["s"]:
        if u5 is not None:
            check(nn is not None and im is not None and nn <= im <= u5, f"{name} {y}: mortality out of order")

surveys_per = {y: n for y, n in data["years"]}
last = {n: c["last"] for n, c in C.items()}
check(len(dhs) == 322 == len(data["surveys"]) == sum(surveys_per.values()), "322 surveys")
check(len(C) == 87, "87 countries")
check(sum(y < 2015 for y in last.values()) == 39, "39 countries with no survey since before 2015")
check(round(statistics.mean(surveys_per[y] for y in range(2010, 2020)), 1) == 9.9, "9.9 surveys a year")
check(round(statistics.mean(surveys_per[y] for y in range(2020, 2026)), 1) == 4.2, "4.2 surveys a year")


def ends(name, col):
    v = [r for r in C[name]["s"] if r[col] is not None]
    return v[0], v[-1]


counts = []
for col in (1, 4, 5):
    pairs = [(n, *ends(n, col)) for n in C if any(r[col] is not None for r in C[n]["s"])]
    pairs = [p for p in pairs if p[2][0] - p[1][0] >= 10]
    counts.append(len(pairs))
    if col in (1, 4):
        check(all(b[col] < a[col] for _, a, b in pairs), f"column {col}: not every country fell")
    else:
        check([n for n, a, b in pairs if b[col] < a[col]] == ["Madagascar"], "only Madagascar fell on facility births")
check(counts == [54, 48, 52], f"plant counts {counts}")
print(f"ALL CHECKS PASSED: {compared} values, {len(C)} countries, {len(dhs)} surveys")
