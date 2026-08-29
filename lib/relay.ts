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

export type MissionConfig = {
  currentAddress: string;
  newAddress: string;
  postcode: string;
  moveDate: string;
  forwardingMonths: 3 | 6 | 12;
  approvalThreshold: number;
};

export type ProviderAccounts = {
  civic: { accountId: string; registeredAddress: string; lastUpdated: string | null };
  northstar: { accountId: string; serviceAddress: string; moveDate: string | null; tariff: string };
  clearflow: { accountId: string; serviceAddress: string; moveDate: string | null; plan: string };
  postway: { accountId: string; forwardingAddress: string | null; forwardingMonths: number };
  haven: { accountId: string; insuredAddress: string; cover: string; monthlyPremium: number; moveDate: string | null };
  wavelength: { accountId: string; serviceAddress: string; plan: string; monthlyCost: number; moveDate: string | null };
  hearth: { accountId: string; employerAddress: string; marketingPreferences: string };
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
  approvalGrantId?: ApprovalGrant['grantId'];
  approvalScope?: string;
};

export type ActivityEntry = {
  id: string;
  timestamp: string;
  label: string;
  kind: 'Policy check' | 'Tool call' | 'Tool result' | 'Human approval' | 'Approval grant' | 'Safety refusal';
  tool?: {
    name: string;
    direction: 'request' | 'response';
    payload: Record<string, string | number | boolean | null>;
  };
};

export type SafetyChallengeId = 'forbidden_employer_change' | 'changed_terms' | 'expired_approval' | 'replayed_approval' | 'out_of_order_action';

export type RefusalRecord = {
  refusalId: string;
  challengeId: SafetyChallengeId;
  title: string;
  attemptedAction: string;
  target: string;
  decision: 'blocked';
  reason: string;
  rule: string;
  policyId: string;
  timestamp: string;
  providerStateChanged: false;
};

export type InternetCommitRequest = {
  proposalId: 'PROP-WAV-300';
  providerId: 'wavelength';
  action: 'internet_commit_transfer';
  plan: 'Fibre 300';
  monthlyCost: 42;
  contractMonths: 12;
  moveDate: string;
  postcode: string;
};

export type ApprovalGrant = {
  grantId: 'GRT-WAV-300-0915';
  proposalId: InternetCommitRequest['proposalId'];
  providerId: InternetCommitRequest['providerId'];
  action: InternetCommitRequest['action'];
  terms: Pick<InternetCommitRequest, 'plan' | 'monthlyCost' | 'contractMonths' | 'moveDate' | 'postcode'>;
  grantedBy: 'David';
  grantedAt: string;
  expiresAt: string;
  consumedAt: string | null;
};

export type InternetCommitAuthorization =
  | { status: 'authorized'; grantId: ApprovalGrant['grantId'] }
  | { status: 'denied'; reason: 'human_approval_required' | 'approval_expired' | 'approval_already_used' | 'wrong_provider' | 'wrong_action' | 'approved_terms_changed'; changedFields?: string[] };

export type RelayState = {
  missionStatus: 'draft' | 'ready' | 'running' | 'waiting_for_human_approval' | 'committing' | 'complete';
  approvalStatus: 'not_requested' | 'required' | 'granted' | 'approved';
  approvalGrant: ApprovalGrant | null;
  mission: MissionConfig;
  providers: ProviderAccounts;
  services: RelayService[];
  receipts: Receipt[];
  refusals: RefusalRecord[];
  activity: ActivityEntry[];
};

export type ShowcaseStepId = 'boundaries' | 'coordinate' | 'approve' | 'proof';

export type ShowcaseGuide = {
  currentStepId: ShowcaseStepId;
  completedSteps: number;
  steps: Array<{
    id: ShowcaseStepId;
    label: string;
    description: string;
    timing: string;
    status: 'complete' | 'current' | 'upcoming';
  }>;
};

export const POLICY = {
  id: 'POL-MOVE-0915',
  title: 'Moving home delegation',
  expires: '15 September 2026, 23:59',
  allowed: ['Home address', 'Move date', 'Service availability'],
  approvalRequired: ['Recurring cost above your threshold', 'Any contract longer than 12 months'],
  forbidden: ['Employer details', 'Marketing preferences'],
};

