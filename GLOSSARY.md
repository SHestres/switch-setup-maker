# Switch Setup Maker

A local-first web app for modelling network switch setups: switches rendered as faceplates on a canvas, wired port-to-port.

## Language

**Setup**:
One modelled network-switch configuration — its switches and their connections. The root document; one at a time in this effort.
_Avoid_: Project, diagram, layout

**Switch**:
A device in the setup, rendered as a faceplate and positioned on the canvas.
_Avoid_: Device, node, box

**Faceplate**:
The rendered front panel of a switch: rows of ports with labels.
_Avoid_: Front panel, chassis

**Port**:
An individually addressable connector on a switch, with a printed label, a kind and a speed.
_Avoid_: Jack, interface, socket

**Port kind**:
The connector family of a port: RJ45, SFP or SFP+ in this effort.
_Avoid_: Type

**Port speed**:
The rated speed of a port: 100M, 1G, 2.5G, 5G or 10G in this effort.
_Avoid_: Rate, bandwidth

**Port layout**:
A switch's arrangement of ports into rows.
_Avoid_: Port map, configuration

**Row**:
A horizontal group of ports as laid out on a faceplate.
_Avoid_: Line, bank

**Section**:
A vertically-centred bank of ports on a faceplate: a grid of rows and columns sharing a port kind, speed, numbering convention and starting number. Sections line up left to right; same-kind neighbours sit closer together than different kinds.
_Avoid_: Bank, group

**Port numbering preset**:
The convention that generates printed port labels, set per section: alternating top-first, alternating bottom-first, or sequential; each section starts numbering automatically after the previous section or at a custom number.
_Avoid_: Scheme, mode

**Layout preset**:
A named, pre-built port layout offered as a starting point when adding a Switch (e.g. 24×1G + 2×SFP); a switch may carry a model name this way. Distinct from the port numbering preset.
_Avoid_: Template, model preset, switch type

**Connection**:
An undirected logical link between two ports; carries the cable's attributes (colour, and later length and type).
_Avoid_: Link, wire, edge

**Cable**:
The physical medium realising a connection; its attributes are stored on the Connection, not as a separate thing.
_Avoid_: Wire, lead

**Canvas**:
The pannable, zoomable workspace holding switches and their connections.
_Avoid_: Board, stage
