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
