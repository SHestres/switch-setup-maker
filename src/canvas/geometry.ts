import { findSwitch } from '@/model/document'
import type { Connection, PortRef, Section, Setup, Switch } from '@/model/types'

import {
  CHROME_LEFT_WIDTH,
  CHROME_RIGHT_WIDTH,
  FACE_BORDER,
  FACE_HEIGHT,
  FACE_PADDING_X,
  FACE_PADDING_Y,
  LABEL_ROW_HEIGHT,
  PORT_PITCH,
  RACK_WIDTH,
  ROW_HEIGHT,
  SECTION_GAP_OTHER_KIND,
  SECTION_GAP_SAME_KIND,
} from './constants'

/**
 * Model-first port and wire geometry (ADR 0001): every coordinate is derived
 * from the port grid and the renderer constants, never from DOM measurement.
 * `faceplate.css` renders the same grid with flex sections; the constants mirror it.
 */

/** A point in canvas units, relative to the canvas origin (switch x/y share it). */
export interface Point {
  x: number
  y: number
}

/** A Switch mid-gesture: its live top-left replaces the model's until gesture end. */
export interface MovedSwitch {
  id: string
  x: number
  y: number
}

/** Vertical gap under which two ports count as level and the wire hangs below them. */
const LEVEL_GAP = 24
/** Smallest sag under a pair of level ports. */
const MIN_SAG = 24
/** Largest control offset for any wire. */
const MAX_BOW = 120
/** Sag grows with horizontal span, as a share of it. */
const SAG_RATIO = 0.5
/**
 * A cubic whose two control points sit equally below level anchors reaches its
 * lowest point this share of the control bow below them (at t = 0.5).
 */
const SAG_LOWEST_SHARE = 0.75
/**
 * Visible clearance between a sagging cable's lowest point and the bottom of
 * the faceplate it passes under, so the cable always has an exposed, clickable
 * run while "Cables behind". Clearance wins over MAX_BOW for tall faceplates.
 */
const SAG_CLEARANCE = 8

interface PlacedSection {
  section: Section
  /** Distance between the Section's left edge and the face content's left. */
  left: number
  /** Distance between the Section's top and the face content's top. */
  top: number
  width: number
  height: number
}

function sectionWidth(section: Section): number {
  return section.columns * PORT_PITCH
}

/** A row-pair is label + top row + bottom row + label; a lone row is label + row. */
function sectionHeight(section: Section): number {
  const pairs = Math.floor(section.rows / 2)
  return (
    pairs * 2 * (LABEL_ROW_HEIGHT + ROW_HEIGHT) +
    (section.rows % 2) * (LABEL_ROW_HEIGHT + ROW_HEIGHT)
  )
}

/** The face content's rendered height: the chassis field, or the tallest Section when it overflows. */
function faceContentHeight(...sectionHeights: number[]): number {
  return Math.max(FACE_HEIGHT - 2 * FACE_BORDER - 2 * FACE_PADDING_Y, ...sectionHeights)
}

/** Vertical distance from a Section's top to the row's top. */
function sectionRowTop(index: number): number {
  return (
    Math.floor(index / 2) * 2 * (LABEL_ROW_HEIGHT + ROW_HEIGHT) +
    LABEL_ROW_HEIGHT +
    (index % 2) * ROW_HEIGHT
  )
}

/**
 * The Sections' horizontal placement: left to right from the portfield's
 * center, with 6px between same-kind neighbours and 16px otherwise. Each
 * Section is centered vertically against the tallest one (or the chassis).
 */
function placedSections(switch_: Switch): PlacedSection[] {
  const { sections } = switch_.layout
  const portfieldLeft = FACE_BORDER + FACE_PADDING_X + CHROME_LEFT_WIDTH
  const portfieldWidth =
    RACK_WIDTH - 2 * FACE_BORDER - 2 * FACE_PADDING_X - CHROME_LEFT_WIDTH - CHROME_RIGHT_WIDTH

  const gapBefore = (index: number): number => {
    if (index === 0) return 0
    return sections[index - 1].kind === sections[index].kind
      ? SECTION_GAP_SAME_KIND
      : SECTION_GAP_OTHER_KIND
  }

  const widths = sections.map(sectionWidth)
  const contentWidth = widths.reduce((total, width, index) => total + width + gapBefore(index), 0)
  const contentHeight = faceContentHeight(...sections.map(sectionHeight))

  let cursor = portfieldLeft + (portfieldWidth - contentWidth) / 2
  return sections.map((section, index) => {
    cursor += gapBefore(index)
    const height = sectionHeight(section)
    const placed: PlacedSection = {
      section,
      left: cursor,
      top: FACE_BORDER + FACE_PADDING_Y + (contentHeight - height) / 2,
      width: widths[index],
      height,
    }
    cursor += placed.width
    return placed
  })
}

