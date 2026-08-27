import { getMissionSnapshot, POLICY, type RelayState } from './relay';

export type ToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, boolean>;
  execute: (input: unknown, context?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
};

export type RelayToolCallbacks = {
  getState: () => RelayState;
  onApprovalRequested: () => void;
  onCommit: () => void;
  onRunMission: () => Promise<void> | void;
};

function objectInput(input: unknown): Record<string, unknown> {
  if (typeof input === 'string') {
    try { return JSON.parse(input) as Record<string, unknown>; } catch { return {}; }
  }
  return input && typeof input === 'object' ? input as Record<string, unknown> : {};
}

export function createRelayTools(callbacks: RelayToolCallbacks): ToolDefinition[] {
  const readOnly = { readOnlyHint: true };
  return [
    { name: 'relay_get_mission', title: 'Get RELAY mission', description: 'Get the moving-home mission, service states, and whether human approval is required.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: readOnly, execute: () => getMissionSnapshot(callbacks.getState()) },
    { name: 'relay_get_permissions', title: 'Get delegation permissions', description: 'Read the exact fields and changes this mission allows, blocks, or requires human approval for.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: readOnly, execute: () => ({ policyId: POLICY.id, expires: POLICY.expires, allowed: POLICY.allowed, approvalRequired: POLICY.approvalRequired, forbidden: POLICY.forbidden }) },
    { name: 'relay_get_service_plan', title: 'Get service execution plan', description: 'List each fictional provider, its current state, and available WebMCP tools.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: readOnly, execute: () => ({ services: callbacks.getState().services.map(({ id, name, status, tools }) => ({ id, name, status, tools })) }) },
    {
      name: 'relay_execute_allowed_plan', title: 'Execute allowed moving-home plan',
      description: 'Run the moving-home mission across fictional services within the active delegation policy. Completes allowed low-risk actions, creates receipts, and pauses before any action requiring human approval.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { idempotentHint: true },
      execute: async () => {
        if (callbacks.getState().missionStatus !== 'ready') return { status: 'not_ready', mission: getMissionSnapshot(callbacks.getState()) };
        await callbacks.onRunMission();
        return { status: 'waiting_for_human_approval', mission: getMissionSnapshot(callbacks.getState()), receiptsCreated: callbacks.getState().receipts.length };
      },
    },
    {
      name: 'internet_preview_transfer', title: 'Preview internet transfer',
      description: 'Preview the Wavelength internet move without changing the plan. Returns any human approval requirement.',
      inputSchema: { type: 'object', properties: { moveDate: { type: 'string', description: 'Move date in YYYY-MM-DD format.' }, postcode: { type: 'string', description: 'Destination postcode.' } }, required: ['moveDate', 'postcode'], additionalProperties: false }, annotations: readOnly,
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (input.moveDate !== '2026-09-15') return { status: 'invalid_input', field: 'moveDate', expected: '2026-09-15' };
        return { status: 'approval_required', proposalId: 'PROP-WAV-300', current: { plan: 'Standard 100', monthlyCost: 36 }, proposed: { plan: 'Fibre 300', monthlyCost: 42 }, reason: 'Recurring cost increases by £6.' };
      },
    },
    {
      name: 'relay_request_human_approval', title: 'Request human approval',
      description: 'Open RELAY’s visible approval gate for a reviewed proposal. This never grants approval for the human.',
      inputSchema: { type: 'object', properties: { proposalId: { type: 'string', enum: ['PROP-WAV-300'], description: 'The preview proposal to show.' } }, required: ['proposalId'], additionalProperties: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (input.proposalId !== 'PROP-WAV-300') return { status: 'not_found', proposalId: input.proposalId };
        if (callbacks.getState().missionStatus !== 'waiting_for_human_approval') return { status: 'denied', reason: 'mission_not_at_approval_gate', proposalId: 'PROP-WAV-300' };
        callbacks.onApprovalRequested();
        return { status: 'waiting_for_human', proposalId: 'PROP-WAV-300', message: 'The visible approval gate is open. The human must decide.' };
      },
    },
    {
      name: 'internet_commit_transfer', title: 'Commit internet transfer',
      description: 'Commit the Wavelength transfer. Rejects attempts without matching explicit human approval.',
      inputSchema: { type: 'object', properties: { proposalId: { type: 'string', enum: ['PROP-WAV-300'], description: 'Approved proposal identifier.' } }, required: ['proposalId'], additionalProperties: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (input.proposalId !== 'PROP-WAV-300') return { status: 'not_found', proposalId: input.proposalId };
        if (!['granted', 'approved'].includes(callbacks.getState().approvalStatus)) return { status: 'denied', reason: 'human_approval_required', proposalId: 'PROP-WAV-300' };
        callbacks.onCommit();
        return { status: 'completed', proposalId: 'PROP-WAV-300', receiptId: 'RCT-WAV-0915' };
      },
    },
    { name: 'relay_list_receipts', title: 'List action receipts', description: 'List compact audit receipts for every service mutation completed by RELAY.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: readOnly, execute: () => ({ receipts: callbacks.getState().receipts.map(({ receiptId, service, action, status, timestamp }) => ({ receiptId, service, action, status, timestamp })) }) },
    {
      name: 'relay_get_receipt', title: 'Get action receipt', description: 'Get one detailed audit receipt by receipt identifier.',
      inputSchema: { type: 'object', properties: { receiptId: { type: 'string', description: 'Receipt identifier from relay_list_receipts.' } }, required: ['receiptId'], additionalProperties: false }, annotations: readOnly,
      execute: (rawInput) => { const input = objectInput(rawInput); return callbacks.getState().receipts.find((receipt) => receipt.receiptId === input.receiptId) ?? { status: 'not_found', receiptId: input.receiptId }; },
    },
  ];
}