export const DEFAULT_MISSION: MissionConfig = {
  currentAddress: '42 Willow Road',
  newAddress: '18 River Lane',
  postcode: 'SE1 2AB',
  moveDate: '2026-09-15',
  forwardingMonths: 6,
  approvalThreshold: 0,
};

export function getShowcaseGuide(state: RelayState): ShowcaseGuide {
  const currentStepId: ShowcaseStepId = state.missionStatus === 'draft'
    ? 'boundaries'
    : ['ready', 'running'].includes(state.missionStatus)
      ? 'coordinate'
      : state.missionStatus === 'waiting_for_human_approval'
        ? 'approve'
        : 'proof';
  const definitions: Array<Omit<ShowcaseGuide['steps'][number], 'status'>> = [
    { id: 'boundaries', label: 'Set the boundaries', description: 'One move, six allowed services, protected employer and marketing data.', timing: '0:00–0:35' },
    { id: 'coordinate', label: 'Watch structured actions', description: 'Preview and commit tools update real fictional provider accounts in order.', timing: '0:35–1:35' },
    { id: 'approve', label: 'Make the human decision', description: 'RELAY pauses before the £6 monthly increase and creates an exact one-use grant.', timing: '1:35–2:10' },
    { id: 'proof', label: 'Inspect the proof', description: 'Receipts prove allowed changes; safety challenges prove unsafe requests were refused.', timing: '2:10–3:00' },
  ];
  const currentIndex = definitions.findIndex((step) => step.id === currentStepId);
  const proofComplete = state.missionStatus === 'complete' && state.receipts.length === 6 && state.refusals.length > 0;
  const steps = definitions.map((step, index) => ({
    ...step,
    status: (index < currentIndex || (step.id === 'proof' && proofComplete) ? 'complete' : index === currentIndex ? 'current' : 'upcoming') as ShowcaseGuide['steps'][number]['status'],
  }));
  return { currentStepId, completedSteps: steps.filter((step) => step.status === 'complete').length, steps };
}

export const INITIAL_PROVIDERS: ProviderAccounts = {
  civic: { accountId: 'CT-1842-77', registeredAddress: DEFAULT_MISSION.currentAddress, lastUpdated: null },
  northstar: { accountId: 'NS-9401-38', serviceAddress: DEFAULT_MISSION.currentAddress, moveDate: null, tariff: 'Northstar Flex' },
  clearflow: { accountId: 'CF-2208-64', serviceAddress: DEFAULT_MISSION.currentAddress, moveDate: null, plan: 'Metered Home' },
  postway: { accountId: 'PW-3150-82', forwardingAddress: null, forwardingMonths: 0 },
  haven: { accountId: 'HV-8042-19', insuredAddress: DEFAULT_MISSION.currentAddress, cover: 'Home Essentials', monthlyPremium: 28, moveDate: null },
  wavelength: { accountId: 'WV-7719-04', serviceAddress: DEFAULT_MISSION.currentAddress, plan: 'Standard 100', monthlyCost: 36, moveDate: null },
  hearth: { accountId: 'HR-0018-55', employerAddress: DEFAULT_MISSION.currentAddress, marketingPreferences: 'Essential only' },
};

function createServices(mission: MissionConfig): RelayService[] {
  return [
    { id: 'civic', icon: 'C', name: 'Civic', detail: 'Council address', status: 'Ready', tone: 'queued', summary: `Ready to update your council address from ${mission.currentAddress} to ${mission.newAddress}.`, tools: ['council_get_account', 'council_preview_move', 'council_commit_move'] },
    { id: 'northstar', icon: 'E', name: 'Northstar', detail: 'Energy transfer', status: 'Ready', tone: 'queued', summary: `Ready to schedule your energy service move for ${formatMoveDate(mission.moveDate)}.`, tools: ['energy_check_area', 'energy_preview_move', 'energy_schedule_move'] },
    { id: 'clearflow', icon: 'W', name: 'Clearflow', detail: 'Water account', status: 'Ready', tone: 'queued', summary: `Ready to close the water account at ${mission.currentAddress} and open service at ${mission.newAddress}.`, tools: ['water_get_account', 'water_preview_move', 'water_schedule_move'] },
    { id: 'postway', icon: 'P', name: 'Postway', detail: 'Mail forwarding', status: 'Ready', tone: 'queued', summary: `Ready to arrange ${mission.forwardingMonths} months of mail forwarding.`, tools: ['postal_preview_forwarding', 'postal_schedule_forwarding'] },
    { id: 'haven', icon: 'H', name: 'Haven', detail: 'Home insurance', status: 'Ready', tone: 'queued', summary: `Ready to update the insured address without changing your £28 monthly premium.`, tools: ['insurance_get_policy', 'insurance_preview_address_change', 'insurance_commit_address_change'] },
    { id: 'wavelength', icon: 'W', name: 'Wavelength', detail: 'Internet plan', status: 'Ready', tone: 'queued', summary: 'Ready to check available broadband plans at your new address.', tools: ['internet_preview_transfer', 'internet_commit_transfer'] },
    { id: 'hearth', icon: 'H', name: 'Hearth', detail: 'Employer records', status: 'Blocked by rule', tone: 'blocked', summary: 'Skipped because your delegation forbids employer changes.', tools: [] },
  ];
}

