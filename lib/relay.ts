export type ServiceTone = 'done' | 'review' | 'blocked';

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

export type RelayState = {
  approvalStatus: 'required' | 'approved';
  services: RelayService[];
  receipts: Receipt[];
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
  { id: 'civic', icon: 'C', name: 'Civic', detail: 'Council address', status: 'Complete', tone: 'done', summary: 'Address updated from 42 Willow Road to 18 River Lane.', tools: ['council_get_account', 'council_preview_move', 'council_commit_move'] },
  { id: 'northstar', icon: 'E', name: 'Northstar', detail: 'Energy transfer', status: 'Complete', tone: 'done', summary: 'Energy service scheduled to move on 15 September.', tools: ['energy_check_area', 'energy_preview_move', 'energy_schedule_move'] },
  { id: 'postway', icon: 'P', name: 'Postway', detail: 'Mail forwarding', status: 'Complete', tone: 'done', summary: 'Mail forwarding scheduled for six months.', tools: ['postal_preview_forwarding', 'postal_schedule_forwarding'] },
  { id: 'wavelength', icon: 'W', name: 'Wavelength', detail: 'Internet plan', status: 'Needs approval', tone: 'review', summary: 'A faster plan is available for £6 more per month.', tools: ['internet_preview_transfer', 'internet_commit_transfer'] },
  { id: 'hearth', icon: 'H', name: 'Hearth', detail: 'Employer records', status: 'Blocked by rule', tone: 'blocked', summary: 'Skipped because your delegation forbids employer changes.', tools: [] },
];

export const INITIAL_RECEIPTS: Receipt[] = [
  { receiptId: 'RCT-CIV-0915', service: 'Civic', action: 'Address updated', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: '42 Willow Road', after: '18 River Lane', timestamp: '2026-08-27T13:18:00.000Z', reversibleUntil: '2026-09-14T23:59:00.000Z' },
  { receiptId: 'RCT-ENE-0915', service: 'Northstar', action: 'Energy move scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: '42 Willow Road', after: '18 River Lane · 15 Sep', timestamp: '2026-08-27T13:18:04.000Z', reversibleUntil: '2026-09-12T23:59:00.000Z' },
  { receiptId: 'RCT-PST-0915', service: 'Postway', action: 'Mail forwarding scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: 'No forwarding', after: '6 months · 18 River Lane', timestamp: '2026-08-27T13:18:08.000Z', reversibleUntil: '2026-09-14T23:59:00.000Z' },
];

export const INITIAL_STATE: RelayState = { approvalStatus: 'required', services: INITIAL_SERVICES, receipts: INITIAL_RECEIPTS };

export function approveInternetTransfer(state: RelayState, now = new Date()): RelayState {
  if (state.approvalStatus === 'approved') return state;
  const receipt: Receipt = {
    receiptId: `RCT-WAV-${String(now.getTime()).slice(-6)}`,
    service: 'Wavelength', action: 'Internet transfer approved', status: 'completed',
    approvedBy: 'David · explicit approval', policyId: POLICY.id,
    before: 'Standard 100 · £36/mo', after: 'Fibre 300 · £42/mo',
    timestamp: now.toISOString(), reversibleUntil: null,
  };
  return {
    approvalStatus: 'approved',
    services: state.services.map((service) => service.id === 'wavelength'
      ? { ...service, status: 'Complete', tone: 'done', summary: 'Fibre 300 transfer approved for 15 September.' }
      : service),
    receipts: [...state.receipts, receipt],
  };
}

export function getMissionSnapshot(state: RelayState) {
  const allowedServices = state.services.filter((service) => service.tone !== 'blocked');
  const completed = allowedServices.filter((service) => service.tone === 'done').length;
  return {
    missionId: 'MISSION-MOVE-0915',
    intent: 'Move home on 15 September without changing employer details or marketing preferences.',
    status: state.approvalStatus === 'approved' ? 'complete_within_policy' : 'waiting_for_human_approval',
    completed,
    totalAllowed: allowedServices.length,
    services: state.services.map(({ id, name, status }) => ({ id, name, status })),
  };
}
