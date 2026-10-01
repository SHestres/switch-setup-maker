# 33: Port speed & PoE highlighting

Type: grilling
Status: ready-for-agent
Blocked by: None

## Question

Decide the visual language for port speeds and PoE, and whether PoE enters the model.

- **Speed**: what showing speed means (badges on ports, colour coding, a filter/highlight mode); per-theme behaviour (light/dark/blueprint — [18](18-themes.md)); how it layers with wired/selected/hover states ([21](21-render-cables.md), [22](22-wire-ports.md), [23](23-manage-connections-and-cable-layer.md)).
- **PoE**: whether Ports model a PoE capability/class (PoE / PoE+ / PoE++ with wattages) and switch-level budgets; how powered vs unpowered reads.
- **Surfaces**: the faceplate, hover ([30](30-port-hover-connected-info.md)), and the editor ([27](27-section-faceplate-and-editor.md)).

Cross-reference (text only, no blocking): speed-mismatch warnings and connection state colours will read from this.

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.
