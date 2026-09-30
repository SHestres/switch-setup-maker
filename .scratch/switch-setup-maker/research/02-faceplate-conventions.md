# Faceplate & port-numbering conventions

Research for ticket `02-faceplate-conventions-research`. Feeds the faceplate prototype (ticket 04) and the domain model (ticket 05).

Method: vendor documentation (hardware install guides, datasheets, quick-start guides), vendor product renders/photos (analysed at pixel level for numbering, label placement, and port pitch), plus reputable reviews/community write-ups where vendor docs are silent. Claims are tagged **[doc]**, **[photo/render]**, or **[community]**; approximate measurements say so.

## TL;DR for the app

1. **1U geometry**: 44.45 mm tall, ~440–445 mm body (19" with ears). 24-port = 2 rows × 12; 48-port = 2 rows × 24. Uplinks: 2–4 SFP/SFP+ cages, most often a single row or 2×2 block at the right end; sometimes at the left (Aruba 2930F), and sometimes in a modular slot (Catalyst 9300).
2. **Numbering**: the dominant convention is **per-column pairs, odd numbers across the top row, even numbers across the bottom row** (1/2, 3/4, 5/6… vertically paired). Cisco and Ubiquiti document it; Aruba and MikroTik match. **Juniper runs even numbers on top, odd on the bottom, 0-based**. Row-major (1–24 top, 25–48 bottom) is a **patch-panel** convention, not the switch norm. Model numbering as data; don't hardcode one convention.
3. **SFP cages** are visually distinct (~14 mm metal boxes); give them their own LED, a "SFP+"/"10G" label, and either continued numbering (Cisco uplinks as 25–28/49–52) or a separate sequence (`SFP+ 1–4`, `SFP 1–2`).
4. **PoE** is shown by model text ("PoE+", `P`/`PP` suffix, budget label) and by a PoE **LED mode**, not usually by text on every port.
5. **LEDs**: one per port; green = link, blinking green = activity, amber = fault/STP-block/disabled. A **mode button** flips the whole port field between Link/Speed/PoE/etc. This is a big part of the "real switch" feel.
6. **Density**: ~**14 mm horizontal pitch** (≈11.7 mm opening + ≈2 mm gap), rows ~**11–13 mm** apart centre-to-centre, groups/separators every 8–12 ports, LEDs and tiny number labels. Keep these proportions and the faceplate will read as real hardware rather than a toy.

---

## 1. The 1U faceplate

What is actually on the front of a fixed 1U access switch, left to right:

- **Brand logo** (left or centre), **model number** (usually right).
- **Status LED cluster**: SYST, ACT/UID, PoE, fan/PSU, stack (Cisco: STAT/SPEED/DUPLX/ACTV/STACK/PoE mode LEDs + mode button; Aruba: Global Status, UID, Speed, PoE, Usr + LED Mode button).
- **Console ports**: RJ-45 serial + USB Mini-B/micro-USB, sometimes USB-A host port, reset button.
- **Downlink port field**: 2 rows of RJ45 with per-port LEDs and numbers.
- **Uplink cages**: SFP/SFP+ (sometimes QSFP/SFP28), single row, 2×2 block, or a module slot.
- **Rack ears** with mounting screws at both ends.

Dimensions (verified):
- Juniper EX2300: height **1.75 in / 4.45 cm**, width **17.4 in / 44.19 cm** (19 in / 48.26 cm with brackets). [EX2300 System Overview](https://www.juniper.net/documentation/us/en/hardware/ex2300/topics/topic-map/ex2300-system-overview.html)
- Cisco C9200L-48P-4X: **4.4 × 44.5 × 28.8 cm** (1.73 × 17.5 × 11.3 in). [C9200 datasheet](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-9200-series-switches/nb-06-cat9200-ser-data-sheet-cte-en.html)
- MikroTik CRS328-24P-4S+RM: **443 × 300 × 44 mm**. [MikroTik product page](https://mikrotik.com/product/crs328_24p_4s_rm)

### Common port-field shapes

| Faceplate | Rows | Usual uplinks | Examples |
|---|---|---|---|
| 8–12 port fanless | 1–2 rows | 2 SFP/SFP+ | EX2300-C, CRS310, USW-Lite |
| 24 × 1G | 2 × 12 | 2 or 4 SFP/SFP+; stacked at right, single row, or 2×2 | 2960-X 24, USW-24, CRS326, 2930F 24 |
| 48 × 1G | 2 × 24 | 4 SFP/SFP+ single row at right (fixed) or network-module slot | C9200L-48P-4X, C9300L-48P-4X, C9300-48P |
| 48 × 1G + uplinks | 2 × 24 | uplinks at far right, separated by a visible gap | CRS328, many Aruba/Cisco models |

### Uplink cage placement — real examples

- **Right, single row of 4** — Cisco C9200L/C9300L fixed uplinks. The C9200L front-panel call-outs run left→right: status LEDs → USB → "10/100/1000 PoE+ ports" → "Fixed uplink ports". [C9200 HIG](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/product_overview.html)
- **Right, 2×2 block** — MikroTik CRS328-24P-4S+RM: 24 RJ45 in 3 groups of 8 (2 rows × 4 columns per group), then a 2×2 SFP+ block, then console/reset, then empty panel + model text. [Vendor 2560px render](https://cdn.mikrotik.com/web-assets/rb_images/1493_hi_res.png); block diagram calls the groups "Ether 1-8 / 9-16 / 17-24" and "SFP+ 1..4" [block diagram](https://cdn.mikrotik.com/web-assets/product_files/CRS328-24P-4S_240414.png)
- **Right, 2×2 block** — Cisco Catalyst 2960-S 24-port: photo of a live switch shows the last RJ45 port (24) then four SFP cages labelled 25–28 with green link LEDs. [Wikimedia photo](https://commons.wikimedia.org/wiki/File:Cisco_Catalyst_2960-S_(11625112186).jpg) **[photo]**
- **Left, 2×2 block** — Aruba 2930F 48G PoE+ 4SFP+ (JL256A): four SFP+ cages in a 2×2 block at the far left, labelled 49–52; 48 RJ45 in 2 rows of 24 to the right. [Front-panel photo](https://m.media-amazon.com/images/I/81LbpwRFvYL._AC_SL2000_.jpg) **[photo]**; manual calls them "10GbE SFP+ Ports (49A-52)" [Aruba 2930F user manual](https://manuals.plus/asin/B01HPKW13Q)
- **Right, stacked pair** — Ubiquiti US-24: 24 RJ45 (2 rows of 12) then 2 SFP cages stacked vertically (`SFP 1`, `SFP 2`). Quick-start guide labels "RJ45 1-24 / SFP 1-2". [US-24 QSG PDF](https://dl.ubnt.com/guides/UniFi_Switch/UniFi_PoE_Switch_US-24_QSG.pdf)
- **Module slot at right** — Cisco Catalyst 9300: "Uplink network module slots" at the right side of the front panel; modules hold 4×1G, 8×10G, 2×25G, 2×40G, etc. [C9300 HIG](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html)

### Combo / shared ports

A combo (dual-purpose) port is one logical port with two physical options — an RJ45 jack and an SFP cage — only one active at a time:

- Cisco classic 2960: "**2 dual-purpose uplinks** (each dual-purpose uplink port has one 10/100/1000 Ethernet port and 1 SFP-based Gigabit Ethernet port, 1 port active)". [Cisco 2960 datasheet PDF](https://www.cisco.com/c/dam/en_us/solutions/small-business/products/routers-switches/catalyst-2960-series-switches/C78-481303-01_2960-LAN_DS_v1a.pdf)
- Meraki MS220-24: "the last 4 ports … numbered 21-24, are combination ports shared between the RJ45 ports and the SFP interfaces… if both ports are occupied, the RJ45 port will take priority." [Meraki SFP overview](https://documentation.meraki.com/Switching/MS_-_Switches/Operate_and_Maintain/How-Tos/MS_Switch_SFP_and_SFP__Overview)
- Faceplate treatment: cage sits next to (or directly above/below) its RJ45 partner, **shares the number**, and is often bracketed or annotated ("combo"). In software, disable/mark the partner when one side is patched.

---

## 2. Port numbering conventions

Three patterns exist. Name them precisely so both prototype and data model can support them:

**(a) Column-pair, odd-top / even-bottom** — the dominant enterprise convention. The top row runs 1, 3, 5, … left→right; the bottom row runs 2, 4, 6, … left→right. Each column is a pair (1 above 2, 3 above 4).

```
   1   3   5   7   9  11  ...  45  47
  [ ] [ ] [ ] [ ] [ ] [ ] ... [ ] [ ]
  [ ] [ ] [ ] [ ] [ ] [ ] ... [ ] [ ]
   2   4   6   8  10  12  ...  46  48
```

Evidence:
- Cisco: "The odd-numbered ports are on the upper row and the even-numbered ports on the lower row." [Catalyst 9500 HIG](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9500/hardware/install/b_catalyst_9500_hig/9500_product-overview.html); "Top row has odd numbered ports… Bottom row has even numbered ports" [Catalyst 6800 datasheet](https://www.andovercg.com/datasheets/cisco-catalyst-6800-series-switches-datasheet-c78-733662.pdf); same wording for the 6880-X [HIG](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst6880_x/hardware/installation/guide/b_c6880-X_hig/b_c6880-X_hig_chapter_01.html); Nexus 5000 "odd numbered ports on top and even numbered ports on bottom" [HIG](https://www.cisco.com/c/en/us/td/docs/switches/datacenter/nexus5000/hw/installation/guide/nexus_5000_hig/overview5500.html).
- Ubiquiti US-24: front-panel diagram numbers the rows `1 3 5 7 … 21 23` (top) and `2 4 6 8 … 22 24` (bottom). [US-24 QSG PDF](https://dl.ubnt.com/guides/UniFi_Switch/UniFi_PoE_Switch_US-24_QSG.pdf) **[doc/photo]**
- Aruba 2930F: the number band between the rows reads 1,2,3,4…, with small ▲/▽ row markers: odd numbers are the top-row ports, even numbers the bottom-row ports (verified at high zoom on the front-panel photo; SFP+ cages labelled 49–52 in the same scheme). **[photo]**
- MikroTik CRS328: 2560px vendor render shows number tabs above and below each port block; each column carries a pair (blue/upper tab = odd, black/lower tab = even), i.e. 1/2, 3/4, … 23/24. **[render]**

**(b) Column-pair, even-top / odd-bottom (0-based)** — Juniper.

- "…built-in network ports are numbered from left to right. On models that have two rows of ports, the ports on the **top row start with 0** followed by the remaining **even**-numbered ports, and the ports on the **bottom row start with 1** followed by the remaining **odd**-numbered ports." [Juniper: Understanding Interfaces](https://www.juniper.net/documentation/us/en/software/junos/interfaces-fundamentals/interfaces-ethernet-switches/topics/topic-map/switches-interface-understanding.html)
- So the first column is 0 (top) / 1 (bottom), then 2/3, 4/5 … Ports count from **0**, not 1. Uplink ports are numbered separately, also from 0. Huawei is similar but starts from the bottom-left (0/0/1 at bottom-left, 0/0/2 at top-left). [Huawei S5700 port numbering](https://support.huawei.com/enterprise/en/doc/EDOC1000013597/ba17a118/port-numbering-conventions)

**(c) Row-major (sequential rows)** — 1–24 across the top, 25–48 across the bottom. This is the **patch-panel** convention:

- "1-24, top layer numbered 25-48" (patch panels). [HellermannTyton LAN catalogue PDF](https://www.hellermanntyton.com/binaries/content/assets/downloads/ht-data/connectivity-catalogue-2016-2017/hellermanntyton-lan-catalogue-r10-2015-full-catalogue.pdf)
- Community threads distinguish the two: patch panels 1–24/25–48 vs switches odd/even. [r/networking](https://www.reddit.com/r/networking/comments/2qpk5l/why_are_patch_panels_labeled_124_on_the_top_row/); [Spiceworks "Dear Switch Manufacturers, STOP THIS!"](https://community.spiceworks.com/t/dear-switch-manufacturers-stop-this/709965) **[community]**
- A known HP/HPE 48-port variant splits the faceplate into two 24-port fields: ports 1–24 on the left (odd/even rows) and 25–48 on the right (odd/even rows) — odd/even still, but the sequence "restarts" at 25 mid-faceplate. [Spiceworks thread](https://community.spiceworks.com/t/cabling-a-48-port-panel-to-hp-48-port-switch/518810) **[community, unverified against a manual]**

Note on the ticket's phrasing: "1,3,5 down the left column, 2,4,6 down the right" describes vertical block numbering (66-block/patch-panel style). On switches with two rows, odd numbers run **across the top row**, even across the bottom, so each *column* is a pair. That column-pair ("pairs-first") reading is the one to implement.

### Uplink numbering

Two behaviours, both common — keep it configurable:

- **Continuous**: uplinks continue the RJ45 sequence. Cisco 2960-S 24-port: SFP cages labelled **25–28** next to port 24. **[photo]**. Aruba 2930F 48-port: SFP+ are **49–52**. [manual](https://manuals.plus/asin/B01HPKW13Q). C9300 network-module ports are addressed in a separate module number (`1/1/x`) rather than continuing the downlink numbers.
- **Independent**: `SFP+ 1–4` (MikroTik CRS328), `SFP 1–2` (Ubiquiti US-24), Juniper uplinks numbered separately from 0. [MikroTik render](https://cdn.mikrotik.com/web-assets/rb_images/1493_hi_res.png); [US-24 QSG PDF](https://dl.ubnt.com/guides/UniFi_Switch/UniFi_PoE_Switch_US-24_QSG.pdf); [Juniper](https://www.juniper.net/documentation/us/en/software/junos/interfaces-fundamentals/interfaces-ethernet-switches/topics/topic-map/switches-interface-understanding.html)

### Label placement styles

- Above the top row and below the bottom row (Cisco 2960-X photo).
- Small number tabs above top-row and below bottom-row ports, repeated (MikroTik render — numbers are printed both above and below the port field).
- Single number band between the rows, with ▲/▽ row indicators (Aruba 2930F). This is the most compact and looks great when the rows are close together.

---

## 3. SFP / SFP+ cages — shape, spacing, rendering

- **SFP module dimensions** (MSA): **13.4 mm wide × 8.5 mm high × 56.5 mm deep**; cage opening slightly larger; QSFP/QSFP28 is **18.35 mm** wide. [INF-8074i SFP MSA (SNIA-hosted PDF)](https://members.snia.org/document/dl/26184) **[doc]**; [SFP mechanical dimensions summary](https://en.wikipedia.org/wiki/Small_Form-factor_Pluggable) **[doc]**
- Therefore an SFP cage is roughly the same width as an RJ45 jack (~14 mm) but much lower, and a **2×2 cage block is ~30 mm wide**. Cages are metal-shielded; visible from the front as a dark opening in a thin metal frame, with the module's **bail latch** showing at the bottom when populated.
- **Rendering recipe for a convincing cage**: dark near-black rectangle; 1–2 px lighter metal rim; subtle inner bevel/shadow at the top; a small notch/bale at the bottom edge; a "SFP+"/"10G" silkscreen label next to or above the group; an LED per cage (green = link, blinking = activity).
- **Spacing**: cages in a group sit with a small gap between pairs; the group is separated from the RJ45 bank by a gap and often by a printed label ("GIGABIT ETHERNET" / "SFP+" on the CRS328). Keep this gap — it is one of the strongest "real switch" cues.
- **Empty vs populated**: empty cages read as deep dark rectangles; populated ones protrude slightly and can show a colored latch/tab. Both are worth rendering.
- **Combo pairing**: when a cage shares a number with an RJ45, place it immediately beside/above the partner (or bracket them) and print the shared number once.

Examples of cage counts/layouts: 2 stacked right (US-24), 2×2 right (CRS328, 2960-S 24-port), 1×4 right (C9200L/C9300L fixed uplinks), 2×2 left (2930F), module slot right (C9300).

---

## 4. PoE designations

- **Standards and power**: PoE **802.3af = 15.4 W**; PoE+ **802.3at = 30 W**; IEEE 802.3bt Type 3 = **60 W**, Type 4 = **90 W**; Cisco's proprietary names are **UPOE (60 W)** and **UPOE+ (90 W)**. [Cisco UPOE+ white paper](https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/nb-06-upoe-plus-it-ot-wp-cte-en.html); [C9300 HIG PoE section](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html)
- **Faceplate markings**: models encode it in the name/PID (`...-48P`, `...-48U`, `P` = PoE, `U` = UPOE, `H` = UPOE+/bt) and labels print the port type over the bank — e.g. Aruba 2930F prints "**10/100/1000 BASE-T PoE+ Ports (1-48)**" on the faceplate **[photo]**. MikroTik prints "28 V / 53 V / PoE out" on the orange trim of the CRS328 **[render]**.
- **LEDs**: PoE state appears through the port-LED **PoE mode** (Cisco: green = powering; alternating green/amber = denied; blinking amber = fault; amber = disabled; [2960-X HIG](https://www.cisco.com/en/US/docs/switches/lan/catalyst2960x/hardware/installation/guide/b_c2960x_hig_chapter_01.html), [9200 HIG](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/leds.html)). Aruba's PoE mode: green = providing, orange = disabled, fast flash = denied/fault. [2930F IGSG PDF](https://gzhls.at/blob/ldb/6/0/3/0/cbaa8300fe61e04a5b759736f13b7bf9aa85.pdf). MikroTik CRS328 has a *second* LED row per port dedicated to PoE state. [STH review](https://www.servethehome.com/mikrotik-crs328-24p-4s-rm-review-24-port-poe-and-4x-10gbe-switch/)
- App guidance: surface PoE as a per-port attribute (standard, budget class) plus a small PoE glyph or the model label over the bank; do not print "PoE" on every port.

---

## 5. LED conventions worth mimicking

| Vendor | Per-port LED behaviour | Mode button? | Source |
|---|---|---|---|
| Cisco | One LED per port. STAT mode: off = no link, green = link, blinking green = activity, amber = STP-blocked, alternating green/amber = link fault. SPEED mode: off = 10 M, green = 100 M, single flash = 1 G, double flash = 2.5/5/10 G. PoE mode: green = powering, amber = disabled, alternating = denied, blinking amber = fault. System/stack/beacon LEDs separate. | Yes — STAT / SPEED / DUPLX / ACTV / STACK / PoE | [2960-X HIG](https://www.cisco.com/en/US/docs/switches/lan/catalyst2960x/hardware/installation/guide/b_c2960x_hig_chapter_01.html), [9200 LEDs](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/leds.html), [9300 HIG](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html) |
| Aruba 2930F | Link/Activity default: half-bright green = link, flicker = activity. Speed mode: on green = 10G, slow flash = 1G, off = 10/100M. PoE mode: green = powering, orange = disabled, fast flash = denied/fault. | Yes — Link / Speed / PoE / Usr | [2930F IGSG PDF](https://arubanetworking.hpe.com/techdocs/hardware/switches/2930/IGSG/Aruba_2930_IGSG.pdf) |
| Ubiquiti | Speed/Link/Act: amber = 10/100M link, green = 1000M link, flashing = activity. PoE LED separate on PoE models (amber = 802.3af/at, green = 24 V passive on some families). | No (system LED only) | [Ubiquiti LED status article](https://help.ui.com/hc/en-us/articles/204910134-Understanding-Device-LED-Status-Indicators), [US-24 QSG PDF](https://dl.ubnt.com/guides/UniFi_Switch/UniFi_PoE_Switch_US-24_QSG.pdf) |
| MikroTik CRS328 | Two LEDs per port: one row = PoE state, one row = link/activity. | No | [STH review](https://www.servethehome.com/mikrotik-crs328-24p-4s-rm-review-24-port-poe-and-4x-10gbe-switch/) |

For the MVP faceplate: dark/off LEDs by default; **green = link**, **blinking green = activity** on hover/animation; amber reserved for warnings. If we highlight PoE later, use green/amber as above.

---

## 6. Port pitch & density (what makes it feel real)

Measured from vendor images (approximate; ratios are what matter):

- Horizontal **pitch ≈ 13.5–14 mm** (48-port 1U: 24 ports across ~330–350 mm of the ~442 mm body). RJ45 **opening ≈ 11.7 mm wide × ~8.8 mm tall**; a standard 8P8C jack body is ~13.5 mm wide × 15.5 mm high, but only the opening is visible in a gang.
- **Row pitch ≈ 11–13 mm**, so two rows occupy roughly the middle ~25–30 mm of the 44.45 mm face, leaving room for labels/LEDs above/below.
- SFP cage ≈ same ~14 mm width, block of four ≈ 60 mm; QSFP ≈ 18.4 mm.
- Port **groups** with small gaps are common: MikroTik = 3 × (4 columns × 2 rows) with roughly one port-width between groups; Cisco line cards draw groups of 12; HP 48-port = two 24-port fields. Gaps every 8–12 ports add realism and help cable management concepts.
- Realism checklist (each item appears in real faceplates):
  - per-port LEDs *and* small number labels (tiny but legible),
  - number labels aligned consistently (above top row / below bottom row, or a centre band),
  - short printed descriptors over the banks ("10/100/1000 BASE-T PoE+ Ports (1-48)", "SFP+"),
  - visible screws at the ears and sometimes on the bezel,
  - bezel colour contrast (dark grey plastic/black bezel around the port field, lighter metal body),
  - ventilation slots, and the model/logo text,
  - separation line/gap between the RJ45 bank and the uplink cages,
  - console/USB/reset cluster at one end (usually right or left, small).
- Anti-pattern (toy look): uniform squares for both RJ45 and SFP, no LEDs/labels, equal spacing ignoring groups, no model text, too-large gaps, glossy uniform colours.

---

## 7. Example faceplates (ASCII sketches)

**A. 24 × 1G + 4 × SFP+ in a 2×2 block at the right end (Cisco 2960-S / MikroTik CRS328 style)**

```
 top row  :   1    3    5    7   ...  21   23      ┌────┐┌────┐
           : [RJ] [RJ] [RJ] [RJ]  ... [RJ] [RJ]    │ 25 ││ 27 │  SFP+
 bottom   : [RJ] [RJ] [RJ] [RJ]  ... [RJ] [RJ]    ├────┤├────┤  cages
           :   2    4    6    8   ...  22   24      │ 26 ││ 28 │
                                                    └────┘└────┘
```

**B. 48 × 1G + 4 × SFP+ in a single row at the right end (C9200L / C9300L style)**

```
 top row  :  1  3  5  7  9 ... 45 47    ┌────┐┌────┐┌────┐┌────┐
           : [RJ][RJ][RJ][RJ]  ...      │ 49 ││ 50 ││ 51 ││ 52 │  SFP+ row
 bottom   : [RJ][RJ][RJ][RJ]  ...      └────┘└────┘└────┘└────┘
           :  2  4  6  8 10 ... 46 48
```

**C. Aruba 2930F style — SFP+ 2×2 at left, centre number band with ▲/▽ row markers**

```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌────┐┌────┐  1▲ 2▽ 3▲ 4▽ 5▲ 6▽   …                         ●Speed  │
│ │ 49 ││ 50 │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                         ●PoE   │
│ ├────┤├────┤ └──┘└──┘└──┘└──┘└──┘└──┘                          ●Usr  │
│ │ 51 ││ 52 │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                      [LED Mode]│
│ └────┘└────┘ └──┘└──┘└──┘└──┘└──┘└──┘                                │
│  4×SFP+         48 × 10/100/1000 PoE+ (2 rows × 24, odd/even pairs)  │
└──────────────────────────────────────────────────────────────────────┘
```

**D. Juniper convention — 0-based, even on top / odd on bottom**

```
   0   2   4   6   8   …  44  46
  [ ] [ ] [ ] [ ] [ ] …  [ ] [ ]     uplinks (SFP+/SFP) numbered 0..3
  [ ] [ ] [ ] [ ] [ ] …  [ ] [ ]     at the right of the front panel
   1   3   5   7   9   …  45  47
```

**E. Combo port — an RJ45 and an SFP share one logical number (only one active)**

```
   1   3   5  …  23   25
  [RJ][RJ][RJ] … [RJ][RJ] ──┐  "25" labels both the RJ45 and the cage;
   2   4   6  …  24  (C)   ──┘  the partner is disabled when either is patched
                     ↑
                  SFP 25
```

**F. Numbering contrast: switch vs patch panel**

```
Switch (odd top / even bottom)      Patch panel (row-major)
  1  3  5  7 … 23                     1  2  3  4 … 24
  [ ][ ][ ][ ]…[ ]                   [ ][ ][ ][ ]…[ ]
  [ ][ ][ ][ ]…[ ]                   [ ][ ][ ][ ]…[ ]
  2  4  6  8 … 24                    25 26 27 28 … 48
```

---

## 8. Implications for the data model (ticket 05 input)

- **Port layout should be explicit row data**, not derived from a count: each row has an ordered list of ports (each with a printed number/label). This supports 2-row, 1-row, and future 3-row layouts.
- **Provide numbering presets**, at minimum:
  1. Odd-top / even-bottom column pairs (default for 2-row layouts; Cisco/Ubiquiti/Aruba/MikroTik).
  2. Sequential rows (1–24 / 25–48; patch-panel style).
  3. Even-top / odd-bottom, 0-based (Juniper).
  4. Custom (explicit per-port labels).
- **Pairing is implicit in the column model**: column i holds top port `2i−1` and bottom port `2i` in preset 1; store the column index so future "pair" features (combo logic, patch guidance) have it.
- **Port attributes** to carry from day one: kind (rj45, sfp, sfp+, sfp28, qsfp+, qsfp28), speed, position (row/column/group), label, and later PoE class + LED state. Combo: a link between two ports that share one logical number and are mutually exclusive.
- **Uplink group**: side (left/right), layout (row | stack | block-2×2 | module), numbering mode (continue | independent), count.
- **Faceplate chrome**: model name, port-bank label text, PoE/port-type labels, logo flag, console/USB/reset items — enough for the renderer to draw a realistic panel without per-model art.
- **Group separators** every 8 or 12 ports should be a renderer concern driven by layout, not a domain rule.

## 9. Checklist for the prototype (ticket 04)

- Render `1U = 44.45`, body width 442 mm equivalent. Keep port pitch ≈14 mm horizontal, rows ≈11–13 mm apart; opening ≈11.7 × 8.8 mm; port groups with small gaps.
- Default examples: (1) 24×1G + 2 SFP stacked right (USW/CRS326 feel); (2) 48×1G + 4 SFP+ single row right (C9200L feel); (3) 24×1G + 4 SFP+ 2×2 right (2960-S/CRS328 feel). Optionally one Aruba-style (cages left, number band).
- Numbering: odd top/even bottom by default; draw tiny labels (above top row, below bottom row).
- Per-port LED: off; green on "connected"; subtle blink for activity. Mode-button concept optional.
- Make SFP cages visually different (dark, metal, latch) and label them ("SFP+" / numbers 49–52 or 1–4).
- Add chrome: model text, logo, status LED cluster, console/reset, rack ears with screws, subtle vents. The 10-mins-of-chrome is what sells the realism.
- Test readability at 48 ports: minimum ~18–20 px per port tile at 100% zoom; allow zoom for port-level clicking.

---

## Sources

1. Cisco Catalyst 9500 HIG — port mapping (odd upper / even lower): https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9500/hardware/install/b_catalyst_9500_hig/9500_product-overview.html
2. Cisco Catalyst 6800 datasheet — odd top / even bottom: https://www.andovercg.com/datasheets/cisco-catalyst-6800-series-switches-datasheet-c78-733662.pdf
3. Cisco Catalyst 6880-X HIG — odd upper / even lower: https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst6880_x/hardware/installation/guide/b_c6880-X_hig/b_c6880-X_hig_chapter_01.html
4. Cisco Nexus 5000 HIG — odd top / even bottom: https://www.cisco.com/c/en/us/td/docs/switches/datacenter/nexus5000/hw/installation/guide/nexus_5000_hig/overview5500.html
5. Cisco Catalyst 2960-X HIG — front panel, PoE, LED modes and colours: https://www.cisco.com/en/US/docs/switches/lan/catalyst2960x/hardware/installation/guide/b_c2960x_hig_chapter_01.html
6. Cisco Catalyst 9200 HIG — front panel (uplinks right), LED tables: https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/product_overview.html and https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/leds.html
7. Cisco Catalyst 9300 HIG — front panel, network module slots, PoE/UPOE/UPOE+, LED tables: https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html
8. Cisco Catalyst 2960 datasheet — dual-purpose uplinks: https://www.cisco.com/c/dam/en_us/solutions/small-business/products/routers-switches/catalyst-2960-series-switches/C78-481303-01_2960-LAN_DS_v1a.pdf
9. Cisco Meraki — combo ports 21–24, RJ45 priority: https://documentation.meraki.com/Switching/MS_-_Switches/Operate_and_Maintain/How-Tos/MS_Switch_SFP_and_SFP__Overview
10. Ubiquiti UniFi Switch US-24 Quick Start Guide (PDF) — RJ45 1-24 / SFP 1-2, odd/even row numbering, LED labels: https://dl.ubnt.com/guides/UniFi_Switch/UniFi_PoE_Switch_US-24_QSG.pdf
11. Ubiquiti — device LED status indicators: https://help.ui.com/hc/en-us/articles/204910134-Understanding-Device-LED-Status-Indicators
12. Aruba 2930F Installation & Getting Started Guide (PDF) — components, LED modes: https://arubanetworking.hpe.com/techdocs/hardware/switches/2930/IGSG/Aruba_2930_IGSG.pdf (mirror used for extraction: https://gzhls.at/blob/ldb/6/0/3/0/cbaa8300fe61e04a5b759736f13b7bf9aa85.pdf)
13. Aruba 2930F JL256A front-panel photo (odd/even numbers in centre band, SFP+ 2×2 left labelled 49–52): https://m.media-amazon.com/images/I/81LbpwRFvYL._AC_SL2000_.jpg
14. Aruba 2930F user manual (secondary) — "10GbE SFP+ Ports (49A-52)": https://manuals.plus/asin/B01HPKW13Q
15. Juniper — Understanding Interfaces (even top / odd bottom, 0-based): https://www.juniper.net/documentation/us/en/software/junos/interfaces-fundamentals/interfaces-ethernet-switches/topics/topic-map/switches-interface-understanding.html
16. Juniper EX2300 System Overview — models, uplinks at front right, 1U dimensions: https://www.juniper.net/documentation/us/en/hardware/ex2300/topics/topic-map/ex2300-system-overview.html
17. MikroTik CRS328-24P-4S+RM 2560px front render — groups of 8, odd/even column tabs, 2×2 SFP+ right: https://cdn.mikrotik.com/web-assets/rb_images/1493_hi_res.png
18. MikroTik CRS328 block diagram — Ether 1-8 / 9-16 / 17-24, SFP+ 1-4: https://cdn.mikrotik.com/web-assets/product_files/CRS328-24P-4S_240414.png
19. MikroTik CRS328 product page (dimensions): https://mikrotik.com/product/crs328_24p_4s_rm
20. ServeTheHome CRS328 review — two LED rows per port (PoE / activity), layout: https://www.servethehome.com/mikrotik-crs328-24p-4s-rm-review-24-port-poe-and-4x-10gbe-switch/
21. Huawei S5700 port numbering (bottom-left = 1, top-left = 2): https://support.huawei.com/enterprise/en/doc/EDOC1000013597/ba17a118/port-numbering-conventions
22. INF-8074i SFP MSA — module width 13.4 mm: https://members.snia.org/document/dl/26184 ; SFP/QSFP dimensions summary: https://en.wikipedia.org/wiki/Small_Form-factor_Pluggable
23. Patch-panel numbering "1-24, top layer numbered 25-48" — HellermannTyton LAN catalogue (PDF): https://www.hellermanntyton.com/binaries/content/assets/downloads/ht-data/connectivity-catalogue-2016-2017/hellermanntyton-lan-catalogue-r10-2015-full-catalogue.pdf
24. r/networking — patch panels vs switch odd/even numbering (community): https://www.reddit.com/r/networking/comments/2qpk5l/why_are_patch_panels_labeled_124_on_the_top_row/
25. Spiceworks — HP 2920/2530 48-port numbering (community): https://community.spiceworks.com/t/cabling-a-48-port-panel-to-hp-48-port-switch/518810
26. Wikimedia Commons — Cisco Catalyst 2960-S live photo (SFP uplinks 25–28 on 24-port model): https://commons.wikimedia.org/wiki/File:Cisco_Catalyst_2960-S_(11625112186).jpg
27. Cisco (via Meraki docs) — C9300 front-panel line drawing: https://documentation.meraki.com/@api/deki/files/28035/Front_Panel_Components.png