export const INITIAL_SERVICES = createServices(DEFAULT_MISSION);

export const INITIAL_STATE: RelayState = {
  missionStatus: 'draft',
  approvalStatus: 'not_requested',
  approvalGrant: null,
  mission: DEFAULT_MISSION,
  providers: INITIAL_PROVIDERS,
  services: INITIAL_SERVICES,
  receipts: [],
  refusals: [],
  activity: [],
};

function formatMoveDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function activity(id: string, label: string, kind: ActivityEntry['kind'], now: Date, tool?: ActivityEntry['tool']): ActivityEntry {
  return { id, label, kind, timestamp: now.toISOString(), ...(tool ? { tool } : {}) };
}

function previewTrace(state: RelayState, serviceId: string): ActivityEntry['tool'] | undefined {
  const { mission } = state;
  const traces: Record<string, NonNullable<ActivityEntry['tool']>> = {
    civic: { name: 'council_preview_move', direction: 'request', payload: { newAddress: mission.newAddress, moveDate: mission.moveDate } },
    northstar: { name: 'energy_preview_move', direction: 'request', payload: { moveDate: mission.moveDate } },
    clearflow: { name: 'water_preview_move', direction: 'request', payload: { moveDate: mission.moveDate, postcode: mission.postcode } },
    postway: { name: 'postal_preview_forwarding', direction: 'request', payload: { months: mission.forwardingMonths } },
    haven: { name: 'insurance_preview_address_change', direction: 'request', payload: { newAddress: mission.newAddress, moveDate: mission.moveDate } },
    wavelength: { name: 'internet_preview_transfer', direction: 'request', payload: { moveDate: mission.moveDate, postcode: mission.postcode } },
  };
  return traces[serviceId];
}

function resultTrace(state: RelayState, serviceId: string, receipt: Receipt): ActivityEntry['tool'] | undefined {
  const { mission } = state;
  const traces: Record<string, NonNullable<ActivityEntry['tool']>> = {
    civic: { name: 'council_commit_move', direction: 'response', payload: { status: 'completed', receiptId: receipt.receiptId, address: mission.newAddress } },
    northstar: { name: 'energy_schedule_move', direction: 'response', payload: { status: 'completed', receiptId: receipt.receiptId, moveDate: mission.moveDate } },
    clearflow: { name: 'water_schedule_move', direction: 'response', payload: { status: 'completed', receiptId: receipt.receiptId, address: mission.newAddress } },
    postway: { name: 'postal_schedule_forwarding', direction: 'response', payload: { status: 'completed', receiptId: receipt.receiptId, months: mission.forwardingMonths } },
    haven: { name: 'insurance_commit_address_change', direction: 'response', payload: { status: 'completed', receiptId: receipt.receiptId, monthlyPremium: 28 } },
  };
  return traces[serviceId];
}

