# UniFi switch front-panel specs (ticket 37)

Research for ticket `37-unifi-front-panel-research`. Feeds the device-model library (ticket 38, decided in ticket 32): every seed entry becomes a `LayoutPreset` with `vendor`, prefilled `model`, baked `sections`, and a one-line `details` blurb.

Method: Ubiquiti official datasheets (`dl.ubnt.com/ds/*.pdf`, `dl.ui.com/ds/*.pdf`) and Ubiquiti Quick Start Guides (`dl.ubnt.com/qsg/<MODEL>/<MODEL>_EN.html`), including their front-panel callout images (confirmed by pixel inspection at 4–5× zoom); techspecs pages (`techspecs.ui.com`) for marketing names. Claims are tagged **[datasheet]**, **[qsg]**, or **[photo/render]**.

## TL;DR for the seed

1. All rackmount UniFi RJ45 sections are 2 rows, grouped (2 rows × 6 for 24-port RJ45 fields, 2 rows × 8 for 48-port RJ45 fields, 2 rows × 4 on the Lite-16), numbered **alternating top-first**: odd labels across the top row, even across the bottom (1/2, 3/4, … column pairs). Confirmed on USW-Lite-16-PoE's product render (top: 1,3,…,15; bottom: 2,4,…,16) and the US-24-era QSG convention [photo/render, doc].
2. SFP/SFP+ uplinks sit at the **right end** of the faceplate in every model researched, and their labels **continue the RJ45 numbering**: USW-24/Pro-24 → 25–26; USW-48/Pro-48 → 49–52. USW-Aggregation is SFP+ only, no RJ45.
3. SFP cage geometry: 2×1 vertical stack for 2-cage models (25 over 26), 2×2 block for 4-cage models (49 top-left, 50 bottom-left, 51 top-right, 52 bottom-right — same alternating column-pair reading).
4. Serial numbering is **not row-major**: top row odd, bottom row even, continuing left-to-right across physical groups.

## Seed models (8 entries)

