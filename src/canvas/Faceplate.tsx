import { Fragment } from 'react'
import type { MouseEvent } from 'react'

import { switchLabel } from '@/model/document'
import { sectionRows } from '@/model/layout'
import { portKey } from '@/model/portRef'
import type { Port, PortRef, Row, Section, Switch } from '@/model/types'

import { portAriaLabel } from './faceplateLayout'

export interface FaceplateProps {
  switch_: Switch
  x: number
  y: number
  selected?: boolean
  /** Preview only: transparent, no controls and no handlers, so it cannot be wired or selected. */
  ghost?: boolean
  /** Connected Ports as `switch:port` keys, so each shows a wired connector fill. */
  connectedPorts?: ReadonlySet<string>
  /** This switch's port that starts the pending wire, when one is being drawn. */
  pendingPortId?: string | null
  onMouseDown?: (event: MouseEvent<HTMLDivElement>) => void
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
  onPortClick?: (ref: PortRef) => void
}

/** A switch rendered as a rack-width faceplate: Sections left to right, with printed labels. */
export function Faceplate({
  switch_,
  x,
  y,
  selected = false,
  ghost = false,
  connectedPorts,
  pendingPortId = null,
  onMouseDown,
  onClick,
  onPortClick,
}: FaceplateProps) {
  const { sections } = switch_.layout
  const name = switchLabel(switch_)
  const portScope: PortScope = {
    switchId: switch_.id,
    switchName: name,
    ghost,
    connectedPorts,
    pendingPortId,
    onPortClick,
  }

  return (
    <div
      className={ghost ? 'switch ghost' : selected ? 'switch selected' : 'switch'}
      {...(ghost ? { 'data-draft': true } : { 'data-switch': switch_.id })}
      role="group"
      aria-label={ghost ? 'Draft switch' : name}
      style={{ left: x, top: y }}
      onMouseDown={ghost ? undefined : onMouseDown}
      onClick={ghost ? undefined : onClick}
    >
      <div className="sw-tag">
        <b>{name}</b>
      </div>
      <div className="ears left" aria-hidden="true">
        <i className="screw t" />
        <i className="screw b" />
      </div>
      <div className="ears right" aria-hidden="true">
        <i className="screw t" />
        <i className="screw b" />
      </div>
      <div className="face">
        <div className="chrome left" aria-hidden="true">
          <span className="brand" />
          <span className="status">
            <i className="sled" />
            <i className="sled" />
            <i className="sled" />
          </span>
        </div>
        <div className="portfield">
          {sections.map((section, index) => {
            const tight = index > 0 && sections[index - 1].kind === section.kind
            return (
              <Fragment key={index}>
                {index > 0 && (
                  <span className={tight ? 'sec-gap tight' : 'sec-gap'} aria-hidden="true" />
                )}
                <SectionView section={section} scope={portScope} />
              </Fragment>
            )
          })}
        </div>
        <div className="chrome right">
          {switch_.model && <span className="model">{switch_.model}</span>}
          <span className="vents" aria-hidden="true" />
          <span className="console" aria-hidden="true">
            <i className="c-rj" />
            <i className="c-usb" />
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * The switch-wide values every Port renders from, threaded as one object so
 * SectionView and PortRow stay pass-through layers instead of listing six props.
 */
interface PortScope {
  switchId: string
  switchName: string
  ghost: boolean
  connectedPorts?: ReadonlySet<string>
  pendingPortId: string | null
  onPortClick?: (ref: PortRef) => void
}

function SectionView({ section, scope }: { section: Section; scope: PortScope }) {
  return (
    <div className="section">
      {pairRows(sectionRows(section)).map(([top, bottom], index) => (
        <Fragment key={index}>
          <LabelRow row={top} />
          <PortRow row={top} scope={scope} />
          {bottom && (
            <Fragment>
              <PortRow row={bottom} scope={scope} />
              <LabelRow row={bottom} />
            </Fragment>
          )}
        </Fragment>
      ))}
    </div>
  )
}

function PortRow({ row, scope }: { row: Row; scope: PortScope }) {
  return (
    <div className="row">
      {row.ports.map((port) => (
        <PortButton key={port.id} port={port} scope={scope} />
      ))}
    </div>
  )
}

function PortButton({ port, scope }: { port: Port; scope: PortScope }) {
  const { switchId, switchName, ghost, connectedPorts, pendingPortId, onPortClick } = scope
  const kind = port.kind === 'sfp+' ? 'sfpp' : port.kind
  const isCage = port.kind !== 'rj45'
  const content = (
    <>
      <span className="led" />
      <span className="connector" />
      {isCage && <span className="latch" />}
    </>
  )

  if (ghost) {
    return (
      <span className={`port kind-${kind}`} data-port={port.id} aria-hidden="true">
        {content}
      </span>
    )
  }

  const connected = connectedPorts?.has(portKey({ switch: switchId, port: port.id })) ?? false
  const pending = pendingPortId === port.id
  return (
    <button
      type="button"
      className={`port kind-${kind}${connected ? ' connected' : ''}${pending ? ' pending' : ''}`}
      data-port={port.id}
      aria-label={portAriaLabel(port, switchName)}
      onClick={(event) => {
        event.stopPropagation()
        onPortClick?.({ switch: switchId, port: port.id })
      }}
    >
      {content}
    </button>
  )
}

function LabelRow({ row }: { row: Row }) {
  return (
    <div className="numrow">
      {row.ports.map((port) => (
        <span className="num" key={port.id}>
          {port.label}
        </span>
      ))}
    </div>
  )
}

function pairRows(rows: readonly Row[]): Array<[Row] | [Row, Row]> {
  const pairs: Array<[Row] | [Row, Row]> = []
  for (let index = 0; index < rows.length; index += 2) {
    const top = rows[index]
    const bottom = rows[index + 1]
    pairs.push(bottom ? [top, bottom] : [top])
  }
  return pairs
}