/** Where a port's tile center sits in canvas coordinates, or undefined if absent. */
export function portAnchor(
  switch_: Switch,
  portId: string,
  moved?: MovedSwitch | null,
): Point | undefined {
  const origin = moved?.id === switch_.id ? moved : switch_
  for (const placed of placedSections(switch_)) {
    const index = placed.section.ports.findIndex((port) => port.id === portId)
    if (index === -1) continue
    const row = Math.floor(index / placed.section.columns)
    const column = index % placed.section.columns
    return {
      x: origin.x + placed.left + column * PORT_PITCH + PORT_PITCH / 2,
      y: origin.y + placed.top + sectionRowTop(row) + ROW_HEIGHT / 2,
    }
  }
  return undefined
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** The rendered faceplate height, mirroring the CSS box (border-box, 89px minimum). */
function faceHeight(switch_: Switch): number {
  const contentHeight = faceContentHeight(...switch_.layout.sections.map(sectionHeight))
  return contentHeight + 2 * FACE_BORDER + 2 * FACE_PADDING_Y
}

/** The style's base sag for a level pair: grows with span, within [MIN_SAG, MAX_BOW]. */
function baseSag(a: Point, b: Point): number {
  return Math.min(Math.max(Math.abs(b.x - a.x) * SAG_RATIO, MIN_SAG), MAX_BOW)
}

/**
 * The smallest sag whose cable dips clear of every faceplate under its lowest
 * point, by SAG_CLEARANCE. Only meaningful for level pairs (the sag branch):
 * a sloped cable's lowest point is an endpoint inside its own faceplate, and
 * vertical exits are preserved. Raising the dip can bring it under another
 * faceplate, so the scan repeats to a fixed point (bounded by the switch count).
 */
function clearanceSag(setup: Setup, a: Point, b: Point, moved?: MovedSwitch | null): number {
  const midX = (a.x + b.x) / 2
  const baseY = (a.y + b.y) / 2
  let lowest = baseY + baseSag(a, b) * SAG_LOWEST_SHARE
  for (let pass = 0; pass <= setup.switches.length; pass++) {
    let raised = false
    for (const switch_ of setup.switches) {
      const origin = moved?.id === switch_.id ? moved : switch_
      if (midX < origin.x || midX > origin.x + RACK_WIDTH) continue
      const bottom = origin.y + faceHeight(switch_)
      if (lowest >= origin.y && lowest < bottom + SAG_CLEARANCE) {
        lowest = bottom + SAG_CLEARANCE
        raised = true
      }
    }
    if (!raised) break
  }
  return (lowest - baseY) / SAG_LOWEST_SHARE
}

/** The extra sag a settled cable needs so it stays clickable in behind mode. */
function faceplateClearance(setup: Setup, a: Point, b: Point, moved?: MovedSwitch | null): number {
  return Math.abs(b.y - a.y) <= LEVEL_GAP ? clearanceSag(setup, a, b, moved) : 0
}

/** The two control points of the cable between `a` and `b`, at least `minSag` deep. */
function wireControls(a: Point, b: Point, minSag = 0): { c1: Point; c2: Point } {
  const dy = b.y - a.y
  let fromY: number
  let toY: number
  if (Math.abs(dy) > LEVEL_GAP) {
    const bow = Math.min(Math.abs(dy) / 2, MAX_BOW)
    const sign = dy > 0 ? 1 : -1
    fromY = a.y + sign * bow
    toY = b.y - sign * bow
  } else {
    const bow = Math.max(baseSag(a, b), minSag)
    fromY = a.y + bow
    toY = b.y + bow
  }
  return { c1: { x: a.x, y: fromY }, c2: { x: b.x, y: toY } }
}

/**
 * SVG path from one port anchor to another. Cables leave Ports vertically: the
 * first control point sits above/below the start, the second below/above the
 * end. Roughly level Ports (same row, or within LEVEL_GAP) both exit downwards
 * and the cable hangs in a sag at least `minSag` deep.
 */
export function wireCurve(a: Point, b: Point, minSag = 0): string {
  const { c1, c2 } = wireControls(a, b, minSag)
  return `M ${round2(a.x)} ${round2(a.y)} C ${round2(c1.x)} ${round2(c1.y)}, ${round2(c2.x)} ${round2(c2.y)}, ${round2(b.x)} ${round2(b.y)}`
}

/** A point on the cable's cubic curve, at `t` 0 to 1. */
export function wirePoint(a: Point, b: Point, t: number, minSag = 0): Point {
  const { c1, c2 } = wireControls(a, b, minSag)
  const inv = 1 - t
  const wa = inv * inv * inv
  const wc1 = 3 * inv * inv * t
  const wc2 = 3 * inv * t * t
  const wb = t * t * t
  return {
    x: round2(wa * a.x + wc1 * c1.x + wc2 * c2.x + wb * b.x),
    y: round2(wa * a.y + wc1 * c1.y + wc2 * c2.y + wb * b.y),
  }
}

/** The SVG path for one Connection, or undefined when a referenced Port is gone. */
export function connectionCurve(
  setup: Setup,
  connection: Connection,
  moved?: MovedSwitch | null,
): string | undefined {
  const a = pointForPort(setup, connection.a, moved)
  const b = pointForPort(setup, connection.b, moved)
  if (!a || !b) return undefined
  return wireCurve(a, b, faceplateClearance(setup, a, b, moved))
}

/** The curve midpoint of one Connection, where selection affordances anchor. */
export function connectionMidpoint(
  setup: Setup,
  connection: Connection,
  moved?: MovedSwitch | null,
): Point | undefined {
  const a = pointForPort(setup, connection.a, moved)
  const b = pointForPort(setup, connection.b, moved)
  if (!a || !b) return undefined
  return wirePoint(a, b, 0.5, faceplateClearance(setup, a, b, moved))
}

/** Where a Port ref's anchor sits in canvas coordinates, when it exists. */
export function pointForPort(
  setup: Setup,
  ref: PortRef,
  moved?: MovedSwitch | null,
): Point | undefined {
  const switch_ = findSwitch(setup, ref.switch)
  return switch_ ? portAnchor(switch_, ref.port, moved) : undefined
}
