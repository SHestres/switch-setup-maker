import type { SetupDocument } from '@/model/types'

/** The example document from ticket 05, completed with the second switch its connection points at. */
export function sampleDocument(): SetupDocument {
  return {
    version: 1,
    setup: {
      switches: [
        {
          id: 'sw1',
          name: 'Core',
          model: 'NSW-24G-4X',
          x: 120,
          y: 360,
          layout: {
            numbering: 'odd-top-even-bottom',
            rows: [
              {
                ports: [
                  { id: 'p1', label: '1', kind: 'rj45', speed: '1G' },
                  { id: 'p2', label: '3', kind: 'rj45', speed: '1G' },
                ],
              },
              {
                numbering: 'start-over',
                ports: [{ id: 'p49', label: '1', kind: 'sfp+', speed: '10G' }],
              },
            ],
          },
        },
        {
          id: 'sw2',
          name: 'Edge',
          model: '',
          x: 640,
          y: 400,
          layout: {
            numbering: 'sequential',
            rows: [
              {
                ports: [
                  { id: 'p1', label: '1', kind: 'rj45', speed: '1G' },
                  { id: 'p2', label: '2', kind: 'rj45', speed: '1G' },
                ],
              },
            ],
          },
        },
      ],
      connections: [{ a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p2' } }],
    },
    ui: { theme: 'light', cableLayer: 'behind', viewport: { x: 0, y: 0, zoom: 1 } },
  }
}
