import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabPills } from '../TabPills'

describe('TabPills', () => {
  const options = [
    { value: 'a' as const, label: 'Tab A', id: 'tab-a', panelId: 'panel-a' },
    { value: 'b' as const, label: 'Tab B', id: 'tab-b', panelId: 'panel-b' },
  ]

  it('marks the active tab as selected and links it to its panel', () => {
    render(<TabPills ariaLabel="Example tabs" value="a" onChange={vi.fn()} options={options} />)

    expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('aria-controls', 'panel-a')
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the tapped tab\'s value', async () => {
    const onChange = vi.fn()
    render(<TabPills ariaLabel="Example tabs" value="a" onChange={onChange} options={options} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Tab B' }))

    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('exposes a tablist with the given accessible label', () => {
    render(<TabPills ariaLabel="Example tabs" value="a" onChange={vi.fn()} options={options} />)

    expect(screen.getByRole('tablist', { name: 'Example tabs' })).toBeInTheDocument()
  })
})
