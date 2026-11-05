#!/usr/bin/env python3
"""Turn the raw API files into src/lib/data.json, which the page reads.

    python3 scripts/build.py

Each survey row is [year, under-five, infant, neonatal, stunting %, facility births %].
Mortality is per 1,000 births for the five years before the survey.
A measure a survey did not report is null.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
ORDER = ["CM_ECMT_C_U5M", "CM_ECMT_C_IMR", "CM_ECMT_C_NNR", "CN_NUTS_C_HA2", "RH_DELP_C_DHF"]
PERIOD = {"CM_ECMT_C_U5M", "CM_ECMT_C_IMR", "CM_ECMT_C_NNR"}
DISPLAY = {"Congo Democratic Republic": "DR Congo", "Cote d'Ivoire": "Côte d'Ivoire"}


def load(name):
    return json.loads((RAW / f"{name}.json").read_text(encoding="utf-8"))["Data"]


def name(country):
    return DISPLAY.get(country, country)


surveys = [s for s in load("surveys") if s["SurveyType"] == "DHS"]
values = {}
for indicator in ORDER:
    for row in load(indicator):
        if row["IsTotal"] != 1 or row["IsPreferred"] != 1:
            continue
        if indicator in PERIOD and row["CharacteristicLabel"] != "0-4":
            continue
        values[(row["SurveyId"], indicator)] = row["Value"]

countries = {}
for s in sorted(surveys, key=lambda x: (x["CountryName"], int(x["SurveyYear"]))):
    row = [int(s["SurveyYear"])] + [values.get((s["SurveyId"], i)) for i in ORDER]
    if any(v is not None for v in row[1:]):
        countries.setdefault(name(s["CountryName"]), {"s": [], "last": 0})
        countries[name(s["CountryName"])]["s"].append(row)
for s in surveys:
    c = countries[name(s["CountryName"])]
    c["last"] = max(c["last"], int(s["SurveyYear"]))

listing = sorted([int(s["SurveyYear"]), name(s["CountryName"])] for s in surveys)
years = [[y, sum(1 for s in listing if s[0] == y)] for y in range(1985, 2026)]
out = {"retrieved": "2026-11", "countries": countries, "years": years, "surveys": listing}
path = ROOT / "src" / "lib" / "data.json"
path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(countries)} countries, {len(listing)} surveys")
