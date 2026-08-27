import { INITIAL_STATE, type RelayState } from './relay';

export const RELAY_STORAGE_KEY = 'relay-demo-ledger-v3';

export function loadRelayState(): RelayState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const stored = window.localStorage.getItem(RELAY_STORAGE_KEY);
    if (!stored) return INITIAL_STATE;
    const parsed = JSON.parse(stored) as RelayState;
    if (!parsed.mission || !parsed.providers || !Array.isArray(parsed.services) || !Array.isArray(parsed.receipts)) return INITIAL_STATE;
    return parsed;
  } catch {
    return INITIAL_STATE;
  }
}

export function persistRelayState(state: RelayState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(state));
}

export function clearRelayState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(RELAY_STORAGE_KEY);
}

export function mutateRelayState(update: (state: RelayState) => RelayState) {
  const next = update(loadRelayState());
  persistRelayState(next);
  window.dispatchEvent(new CustomEvent('relay-state-change', { detail: next }));
  return next;
}
