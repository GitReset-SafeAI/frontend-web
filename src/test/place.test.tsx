import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp'

describe('place search selection', () => {
  it('lets you pick a start and destination from the dropdown, like a map app', async () => {
    const user = userEvent.setup()
    renderApp('/safety')

    const originField = await screen.findByTestId('planner-origin')
    await user.type(originField, 'Fort')

    const option = await screen.findByText('Colombo Fort Railway Station')
    console.log('OPTION FOUND, clicking...')
    await user.click(option)

    console.log('ORIGIN FIELD VALUE AFTER CLICK>>>', (originField as HTMLInputElement).value)
    await waitFor(() => {
      expect((originField as HTMLInputElement).value).toBe('Colombo Fort Railway Station')
    })

    const destField = screen.getByTestId('planner-destination')
    await user.type(destField, 'Galle Face')
    const destOption = await screen.findByText('Galle Face Green')
    await user.click(destOption)
    await waitFor(() => {
      expect((destField as HTMLInputElement).value).toBe('Galle Face Green')
    })

    const compareButton = screen.getByRole('button', { name: /compare routes/i })
    expect(compareButton).not.toBeDisabled()
  })
})
