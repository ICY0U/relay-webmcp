export type ServiceTone = 'queued' | 'running' | 'done' | 'review' | 'blocked';

export type RelayService = {
  id: string;
  icon: string;
  name: string;
  detail: string;
  status: string;
  tone: ServiceTone;
  summary: string;
  tools: string[];
};

export type Receipt = {
  receiptId: string;
  service: string;
  action: string;
  status: 'completed';
  approvedBy: string;
  policyId: string;
  before: string;
  after: string;
  timestamp: string;
  reversibleUntil: string | null;
};

export type ActivityEntry = {
  id: string;
  timestamp: string;
  label: string;
  kind: 'Policy check' | 'Tool call' | 'Tool result' | 'Human approval';
};

export type RelayState = {
  missionStatus: 'ready' | 'running' | 'waiting_for_human_approval' | 'committing' | 'complete';
  approvalStatus: 'not_requested' | 'required' | 'granted' | 'approved';
  services: RelayService[];
  receipts: Receipt[];
  activity: ActivityEntry[];
};

export const POLICY = {
  id: 'POL-MOVE-0915',
  title: 'Moving home delegation',
  expires: '15 September 2026, 23:59',
  allowed: ['Home address', 'Move date', 'Service availability'],
  approvalRequired: ['Any recurring price increase', 'Any contract longer than 12 months'],
  forbidden: ['Employer details', 'Marketing preferences'],
};

export const INITIAL_SERVICES: RelayService[] = [
  { id: 'civic', icon: 'C', name: 'Civic', detail: 'Council address', status: 'Ready', tone: 'queued', summary: 'Ready to update your council address from 42 Willow Road to 18 River Lane.', tools: ['council_get_account', 'council_preview_move', 'council_commit_move'] },
  { id: 'northstar', icon: 'E', name: 'Northstar', detail: 'Energy transfer', status: 'Ready', tone: 'queued', summary: 'Ready to schedule your energy service move for 15 September.', tools: ['energy_check_area', 'energy_preview_move', 'energy_schedule_move'] },
  { id: 'postway', icon: 'P', name: 'Postway', detail: 'Mail forwarding', status: 'Ready', tone: 'queued', summary: 'Ready to arrange six months of mail forwarding.', tools: ['postal_preview_forwarding', 'postal_schedule_forwarding'] },
  { id: 'wavelength', icon: 'W', name: 'Wavelength', detail: 'Internet plan', status: 'Ready', tone: 'queued', summary: 'Ready to check available broadband plans at your new address.', tools: ['internet_preview_transfer', 'internet_commit_transfer'] },
  { id: 'hearth', icon: 'H', name: 'Hearth', detail: 'Employer records', status: 'Blocked by rule', tone: 'blocked', summary: 'Skipped because your delegation forbids employer changes.', tools: [] },
];

export const INITIAL_STATE: RelayState = {
  missionStatus: 'ready',
  approvalStatus: 'not_requested',
  services: INITIAL_SERVICES,
  receipts: [],
  activity: [],
};

