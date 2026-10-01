# Switch Setup Maker

A local-first web app for modelling network switch setups: switches rendered as faceplates on a canvas, wired port-to-port.

## Language

**Setup**:
One modelled network-switch configuration — its switches and their connections. The root document; one at a time in this effort.
_Avoid_: Project, diagram, layout

**Switch**:
A switch modelled in the setup, rendered as a faceplate and positioned on the canvas.
_Avoid_: Node, box

**Faceplate**:
The rendered front panel of a switch: sections of ports with labels.
_Avoid_: Front panel, chassis

**Port**:
An individually addressable connector on a switch, with a printed label, a kind and a speed.
_Avoid_: Jack, interface, socket

**Port kind**:
The connector family of a port: RJ45 or SFP in this effort.
_Avoid_: Type

**Port speed**:
The rated speed of a port: 100M, 1G, 2.5G, 5G or 10G in this effort.
_Avoid_: Rate, bandwidth

**Port layout**:
A switch's arrangement of ports into sections, each a grid of rows and columns.
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
An undirected logical link between two Ports, or between a Port and a Device; carries the cable's attributes, color and length.
_Avoid_: Link, wire, edge

**Device**:
The far end of a Connection that is not a Port: something plugged into a Port that is not modelled as a Switch. Unnamed it is a generic device; otherwise it is named.
_Avoid_: Port device, endpoint, peripheral

**Cable**:
The physical medium realising a connection; its color and length are stored on the Connection, not as a separate thing. Type is inferred from the ports a Connection joins, never stored.
_Avoid_: Wire, lead

**Cable color**:
One of nine named palette tokens — red, orange, yellow, green, teal, blue, purple, pink, brown — or unset for the theme's default wire. Meaning is the user's; computed state cues layer over it rather than replace it.
_Avoid_: Colour code, stroke color

**Canvas**:
The pannable, zoomable workspace holding switches and their connections.
_Avoid_: Board, stage
