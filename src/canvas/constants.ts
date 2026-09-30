/**
 * Renderer constants for the canvas layer. Physical geometry (rack width, port
 * pitch, row heights) is a rendering concern and never enters the model; the
 * faceplate CSS mirrors these numbers (`src/canvas/faceplate.css`).
 */

/** Port tile width in canvas units: the prototype's densest validated pitch. */
export const PORT_PITCH = 27
/** Height of one row of ports in canvas units. */
export const ROW_HEIGHT = 24
/** Height of a printed-label row in canvas units. */
export const LABEL_ROW_HEIGHT = 9
/** Chassis height of a faceplate in canvas units. */
export const FACE_HEIGHT = 89
/** One rack width for every faceplate: 24 ports + 4 uplinks at PORT_PITCH. */
export const RACK_WIDTH = 880

/*
 * Faceplate internals that the geometry module must reproduce without reading
 * the DOM. Every value mirrors a rule in `faceplate.css`; change both together.
 */

/** `.face` border width in canvas units. */
export const FACE_BORDER = 1
/** `.face` horizontal padding in canvas units. */
export const FACE_PADDING_X = 3
/** `.face` vertical padding in canvas units. */
export const FACE_PADDING_Y = 5
/** Fixed `.chrome.left` column width in canvas units. */
export const CHROME_LEFT_WIDTH = 34
/** Fixed `.chrome.right` column width in canvas units. */
export const CHROME_RIGHT_WIDTH = 74
/** `.portfield` gap between banks in canvas units. */
export const BANK_GAP = 8
/** Height of one `.cages .row` in canvas units. */
export const CAGE_ROW_HEIGHT = 22
/** `.cages` gap between uplink rows in canvas units. */
export const CAGE_GAP = 4