export function configureMission(state: RelayState, mission: MissionConfig, now = new Date()): RelayState {
  if (!mission.currentAddress.trim() || !mission.newAddress.trim() || !mission.postcode.trim() || !mission.moveDate) return state;
  const providers: ProviderAccounts = {
    civic: { ...INITIAL_PROVIDERS.civic, registeredAddress: mission.currentAddress },
    northstar: { ...INITIAL_PROVIDERS.northstar, serviceAddress: mission.currentAddress },
    clearflow: { ...INITIAL_PROVIDERS.clearflow, serviceAddress: mission.currentAddress },
    postway: { ...INITIAL_PROVIDERS.postway },
    haven: { ...INITIAL_PROVIDERS.haven, insuredAddress: mission.currentAddress },
    wavelength: { ...INITIAL_PROVIDERS.wavelength, serviceAddress: mission.currentAddress },
    hearth: { ...INITIAL_PROVIDERS.hearth, employerAddress: mission.currentAddress },
  };
  return {
    missionStatus: 'ready',
    approvalStatus: 'not_requested',
    approvalGrant: null,
    mission,
    providers,
    services: createServices(mission),
    receipts: [],
    refusals: [],
    activity: [activity('plan-configured', `Move plan configured for ${mission.newAddress}`, 'Policy check', now)],
  };
}

export function runSafetyChallenge(state: RelayState, challengeId: SafetyChallengeId, now = new Date()): RelayState {
  let refusal: RefusalRecord;
  if (challengeId === 'forbidden_employer_change') {
    refusal = {
      refusalId: 'DENY-EMPLOYER-001', challengeId,
      title: 'Forbidden data request stopped',
      attemptedAction: 'Update employer address and marketing preferences',
      target: 'Hearth employer records', decision: 'blocked', reason: 'forbidden_by_policy', rule: 'Employer details',
      policyId: POLICY.id, timestamp: now.toISOString(), providerStateChanged: false,
    };
  } else if (challengeId === 'out_of_order_action') {
    const authorization = getServiceStartAuthorization(state, 'northstar');
    refusal = {
      refusalId: 'DENY-ORDER-001', challengeId,
      title: 'Out-of-order action stopped',
      attemptedAction: 'Start Northstar before Civic completed',
      target: 'Northstar energy account', decision: 'blocked',
      reason: authorization.status === 'denied' ? authorization.reason : 'service_order_violation',
      rule: 'Civic must complete before Northstar starts',
      policyId: POLICY.id, timestamp: now.toISOString(), providerStateChanged: false,
    };
  } else {
    const grantedAt = new Date(now.getTime() - (challengeId === 'expired_approval' ? 11 : 2) * 60 * 1000);
    const sandboxBase: RelayState = {
      ...state,
      missionStatus: 'running',
      approvalStatus: 'not_requested',
      approvalGrant: null,
      mission: { ...state.mission, approvalThreshold: 0 },
    };
    const granted = grantInternetApproval(requestInternetApproval(sandboxBase, grantedAt), grantedAt);
    const exactRequest = buildInternetCommitRequest(granted);
    const evaluatedState = challengeId === 'replayed_approval'
      ? approveInternetTransfer(granted, exactRequest, new Date(now.getTime() - 60 * 1000))
      : granted;
    const attemptedRequest = challengeId === 'changed_terms'
      ? { ...exactRequest, monthlyCost: 44 } as unknown as InternetCommitRequest
      : exactRequest;
    const authorization = getInternetCommitAuthorization(evaluatedState, attemptedRequest, now);
    const reason = authorization.status === 'denied' ? authorization.reason : 'human_approval_required';
    const definitions = {
      changed_terms: { refusalId: 'DENY-TERMS-001', title: 'Changed provider terms stopped', attemptedAction: 'Commit Fibre 300 after price changed from £42 to £44', rule: 'Approval must match exact reviewed terms' },
      expired_approval: { refusalId: 'DENY-EXPIRED-001', title: 'Expired approval stopped', attemptedAction: 'Commit Wavelength transfer after the grant expired', rule: 'Approval expires after 10 minutes' },
      replayed_approval: { refusalId: 'DENY-REPLAY-001', title: 'Approval replay stopped', attemptedAction: 'Reuse an approval grant after its first commit', rule: 'Approval grants are single-use' },
    } as const;
    const definition = definitions[challengeId];
    refusal = {
      ...definition,
      challengeId,
      target: 'Wavelength internet account',
      decision: 'blocked',
      reason,
      policyId: POLICY.id,
      timestamp: now.toISOString(),
      providerStateChanged: false,
    };
  }
  return {
    ...state,
    refusals: [refusal, ...state.refusals.filter((item) => item.challengeId !== challengeId)],
    activity: [activity(`safety-${challengeId}`, `${refusal.attemptedAction} blocked before provider access`, 'Safety refusal', now), ...state.activity],
  };
}

