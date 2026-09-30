# Document real switch faceplate & port-numbering conventions

Type: research
Status: resolved

## Question

How do real network switches lay out and number their ports, so a rendered faceplate feels right to an IT pro? Cover at least:

- Common 1U layouts: 24-port, 48-port, uplink cages (SFP/SFP+), combo ports.
- Port numbering conventions: single-row numbering; dual-row stacks where odd/even numbers run down columns (e.g. 1,3,5… down the left, 2,4,6… down the right) — what is most common, and where ports are laid out pairs-first.
- SFP/SFP+ cage rendering: shape, spacing, when cages sit beside or above the RJ45 rows.
- PoE designations and LED conventions worth mimicking.
- Port pitch/density: what makes a faceplate feel realistic rather than toy-like (icons, shielding, labels).

Deliverable: findings file at `.scratch/switch-setup-maker/research/02-faceplate-conventions.md` with concrete conventions, example layouts (ASCII sketches welcome), and sources. Feeds the prototype (ticket 04) and the domain model (ticket 05).

## Answer

Findings: [`.scratch/switch-setup-maker/research/02-faceplate-conventions.md`](../research/02-faceplate-conventions.md)

Headline findings:

- **Numbering**: the dominant convention is per-column pairs with **odd numbers across the top row, even numbers across the bottom** (Cisco, Ubiquiti, Aruba, MikroTik all match; Cisco documents it explicitly). **Juniper is the notable exception**: even numbers on top, odd on the bottom, and ports count from 0. Row-major numbering (1–24 / 25–48) is the *patch-panel* convention, not the switch norm. The app should model numbering as data (presets) rather than hardcode one scheme.
- **Layouts**: 1U = 44.45 mm; 24-port = 2 rows × 12, 48-port = 2 rows × 24. Uplinks are 2–4 SFP/SFP+ cages, usually at the right as a single row or 2×2 block (Aruba 2930F puts them at the left; Catalyst 9300 uses a right-side module slot). Uplink numbering either continues the RJ45 sequence (Cisco 25–28 / 49–52) or runs independently (`SFP+ 1–4`, `SFP 1–2`). Combo ports share one number between an RJ45 and a cage, one active.
- **SFP cages**: ~14 mm metal boxes (module = 13.4 mm per INF-8074i); render dark, recessed, metal-rimmed with a bale latch, own LED and "SFP+/10G" label, separated from the RJ45 bank by a visible gap.
- **PoE**: 802.3af 15.4 W / at 30 W / bt 60 or 90 W (Cisco UPOE/UPOE+); shown via model text/PID and a PoE LED mode, not per-port text.
- **LEDs**: per-port LED, green = link, blinking green = activity, amber = fault/STP-block/disabled; a mode button toggles the whole port field between Link/Speed/PoE modes (Cisco/Aruba). UniFi uses amber = 10/100 M, green = 1 G.
- **Density**: horizontal pitch ≈14 mm (opening ≈11.7 × 8.8 mm), rows ≈11–13 mm apart, port groups every 8–12 columns, LEDs + tiny number labels + model/logo chrome. The findings file includes ASCII sketches of four example faceplates plus a prototype checklist.
