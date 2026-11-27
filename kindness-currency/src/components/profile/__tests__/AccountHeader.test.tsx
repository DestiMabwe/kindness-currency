import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountHeader } from '../AccountHeader'

const ok = (name: string) => ({ success: true as const, name })

describe('AccountHeader', () => {
  it('greets a person by name and shows the email they are signed in with', () => {
    render(<AccountHeader name="Alex" email="alex@example.com" onSave={vi.fn()} />)

    expect(screen.getByText('Hi, Alex')).toBeInTheDocument()
    expect(screen.getByText('Signed in as')).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
  })

  it('asks for a name instead when none is saved, but still shows the email', () => {
    render(<AccountHeader name={null} email="alex@example.com" onSave={vi.fn()} />)

    expect(screen.getByText('What should we call you?')).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toHaveValue('')
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
    expect(screen.queryByText(/^Hi,/)).not.toBeInTheDocument()
  })

  it('saves a first name and turns the prompt into a greeting', async () => {
    const onSave = vi.fn().mockResolvedValue(ok('Alex'))
    render(<AccountHeader name={null} email="alex@example.com" onSave={onSave} />)

    await userEvent.type(screen.getByLabelText('Your name'), 'Alex')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith('Alex')
    expect(await screen.findByText('Hi, Alex')).toBeInTheDocument()
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument()
  })

  it('lets a saved name be edited, starting from the current one', async () => {
    const onSave = vi.fn().mockResolvedValue(ok('Alexandra'))
    render(<AccountHeader name="Alex" email="alex@example.com" onSave={onSave} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit name' }))
    const field = screen.getByLabelText('Your name')
    expect(field).toHaveValue('Alex')
    await userEvent.clear(field)
    await userEvent.type(field, 'Alexandra')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Hi, Alexandra')).toBeInTheDocument()
  })

  it('cancels an edit and keeps the old name', async () => {
    const onSave = vi.fn()
    render(<AccountHeader name="Alex" email="alex@example.com" onSave={onSave} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit name' }))
    await userEvent.type(screen.getByLabelText('Your name'), 'zzz')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Hi, Alex')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows the reason and stays open when saving fails', async () => {
    const onSave = vi.fn().mockResolvedValue({ success: false, error: 'Enter your name ♥' })
    render(<AccountHeader name={null} email="alex@example.com" onSave={onSave} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your name ♥')
    expect(screen.getByLabelText('Your name')).toBeInTheDocument()
  })

  it('does not save twice while a save is in flight', async () => {
    let finish: (v: ReturnType<typeof ok>) => void = () => {}
    const onSave = vi.fn().mockReturnValue(new Promise((resolve) => (finish = resolve)))
    render(<AccountHeader name={null} email="alex@example.com" onSave={onSave} />)

    await userEvent.type(screen.getByLabelText('Your name'), 'Alex')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    finish(ok('Alex'))

    expect(await screen.findByText('Hi, Alex')).toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
