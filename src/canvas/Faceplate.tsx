import { Fragment } from 'react'
import type { MouseEvent } from 'react'

import type { Port, PortRef, Row, Switch } from '@/model/types'

import { bankLabel, portAriaLabel, splitBanks } from './faceplateLayout'

export interface FaceplateProps {
  switch_: Switch
  x: number
  y: number
  selected?: boolean
  /** Connected ports as `switch:port` keys, so jacks can show a wired fill. */
  connectedPorts?: ReadonlySet<string>
  onMouseDown?: (event: MouseEvent<HTMLDivElement>) => void
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
  onPortClick?: (ref: PortRef) => void
}

/** A switch rendered as a rack-width faceplate: rows of ports with printed labels. */
export function Faceplate({
  switch_,
  x,
  y,
  selected = false,
  connectedPorts,
  onMouseDown,
  onClick,
  onPortClick,
}: FaceplateProps) {
  const banks = splitBanks(switch_.layout.rows)
  const name = switch_.name || switch_.model || switch_.id

  return (
    <div
      className={selected ? 'switch selected' : 'switch'}
      data-switch={switch_.id}
      role="group"
      aria-label={name}
      style={{ left: x, top: y }}
      onMouseDown={onMouseDown}
      onClick={onClick}
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
          {banks.left.length > 0 && (
            <UplinkBank
              rows={banks.left}
              switchId={switch_.id}
              switchName={name}
              connectedPorts={connectedPorts}
              onPortClick={onPortClick}
            />
          )}
          <MainBank
            rows={banks.main}
            switchId={switch_.id}
            switchName={name}
            connectedPorts={connectedPorts}
            onPortClick={onPortClick}
          />
          {banks.right.length > 0 && (
            <UplinkBank
              rows={banks.right}
              switchId={switch_.id}
              switchName={name}
              connectedPorts={connectedPorts}
              onPortClick={onPortClick}
            />
          )}
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

interface BankProps {
  rows: readonly Row[]
  switchId: string
  switchName: string
  connectedPorts?: ReadonlySet<string>
  onPortClick?: (ref: PortRef) => void
}

function MainBank({ rows, switchId, switchName, connectedPorts, onPortClick }: BankProps) {
  return (
    <div className="bank main">
      {pairRows(rows).map(([top, bottom], index) => (
        <Fragment key={index}>
          <LabelRow row={top} />
          <PortRow
            row={top}
            switchId={switchId}
            switchName={switchName}
            connectedPorts={connectedPorts}
            onPortClick={onPortClick}
          />
          {bottom && (
            <Fragment>
              <PortRow
                row={bottom}
                switchId={switchId}
                switchName={switchName}
                connectedPorts={connectedPorts}
                onPortClick={onPortClick}
              />
              <LabelRow row={bottom} />
            </Fragment>
          )}
        </Fragment>
      ))}
    </div>
  )
}

function UplinkBank({ rows, switchId, switchName, connectedPorts, onPortClick }: BankProps) {
  return (
    <div className="bank uplink">
      <span className="bank-label">{bankLabel(rows)}</span>
      <div className="cages">
        {rows.map((row, index) => (
          <PortRow
            key={index}
            row={row}
            switchId={switchId}
            switchName={switchName}
            connectedPorts={connectedPorts}
            onPortClick={onPortClick}
          />
        ))}
      </div>
    </div>
  )
}

interface PortRowProps {
  row: Row
  switchId: string
  switchName: string
  connectedPorts?: ReadonlySet<string>
  onPortClick?: (ref: PortRef) => void
}

function PortRow({ row, switchId, switchName, connectedPorts, onPortClick }: PortRowProps) {
  return (
    <div className="row">
      {row.ports.map((port) => (
        <PortButton
          key={port.id}
          port={port}
          switchId={switchId}
          switchName={switchName}
          connectedPorts={connectedPorts}
          onPortClick={onPortClick}
        />
      ))}
    </div>
  )
}

interface PortButtonProps {
  port: Port
  switchId: string
  switchName: string
  connectedPorts?: ReadonlySet<string>
  onPortClick?: (ref: PortRef) => void
}

function PortButton({ port, switchId, switchName, connectedPorts, onPortClick }: PortButtonProps) {
  const kind = port.kind === 'sfp+' ? 'sfpp' : port.kind
  const isCage = port.kind !== 'rj45'
  const connected = connectedPorts?.has(`${switchId}:${port.id}`) ?? false
  return (
    <button
      type="button"
      className={`port kind-${kind}${connected ? ' connected' : ''}`}
      data-port={port.id}
      aria-label={portAriaLabel(port, switchName)}
      onClick={(event) => {
        event.stopPropagation()
        onPortClick?.({ switch: switchId, port: port.id })
      }}
    >
      {isCage && <span className="cage-num">{port.label}</span>}
      <span className="led" />
      <span className="jack" />
      {isCage && <span className="latch" />}
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