export function startMission(state: RelayState, now = new Date()): RelayState {
  if (state.missionStatus !== 'ready') return state;
  return {
    ...state,
    missionStatus: 'running',
    activity: [activity('policy-check', 'Delegation policy validated before execution', 'Policy check', now), ...state.activity],
  };
}

export function beginService(state: RelayState, serviceId: string, now = new Date()): RelayState {
  const service = state.services.find((item) => item.id === serviceId);
  if (!service || service.tone !== 'queued' || !['ready', 'running'].includes(state.missionStatus) || getServiceStartAuthorization(state, serviceId).status === 'denied') return state;
  return {
    ...state,
    missionStatus: 'running',
    services: state.services.map((item) => item.id === serviceId ? { ...item, tone: 'running', status: 'Executing' } : item),
    activity: [activity(`${serviceId}-call`, `${service.name} received only the fields allowed by ${POLICY.id}`, 'Tool call', now, previewTrace(state, serviceId)), ...state.activity],
  };
}

const SERVICE_EXECUTION_ORDER = ['civic', 'northstar', 'clearflow', 'postway', 'haven', 'wavelength'] as const;

export function getServiceStartAuthorization(state: RelayState, serviceId: string):
  | { status: 'allowed' }
  | { status: 'denied'; reason: 'service_order_violation' | 'service_not_allowed'; requiredServiceId?: string } {
  const index = SERVICE_EXECUTION_ORDER.indexOf(serviceId as typeof SERVICE_EXECUTION_ORDER[number]);
  if (index < 0) return { status: 'denied', reason: 'service_not_allowed' };
  const requiredServiceId = SERVICE_EXECUTION_ORDER.slice(0, index).find((id) => state.services.find((service) => service.id === id)?.tone !== 'done');
  return requiredServiceId
    ? { status: 'denied', reason: 'service_order_violation', requiredServiceId }
    : { status: 'allowed' };
}