| SKU (`model`) | Marketing name | Sections (rows × cols, kind, speed) | Numbering | Uplinks | PoE | Sources |
|---|---|---|---|---|---|---|
| USW-Lite-8-PoE | Lite 8 PoE | 1×8 RJ45, 1G (single row) | sequential 1–8 | none | 4× 802.3af/at (ports 1–4) | [datasheet](https://dl.ubnt.com/ds/usw-lite-8-poe.pdf), [render](https://images.svc.ui.com/?u=https%3A%2F%2Fcdn.ecomm.ui.com%2Fproducts%2F75c44878-4e73-446e-8e86-f207db6b2b7c%2F2116b3a2-bfcf-40f7-a8f2-1f56915959b5.png) |
| USW-Lite-16-PoE | Lite 16 PoE | 2× (2×4) RJ45, 1G | alternating top-first 1–16 | none | 8× 802.3af/at | [datasheet](https://dl.ubnt.com/ds/usw-lite-16-poe.pdf), [render](https://images.svc.ui.com/?u=https%3A%2F%2Fcdn.ecomm.ui.com%2Fproducts%2Fe726eace-a772-4f12-bfad-c68baf20e51f%2F0eebb92b-e877-4f83-8355-0764a8271132.png) |
| USW-24 | Standard 24 | 2× (2×6) RJ45, 1G | alternating top-first 1–24 | 2×1 SFP 1G at right, 25–26 | none | [datasheet](https://dl.ui.com/ds/usw-24_ds.pdf), [QSG](https://dl.ubnt.com/qsg/USW-24-POE/USW-24-POE_EN.html) (front panel mirrors USW-24-POE) |
| USW-24-PoE | Standard 24 PoE | 2× (2×6) RJ45, 1G | alternating top-first 1–24 | 2×1 SFP 1G at right, 25–26 | 16× 802.3af/at (ports 1–16) | [QSG](https://dl.ubnt.com/qsg/USW-24-POE/USW-24-POE_EN.html), [datasheet](https://dl.ui.com/datasheets/unifi/UniFi_PoE_Switch.pdf) |
| USW-48-PoE | Standard 48 PoE | 3× (2×8) RJ45, 1G | alternating top-first 1–48 | 2×2 SFP 1G at right, 49–52 | 32× 802.3af/at (ports 1–32) | [QSG](https://dl.ubnt.com/qsg/USW-48-POE/USW-48-POE_EN.html), techspecs |
| USW-Pro-24-PoE | Switch Pro 24 PoE | 2× (2×6) RJ45, 1G | alternating top-first 1–24 | 2×1 SFP+ 10G at right, 25–26 | 16× (8× PoE++ 60 W) (ports 1–16) | [datasheet](https://dl.ui.com/ds/usw-pro-24-poe_ds.pdf), [QSG](https://dl.ubnt.com/qsg/USW-Pro-24-POE/USW-Pro-24-POE_EN.html) |
| USW-Pro-48-PoE | Switch Pro 48 PoE | 3× (2×8) RJ45, 1G | alternating top-first 1–48 | 2×2 SFP+ 10G at right, 49–52 | 40× (8× PoE++ 60 W) (ports 1–40) | [datasheet](https://dl.ui.com/ds/usw-pro-48-poe_ds.pdf), [QSG](https://dl.ubnt.com/qsg/USW-Pro-48-POE/USW-Pro-48-POE_EN.html) |
| USW-Aggregation | Switch Aggregation | 2×4 SFP+, 10G (right end; no RJ45) | sequential or alternating — undocumented, see notes | 8× 10G SFP+ | none | [datasheet](https://dl.ubnt.com/ds/usw-aggregation-ds.pdf), [render](https://images.svc.ui.com/?u=https%3A%2F%2Fcdn.ecomm.ui.com%2Fproducts%2F1c748fb1-b4df-43ef-83e0-d5ed26f9db7c%2F0247dd12-2dba-44c7-a717-626992874181.png) |

Notes on physical group boundaries: the 24-port RJ45 fields are physically two 2×6 groups with a visible gap between them, and the 48-port fields are three 2×8 groups; PoE-capable regions (ports 1–16 / 1–32 / 1–40) are marked by callouts that straddle group boundaries. In the seed, each physical group becomes its own `Section` — the faceplate reads identically either way because `auto` start chaining keeps the numbering continuous.

## JSON seed (`LayoutPreset` shape)

```json
[
  {
    "id": "usw-lite-8-poe",
    "vendor": "UniFi",
    "label": "UniFi USW-Lite-8-PoE",
    "model": "USW-Lite-8-PoE",
    "sections": [
      { "rows": 1, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "sequential", "startMode": "auto" }
    ],
    "details": "1 row of 8 RJ45 1G ports, sequential (1–8); no SFP uplinks."
  },
  {
    "id": "usw-lite-16-poe",
    "vendor": "UniFi",
    "label": "UniFi USW-Lite-16-PoE",
    "model": "USW-Lite-16-PoE",
    "sections": [
      { "rows": 2, "columns": 4, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 4, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "2 sections of 2×4 RJ45 1G ports, alternating top-first (1–16); no SFP uplinks."
  },
  {
    "id": "usw-24",
    "vendor": "UniFi",
    "label": "UniFi USW-24",
    "model": "USW-24",
    "sections": [
      { "rows": 2, "columns": 6, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 6, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 1, "kind": "sfp", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "2×6 + 2×6 RJ45 1G sections, alternating top-first (1–24); 2×1 SFP 1G uplinks at 25–26."
  },
  {
    "id": "usw-24-poe",
    "vendor": "UniFi",
    "label": "UniFi USW-24-PoE",
    "model": "USW-24-PoE",
    "sections": [
      { "rows": 2, "columns": 6, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 6, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 1, "kind": "sfp", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "2×6 + 2×6 RJ45 1G sections, alternating top-first (1–24), PoE+ on ports 1–16; 2×1 SFP 1G uplinks at 25–26."
  },
  {
    "id": "usw-48-poe",
    "vendor": "UniFi",
    "label": "UniFi USW-48-PoE",
    "model": "USW-48-PoE",
    "sections": [
      { "rows": 2, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 2, "kind": "sfp", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "Three 2×8 RJ45 1G sections, alternating top-first (1–48), PoE+ on ports 1–32; 2×2 SFP 1G uplinks at 49–52."
  },
  {
    "id": "usw-pro-24-poe",
    "vendor": "UniFi",
    "label": "UniFi USW-Pro-24-PoE",
    "model": "USW-Pro-24-PoE",
    "sections": [
      { "rows": 2, "columns": 6, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 6, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 1, "kind": "sfp", "speed": "10G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "2×6 + 2×6 RJ45 1G sections, alternating top-first (1–24), PoE+/PoE++ on ports 1–16; 2×1 SFP+ 10G uplinks at 25–26."
  },
  {
    "id": "usw-pro-48-poe",
    "vendor": "UniFi",
    "label": "UniFi USW-Pro-48-PoE",
    "model": "USW-Pro-48-PoE",
    "sections": [
      { "rows": 2, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 8, "kind": "rj45", "speed": "1G", "numbering": "alternating-top-first", "startMode": "auto" },
      { "rows": 2, "columns": 2, "kind": "sfp", "speed": "10G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "Three 2×8 RJ45 1G sections, alternating top-first (1–48), PoE+/PoE++ on ports 1–40; 2×2 SFP+ 10G uplinks at 49–52."
  },
  {
    "id": "usw-aggregation",
    "vendor": "UniFi",
    "label": "UniFi USW-Aggregation",
    "model": "USW-Aggregation",
    "sections": [
      { "rows": 2, "columns": 4, "kind": "sfp", "speed": "10G", "numbering": "alternating-top-first", "startMode": "auto" }
    ],
    "details": "2×4 SFP+ 10G ports, alternating top-first (1–8); no RJ45 ports."
  }
]
```

### Seed JSON notes / uncertainties

- **`label`** follows ticket 32's `<vendor> <model>` rule; `vendor` is `"UniFi"` (product line branding). `model` carries the SKU.
- **SFP numbering**: UniFi QSGs explicitly number SFP cages to continue the RJ45 sequence (USW-24-POE: SFP 25–26; USW-48-POE: SFP 49–52), so `startMode: "auto"` on every section reproduces it. The same alternating odd-top/even-bottom reading is assumed for the 2×1/2×2 SFP blocks (cage positions 49/50 and 51/52 in the USW-48 callout support this).
- **USW-Aggregation numbering is undocumented**: no datasheet or QSG states whether its 8 SFP+ cages run 1–8 row-major or odd/even column pairs. Seeded as a single 2×4 `alternating-top-first` section (1–8 either way, only the per-column pairing differs); flag to the user before shipping if it matters.
- **USW-24 (non-PoE) front panel**: no dedicated QSG front callout found; it mirrors the USW-24-PoE shell (same dimensions, 24×1G + 2×SFP), so the 24-PoE front layout is reused. Low risk.
- **Lite-8-PoE single-row ports**: confirmed by product render (8 RJ45 in one horizontal row, 4 PoE+ left / 4 non-PoE right); its per-port numbering (1–8 across) is inferred sequential — no datasheet documents it.
- **PoE split is callout-level, not section-level** (e.g. USW-24-PoE PoE+ ends at port 16, mid-second-group). The seed intentionally does not split PoE/non-PoE into separate sections; the PoE region is noted in `details`.
- **`kind` after ticket 36**: SFP+ cages are seeded as `"kind": "sfp"` with `"speed": "10G"` (single SFP kind), matching the ADR 0002 decision.

## Sources

1. USW-Lite-8-PoE datasheet: https://dl.ubnt.com/ds/usw-lite-8-poe.pdf
2. USW-Lite-16-PoE datasheet: https://dl.ubnt.com/ds/usw-lite-16-poe.pdf
3. USW-Lite-16-PoE product render (port labels): techspecs.ui.com / store.ui.com listing
4. USW-24 datasheet: https://dl.ui.com/ds/usw-24_ds.pdf
5. USW-24-POE QSG: https://dl.ubnt.com/qsg/USW-24-POE/USW-24-POE_EN.html
6. USW-48-POE QSG: https://dl.ubnt.com/qsg/USW-48-POE/USW-48-POE_EN.html
7. USW-Pro-24-POE QSG: https://dl.ubnt.com/qsg/USW-Pro-24-POE/USW-Pro-24-POE_EN.html
8. USW-Pro-48-POE QSG: https://dl.ubnt.com/qsg/USW-Pro-48-POE/USW-Pro-48-POE_EN.html
9. USW-Pro-24-POE datasheet: https://dl.ui.com/ds/usw-pro-24-poe_ds.pdf
10. USW-Pro-48-POE datasheet: https://dl.ui.com/ds/usw-pro-48-poe_ds.pdf
11. USW-Aggregation datasheet: https://dl.ubnt.com/ds/usw-aggregation-ds.pdf
