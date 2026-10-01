# 29: Port devices — model & editing (generic + named)

Type: grilling
Status: ready-for-agent
Blocked by: None (decision ticket; implementation composes with 26–27)

## Question

Decide how a Port is marked as connected to an external device — generic, or a named device — how that attachment is authored and how it renders.

- **Scope**: current scope = a generic "device connected" marking plus named devices that carry just a name. Device types (server, access point, firewall, …) are out of scope and stay in the fog.
- **Open points to settle:**
  - Where the attachment lives in the document (a Device entity in `setup` referenced by the Port vs. an attachment on the Port).
  - Exclusivity with Connections (can a Port be both wired and device-attached?).
  - One device per Port.
  - How the faceplate shows an attached Port.
  - How it is authored (bottom-panel editor and/or direct on the faceplate).
  - Glossary vocabulary.
  - Serialisation and validation.
  - How it composes with the Section schema work ([26](26-section-model.md)).

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.
