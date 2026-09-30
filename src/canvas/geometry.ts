import { findSwitch } from '@/model/document'
import type { Connection, PortRef, Row, Setup, Switch } from '@/model/types'

import {
  BANK_GAP,
  CAGE_GAP,
  CAGE_ROW_HEIGHT,
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
} from './constants'
import { splitBanks } from './faceplateLayout'

/**
 * Model-first port and wire geometry (ADR 0001): every coordinate is derived
 * from the port grid and the renderer constants, never from DOM measurement.
 * `faceplate.css` renders the same grid with flex rows; the constants mirror it.
 */

/** A point in canvas units, relative to the canvas origin (switch x/y share it). */
export interface Point {
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

interface FaceplateBank {
  rows: readonly Row[]
  /** Distance between the bank's top and the face content's top. */
  top: number
  left: number
  width: number
  height: number
  /** Vertical distance from the bank top to the row's top. */
  rowTop: (index: number) => number
  rowHeight: number
}

function bankWidth(rows: readonly Row[]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.ports.length), 0) * PORT_PITCH
}

/** A main-field pair is label + top row + bottom row + label; a lone row is label + row. */
function mainBankHeight(rows: readonly Row[]): number {
  const pairs = Math.floor(rows.length / 2)
  return (
    pairs * 2 * (LABEL_ROW_HEIGHT + ROW_HEIGHT) +
    (rows.length % 2) * (LABEL_ROW_HEIGHT + ROW_HEIGHT)
  )
}

function mainRowTop(index: number): number {
  return (
    Math.floor(index / 2) * 2 * (LABEL_ROW_HEIGHT + ROW_HEIGHT) +
    LABEL_ROW_HEIGHT +
    (index % 2) * ROW_HEIGHT
  )
}

function uplinkBankHeight(rows: readonly Row[]): number {
  if (rows.length === 0) return 0
  return rows.length * CAGE_ROW_HEIGHT + (rows.length - 1) * CAGE_GAP
}

function uplinkRowTop(index: number): number {
  return index * (CAGE_ROW_HEIGHT + CAGE_GAP)
}

/** The banks a faceplate renders, with their vertical/horizontal placement. */
function placedBanks(switch_: Switch): FaceplateBank[] {
  const { main, left, right } = splitBanks(switch_.layout.rows)
  const portfieldLeft = FACE_BORDER + FACE_PADDING_X + CHROME_LEFT_WIDTH
  const portfieldWidth =
    RACK_WIDTH - 2 * FACE_BORDER - 2 * FACE_PADDING_X - CHROME_LEFT_WIDTH - CHROME_RIGHT_WIDTH

  const banks: FaceplateBank[] = []
  if (left.length > 0) {
    banks.push({
      rows: left,
      top: 0,
      left: 0,
      width: bankWidth(left),
      height: uplinkBankHeight(left),
      rowTop: uplinkRowTop,
      rowHeight: CAGE_ROW_HEIGHT,
    })
  }
  if (main.length > 0) {
    banks.push({
      rows: main,
      top: 0,
      left: 0,
      width: bankWidth(main),
      height: mainBankHeight(main),
      rowTop: mainRowTop,
      rowHeight: ROW_HEIGHT,
    })
  }
  if (right.length > 0) {
    banks.push({
      rows: right,
      top: 0,
      left: 0,
      width: bankWidth(right),
      height: uplinkBankHeight(right),
      rowTop: uplinkRowTop,
      rowHeight: CAGE_ROW_HEIGHT,
    })
  }

  const gap = banks.length > 1 ? BANK_GAP * (banks.length - 1) : 0
  const contentWidth = banks.reduce((total, bank) => total + bank.width, 0) + gap
  const contentHeight = Math.max(
    FACE_HEIGHT - 2 * FACE_BORDER - 2 * FACE_PADDING_Y,
    ...banks.map((bank) => bank.height),
  )

  // The portfield centres the rendered banks; so does the group's top padding.
  let cursor = portfieldLeft + (portfieldWidth - contentWidth) / 2
  for (const bank of banks) {
    bank.left = cursor
    bank.top = FACE_BORDER + FACE_PADDING_Y + (contentHeight - bank.height) / 2
    cursor += bank.width + BANK_GAP
  }
  return banks
}

/** Where a port's tile centre sits in canvas coordinates, or undefined if absent. */
export function portAnchor(switch_: Switch, portId: string): Point | undefined {
  for (const bank of placedBanks(switch_)) {
    for (let index = 0; index < bank.rows.length; index++) {
      const column = bank.rows[index].ports.findIndex((port) => port.id === portId)
      if (column === -1) continue
      return {
        x: switch_.x + bank.left + column * PORT_PITCH + PORT_PITCH / 2,
        y: switch_.y + bank.top + bank.rowTop(index) + bank.rowHeight / 2,
      }
    }
  }
  return undefined
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** The rendered faceplate height, mirroring the CSS box (border-box, 89px minimum). */
function faceHeight(switch_: Switch): number {
  const { main, left, right } = splitBanks(switch_.layout.rows)
  const contentHeight = Math.max(
    FACE_HEIGHT - 2 * FACE_BORDER - 2 * FACE_PADDING_Y,
    mainBankHeight(main),
    uplinkBankHeight(left),
    uplinkBankHeight(right),
  )
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
function clearanceSag(setup: Setup, a: Point, b: Point): number {
  const midX = (a.x + b.x) / 2
  const baseY = (a.y + b.y) / 2
  let lowest = baseY + baseSag(a, b) * SAG_LOWEST_SHARE
  for (let pass = 0; pass <= setup.switches.length; pass++) {
    let raised = false
    for (const switch_ of setup.switches) {
      if (midX < switch_.x || midX > switch_.x + RACK_WIDTH) continue
      const bottom = switch_.y + faceHeight(switch_)
      if (lowest >= switch_.y && lowest < bottom + SAG_CLEARANCE) {
        lowest = bottom + SAG_CLEARANCE
        raised = true
      }
    }
    if (!raised) break
  }
  return (lowest - baseY) / SAG_LOWEST_SHARE
}

/** The extra sag a settled cable needs so it stays clickable in behind mode. */
function faceplateClearance(setup: Setup, a: Point, b: Point): number {
  return Math.abs(b.y - a.y) <= LEVEL_GAP ? clearanceSag(setup, a, b) : 0
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
export function connectionCurve(setup: Setup, connection: Connection): string | undefined {
  const a = pointForPort(setup, connection.a)
  const b = pointForPort(setup, connection.b)
  if (!a || !b) return undefined
  return wireCurve(a, b, faceplateClearance(setup, a, b))
}

/** The curve midpoint of one Connection, where selection affordances anchor. */
export function connectionMidpoint(setup: Setup, connection: Connection): Point | undefined {
  const a = pointForPort(setup, connection.a)
  const b = pointForPort(setup, connection.b)
  if (!a || !b) return undefined
  return wirePoint(a, b, 0.5, faceplateClearance(setup, a, b))
}

/** Where a Port ref's anchor sits in canvas coordinates, when it exists. */
export function pointForPort(setup: Setup, ref: PortRef): Point | undefined {
  const switch_ = findSwitch(setup, ref.switch)
  return switch_ ? portAnchor(switch_, ref.port) : undefined
}
