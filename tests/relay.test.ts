import { describe, expect, it, vi } from 'vitest';
import { approveInternetTransfer, getMissionSnapshot, INITIAL_STATE } from '../lib/relay';
import { createRelayTools } from '../lib/relay-tools';

describe('RELAY delegation state', () => {
  it('starts paused at the human approval boundary', () => {
    const snapshot = getMissionSnapshot(INITIAL_STATE);
    expect(snapshot.status).toBe('waiting_for_human_approval');
    expect(snapshot.completed).toBe(3);
    expect(snapshot.totalAllowed).toBe(4);
  });

  it('approves only the matching internet proposal and creates an audit receipt', () => {
    const approved = approveInternetTransfer(INITIAL_STATE, new Date('2026-08-27T14:00:00.000Z'));
    expect(approved.approvalStatus).toBe('approved');
    expect(approved.services.find((service) => service.id === 'wavelength')?.status).toBe('Complete');
    expect(approved.services.find((service) => service.id === 'hearth')?.status).toBe('Blocked by rule');
    expect(approved.receipts).toHaveLength(4);
    expect(approved.receipts.at(-1)).toMatchObject({ service: 'Wavelength', policyId: 'POL-MOVE-0915', approvedBy: 'David · explicit approval' });
  });

  it('is replay-safe and does not create a second receipt', () => {
    const approved = approveInternetTransfer(INITIAL_STATE, new Date('2026-08-27T14:00:00.000Z'));
    expect(approveInternetTransfer(approved)).toBe(approved);
    expect(approved.receipts).toHaveLength(4);
  });
});

describe('RELAY WebMCP tools', () => {
  it('previews a price-changing transfer without mutation', async () => {
    const state = INITIAL_STATE;
    const tools = createRelayTools({ getState: () => state, onApprovalRequested: vi.fn(), onCommit: vi.fn() });
    const preview = tools.find((tool) => tool.name === 'internet_preview_transfer');
    expect(await preview?.execute({ moveDate: '2026-09-15', postcode: 'SE1 2AB' })).toMatchObject({ status: 'approval_required', proposalId: 'PROP-WAV-300' });
    expect(state).toBe(INITIAL_STATE);
  });

  it('rejects a commit before explicit human approval', async () => {
    const onCommit = vi.fn();
    const tools = createRelayTools({ getState: () => INITIAL_STATE, onApprovalRequested: vi.fn(), onCommit });
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    expect(await commit?.execute({ proposalId: 'PROP-WAV-300' })).toMatchObject({ status: 'denied', reason: 'human_approval_required' });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('opens a visible human gate but never self-approves', async () => {
    const onApprovalRequested = vi.fn();
    const onCommit = vi.fn();
    const tools = createRelayTools({ getState: () => INITIAL_STATE, onApprovalRequested, onCommit });
    const request = tools.find((tool) => tool.name === 'relay_request_human_approval');
    expect(await request?.execute('{"proposalId":"PROP-WAV-300"}')).toMatchObject({ status: 'waiting_for_human' });
    expect(onApprovalRequested).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('permits the commit only after the human-created approval state exists', async () => {
    const state = approveInternetTransfer(INITIAL_STATE, new Date('2026-08-27T14:00:00.000Z'));
    const onCommit = vi.fn();
    const tools = createRelayTools({ getState: () => state, onApprovalRequested: vi.fn(), onCommit });
    const commit = tools.find((tool) => tool.name === 'internet_commit_transfer');
    expect(await commit?.execute({ proposalId: 'PROP-WAV-300' })).toMatchObject({ status: 'completed', receiptId: expect.stringMatching(/^RCT-WAV-/) });
    expect(onCommit).toHaveBeenCalledOnce();
  });
});
