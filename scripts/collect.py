#!/usr/bin/env python3
"""Download the survey list and five national indicators from the DHS Program API.

    python3 scripts/collect.py

Each response is saved as received in data/raw/, so the story can be rebuilt
offline and every figure traced back to a raw file.
"""
import json
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.dhsprogram.com/rest/dhs"
RAW = Path(__file__).resolve().parent.parent / "data" / "raw"
HEADERS = {"User-Agent": "five-springs/1.0 (open-data study)"}
INDICATORS = ["CM_ECMT_C_U5M", "CM_ECMT_C_IMR", "CM_ECMT_C_NNR", "CN_NUTS_C_HA2", "RH_DELP_C_DHF"]


def fetch(path, name, **params):
    params = {**params, "f": "json", "perpage": 3000}
    url = f"{API}/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=90) as r:
        text = r.read().decode("utf-8")
    json.loads(text)
    (RAW / f"{name}.json").write_text(text, encoding="utf-8")
    print(name)


RAW.mkdir(parents=True, exist_ok=True)
fetch("surveys", "surveys")
fetch("countries", "countries")
for indicator in INDICATORS:
    fetch("data", indicator, indicatorIds=indicator, surveyType="DHS", breakdown="national")