export function completeService(state: RelayState, serviceId: string, now = new Date()): RelayState {
  const service = state.services.find((item) => item.id === serviceId);
  if (!service || service.tone !== 'running') return state;
  const { mission } = state;
  const outcomes: Record<string, Omit<Receipt, 'timestamp'>> = {
    civic: { receiptId: 'RCT-CIV-0915', service: 'Civic', action: 'Address updated', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: mission.currentAddress, after: mission.newAddress, reversibleUntil: '2026-09-14T23:59:00.000Z' },
    northstar: { receiptId: 'RCT-ENE-0915', service: 'Northstar', action: 'Energy move scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: mission.currentAddress, after: `${mission.newAddress} · ${formatMoveDate(mission.moveDate)}`, reversibleUntil: '2026-09-12T23:59:00.000Z' },
    clearflow: { receiptId: 'RCT-WTR-0915', service: 'Clearflow', action: 'Water move scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: mission.currentAddress, after: `${mission.newAddress} · ${formatMoveDate(mission.moveDate)}`, reversibleUntil: '2026-09-13T23:59:00.000Z' },
    postway: { receiptId: 'RCT-PST-0915', service: 'Postway', action: 'Mail forwarding scheduled', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: 'No forwarding', after: `${mission.forwardingMonths} months · ${mission.newAddress}`, reversibleUntil: '2026-09-14T23:59:00.000Z' },
    haven: { receiptId: 'RCT-HVN-0915', service: 'Haven', action: 'Insured address updated', status: 'completed', approvedBy: 'delegation-policy', policyId: POLICY.id, before: mission.currentAddress, after: `${mission.newAddress} · £28/mo unchanged`, reversibleUntil: '2026-09-14T23:59:00.000Z' },
  };
  const outcome = outcomes[serviceId];
  if (!outcome) return state;
  const receipt = { ...outcome, timestamp: now.toISOString() };
  const providers: ProviderAccounts = {
    ...state.providers,
    ...(serviceId === 'civic' ? { civic: { ...state.providers.civic, registeredAddress: mission.newAddress, lastUpdated: now.toISOString() } } : {}),
    ...(serviceId === 'northstar' ? { northstar: { ...state.providers.northstar, serviceAddress: mission.newAddress, moveDate: mission.moveDate } } : {}),
    ...(serviceId === 'clearflow' ? { clearflow: { ...state.providers.clearflow, serviceAddress: mission.newAddress, moveDate: mission.moveDate } } : {}),
    ...(serviceId === 'postway' ? { postway: { ...state.providers.postway, forwardingAddress: mission.newAddress, forwardingMonths: mission.forwardingMonths } } : {}),
    ...(serviceId === 'haven' ? { haven: { ...state.providers.haven, insuredAddress: mission.newAddress, moveDate: mission.moveDate } } : {}),
  };
  const summaries: Record<string, string> = {
    civic: `Address updated from ${mission.currentAddress} to ${mission.newAddress}.`,
    northstar: `Energy service scheduled to move on ${formatMoveDate(mission.moveDate)}.`,
    clearflow: `Water service scheduled to move on ${formatMoveDate(mission.moveDate)}.`,
    postway: `Mail forwarding scheduled for ${mission.forwardingMonths} months.`,
    haven: `Home cover moved to ${mission.newAddress} with no premium change.`,
  };
  return {
    ...state,
    providers,
    services: state.services.map((item) => item.id === serviceId ? { ...item, tone: 'done', status: 'Complete', summary: summaries[serviceId] } : item),
    receipts: [...state.receipts, receipt],
    activity: [activity(`${serviceId}-result`, `${service.name} completed and returned ${receipt.receiptId}`, 'Tool result', now, resultTrace(state, serviceId, receipt)), ...state.activity],
  };
}

export function requestInternetApproval(state: RelayState, now = new Date()): RelayState {
  if (state.approvalStatus === 'approved' || state.approvalStatus === 'granted') return state;
  if (state.mission.approvalThreshold >= 6) return completeInternetTransfer(state, 'delegation-policy', now);
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
  const request = buildInternetCommitRequest(state);
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const approvalGrant: ApprovalGrant = {
    grantId: 'GRT-WAV-300-0915',
    proposalId: request.proposalId,
    providerId: request.providerId,
    action: request.action,
    terms: {
      plan: request.plan,
      monthlyCost: request.monthlyCost,
      contractMonths: request.contractMonths,
      moveDate: request.moveDate,
      postcode: request.postcode,
    },
    grantedBy: 'David',
    grantedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    consumedAt: null,
  };
  return {
    ...state,
    missionStatus: 'committing',
    approvalStatus: 'granted',
    approvalGrant,
    services: state.services.map((service) => service.id === 'wavelength' ? { ...service, status: 'Approval granted', tone: 'running' } : service),
    activity: [
      activity('wavelength-grant', `${approvalGrant.grantId} issued for Wavelength transfer only · expires in 10 minutes`, 'Approval grant', now),
      activity('wavelength-approved', 'David approved the exact terms for PROP-WAV-300', 'Human approval', now),
      ...state.activity,
    ],
  };
}

export function buildInternetCommitRequest(state: RelayState): InternetCommitRequest {
  return {
    proposalId: 'PROP-WAV-300',
    providerId: 'wavelength',
    action: 'internet_commit_transfer',
    plan: 'Fibre 300',
    monthlyCost: 42,
    contractMonths: 12,
    moveDate: state.mission.moveDate,
    postcode: state.mission.postcode,
  };
}

export function getInternetCommitAuthorization(state: RelayState, request: InternetCommitRequest, now = new Date()): InternetCommitAuthorization {
  const grant = state.approvalGrant;
  if (!grant) return { status: 'denied', reason: 'human_approval_required' };
  if (grant.consumedAt || state.approvalStatus === 'approved') return { status: 'denied', reason: 'approval_already_used' };
  if (now.getTime() >= new Date(grant.expiresAt).getTime()) return { status: 'denied', reason: 'approval_expired' };
  if (request.providerId !== grant.providerId) return { status: 'denied', reason: 'wrong_provider' };
  if (request.action !== grant.action) return { status: 'denied', reason: 'wrong_action' };

  const expected = { proposalId: grant.proposalId, ...grant.terms };
  const changedFields = (Object.keys(expected) as Array<keyof typeof expected>).filter((key) => request[key] !== expected[key]);
  if (changedFields.length) return { status: 'denied', reason: 'approved_terms_changed', changedFields };
  return { status: 'authorized', grantId: grant.grantId };
}

export function approveInternetTransfer(state: RelayState, request = buildInternetCommitRequest(state), now = new Date()): RelayState {
  if (state.approvalStatus === 'approved') return state;
  if (state.approvalStatus !== 'granted') return state;
  const authorization = getInternetCommitAuthorization(state, request, now);
  if (authorization.status !== 'authorized') return state;
  return completeInternetTransfer(state, 'David · explicit approval', now, authorization.grantId);
}

function completeInternetTransfer(state: RelayState, approvedBy: string, now: Date, approvalGrantId?: ApprovalGrant['grantId']): RelayState {
  const request = buildInternetCommitRequest(state);
  const receipt: Receipt = {
    receiptId: 'RCT-WAV-0915',
    service: 'Wavelength', action: 'Internet transfer approved', status: 'completed',
    approvedBy, policyId: POLICY.id,
    before: `${state.providers.wavelength.plan} · £${state.providers.wavelength.monthlyCost}/mo`, after: 'Fibre 300 · £42/mo',
    timestamp: now.toISOString(), reversibleUntil: null,
    ...(approvalGrantId ? { approvalGrantId, approvalScope: 'Wavelength · internet_commit_transfer · PROP-WAV-300 · one use' } : {}),
  };
  return {
    ...state,
    missionStatus: 'complete',
    approvalStatus: 'approved',
    approvalGrant: state.approvalGrant ? { ...state.approvalGrant, consumedAt: now.toISOString() } : null,
    providers: {
      ...state.providers,
      wavelength: { ...state.providers.wavelength, serviceAddress: state.mission.newAddress, plan: 'Fibre 300', monthlyCost: 42, moveDate: state.mission.moveDate },
    },
    services: state.services.map((service) => service.id === 'wavelength'
      ? { ...service, status: 'Complete', tone: 'done', summary: `Fibre 300 transfer approved for ${formatMoveDate(state.mission.moveDate)}.` }
      : service),
    receipts: [...state.receipts, receipt],
    activity: [
      activity('wavelength-result', approvedBy === 'delegation-policy' ? `Wavelength completed within the £${state.mission.approvalThreshold}/mo threshold and returned ${receipt.receiptId}` : `Wavelength completed after explicit approval and returned ${receipt.receiptId}`, 'Tool result', now, {
        name: 'internet_commit_transfer',
        direction: 'response',
        payload: { status: 'completed', receiptId: receipt.receiptId, grantId: approvalGrantId ?? null, monthlyCost: 42 },
      }),
      ...(approvalGrantId ? [activity('wavelength-grant-consumed', `${approvalGrantId} consumed once and permanently closed`, 'Approval grant', now)] : []),
      activity('wavelength-commit-call', 'Wavelength received the reviewed terms and scoped authorization', 'Tool call', now, {
        name: 'internet_commit_transfer',
        direction: 'request',
        payload: { proposalId: request.proposalId, plan: request.plan, monthlyCost: request.monthlyCost, contractMonths: request.contractMonths, moveDate: request.moveDate, postcode: request.postcode, grantId: approvalGrantId ?? null },
      }),
      ...state.activity,
    ],
  };
}

export function getMissionSnapshot(state: RelayState) {
  const allowedServices = state.services.filter((service) => service.tone !== 'blocked');
  const completed = allowedServices.filter((service) => service.tone === 'done').length;
  return {
    planId: 'PLAN-MOVE-0915',
    intent: `Move home from ${state.mission.currentAddress} to ${state.mission.newAddress} on ${state.mission.moveDate} without changing employer details or marketing preferences.`,
    status: state.missionStatus,
    completed,
    totalAllowed: allowedServices.length,
    approvalStatus: state.approvalStatus,
    approvalGrant: state.approvalGrant ? {
      grantId: state.approvalGrant.grantId,
      providerId: state.approvalGrant.providerId,
      action: state.approvalGrant.action,
      terms: state.approvalGrant.terms,
      expiresAt: state.approvalGrant.expiresAt,
      consumedAt: state.approvalGrant.consumedAt,
    } : null,
    moveDetails: state.mission,
    services: state.services.map(({ id, name, status }) => ({ id, name, status })),
  };
}
