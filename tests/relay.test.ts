import { describe, expect, it, vi } from 'vitest';
import {
  approveInternetTransfer,
  beginService,
  completeService,
  getMissionSnapshot,
  grantInternetApproval,
  INITIAL_STATE,
  requestInternetApproval,
  startMission,
} from '../lib/relay';
import { createRelayTools, type RelayToolCallbacks } from '../lib/relay-tools';

function callbacks(overrides: Partial<RelayToolCallbacks> = {}): RelayToolCallbacks {
  return {
    getState: () => INITIAL_STATE,
    onApprovalRequired: vi.fn(),
    onApprovalRequested: vi.fn(),
    onBeginService: vi.fn(),
    onCompleteService: vi.fn(),
    onCommit: vi.fn(),
    onRunMission: vi.fn(),
    ...overrides,
  };
}

describe('RELAY delegation state', () => {
  it('starts as a genuinely runnable mission with no pre-created receipts', () => {
    const snapshot = getMissionSnapshot(INITIAL_STATE);
    expect(snapshot.status).toBe('ready');
    expect(snapshot.completed).toBe(0);
    expect(snapshot.totalAllowed).toBe(4);
    expect(INITIAL_STATE.receipts).toHaveLength(0);
  });

  it('executes allowed services and creates one receipt for each mutation', () => {
    let state = startMission(INITIAL_STATE, new Date('2026-08-27T14:00:00.000Z'));
    for (const id of ['civic', 'northstar', 'postway']) {
      state = beginService(state, id);
      state = completeService(state, id);
    }
    state = beginService(state, 'wavelength');
    state = requestInternetApproval(state);
    expect(state.missionStatus).toBe('waiting_for_human_approval');
    expect(state.services.find((service) => service.id === 'wavelength')?.status).toBe('Needs approval');
    expect(state.services.find((service) => service.id === 'hearth')?.status).toBe('Blocked by rule');
    expect(state.receipts).toHaveLength(3);
  });

  it('requires explicit approval before completing the internet transfer', () => {
    expect(approveInternetTransfer(INITIAL_STATE)).toBe(INITIAL_STATE);
    const waiting = requestInternetApproval(startMission(INITIAL_STATE));
    const granted = grantInternetApproval(waiting, new Date('2026-08-27T14:00:00.000Z'));
    const approved = approveInternetTransfer(granted, new Date('2026-08-27T14:00:01.000Z'));
    expect(approved.approvalStatus).toBe('approved');
    expect(approved.services.find((service) => service.id === 'wavelength')?.status).toBe('Complete');
    expect(approved.receipts.at(-1)).toMatchObject({ service: 'Wavelength', policyId: 'POL-MOVE-0915', approvedBy: 'David · explicit approval' });
  });

  it('is replay-safe and does not create a second receipt', () => {
    const waiting = requestInternetApproval(startMission(INITIAL_STATE));
    const approved = approveInternetTransfer(grantInternetApproval(waiting), new Date('2026-08-27T14:00:00.000Z'));
    expect(approveInternetTransfer(approved)).toBe(approved);
    expect(approved.receipts).toHaveLength(1);
  });
});

describe('RELAY WebMCP tools', () => {
  it('lets real provider tool calls drive the visible mission to the approval boundary', async () => {
    let state = INITIAL_STATE;
    const tools = createRelayTools(callbacks({
      getState: () => state,
      onBeginService: (serviceId) => { state = beginService(startMission(state), serviceId); },
      onCompleteService: (serviceId) => { state = completeService(state, serviceId); },
      onApprovalRequired: () => { state = requestInternetApproval(state); },
    }));
    const call = (name: string, input: unknown = {}) => tools.find((tool) => tool.name === name)?.execute(input);

    expect(await call('council_preview_move', { newAddress: '18 River Lane', moveDate: '2026-09-15' })).toMatchObject({ status: 'ready', policyDecision: 'allowed' });
    expect(await call('council_commit_move')).toMatchObject({ receiptId: 'RCT-CIV-0915' });
    expect(await call('energy_preview_move', { moveDate: '2026-09-15' })).toMatchObject({ status: 'ready' });
    expect(await call('energy_schedule_move')).toMatchObject({ receiptId: 'RCT-ENE-0915' });
    expect(await call('postal_preview_forwarding', { months: 6 })).toMatchObject({ status: 'ready' });
    expect(await call('postal_schedule_forwarding')).toMatchObject({ receiptId: 'RCT-PST-0915' });
    expect(await call('internet_preview_transfer', { moveDate: '2026-09-15', postcode: 'SE1 2AB' })).toMatchObject({ status: 'approval_required', proposalId: 'PROP-WAV-300' });

    expect(state.missionStatus).toBe('waiting_for_human_approval');
    expect(state.receipts).toHaveLength(3);
    expect(state.services.find((service) => service.id === 'wavelength')?.tone).toBe('review');
  });

  it('rejects a commit before explicit human approval', async () => {
    const onCommit = vi.fn();
    const tools = createRelayTools(callbacks({ onCommit }));
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    expect(await commit?.execute({ proposalId: 'PROP-WAV-300' })).toMatchObject({ status: 'denied', reason: 'human_approval_required' });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('opens a visible human gate but never self-approves', async () => {
    const onApprovalRequested = vi.fn();
    const onCommit = vi.fn();
    const waiting = requestInternetApproval(startMission(INITIAL_STATE));
    const tools = createRelayTools(callbacks({ getState: () => waiting, onApprovalRequested, onCommit }));
    const request = tools.find((tool) => tool.name === 'relay_request_human_approval');
    expect(await request?.execute('{"proposalId":"PROP-WAV-300"}')).toMatchObject({ status: 'waiting_for_human' });
    expect(onApprovalRequested).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('exposes a runnable orchestration tool for the agent', async () => {
    let state = INITIAL_STATE;
    const onRunMission = vi.fn(async () => { state = requestInternetApproval(startMission(state)); });
    const tools = createRelayTools(callbacks({ getState: () => state, onRunMission }));
    const execute = tools.find((tool) => tool.name === 'relay_execute_allowed_plan');
    expect(await execute?.execute({})).toMatchObject({ status: 'waiting_for_human_approval' });
    expect(onRunMission).toHaveBeenCalledOnce();
  });

  it('permits the commit only after the human-created approval state exists', async () => {
    const state = grantInternetApproval(requestInternetApproval(startMission(INITIAL_STATE)), new Date('2026-08-27T14:00:00.000Z'));
    const onCommit = vi.fn();
    const tools = createRelayTools(callbacks({ getState: () => state, onCommit }));
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    expect(await commit?.execute({ proposalId: 'PROP-WAV-300' })).toMatchObject({ status: 'completed' });
    expect(onCommit).toHaveBeenCalledOnce();
  });
});
