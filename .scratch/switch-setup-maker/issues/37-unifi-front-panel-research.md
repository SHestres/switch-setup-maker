# 37: Research UniFi switch front-panel specs

Type: research
Status: resolved
Blocked by: None

## Question

Gather the front-panel layout facts the device-model library (ticket 32) needs to bake real UniFi switches as layout presets. Representative set of ~6–10 models spanning 8/16/24/48-port and PoE/non-PoE.

For each model, record: SKU, marketing name, per-section layout (rows × columns, port kind, speed), port numbering convention (alternating top-first/bottom-first vs sequential, which end SFP uplinks sit at), and the one-line details blurb text.

Deliverable: findings in `.scratch/switch-setup-maker/research/37-unifi-front-panels.md` — a markdown table plus a JSON seed shaped to `LayoutPreset` (new `vendor` field included, `model` prefilled, genericized labels migrated out). Notes on anything ambiguous (e.g. undocumented numbering conventions) so the build ticket can make a judgment call.

## Answer

Findings are in [research/37-unifi-front-panels.md](../research/37-unifi-front-panels.md). Eight UniFi models seeded across 8/16/24/48-port, PoE and non-PoE: USW-Lite-8-PoE, USW-Lite-16-PoE, USW-24, USW-24-PoE, USW-48-PoE, USW-Pro-24-PoE, USW-Pro-48-PoE, USW-Aggregation. Conventions recorded: all 2-row RJ45 sections use alternating top-first numbering (odd top / even bottom, column pairs); SFP/SFP+ uplinks sit at the right end and continue the RJ45 numbering (25–26 on 24-port, 49–52 on 48-port, single-stack 2×1 and 2×2 block respectively); Pro models' uplinks are 10G SFP+ seeded as `kind: "sfp", speed: "10G"` per ADR 0002. Uncertainties flagged for ticket 38: USW-Aggregation's SFP+ numbering is undocumented (seeded alternating), USW-24's front panel mirrors the 24-PoE shell (no dedicated QSG), and the Lite-8 single-row port numbering is inferred sequential.