const serviceOutcomes: Record<string, Omit<Receipt, 'timestamp'>> = {
  civic: { receiptId: 'RCT-CIV-0915', service: 'Civic', action: 'Address updated', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: '42 Willow Road', after: '18 River Lane', reversibleUntil: '2026-09-14T23:59:00.000Z' },
  northstar: { receiptId: 'RCT-ENE-0915', service: 'Northstar', action: 'Energy move scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: '42 Willow Road', after: '18 River Lane · 15 Sep', reversibleUntil: '2026-09-12T23:59:00.000Z' },
  postway: { receiptId: 'RCT-PST-0915', service: 'Postway', action: 'Mail forwarding scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: 'No forwarding', after: '6 months · 18 River Lane', reversibleUntil: '2026-09-14T23:59:00.000Z' },
};

const completedSummaries: Record<string, string> = {
  civic: 'Address updated from 42 Willow Road to 18 River Lane.',
  northstar: 'Energy service scheduled to move on 15 September.',
  postway: 'Mail forwarding scheduled for six months.',
};

function activity(id: string, label: string, kind: ActivityEntry['kind'], now: Date): ActivityEntry {
  return { id, label, kind, timestamp: now.toISOString() };
}

export function startMission(state: RelayState, now = new Date()): RelayState {
  if (state.missionStatus !== 'ready') return state;
  return {
    ...state,
    missionStatus: 'running',
    activity: [activity('policy-check', 'Delegation policy validated before execution', 'Policy check', now)],
  };
}

export function beginService(state: RelayState, serviceId: string, now = new Date()): RelayState {
  const service = state.services.find((item) => item.id === serviceId);
  if (!service || service.tone !== 'queued') return state;
  return {
    ...state,
    services: state.services.map((item) => item.id === serviceId ? { ...item, tone: 'running', status: 'Executing' } : item),
    activity: [activity(`${serviceId}-call`, `${service.name} tools invoked with policy-scoped data`, 'Tool call', now), ...state.activity],
  };
}

export function completeService(state: RelayState, serviceId: string, now = new Date()): RelayState {
  const service = state.services.find((item) => item.id === serviceId);
  const outcome = serviceOutcomes[serviceId];
  if (!service || !outcome || service.tone === 'done') return state;
  const receipt = { ...outcome, timestamp: now.toISOString() };
  return {
    ...state,
    services: state.services.map((item) => item.id === serviceId ? { ...item, tone: 'done', status: 'Complete', summary: completedSummaries[serviceId] } : item),
    receipts: [...state.receipts, receipt],
    activity: [activity(`${serviceId}-result`, `${service.name} completed and returned ${receipt.receiptId}`, 'Tool result', now), ...state.activity],
  };
}

export function requestInternetApproval(state: RelayState, now = new Date()): RelayState {
  if (state.approvalStatus === 'approved' || state.approvalStatus === 'granted') return state;
  return {
    ...state,
    missionStatus: 'waiting_for_human_approval',
    approvalStatus: 'required',
    services: state.services.map((service) => service.id === 'wavelength'
      ? { ...service, status: 'Needs approval', tone: 'review', summary: 'Fibre 300 is available for £6 more per month. RELAY paused before committing.' }
      : service),
    activity: [activity('wavelength-review', 'Wavelength proposal paused at recurring-cost guardrail', 'Policy check', now), ...state.activity],
  };
}

export function grantInternetApproval(state: RelayState, now = new Date()): RelayState {
  if (state.approvalStatus !== 'required') return state;
  return {
    ...state,
    missionStatus: 'committing',
    approvalStatus: 'granted',
    services: state.services.map((service) => service.id === 'wavelength' ? { ...service, status: 'Approval granted', tone: 'running' } : service),
    activity: [activity('wavelength-approved', 'David granted one-time approval for PROP-WAV-300', 'Human approval', now), ...state.activity],
  };
}

export function approveInternetTransfer(state: RelayState, now = new Date()): RelayState {
  if (state.approvalStatus === 'approved') return state;
  if (state.approvalStatus !== 'granted' && state.approvalStatus !== 'required') return state;
  const receipt: Receipt = {
    receiptId: 'RCT-WAV-0915',
    service: 'Wavelength', action: 'Internet transfer approved', status: 'completed',
    approvedBy: 'David · explicit approval', policyId: POLICY.id,
    before: 'Standard 100 · £36/mo', after: 'Fibre 300 · £42/mo',
    timestamp: now.toISOString(), reversibleUntil: null,
  };
  return {
    ...state,
    missionStatus: 'complete',
    approvalStatus: 'approved',
    services: state.services.map((service) => service.id === 'wavelength'
      ? { ...service, status: 'Complete', tone: 'done', summary: 'Fibre 300 transfer approved for 15 September.' }
      : service),
    receipts: [...state.receipts, receipt],
    activity: [activity('wavelength-result', `Wavelength completed and returned ${receipt.receiptId}`, 'Tool result', now), ...state.activity],
  };
}

export function getMissionSnapshot(state: RelayState) {
  const allowedServices = state.services.filter((service) => service.tone !== 'blocked');
  const completed = allowedServices.filter((service) => service.tone === 'done').length;
  return {
    missionId: 'MISSION-MOVE-0915',
    intent: 'Move home on 15 September without changing employer details or marketing preferences.',
    status: state.missionStatus,
    completed,
    totalAllowed: allowedServices.length,
    approvalStatus: state.approvalStatus,
    services: state.services.map(({ id, name, status }) => ({ id, name, status })),
  };
}
