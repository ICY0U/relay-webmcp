import { describe, expect, it, vi } from 'vitest';
import {
  approveInternetTransfer,
  beginService,
  buildInternetCommitRequest,
  completeService,
  configureMission,
  DEFAULT_MISSION,
  getMissionSnapshot,
  getInternetCommitAuthorization,
  getServiceStartAuthorization,
  grantInternetApproval,
  INITIAL_STATE,
  requestInternetApproval,
  runSafetyChallenge,
  startMission,
} from '../lib/relay';
import { createRelayTools, type RelayToolCallbacks } from '../lib/relay-tools';

const READY_STATE = configureMission(INITIAL_STATE, DEFAULT_MISSION, new Date('2026-08-27T13:59:00.000Z'));

function callbacks(overrides: Partial<RelayToolCallbacks> = {}): RelayToolCallbacks {
  return {
    getState: () => INITIAL_STATE,
    onApprovalRequired: vi.fn(),
    onApprovalRequested: vi.fn(),
    onBeginService: vi.fn(),
    onCompleteService: vi.fn(),
    onCommit: vi.fn(),
    onRunSafetyChallenge: vi.fn(),
    onRunMission: vi.fn(),
    ...overrides,
  };
}

describe('RELAY delegation state', () => {
  it('turns an editable draft into a runnable move plan with no pre-created receipts', () => {
    expect(getMissionSnapshot(INITIAL_STATE).status).toBe('draft');
    const snapshot = getMissionSnapshot(READY_STATE);
    expect(snapshot.status).toBe('ready');
    expect(snapshot.completed).toBe(0);
    expect(snapshot.totalAllowed).toBe(6);
    expect(READY_STATE.receipts).toHaveLength(0);
  });

  it('executes allowed services and creates one receipt for each mutation', () => {
    let state = startMission(READY_STATE, new Date('2026-08-27T14:00:00.000Z'));
    for (const id of ['civic', 'northstar', 'clearflow', 'postway', 'haven']) {
      state = beginService(state, id);
      state = completeService(state, id);
    }
    state = beginService(state, 'wavelength');
    state = requestInternetApproval(state);
    expect(state.missionStatus).toBe('waiting_for_human_approval');
    expect(state.services.find((service) => service.id === 'wavelength')?.status).toBe('Needs approval');
    expect(state.services.find((service) => service.id === 'hearth')?.status).toBe('Blocked by rule');
    expect(state.receipts).toHaveLength(5);
  });

  it('projects custom mission values into provider accounts and receipts', () => {
    const custom = configureMission(INITIAL_STATE, {
      ...DEFAULT_MISSION,
      currentAddress: '7 Horizon Way',
      newAddress: '88 Beacon Street',
      postcode: 'M1 4AB',
      moveDate: '2026-09-22',
      forwardingMonths: 12,
    });
    let state = completeService(beginService(startMission(custom), 'civic'), 'civic');
    state = completeService(beginService(state, 'northstar'), 'northstar');
    state = completeService(beginService(state, 'clearflow'), 'clearflow');
    state = completeService(beginService(state, 'postway'), 'postway');
    state = completeService(beginService(state, 'haven'), 'haven');
    expect(state.providers.civic.registeredAddress).toBe('88 Beacon Street');
    expect(state.providers.northstar.moveDate).toBe('2026-09-22');
    expect(state.providers.clearflow.serviceAddress).toBe('88 Beacon Street');
    expect(state.providers.postway.forwardingMonths).toBe(12);
    expect(state.providers.haven.insuredAddress).toBe('88 Beacon Street');
    expect(state.receipts[0]).toMatchObject({ before: '7 Horizon Way', after: '88 Beacon Street' });
    expect(state.receipts[3].after).toContain('12 months');
    expect(state.receipts[4].after).toContain('£28/mo unchanged');
  });

  it('requires explicit approval before completing the internet transfer', () => {
    expect(approveInternetTransfer(INITIAL_STATE)).toBe(INITIAL_STATE);
    const waiting = requestInternetApproval(startMission(READY_STATE));
    const granted = grantInternetApproval(waiting, new Date('2026-08-27T14:00:00.000Z'));
    const approved = approveInternetTransfer(granted, buildInternetCommitRequest(granted), new Date('2026-08-27T14:00:01.000Z'));
    expect(approved.approvalStatus).toBe('approved');
    expect(approved.services.find((service) => service.id === 'wavelength')?.status).toBe('Complete');
    expect(approved.receipts.at(-1)).toMatchObject({ service: 'Wavelength', policyId: 'POL-MOVE-0915', approvedBy: 'David · explicit approval' });
  });

  it('creates an exact single-use grant for the reviewed provider action', () => {
    const grantedAt = new Date('2026-08-27T14:00:00.000Z');
    const waiting = requestInternetApproval(startMission(READY_STATE));
    const granted = grantInternetApproval(waiting, grantedAt);
    const request = buildInternetCommitRequest(granted);

    expect(granted.approvalGrant).toMatchObject({
      grantId: 'GRT-WAV-300-0915',
      proposalId: 'PROP-WAV-300',
      providerId: 'wavelength',
      action: 'internet_commit_transfer',
      grantedBy: 'David',
      grantedAt: '2026-08-27T14:00:00.000Z',
      expiresAt: '2026-08-27T14:10:00.000Z',
      consumedAt: null,
      terms: { plan: 'Fibre 300', monthlyCost: 42, contractMonths: 12, moveDate: '2026-09-15', postcode: 'SE1 2AB' },
    });
    expect(getInternetCommitAuthorization(granted, request, new Date('2026-08-27T14:05:00.000Z'))).toEqual({
      status: 'authorized',
      grantId: 'GRT-WAV-300-0915',
    });
  });

  it('rejects a provider commit when approved terms change', () => {
    const now = new Date('2026-08-27T14:00:00.000Z');
    const granted = grantInternetApproval(requestInternetApproval(startMission(READY_STATE)), now);
    const changedRequest = { ...buildInternetCommitRequest(granted), monthlyCost: 44 } as unknown as ReturnType<typeof buildInternetCommitRequest>;

    expect(getInternetCommitAuthorization(granted, changedRequest, new Date('2026-08-27T14:01:00.000Z'))).toEqual({
      status: 'denied',
      reason: 'approved_terms_changed',
      changedFields: ['monthlyCost'],
    });
  });

  it('rejects expired, wrong-provider, and wrong-action approval use', () => {
    const granted = grantInternetApproval(requestInternetApproval(startMission(READY_STATE)), new Date('2026-08-27T14:00:00.000Z'));
    const request = buildInternetCommitRequest(granted);

    expect(getInternetCommitAuthorization(granted, request, new Date('2026-08-27T14:10:00.000Z'))).toMatchObject({ status: 'denied', reason: 'approval_expired' });
    expect(getInternetCommitAuthorization(granted, { ...request, providerId: 'haven' } as unknown as typeof request, new Date('2026-08-27T14:01:00.000Z'))).toMatchObject({ status: 'denied', reason: 'wrong_provider' });
    expect(getInternetCommitAuthorization(granted, { ...request, action: 'insurance_commit_address_change' } as unknown as typeof request, new Date('2026-08-27T14:01:00.000Z'))).toMatchObject({ status: 'denied', reason: 'wrong_action' });
  });

  it('consumes the grant once and rejects a replay', () => {
    const granted = grantInternetApproval(requestInternetApproval(startMission(READY_STATE)), new Date('2026-08-27T14:00:00.000Z'));
    const request = buildInternetCommitRequest(granted);
    const approved = approveInternetTransfer(granted, request, new Date('2026-08-27T14:02:00.000Z'));

    expect(approved.approvalGrant?.consumedAt).toBe('2026-08-27T14:02:00.000Z');
    expect(approved.receipts.at(-1)).toMatchObject({ approvalGrantId: 'GRT-WAV-300-0915' });
    expect(getInternetCommitAuthorization(approved, request, new Date('2026-08-27T14:03:00.000Z'))).toEqual({
      status: 'denied',
      reason: 'approval_already_used',
    });
    expect(approveInternetTransfer(approved, request, new Date('2026-08-27T14:03:00.000Z'))).toBe(approved);
  });

  it('completes a £6 increase automatically only when the configured threshold allows it', () => {
    const configured = configureMission(INITIAL_STATE, { ...DEFAULT_MISSION, approvalThreshold: 10 });
    let state = startMission(configured);
    for (const id of ['civic', 'northstar', 'clearflow', 'postway', 'haven']) state = completeService(beginService(state, id), id);
    state = requestInternetApproval(beginService(state, 'wavelength'));
    expect(state.missionStatus).toBe('complete');
    expect(state.receipts.at(-1)).toMatchObject({ service: 'Wavelength', approvedBy: 'delegation-policy' });
  });

  it('is replay-safe and does not create a second receipt', () => {
    const waiting = requestInternetApproval(startMission(READY_STATE));
    const granted = grantInternetApproval(waiting);
    const request = buildInternetCommitRequest(granted);
    const approved = approveInternetTransfer(granted, request, new Date('2026-08-27T14:00:00.000Z'));
    expect(approveInternetTransfer(approved, request)).toBe(approved);
    expect(approved.receipts).toHaveLength(1);
  });
});

