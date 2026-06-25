import { useState } from 'react';
import { X, ShieldAlert, KeyRound, Check } from 'lucide-react';
import type {
  CredentialRecord,
  KeyCheck,
  ProviderInfo,
} from '@shared/instruments';
import { useProviders } from '../hooks/useProviders';
import { IconButton } from './ui/IconButton';
import { cn } from './ui/cn';

interface ProviderSettingsProps {
  open: boolean;
  onClose: () => void;
}

const FIELD_LABEL: Record<keyof CredentialRecord, string> = {
  apiKey: 'API key',
  keyId: 'Key ID',
  secret: 'Secret',
  token: 'Token',
};

const BTN =
  'rounded-md border px-2.5 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40';

function KeyChip({
  requiresKey,
  hasKey,
}: {
  requiresKey: boolean;
  hasKey: boolean;
}): React.JSX.Element {
  if (!requiresKey) {
    return <span className="text-xs text-muted uppercase">Keyless</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs uppercase',
        hasKey ? 'text-gain' : 'text-muted',
      )}
    >
      {hasKey ? <Check size={12} /> : <KeyRound size={12} />}
      {hasKey ? 'Stored' : 'No key'}
    </span>
  );
}

function CapabilityBadges({
  provider,
}: {
  provider: ProviderInfo;
}): React.JSX.Element {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {Object.keys(provider.capabilities).map((cls) => (
        <span
          key={cls}
          className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.65rem] text-muted uppercase"
        >
          {cls}
        </span>
      ))}
    </div>
  );
}

/**
 * Slide-over panel for managing per-provider API keys. Keys are entered masked,
 * stored via the main-process SecureStore, and never read back; a warning shows
 * when the OS keyring is unavailable (keys held in memory only).
 */
export function ProviderSettings({
  open,
  onClose,
}: ProviderSettingsProps): React.JSX.Element | null {
  const { providers, status, setKey, clearKey, validateKey } =
    useProviders(open);
  const [drafts, setDrafts] = useState<Record<string, CredentialRecord>>({});
  const [results, setResults] = useState<Record<string, KeyCheck>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const setField = (
    id: string,
    field: keyof CredentialRecord,
    value: string,
  ): void => setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));

  const save = async (p: ProviderInfo): Promise<void> => {
    setBusy(p.id);
    await setKey(p.id, drafts[p.id] ?? {});
    setDrafts((d) => ({ ...d, [p.id]: {} }));
    setBusy(null);
  };

  const validate = async (p: ProviderInfo): Promise<void> => {
    setBusy(p.id);
    const result = await validateKey(p.id);
    setResults((r) => ({ ...r, [p.id]: result }));
    setBusy(null);
  };

  const clear = async (p: ProviderInfo): Promise<void> => {
    setBusy(p.id);
    await clearKey(p.id);
    setResults((r) => {
      const next = { ...r };
      delete next[p.id];
      return next;
    });
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-ink/60"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Data providers"
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-ink shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg">Data providers</h2>
          <IconButton label="Close settings" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </header>

        {status && !status.secure && (
          <div className="flex items-start gap-2 border-b border-line bg-loss/10 px-5 py-3 text-sm text-loss">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>
              No OS keyring detected — keys are kept in memory for this session
              only and won&rsquo;t persist.
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="flex flex-col gap-4">
            {providers.map((p) => {
              const hasKey = Boolean(status?.hasKey[p.id]);
              const result = results[p.id];
              return (
                <li
                  key={p.id}
                  className="rounded-lg border border-line bg-surface p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base">{p.name}</span>
                    <KeyChip requiresKey={p.requiresKey} hasKey={hasKey} />
                  </div>
                  <CapabilityBadges provider={p} />

                  {p.requiresKey ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {p.credentialFields.map((field) => (
                        <label
                          key={field}
                          className="flex flex-col gap-1 text-xs text-muted"
                        >
                          {FIELD_LABEL[field]}
                          <input
                            type="password"
                            autoComplete="off"
                            spellCheck={false}
                            value={drafts[p.id]?.[field] ?? ''}
                            onChange={(e) =>
                              setField(p.id, field, e.target.value)
                            }
                            placeholder={
                              hasKey
                                ? '•••••••• (stored)'
                                : `Enter ${FIELD_LABEL[field].toLowerCase()}`
                            }
                            className="rounded-md border border-line bg-ink px-2 py-1.5 font-mono text-sm text-text focus-visible:outline-2 focus-visible:outline-accent"
                          />
                        </label>
                      ))}
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => void save(p)}
                          className={cn(
                            BTN,
                            'border-accent/40 bg-accent/10 text-accent',
                          )}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={busy === p.id || !hasKey}
                          onClick={() => void validate(p)}
                          className={cn(BTN, 'border-line text-text')}
                        >
                          Validate
                        </button>
                        <button
                          type="button"
                          disabled={busy === p.id || !hasKey}
                          onClick={() => void clear(p)}
                          className={cn(BTN, 'border-line text-muted')}
                        >
                          Clear
                        </button>
                      </div>
                      {result && (
                        <p
                          className={cn(
                            'text-sm',
                            result.valid ? 'text-gain' : 'text-loss',
                          )}
                        >
                          {result.valid ? 'Key valid' : 'Key invalid'}
                          {result.detail ? ` — ${result.detail}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      No key required — this provider is free to use.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
