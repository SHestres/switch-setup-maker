import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Placeholder } from './Placeholder'

describe('Placeholder', () => {
  it('renders the app name', () => {
    render(<Placeholder />)
    expect(screen.getByRole('heading', { name: 'Switch Setup Maker' })).toBeInTheDocument()
  })
})
