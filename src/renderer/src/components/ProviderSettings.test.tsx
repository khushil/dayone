import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ProviderInfo } from '@shared/instruments';
import type { DayoneApi } from '@shared/types';
import { ProviderSettings } from './ProviderSettings';

const FINNHUB: ProviderInfo = {
  id: 'finnhub',
  name: 'Finnhub',
  requiresKey: true,
  credentialFields: ['apiKey'],
  capabilities: {
    equity: { quotes: true, bars: true, intradayBars: false, streaming: true },
  },
};

function stubApi(overrides: Partial<DayoneApi>): void {
  window.api = {
    loadData: vi.fn(async () => ({ ok: false as const, reason: 'x' })),
    refreshData: vi.fn(async () => ({ ok: false as const, reason: 'x' })),
    listProviders: vi.fn(async () => [FINNHUB]),
    keysStatus: vi.fn(async () => ({
      secure: true,
      hasKey: { finnhub: false },
    })),
    setKey: vi.fn(async () => ({ persisted: true })),
    clearKey: vi.fn(async () => undefined),
    validateKey: vi.fn(async () => ({ valid: true })),
    ...overrides,
  };
}

describe('ProviderSettings', () => {
  it('renders nothing when closed', () => {
    stubApi({});
    const { container } = render(
      <ProviderSettings open={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('saves an entered key through the API', async () => {
    const setKey = vi.fn(async () => ({ persisted: true }));
    stubApi({ setKey });
    render(<ProviderSettings open onClose={vi.fn()} />);

    const input = await screen.findByLabelText('API key');
    fireEvent.change(input, { target: { value: 'abc123' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(setKey).toHaveBeenCalledWith('finnhub', { apiKey: 'abc123' }),
    );
  });

  it('validates a stored key and shows the (sanitized) result', async () => {
    const validateKey = vi.fn(async () => ({ valid: true, detail: 'ok' }));
    stubApi({
      keysStatus: vi.fn(async () => ({
        secure: true,
        hasKey: { finnhub: true },
      })),
      validateKey,
    });
    render(<ProviderSettings open onClose={vi.fn()} />);

    fireEvent.click(await screen.findByText('Validate'));
    expect(await screen.findByText('Key valid — ok')).toBeInTheDocument();
    expect(validateKey).toHaveBeenCalledWith('finnhub');
  });

  it('warns when the OS keyring is unavailable', async () => {
    stubApi({
      keysStatus: vi.fn(async () => ({ secure: false, hasKey: {} })),
    });
    render(<ProviderSettings open onClose={vi.fn()} />);
    expect(
      await screen.findByText(/kept in memory for this session/i),
    ).toBeInTheDocument();
  });
});
