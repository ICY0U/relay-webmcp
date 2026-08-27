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
  onApprovalRequired: () => void;
  onApprovalRequested: () => void;
  onBeginService: (serviceId: string) => void;
  onCompleteService: (serviceId: string) => void;
  onCommit: () => void;
  onRunMission: () => Promise<void> | void;
};

function objectInput(input: unknown): Record<string, unknown> {
  if (typeof input === 'string') {
    try { return JSON.parse(input) as Record<string, unknown>; } catch { return {}; }
  }
  return input && typeof input === 'object' ? input as Record<string, unknown> : {};
}

const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const readOnly = { readOnlyHint: true };

function serviceTone(callbacks: RelayToolCallbacks, serviceId: string) {
  return callbacks.getState().services.find((service) => service.id === serviceId)?.tone;
}

function requirePreview(callbacks: RelayToolCallbacks, serviceId: string) {
  return serviceTone(callbacks, serviceId) === 'running';
}

export function createRelayTools(callbacks: RelayToolCallbacks): ToolDefinition[] {
  return [
    {
      name: 'relay_get_mission', title: 'Get RELAY mission',
      description: 'Get the moving-home mission, service states, and whether human approval is required.',
      inputSchema: emptySchema, annotations: readOnly,
      execute: () => getMissionSnapshot(callbacks.getState()),
    },
    {
      name: 'relay_get_permissions', title: 'Get delegation permissions',
      description: 'Read the exact fields and changes this mission allows, blocks, or requires human approval for.',
      inputSchema: emptySchema, annotations: readOnly,
      execute: () => ({ policyId: POLICY.id, expires: POLICY.expires, allowed: POLICY.allowed, approvalRequired: POLICY.approvalRequired, forbidden: POLICY.forbidden }),
    },
    {
      name: 'relay_get_service_plan', title: 'Get service execution plan',
      description: 'List each fictional provider, its current state, and available WebMCP tools.',
      inputSchema: emptySchema, annotations: readOnly,
      execute: () => ({ services: callbacks.getState().services.map(({ id, name, status, tools }) => ({ id, name, status, tools })) }),
    },

    {
      name: 'council_get_account', title: 'Get Civic council account',
      description: 'Get the fictional signed-in council account and current address without changing it.',
      inputSchema: emptySchema, annotations: readOnly,
      execute: () => ({ accountId: 'CT-1842-77', holder: 'David Adams', address: '42 Willow Road', marketingPreferences: 'unchanged' }),
    },
    {
      name: 'council_preview_move', title: 'Preview Civic address change',
      description: 'Preview the exact fictional council address change. Starts the Civic step visibly but does not commit it.',
      inputSchema: { type: 'object', properties: { newAddress: { type: 'string', description: 'Destination address.' }, moveDate: { type: 'string', description: 'Move date in YYYY-MM-DD format.' } }, required: ['newAddress', 'moveDate'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (input.newAddress !== '18 River Lane' || input.moveDate !== '2026-09-15') return { status: 'invalid_input', expected: { newAddress: '18 River Lane', moveDate: '2026-09-15' } };
        callbacks.onBeginService('civic');
        return { status: 'ready', provider: 'Civic', before: '42 Willow Road', after: '18 River Lane', fee: 0, policyDecision: 'allowed' };
      },
    },
    {
      name: 'council_commit_move', title: 'Commit Civic address change',
      description: 'Commit the previously previewed fictional council address change and create an action receipt.',
      inputSchema: emptySchema,
      execute: () => {
        if (serviceTone(callbacks, 'civic') === 'done') return { status: 'completed', replayed: true, receiptId: 'RCT-CIV-0915' };
        if (!requirePreview(callbacks, 'civic')) return { status: 'denied', reason: 'preview_required' };
        callbacks.onCompleteService('civic');
        return { status: 'completed', receiptId: 'RCT-CIV-0915', address: '18 River Lane' };
      },
    },

    {
      name: 'energy_check_area', title: 'Check Northstar service area',
      description: 'Check fictional energy coverage at the destination address.',
      inputSchema: { type: 'object', properties: { postcode: { type: 'string' } }, required: ['postcode'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        return input.postcode === 'SE1 2AB' ? { available: true, fuel: ['electricity', 'gas'], address: '18 River Lane' } : { available: false };
      },
    },
    {
      name: 'energy_preview_move', title: 'Preview Northstar energy move',
      description: 'Preview the fictional energy transfer and start the Northstar step visibly without committing it.',
      inputSchema: { type: 'object', properties: { moveDate: { type: 'string' } }, required: ['moveDate'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        if (serviceTone(callbacks, 'civic') !== 'done') return { status: 'denied', reason: 'civic_step_required' };
        const input = objectInput(rawInput);
        if (input.moveDate !== '2026-09-15') return { status: 'invalid_input', field: 'moveDate' };
        callbacks.onBeginService('northstar');
        return { status: 'ready', tariff: 'Northstar Flex', estimatedChange: 0, policyDecision: 'allowed' };
      },
    },
    {
      name: 'energy_schedule_move', title: 'Schedule Northstar energy move',
      description: 'Schedule the previewed fictional energy move and create an action receipt.',
      inputSchema: emptySchema,
      execute: () => {
        if (serviceTone(callbacks, 'northstar') === 'done') return { status: 'completed', replayed: true, receiptId: 'RCT-ENE-0915' };
        if (!requirePreview(callbacks, 'northstar')) return { status: 'denied', reason: 'preview_required' };
        callbacks.onCompleteService('northstar');
        return { status: 'completed', receiptId: 'RCT-ENE-0915', date: '2026-09-15' };
      },
    },

    {
      name: 'postal_preview_forwarding', title: 'Preview Postway forwarding',
      description: 'Preview fictional mail forwarding and start the Postway step visibly without committing it.',
      inputSchema: { type: 'object', properties: { months: { type: 'number', enum: [3, 6, 12] } }, required: ['months'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        if (serviceTone(callbacks, 'northstar') !== 'done') return { status: 'denied', reason: 'energy_step_required' };
        const input = objectInput(rawInput);
        if (input.months !== 6) return { status: 'invalid_input', expectedMonths: 6 };
        callbacks.onBeginService('postway');
        return { status: 'ready', months: 6, fee: 42, destination: '18 River Lane', policyDecision: 'allowed' };
      },
    },
    {
      name: 'postal_schedule_forwarding', title: 'Schedule Postway forwarding',
      description: 'Schedule the previewed fictional mail forwarding and create an action receipt.',
      inputSchema: emptySchema,
      execute: () => {
        if (serviceTone(callbacks, 'postway') === 'done') return { status: 'completed', replayed: true, receiptId: 'RCT-PST-0915' };
        if (!requirePreview(callbacks, 'postway')) return { status: 'denied', reason: 'preview_required' };
        callbacks.onCompleteService('postway');
        return { status: 'completed', receiptId: 'RCT-PST-0915', months: 6 };
      },
    },

    {
      name: 'internet_get_account', title: 'Get Wavelength account',
      description: 'Get the fictional Wavelength account and current broadband plan.',
      inputSchema: emptySchema, annotations: readOnly,
      execute: () => ({ accountId: 'WV-7719-04', plan: 'Standard 100', monthlyCost: 36 }),
    },
    {
      name: 'internet_check_availability', title: 'Check Wavelength availability',
      description: 'Check fictional broadband plans available at the destination.',
      inputSchema: { type: 'object', properties: { postcode: { type: 'string' } }, required: ['postcode'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        return input.postcode === 'SE1 2AB'
          ? { available: [{ proposalId: 'PROP-WAV-300', plan: 'Fibre 300', monthlyCost: 42, contractMonths: 12 }] }
          : { available: [] };
      },
    },
    {
      name: 'internet_preview_transfer', title: 'Preview internet transfer',
      description: 'Preview the Wavelength move without changing the plan. Returns and visibly enforces any human approval requirement.',
      inputSchema: { type: 'object', properties: { moveDate: { type: 'string', description: 'Move date in YYYY-MM-DD format.' }, postcode: { type: 'string', description: 'Destination postcode.' } }, required: ['moveDate', 'postcode'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        if (serviceTone(callbacks, 'postway') !== 'done') return { status: 'denied', reason: 'allowed_service_steps_incomplete' };
        const input = objectInput(rawInput);
        if (input.moveDate !== '2026-09-15' || input.postcode !== 'SE1 2AB') return { status: 'invalid_input', expected: { moveDate: '2026-09-15', postcode: 'SE1 2AB' } };
        callbacks.onBeginService('wavelength');
        callbacks.onApprovalRequired();
        return { status: 'approval_required', proposalId: 'PROP-WAV-300', current: { plan: 'Standard 100', monthlyCost: 36 }, proposed: { plan: 'Fibre 300', monthlyCost: 42 }, reason: 'Recurring cost increases by £6.', policyDecision: 'human_required' };
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
      description: 'Commit the exact Wavelength proposal. Rejects attempts without matching explicit human approval.',
      inputSchema: { type: 'object', properties: { proposalId: { type: 'string', enum: ['PROP-WAV-300'], description: 'Approved proposal identifier.' } }, required: ['proposalId'], additionalProperties: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (input.proposalId !== 'PROP-WAV-300') return { status: 'not_found', proposalId: input.proposalId };
        if (!['granted', 'approved'].includes(callbacks.getState().approvalStatus)) return { status: 'denied', reason: 'human_approval_required', proposalId: 'PROP-WAV-300' };
        callbacks.onCommit();
        return { status: 'completed', proposalId: 'PROP-WAV-300', receiptId: 'RCT-WAV-0915' };
      },
    },

    {
      name: 'relay_execute_allowed_plan', title: 'Execute allowed moving-home plan',
      description: 'Guided fallback: run the allowed fictional service plan visibly and pause before human approval. Prefer the individual provider tools when demonstrating agent-driven execution.',
      inputSchema: emptySchema,
      annotations: { idempotentHint: true },
      execute: async () => {
        if (callbacks.getState().missionStatus !== 'ready') return { status: 'not_ready', mission: getMissionSnapshot(callbacks.getState()) };
        await callbacks.onRunMission();
        return { status: 'waiting_for_human_approval', mission: getMissionSnapshot(callbacks.getState()), receiptsCreated: callbacks.getState().receipts.length };
      },
    },
    {
      name: 'relay_list_receipts', title: 'List action receipts',
      description: 'List compact audit receipts for every service mutation completed by RELAY.',
      inputSchema: emptySchema, annotations: readOnly,
      execute: () => ({ receipts: callbacks.getState().receipts.map(({ receiptId, service, action, status, timestamp }) => ({ receiptId, service, action, status, timestamp })) }),
    },
    {
      name: 'relay_get_receipt', title: 'Get action receipt',
      description: 'Get one detailed audit receipt by receipt identifier.',
      inputSchema: { type: 'object', properties: { receiptId: { type: 'string', description: 'Receipt identifier from relay_list_receipts.' } }, required: ['receiptId'], additionalProperties: false },
      annotations: readOnly,
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        return callbacks.getState().receipts.find((receipt) => receipt.receiptId === input.receiptId) ?? { status: 'not_found', receiptId: input.receiptId };
      },
    },
  ];
}
