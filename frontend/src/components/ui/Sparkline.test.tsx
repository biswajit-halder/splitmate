import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('draws a polyline for the supplied series', () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 4]} />)
    const line = container.querySelector('polyline')
    expect(line).toBeTruthy()
    expect(line?.getAttribute('points')?.split(' ')).toHaveLength(4)
  })

  it('renders nothing for empty series', () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.querySelector('polyline')).toBeNull()
  })
})