describe('RELAY WebMCP tools', () => {
  it('exposes the expanded move-plan and provider tool surface', () => {
    const names = createRelayTools(callbacks()).map((tool) => tool.name);
    expect(names).toHaveLength(27);
    expect(names).toEqual(expect.arrayContaining(['relay_get_move_plan', 'water_preview_move', 'insurance_preview_address_change', 'relay_get_safety_proof', 'relay_run_safety_challenge']));
  });

  it('lets real provider tool calls drive the visible move plan to the approval boundary', async () => {
    let state = READY_STATE;
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
    expect(await call('water_preview_move', { moveDate: '2026-09-15', postcode: 'SE1 2AB' })).toMatchObject({ status: 'ready' });
    expect(await call('water_schedule_move')).toMatchObject({ receiptId: 'RCT-WTR-0915' });
    expect(await call('postal_preview_forwarding', { months: 6 })).toMatchObject({ status: 'ready' });
    expect(await call('postal_schedule_forwarding')).toMatchObject({ receiptId: 'RCT-PST-0915' });
    expect(await call('insurance_preview_address_change', { newAddress: '18 River Lane', moveDate: '2026-09-15' })).toMatchObject({ status: 'ready', proposedPremium: 28 });
    expect(await call('insurance_commit_address_change')).toMatchObject({ receiptId: 'RCT-HVN-0915' });
    expect(await call('internet_preview_transfer', { moveDate: '2026-09-15', postcode: 'SE1 2AB' })).toMatchObject({ status: 'approval_required', proposalId: 'PROP-WAV-300' });

    expect(state.missionStatus).toBe('waiting_for_human_approval');
    expect(state.receipts).toHaveLength(5);
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
    const waiting = requestInternetApproval(startMission(READY_STATE));
    const tools = createRelayTools(callbacks({ getState: () => waiting, onApprovalRequested, onCommit }));
    const request = tools.find((tool) => tool.name === 'relay_request_human_approval');
    expect(await request?.execute('{"proposalId":"PROP-WAV-300"}')).toMatchObject({ status: 'waiting_for_human' });
    expect(onApprovalRequested).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('exposes a runnable orchestration tool for the agent', async () => {
    let state = READY_STATE;
    const onRunMission = vi.fn(async () => { state = requestInternetApproval(startMission(state)); });
    const tools = createRelayTools(callbacks({ getState: () => state, onRunMission }));
    const execute = tools.find((tool) => tool.name === 'relay_execute_allowed_plan');
    expect(await execute?.execute({})).toMatchObject({ status: 'waiting_for_human_approval' });
    expect(onRunMission).toHaveBeenCalledOnce();
  });

  it('permits the commit only after the human-created approval state exists', async () => {
    const state = grantInternetApproval(requestInternetApproval(startMission(READY_STATE)), new Date('2026-08-27T14:00:00.000Z'));
    const onCommit = vi.fn();
    const tools = createRelayTools(callbacks({ getState: () => state, onCommit, now: () => new Date('2026-08-27T14:01:00.000Z') }));
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    const request = buildInternetCommitRequest(state);
    expect(await commit?.execute(request)).toMatchObject({ status: 'completed', grantId: 'GRT-WAV-300-0915' });
    expect(onCommit).toHaveBeenCalledWith(request);
  });

  it('refuses a WebMCP commit when the provider changes approved terms', async () => {
    const state = grantInternetApproval(requestInternetApproval(startMission(READY_STATE)), new Date('2026-08-27T14:00:00.000Z'));
    const onCommit = vi.fn();
    const tools = createRelayTools(callbacks({ getState: () => state, onCommit, now: () => new Date('2026-08-27T14:01:00.000Z') }));
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    const changed = { ...buildInternetCommitRequest(state), monthlyCost: 44 };

    expect(await commit?.execute(changed)).toMatchObject({ status: 'denied', reason: 'approved_terms_changed', changedFields: ['monthlyCost'] });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('consumes a WebMCP approval grant and refuses the second commit', async () => {
    const commitTime = new Date('2026-08-27T14:02:00.000Z');
    let state = grantInternetApproval(requestInternetApproval(startMission(READY_STATE)), new Date('2026-08-27T14:00:00.000Z'));
    const tools = createRelayTools(callbacks({
      getState: () => state,
      now: () => commitTime,
      onCommit: (request) => { state = approveInternetTransfer(state, request, commitTime); },
    }));
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    const request = buildInternetCommitRequest(state);

    expect(await commit?.execute(request)).toMatchObject({ status: 'completed', grantId: 'GRT-WAV-300-0915' });
    expect(await commit?.execute(request)).toMatchObject({ status: 'denied', reason: 'approval_already_used' });
    expect(state.receipts.filter((receipt) => receipt.receiptId === 'RCT-WAV-0915')).toHaveLength(1);
  });

  it('lets WebMCP run and inspect the same visible safety challenges', async () => {
    let state = READY_STATE;
    const now = new Date('2026-08-27T15:00:00.000Z');
    const tools = createRelayTools(callbacks({
      getState: () => state,
      onRunSafetyChallenge: (challengeId) => { state = runSafetyChallenge(state, challengeId, now); },
    }));
    const run = tools.find((tool) => tool.name === 'relay_run_safety_challenge');
    const inspect = tools.find((tool) => tool.name === 'relay_get_safety_proof');

    expect(await run?.execute({ challengeId: 'changed_terms' })).toMatchObject({ status: 'blocked', refusalId: 'DENY-TERMS-001', providerStateChanged: false });
    expect(await inspect?.execute({})).toMatchObject({ refusals: [expect.objectContaining({ reason: 'approved_terms_changed' })] });
  });
});

describe('RELAY safety proof', () => {
  it('blocks a forbidden employer-data request before provider mutation', () => {
    const before = READY_STATE.providers.hearth;
    const challenged = runSafetyChallenge(READY_STATE, 'forbidden_employer_change', new Date('2026-08-27T15:00:00.000Z'));

    expect(challenged.providers.hearth).toEqual(before);
    expect(challenged.receipts).toHaveLength(0);
    expect(challenged.refusals).toContainEqual(expect.objectContaining({
      refusalId: 'DENY-EMPLOYER-001',
      challengeId: 'forbidden_employer_change',
      decision: 'blocked',
      reason: 'forbidden_by_policy',
      rule: 'Employer details',
      providerStateChanged: false,
    }));
  });

  it.each([
    ['changed_terms', 'DENY-TERMS-001', 'approved_terms_changed'],
    ['expired_approval', 'DENY-EXPIRED-001', 'approval_expired'],
    ['replayed_approval', 'DENY-REPLAY-001', 'approval_already_used'],
  ] as const)('uses the live grant enforcement to block %s', (challengeId, refusalId, reason) => {
    const challenged = runSafetyChallenge(READY_STATE, challengeId, new Date('2026-08-27T15:00:00.000Z'));

    expect(challenged.providers).toEqual(READY_STATE.providers);
    expect(challenged.receipts).toHaveLength(0);
    expect(challenged.refusals).toContainEqual(expect.objectContaining({
      refusalId,
      challengeId,
      decision: 'blocked',
      reason,
      providerStateChanged: false,
    }));
  });

  it('blocks an out-of-order provider action at the domain seam', () => {
    expect(getServiceStartAuthorization(READY_STATE, 'northstar')).toEqual({
      status: 'denied',
      reason: 'service_order_violation',
      requiredServiceId: 'civic',
    });
    expect(beginService(READY_STATE, 'northstar')).toBe(READY_STATE);

    const challenged = runSafetyChallenge(READY_STATE, 'out_of_order_action', new Date('2026-08-27T15:00:00.000Z'));
    expect(challenged.refusals).toContainEqual(expect.objectContaining({
      refusalId: 'DENY-ORDER-001',
      reason: 'service_order_violation',
      providerStateChanged: false,
    }));
  });
});
