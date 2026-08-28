'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Activity as ActivityIcon,
  ArrowRight,
  BadgeCheck,
  Ban,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Droplets,
  ExternalLink,
  FileCheck2,
  Home,
  Info,
  LockKeyhole,
  LoaderCircle,
  Mail,
  MoreHorizontal,
  Network,
  RadioTower,
  ReceiptText,
  RefreshCw,
  Play,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Umbrella,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { approveInternetTransfer, beginService, buildInternetCommitRequest, completeService, configureMission, getShowcaseGuide, grantInternetApproval, INITIAL_STATE, POLICY, requestInternetApproval, runSafetyChallenge, startMission, type MissionConfig, type RelayService, type RelayState, type SafetyChallengeId } from '@/lib/relay';
import { clearRelayState, loadRelayState, persistRelayState, RELAY_STORAGE_KEY } from '@/lib/relay-storage';
import { useWebMCP } from '@/lib/use-webmcp';

type Drawer = 'guide' | 'permissions' | 'receipts' | 'activity' | 'safety' | 'service' | null;

const navItems = [
  { id: null, label: 'Move plan', icon: Home },
  { id: 'activity' as const, label: 'Activity', icon: ActivityIcon },
  { id: 'permissions' as const, label: 'Permissions', icon: ShieldCheck },
  { id: 'safety' as const, label: 'Safety proof', icon: ShieldAlert },
  { id: 'receipts' as const, label: 'Receipts', icon: ReceiptText },
];

function ServiceGlyph({ id }: { id: string }) {
  const Icon = id === 'civic' ? Home : id === 'northstar' ? Zap : id === 'clearflow' ? Droplets : id === 'postway' ? Mail : id === 'haven' ? Umbrella : id === 'wavelength' ? Wifi : BriefcaseBusiness;
  return <Icon size={18} strokeWidth={2} />;
}

export default function RelayApp() {
  const [state, setState] = useState<RelayState>(INITIAL_STATE);
  const [runMode, setRunMode] = useState<'contained' | 'external' | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [selectedService, setSelectedService] = useState<RelayService | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalAcknowledged, setApprovalAcknowledged] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const runToken = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(loadRelayState());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === RELAY_STORAGE_KEY) setState(loadRelayState());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (hydrated) persistRelayState(state);
  }, [hydrated, state]);

  useEffect(() => {
    function closeOverlay(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setDrawer(null);
      setApprovalOpen(false);
    }
    window.addEventListener('keydown', closeOverlay);
    return () => window.removeEventListener('keydown', closeOverlay);
  }, []);

  const runMission = useCallback(async () => {
    const token = ++runToken.current;
    const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    setRunMode('contained');
    setState((current) => startMission(current));
    await wait(450);
    for (const serviceId of ['civic', 'northstar', 'clearflow', 'postway', 'haven']) {
      if (token !== runToken.current) return;
      setState((current) => beginService(current, serviceId));
      await wait(520);
      if (token !== runToken.current) return;
      setState((current) => completeService(current, serviceId));
      await wait(240);
    }
    if (token !== runToken.current) return;
    setState((current) => beginService(current, 'wavelength'));
    await wait(760);
    if (token !== runToken.current) return;
    setState((current) => requestInternetApproval(current));
  }, []);

  const requestApproval = () => {
    setState((current) => requestInternetApproval(current));
    setApprovalAcknowledged(false);
    setApprovalOpen(true);
  };

  const commitTransfer = () => {
    setState((current) => grantInternetApproval(current));
    setApprovalOpen(false);
    setApprovalAcknowledged(false);
    if (runMode === 'external') {
      setToast('One-time approval granted — the agent may now commit');
      window.setTimeout(() => setToast(null), 3400);
      return;
    }
    window.setTimeout(() => {
      setState((current) => approveInternetTransfer(current, buildInternetCommitRequest(current)));
      setToast('Move complete — 6 verified receipts created');
      window.setTimeout(() => setToast(null), 3400);
    }, 850);
  };

  const webmcp = useWebMCP(state, {
    onApprovalRequired: () => setState((current) => requestInternetApproval(current)),
    onApprovalRequested: requestApproval,
    onBeginService: (serviceId) => {
      setRunMode('external');
      setState((current) => beginService(startMission(current), serviceId));
    },
    onCompleteService: (serviceId) => setState((current) => completeService(current, serviceId)),
    onCommit: (request) => {
      setState((current) => approveInternetTransfer(current, request));
      setToast('Agent commit verified — receipt RCT-WAV-0915 created');
      window.setTimeout(() => setToast(null), 3400);
    },
    onRunSafetyChallenge: (challengeId) => {
      setState((current) => runSafetyChallenge(current, challengeId));
      setDrawer('safety');
      setToast('Safety challenge blocked — provider data unchanged');
      window.setTimeout(() => setToast(null), 3000);
    },
    onRunMission: runMission,
  });
  const allowed = state.services.filter((service) => service.tone !== 'blocked');
  const completed = allowed.filter((service) => service.tone === 'done').length;
  const isComplete = state.missionStatus === 'complete';
  const isDraft = state.missionStatus === 'draft';
  const isReady = state.missionStatus === 'ready';
  const isRunning = state.missionStatus === 'running';
  const isCommitting = state.missionStatus === 'committing';
  const percentage = Math.round((completed / allowed.length) * 100);

  const resetMission = () => {
    runToken.current += 1;
    setRunMode(null);
    setApprovalOpen(false);
    clearRelayState();
    setState(INITIAL_STATE);
    setToast('Demo reset — ready to create a fresh move plan');
    window.setTimeout(() => setToast(null), 2400);
  };

  function openService(service: RelayService) {
    setSelectedService(service);
    setDrawer('service');
  }

  function handleApprovalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (approvalAcknowledged) commitTransfer();
  }

  return (
    <main className="relay-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <button className="relay-wordmark" aria-label="RELAY home" onClick={() => setDrawer(null)}>
          <span className="relay-logo">R</span>
          <span className="relay-name">RELAY</span>
        </button>

        <div className="nav-section-label">Workspace</div>
        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={label} className={`nav-item ${drawer === id ? 'active' : ''}`} onClick={() => setDrawer(id)} aria-label={label} aria-current={drawer === id ? 'page' : undefined}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {label === 'Receipts' && <b>{state.receipts.length}</b>}
              {label === 'Safety proof' && state.refusals.length > 0 && <b>{state.refusals.length}</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-trust">
          <LockKeyhole size={16} />
          <div><strong>Delegation active</strong><span>Expires {new Date(`${state.mission.moveDate}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</span></div>
        </div>

        <button className="user-menu" aria-label="David Adams profile">
          <span className="user-avatar">DA</span>
          <span><strong>David Adams</strong><small>Plan owner</small></span>
          <MoreHorizontal size={17} />
        </button>
      </aside>

      <section className="app-workspace">
        <header className="app-topbar">
          <div className="title-group">
            <span className="breadcrumb">Plans <ChevronRight size={13} /> Home move</span>
            <h1>Your move</h1>
          </div>
          <div className="topbar-tools">
            <button className="showcase-chip" onClick={() => setDrawer('guide')} aria-label="Open three-minute showcase guide">
              <Clock3 size={14} />
              <span>3-minute guide</span>
            </button>
            <span className={`mcp-chip ${webmcp.supported ? 'live' : ''}`} title={webmcp.supported ? `${webmcp.registeredCount} tools registered` : 'Human demo mode remains fully available'}>
              <RadioTower size={14} />
              <span>{webmcp.supported ? `${webmcp.registeredCount} tools live` : 'Demo mode'}</span>
            </span>
            <button className="icon-button" onClick={() => setDrawer('permissions')} aria-label="Move plan settings"><MoreHorizontal size={19} /></button>
          </div>
        </header>

        <div className="dashboard-grid">
          <section className="dashboard-primary">
            <section className={`mission-hero ${isComplete ? 'complete' : ''}`}>
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-heading-row">
                <span className="live-status"><i /> {isComplete ? 'Completed within your rules' : isDraft ? 'New move plan' : isReady ? 'Ready to coordinate' : isRunning || isCommitting ? 'RELAY working live' : 'Paused for your approval'}</span>
                <span className="mission-id">PLAN-MOVE-0915</span>
              </div>
              <h2>{isComplete ? 'Your move is coordinated.' : isDraft ? 'Plan the move. Set the boundaries.' : isReady ? 'Your secure plan is ready.' : isRunning || isCommitting ? 'Coordinating your move now.' : 'One decision needs you.'}</h2>
              <p className="hero-subtitle">{isComplete ? 'Every approved service change is complete. Protected details were left untouched.' : isDraft ? 'Tell RELAY where and when. It will prepare every service and show the boundaries before anything changes.' : isReady ? 'Your details are mapped across six connected services and protected by one approval policy.' : isRunning || isCommitting ? 'RELAY is calling structured service tools and recording every result.' : 'Five services are complete. RELAY stopped before changing your monthly cost.'}</p>
              <button className="intent-surface" onClick={() => setDrawer('permissions')}>
                <Sparkles size={17} />
                <span><small>{isDraft ? 'Move summary' : 'Your instruction'}</small>“Move my home services from {state.mission.currentAddress} to {state.mission.newAddress} on {formatDate(state.mission.moveDate)}. Keep employer details and marketing preferences unchanged.”</span>
                <ChevronRight size={18} />
              </button>
              <div className="hero-progress-row">
                <div className="progress-copy"><strong>{completed} of {allowed.length}</strong><span>allowed actions complete</span></div>
                <div className="progress-track" role="progressbar" aria-label="Allowed move actions completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
                <strong className="progress-percent">{percentage}%</strong>
              </div>
            </section>

            <TrustChain state={state} completed={completed} />

            <section className="execution-card">
              <header className="section-header">
                <div><span className="section-kicker"><Network size={13} /> Live coordination</span><h2>Connected services</h2><p>RELAY previews every change, checks your rules, then acts.</p></div>
                <span className="trace-badge"><i /> Synced just now</span>
              </header>
              <div className="execution-list" data-testid="service-list">
                {state.services.map((service, index) => (
                  <button className={`execution-row ${service.tone}`} key={service.id} onClick={() => openService(service)} aria-label={`Open ${service.name}`}>
                    <span className={`provider-icon provider-${service.id}`}><ServiceGlyph id={service.id} /></span>
                    <span className="provider-details"><strong>{service.name}</strong><small>{service.detail}</small></span>
                    <span className="execution-step">Step {String(index + 1).padStart(2, '0')}</span>
                    <span className={`status-badge ${service.tone}`}>
                      {service.tone === 'done' ? <CheckCircle2 size={14} /> : service.tone === 'review' ? <CircleAlert size={14} /> : service.tone === 'running' ? <LoaderCircle className="spin" size={14} /> : service.tone === 'blocked' ? <Ban size={14} /> : <span className="queued-dot" />}
                      {service.status}
                    </span>
                    <ChevronRight className="row-chevron" size={18} />
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className="dashboard-aside">
            {isDraft ? (
              <MissionComposer mission={state.mission} onSave={(mission) => {
                setState((current) => configureMission(current, mission));
                setToast('Your move plan is ready');
                window.setTimeout(() => setToast(null), 2600);
              }} />
            ) : isReady ? (
              <section className="approval-card launch-card" data-testid="launch-card">
                <div className="attention-icon launch-icon"><Bot size={22} /></div>
                <span className="approval-eyebrow">Built-in RELAY agent</span>
                <h2>Start your move plan</h2>
                <p>RELAY will check your approval rules, coordinate every service, stop for your decision, and finish with verified receipts—all on this screen.</p>
                <div className="run-summary">
                  <span><Network size={16} /><strong>6 connected services</strong></span>
                  <span><ShieldCheck size={16} /><strong>1 protected human decision</strong></span>
                  <span><ReceiptText size={16} /><strong>Live action receipts</strong></span>
                </div>
                <button className="primary-action" onClick={() => void runMission()}>Start move plan <Play size={15} fill="currentColor" /></button>
                <span className="no-action-note"><RadioTower size={12} /> {webmcp.supported ? `${webmcp.registeredCount} WebMCP tools also available` : 'Everything needed is built into RELAY'}</span>
              </section>
            ) : isRunning || isCommitting ? (
              <section className="approval-card running-card" data-testid="running-card">
                <div className="attention-icon running-icon"><LoaderCircle className="spin" size={23} /></div>
                <span className="approval-eyebrow">Agent working</span>
                <h2>{isCommitting ? (runMode === 'external' ? 'Approval granted to the agent' : 'Committing approved change') : 'Executing your plan'}</h2>
                <p>{isCommitting ? (runMode === 'external' ? 'RELAY is waiting for the connected agent to call the exact approved Wavelength commit tool.' : 'Your one-time approval is being exchanged for the exact Wavelength transfer you reviewed.') : 'Structured actions are running one service at a time. Every mutation produces a receipt.'}</p>
                <div className="live-operation">
                  <span className="live-operation-pulse" />
                  <span><small>Current operation</small><strong>{state.services.find((service) => service.tone === 'running')?.name ?? 'Policy validation'}</strong></span>
                  <em>{completed}/{allowed.length}</em>
                </div>
                {state.approvalGrant && !state.approvalGrant.consumedAt && (
                  <div className="active-grant-card">
                    <LockKeyhole size={16} />
                    <span><small>Single-use approval grant</small><strong>{state.approvalGrant.grantId}</strong><em>Wavelength transfer only · expires in 10 minutes</em></span>
                  </div>
                )}
                <div className="mini-progress"><span style={{ width: `${percentage}%` }} /></div>
                <span className="no-action-note"><LockKeyhole size={12} /> RELAY will pause automatically if your rules require it</span>
              </section>
            ) : !isComplete ? (
              <section className="approval-card" data-testid="approval-card">
                <div className="attention-icon"><CircleAlert size={22} /></div>
                <span className="approval-eyebrow">Your decision</span>
                <h2>Approve one plan change</h2>
                <p>Wavelength can move your internet, but your monthly cost would increase.</p>
                <div className="provider-lockup-v2"><span className="provider-icon provider-wavelength"><Wifi size={18} /></span><span><strong>Wavelength</strong><small>Internet transfer · {formatDate(state.mission.moveDate)}</small></span></div>
                <PriceChange />
                <div className="boundary-message"><ShieldCheck size={18} /><span><strong>RELAY stopped here automatically</strong>Your rules require approval for any recurring price increase.</span></div>
                <button className="primary-action" onClick={requestApproval}>Review this decision <ArrowRight size={17} /></button>
                <button className="quiet-action" onClick={() => { const service = state.services.find((item) => item.id === 'wavelength'); if (service) openService(service); }}>Compare provider options</button>
                <span className="no-action-note"><LockKeyhole size={12} /> Nothing changes until you approve</span>
              </section>
            ) : (
              <section className="approval-card completion-card" data-testid="completion-card">
                <div className="completion-mark"><BadgeCheck size={31} /></div>
                <span className="approval-eyebrow">Move complete</span>
                <h2>Everything allowed is done</h2>
                <p>Six services were updated. Employer details and marketing preferences stayed protected.</p>
                <div className="latest-receipt"><FileCheck2 size={20} /><span><small>Latest action receipt</small><strong>{state.receipts.at(-1)?.receiptId}</strong><em>{state.receipts.at(-1)?.approvedBy === 'delegation-policy' ? 'Completed within policy' : 'Human approved'} · Wavelength</em></span></div>
                {state.approvalGrant?.consumedAt && <div className="consumed-grant"><CheckCircle2 size={15} /><span><strong>{state.approvalGrant.grantId}</strong> used once and permanently closed</span></div>}
                <button className="primary-action" onClick={() => setDrawer('receipts')}>Review action receipts <ArrowRight size={17} /></button>
                <button className="quiet-action" onClick={resetMission}><RefreshCw size={14} /> Start a new move</button>
              </section>
            )}

            <section className="guardrail-card guardrail-card-v2">
              <header><ShieldCheck size={19} /><span><strong>Your approval rules</strong><small>Applies only to this move · expires {shortDate(state.mission.moveDate)}</small></span><em>Active</em></header>
              <div className="guardrail-rules">
                <div className="rule-row allow"><span><Check size={13} /></span><div><small>RELAY CAN</small><strong>Update address-based services</strong><p>Six connected providers</p></div></div>
                <div className="rule-row review"><span><CircleAlert size={13} /></span><div><small>ASK ME FIRST</small><strong>{state.mission.approvalThreshold === 0 ? 'Any monthly price increase' : `More than £${state.mission.approvalThreshold}/month`}</strong><p>Contracts and recurring costs</p></div></div>
                <div className="rule-row deny"><span><Ban size={13} /></span><div><small>NEVER TOUCH</small><strong>Employer and marketing data</strong><p>Blocked before provider access</p></div></div>
              </div>
              <button onClick={() => setDrawer('permissions')}>Review approval settings <ChevronRight size={15} /></button>
            </section>
          </aside>
        </div>
      </section>

      {drawer && (
        <div className="drawer-backdrop" onMouseDown={() => setDrawer(null)}>
          <aside className="drawer relay-drawer" aria-modal="true" role="dialog" aria-label={drawer === 'guide' ? 'Three-minute showcase guide' : drawer === 'permissions' ? 'Approval permissions' : drawer === 'receipts' ? 'Action receipts' : drawer === 'activity' ? 'Live activity' : drawer === 'safety' ? 'Safety proof' : selectedService?.name ?? 'Service details'} onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close panel"><X size={18} /></button>
            {drawer === 'guide' && <ShowcaseGuidePanel state={state} onClose={() => setDrawer(null)} onStart={() => { setDrawer(null); runMission(); }} onApproval={() => { setDrawer(null); setApprovalOpen(true); }} onReceipts={() => setDrawer('receipts')} onSafety={() => setDrawer('safety')} />}
            {drawer === 'permissions' && <PermissionsPanel state={state} />}
            {drawer === 'receipts' && <ReceiptsPanel state={state} />}
            {drawer === 'activity' && <ActivityPanel activity={state.activity} webmcp={webmcp} />}
            {drawer === 'safety' && <SafetyPanel state={state} onRun={(challengeId) => {
              setState((current) => runSafetyChallenge(current, challengeId));
              setToast('Safety challenge blocked — provider data unchanged');
              window.setTimeout(() => setToast(null), 3000);
            }} />}
            {drawer === 'service' && selectedService && <ServicePanel service={selectedService} state={state} />}
          </aside>
        </div>
      )}

      {approvalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setApprovalOpen(false)}>
          <section className="approval-modal approval-modal-v2" aria-modal="true" role="dialog" aria-labelledby="approval-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setApprovalOpen(false)} aria-label="Close approval"><X size={18} /></button>
            <div className="modal-security"><ShieldCheck size={17} /> Secure human checkpoint</div>
            <span className="modal-proposal">PROP-WAV-300 · One-time approval</span>
            <h2 id="approval-title">Approve your new internet plan?</h2>
            <p>Review exactly what will change. This permission cannot be reused for another action.</p>
            <PriceChange expanded />
            <dl className="approval-facts">
              <div><dt>Provider</dt><dd>Wavelength only</dd></div>
              <div><dt>Approved action</dt><dd>Internet transfer only</dd></div>
              <div><dt>Move date</dt><dd>{formatDate(state.mission.moveDate)}</dd></div>
              <div><dt>New contract</dt><dd>12 months</dd></div>
              <div><dt>Grant lifetime</dt><dd>10 minutes</dd></div>
              <div><dt>Reuse</dt><dd>Blocked after one use</dd></div>
            </dl>
            <div className="approval-explainer"><Info size={16} /><span><strong>What your approval creates</strong>A grant locked to Wavelength, Fibre 300, £42/month, this move date, and one commit. Changed terms need a new decision.</span></div>
            <form {...{ toolname: 'relay_approve_internet_proposal', tooldescription: 'Present the Wavelength proposal for manual human approval. The agent may fill this form but cannot submit it.' }} onSubmit={handleApprovalSubmit}>
              <input type="hidden" name="proposalId" value="PROP-WAV-300" {...{ toolparamdescription: 'The exact proposal awaiting human approval.' }} />
              <label className="acknowledgement"><input type="checkbox" checked={approvalAcknowledged} onChange={(event) => setApprovalAcknowledged(event.target.checked)} /><span>I understand my bill will increase by <strong>£6 per month</strong>.</span></label>
              <button className="primary-action" type="submit" disabled={!approvalAcknowledged}>Approve once & continue <ArrowRight size={17} /></button>
            </form>
            <button className="quiet-action" onClick={() => setApprovalOpen(false)}>Not now</button>
            <span className="no-action-note"><LockKeyhole size={12} /> Only you can submit this approval</span>
          </section>
        </div>
      )}

      {toast && <div className="toast relay-toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </main>
  );
}

function MissionComposer({ mission, onSave }: { mission: MissionConfig; onSave: (mission: MissionConfig) => void }) {
  const [draft, setDraft] = useState(mission);

  function update<K extends keyof MissionConfig>(key: K, value: MissionConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...draft,
      currentAddress: draft.currentAddress.trim(),
      newAddress: draft.newAddress.trim(),
      postcode: draft.postcode.trim().toUpperCase(),
    });
  }

  return <section className="approval-card mission-composer" data-testid="mission-composer">
    <div className="attention-icon launch-icon"><Sparkles size={21} /></div>
    <span className="approval-eyebrow">Move setup</span>
    <h2>Plan your address change</h2>
    <p>Tell RELAY where and when. It will prepare each service, show what can change, and ask before anything sensitive.</p>
    <form onSubmit={submit}>
      <label><span>Current address</span><input required value={draft.currentAddress} onChange={(event) => update('currentAddress', event.target.value)} /></label>
      <label><span>New address</span><input required value={draft.newAddress} onChange={(event) => update('newAddress', event.target.value)} /></label>
      <div className="composer-grid">
        <label><span>Postcode</span><input required value={draft.postcode} onChange={(event) => update('postcode', event.target.value)} /></label>
        <label><span>Move date</span><input required inputMode="numeric" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" value={draft.moveDate} onChange={(event) => update('moveDate', event.target.value)} /></label>
      </div>
      <div className="composer-grid">
        <label><span>Mail forwarding</span><select value={draft.forwardingMonths} onChange={(event) => update('forwardingMonths', Number(event.target.value) as MissionConfig['forwardingMonths'])}><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option></select></label>
        <label><span>Auto-approve increase</span><select value={draft.approvalThreshold} onChange={(event) => update('approvalThreshold', Number(event.target.value))}><option value={0}>Never</option><option value={5}>Up to £5/mo</option><option value={10}>Up to £10/mo</option></select></label>
      </div>
      <div className="composer-guardrail"><ShieldCheck size={16} /><span><strong>Protected by default</strong>Employer records and marketing preferences will remain blocked.</span></div>
      <button className="primary-action" type="submit">Review move plan <ArrowRight size={16} /></button>
    </form>
    <span className="no-action-note"><LockKeyhole size={12} /> Demo information stays in this browser</span>
  </section>;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function PriceChange({ expanded = false }: { expanded?: boolean }) {
  return <div className={`price-comparison ${expanded ? 'expanded' : ''}`}>
    <div><small>Current plan</small><strong>Standard 100</strong><span>£36 <em>/ month</em></span></div>
    <span className="comparison-arrow"><ArrowRight size={17} /></span>
    <div className="proposed"><small>Proposed</small><strong>Fibre 300</strong><span>£42 <em>/ month</em></span></div>
  </div>;
}

function TrustChain({ state, completed }: { state: RelayState; completed: number }) {
  const policyChecked = !['draft', 'ready'].includes(state.missionStatus);
  const allowedDone = completed >= 5;
  const grantConsumed = Boolean(state.approvalGrant?.consumedAt);
  const grantActive = Boolean(state.approvalGrant && !state.approvalGrant.consumedAt);
  const grantNeeded = state.missionStatus === 'waiting_for_human_approval';
  const nodes = [
    { label: 'Intent', detail: state.missionStatus === 'draft' ? 'Waiting for plan' : 'Plan captured', tone: state.missionStatus === 'draft' ? 'waiting' : 'done', icon: Sparkles },
    { label: 'Rules', detail: policyChecked ? 'Policy checked' : 'Ready to check', tone: policyChecked ? 'done' : 'waiting', icon: ShieldCheck },
    { label: 'Scoped tools', detail: allowedDone ? '5 verified' : `${completed} of 5 verified`, tone: allowedDone ? 'done' : policyChecked ? 'active' : 'waiting', icon: Network },
    { label: 'Human grant', detail: grantConsumed ? 'Used once' : grantActive ? 'Exact scope active' : grantNeeded ? 'Decision required' : 'Not required yet', tone: grantConsumed ? 'done' : grantActive || grantNeeded ? 'review' : 'waiting', icon: LockKeyhole },
    { label: 'Receipt', detail: state.missionStatus === 'complete' ? 'Proof recorded' : 'After commit', tone: state.missionStatus === 'complete' ? 'done' : 'waiting', icon: ReceiptText },
  ];

  return <section className="trust-chain" aria-label="Live trust chain">
    <header><span><ShieldCheck size={14} /> Live trust chain</span><strong>Intent → rules → scoped action → proof</strong></header>
    <div className="trust-chain-grid">
      {nodes.map(({ label, detail, tone, icon: Icon }) => <div className={`trust-node ${tone}`} key={label}><span><Icon size={14} /></span><div><strong>{label}</strong><small>{detail}</small></div></div>)}
    </div>
  </section>;
}

function PanelHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return <div className="drawer-heading relay-drawer-heading"><span className="section-kicker">{kicker}</span><h2>{title}</h2><p>{body}</p></div>;
}

function ShowcaseGuidePanel({ state, onClose, onStart, onApproval, onReceipts, onSafety }: { state: RelayState; onClose: () => void; onStart: () => void; onApproval: () => void; onReceipts: () => void; onSafety: () => void }) {
  const guide = getShowcaseGuide(state);
  const isBusy = ['running', 'committing'].includes(state.missionStatus);
  const primary = state.missionStatus === 'draft'
    ? { label: 'Continue with move setup', action: onClose }
    : state.missionStatus === 'ready'
      ? { label: 'Start coordination', action: onStart }
      : state.missionStatus === 'waiting_for_human_approval'
        ? { label: 'Review human decision', action: onApproval }
        : state.missionStatus === 'complete'
          ? { label: 'Open action receipts', action: onReceipts }
          : { label: state.missionStatus === 'committing' ? 'Creating final receipt' : 'RELAY is coordinating', action: onClose };
  return <>
    <PanelHeading kicker="Guided showcase" title="Tell the whole story in three minutes." body="A contained, prompt-free path through delegated action, human control, and verifiable safety." />
    <div className="showcase-progress"><Clock3 size={18} /><div><strong>{guide.completedSteps} of 4 acts complete</strong><span>Target runtime · under three minutes</span></div></div>
    <div className="showcase-steps">{guide.steps.map((step, index) => <article className={`showcase-step ${step.status}`} key={step.id}>
      <span className="showcase-step-marker">{step.status === 'complete' ? <Check size={14} /> : step.status === 'current' ? <Play size={12} fill="currentColor" /> : index + 1}</span>
      <div><header><strong>{step.label}</strong><code>{step.timing}</code></header><p>{step.description}</p></div>
    </article>)}</div>
    <button className="primary-action showcase-primary" onClick={primary.action} disabled={isBusy}>{isBusy ? <LoaderCircle className="spin" size={15} /> : <ArrowRight size={15} />} {primary.label}</button>
    <button className="quiet-action" onClick={onSafety}><ShieldAlert size={14} /> Open live safety proof</button>
    <span className="showcase-footnote"><Bot size={13} /> No copied prompts or external tabs required.</span>
  </>;
}

function PermissionsPanel({ state }: { state: RelayState }) {
  return <><PanelHeading kicker="Delegation policy" title="You set the boundaries." body="RELAY checks this policy before every tool call and refuses anything outside it." />
    <div className="policy-id"><span>Active policy</span><strong>{POLICY.id}</strong><small>Expires {formatDate(state.mission.moveDate)}, 23:59</small></div>
    {state.approvalGrant && <section className={`approval-grant-panel ${state.approvalGrant.consumedAt ? 'consumed' : ''}`}><header><LockKeyhole size={16} /><span><small>{state.approvalGrant.consumedAt ? 'Consumed approval grant' : 'Active approval grant'}</small><strong>{state.approvalGrant.grantId}</strong></span></header><dl><div><dt>Provider</dt><dd>Wavelength</dd></div><div><dt>Action</dt><dd>Internet transfer</dd></div><div><dt>Exact terms</dt><dd>Fibre 300 · £42/mo · 12 months</dd></div><div><dt>Status</dt><dd>{state.approvalGrant.consumedAt ? 'Used once · closed' : 'One use · expires in 10 minutes'}</dd></div></dl></section>}
    <PolicyGroup tone="allow" title="Agent may use" items={POLICY.allowed} />
    <PolicyGroup tone="review" title="Always ask me" items={POLICY.approvalRequired} />
    <PolicyGroup tone="deny" title="Never change" items={POLICY.forbidden} />
  </>;
}

function PolicyGroup({ tone, title, items }: { tone: string; title: string; items: string[] }) {
  return <section className={`policy-group ${tone}`}><h3><i />{title}</h3>{items.map((item) => <p key={item}><span>{tone === 'deny' ? <X size={13} /> : <Check size={13} />}</span>{item}</p>)}</section>;
}

function ReceiptsPanel({ state }: { state: RelayState }) {
  return <><PanelHeading kicker="Append-only audit" title={`${state.receipts.length} action receipts`} body="Every external change has a compact, inspectable record." />
    {state.receipts.length === 0 ? <div className="empty-panel"><ReceiptText size={25} /><strong>No actions yet</strong><p>Start the move plan and verified receipts will appear here in real time.</p></div> : <div className="receipt-list">{[...state.receipts].reverse().map((receipt) => <article className="receipt" key={receipt.receiptId}><div className="receipt-top"><span className="receipt-check"><Check size={12} /></span><span>{receipt.service}</span><code>{receipt.receiptId}</code></div><h3>{receipt.action}</h3><div className="receipt-change"><span>{receipt.before}</span><ArrowRight size={13} /><span>{receipt.after}</span></div>{receipt.approvalGrantId && <div className="receipt-grant"><LockKeyhole size={13} /><span><small>Human grant consumed</small><strong>{receipt.approvalGrantId}</strong><em>{receipt.approvalScope}</em></span></div>}<footer><span>{receipt.approvedBy}</span><time>{new Date(receipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</time></footer></article>)}</div>}
  </>;
}

function ActivityPanel({ activity, webmcp }: { activity: RelayState['activity']; webmcp: { supported: boolean | null; registeredCount: number } }) {
  return <><PanelHeading kicker="Agent trace" title="Structured, not simulated." body="This timeline mirrors the same state used by the visible UI and WebMCP callbacks." />
    <div className={`mcp-status ${webmcp.supported ? 'live' : ''}`}><RadioTower size={18} /><div><strong>{webmcp.supported ? 'WebMCP available' : 'Human demo mode'}</strong><span>{webmcp.supported ? `${webmcp.registeredCount} RELAY tools registered` : 'The full visible flow remains available.'}</span></div></div>
    {activity.length === 0 ? <div className="empty-panel"><ActivityIcon size={25} /><strong>Waiting to begin</strong><p>The live agent trace will appear here as each structured action runs.</p></div> : <div className="activity-list">{activity.map((item) => <article key={item.id}><time>{new Date(item.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time><div><span>{item.kind}</span><p>{item.label}</p></div></article>)}</div>}
  </>;
}

const SAFETY_CHALLENGES: Array<{ id: SafetyChallengeId; title: string; attempt: string; proof: string }> = [
  { id: 'forbidden_employer_change', title: 'Protected data request', attempt: 'Change employer address and marketing preferences', proof: 'Blocked before Hearth provider access' },
  { id: 'changed_terms', title: 'Provider changes the price', attempt: 'Use £42 approval after price rises to £44', proof: 'Exact approval terms no longer match' },
  { id: 'expired_approval', title: 'Expired approval grant', attempt: 'Commit after the ten-minute grant lifetime', proof: 'Expired permission cannot authorize a mutation' },
  { id: 'replayed_approval', title: 'Approval replay attack', attempt: 'Reuse a grant after its first successful commit', proof: 'Consumed permission is permanently closed' },
  { id: 'out_of_order_action', title: 'Out-of-order provider action', attempt: 'Start Northstar before Civic has completed', proof: 'Execution order is enforced before a tool runs' },
];

function SafetyPanel({ state, onRun }: { state: RelayState; onRun: (challengeId: SafetyChallengeId) => void }) {
  return <><PanelHeading kicker="Live safety evaluation" title="Prove what RELAY refuses." body="These controlled challenges use the same policy and approval enforcement as live WebMCP commits. Successful action receipts stay separate from refusal proof." />
    <div className="safety-assurance"><ShieldCheck size={18} /><div><strong>{state.refusals.length} of {SAFETY_CHALLENGES.length} challenges proven</strong><span>Every result confirms provider state remained unchanged.</span></div></div>
    <div className="safety-challenge-list">{SAFETY_CHALLENGES.map((challenge) => {
      const refusal = state.refusals.find((item) => item.challengeId === challenge.id);
      return <article className={`safety-challenge ${refusal ? 'passed' : ''}`} key={challenge.id}>
        <header><span>{refusal ? <Check size={14} /> : <ShieldAlert size={14} />}</span><div><strong>{challenge.title}</strong><small>{challenge.attempt}</small></div>{refusal && <code>{refusal.refusalId}</code>}</header>
        <p>{refusal ? refusal.rule : challenge.proof}</p>
        {refusal && <div className="refusal-proof"><LockKeyhole size={13} /><span><strong>Blocked · no provider change</strong><small>{refusal.reason.replaceAll('_', ' ')}</small></span></div>}
        <button onClick={() => onRun(challenge.id)}>{refusal ? 'Run again' : 'Run safety challenge'} <Play size={12} fill="currentColor" /></button>
      </article>;
    })}</div>
    <span className="safety-footnote"><RadioTower size={12} /> Also available through <code>relay_run_safety_challenge</code></span>
  </>;
}

function ServicePanel({ service, state }: { service: RelayService; state: RelayState }) {
  const provider = state.providers[service.id as keyof RelayState['providers']];
  const accountRows = service.id === 'civic'
    ? [['Registered address', state.providers.civic.registeredAddress], ['Last updated', state.providers.civic.lastUpdated ? new Date(state.providers.civic.lastUpdated).toLocaleTimeString('en-GB') : 'Not changed']]
    : service.id === 'northstar'
      ? [['Service address', state.providers.northstar.serviceAddress], ['Scheduled move', state.providers.northstar.moveDate ? formatDate(state.providers.northstar.moveDate) : 'Not scheduled']]
      : service.id === 'clearflow'
        ? [['Service address', state.providers.clearflow.serviceAddress], ['Scheduled move', state.providers.clearflow.moveDate ? formatDate(state.providers.clearflow.moveDate) : 'Not scheduled']]
        : service.id === 'postway'
          ? [['Forwarding to', state.providers.postway.forwardingAddress ?? 'Not active'], ['Duration', state.providers.postway.forwardingMonths ? `${state.providers.postway.forwardingMonths} months` : '—']]
          : service.id === 'haven'
            ? [['Insured address', state.providers.haven.insuredAddress], ['Cover', `${state.providers.haven.cover} · £${state.providers.haven.monthlyPremium}/mo`]]
            : service.id === 'wavelength'
              ? [['Current plan', `${state.providers.wavelength.plan} · £${state.providers.wavelength.monthlyCost}/mo`], ['Service address', state.providers.wavelength.serviceAddress]]
              : [['Employer address', state.providers.hearth.employerAddress], ['Marketing', state.providers.hearth.marketingPreferences]];
  return <><PanelHeading kicker="Fictional service" title={service.name} body={service.summary} />
    <div className="provider-preview"><div className="provider-hero"><span className={`provider-big provider-${service.id}`}><ServiceGlyph id={service.id} /></span><div><strong>{service.name}</strong><p>{service.detail}</p></div></div><div className="mock-account"><span>Account number</span><strong>{provider.accountId}</strong>{accountRows.map(([label, value]) => <span className="account-pair" key={label}><small>{label}</small><b>{value}</b></span>)}</div>{service.tone === 'blocked' ? <span className="provider-access-blocked"><LockKeyhole size={14} /> Provider access blocked by your rules</span> : <a href={`/providers/${service.id}`} target="_blank" rel="noreferrer">Open persistent service account <ExternalLink size={14} /></a>}</div>
    <section className="tool-list"><p className="section-kicker">RELAY tools for this service</p>{service.tools.length ? service.tools.map((tool) => <code key={tool}>{tool}</code>) : <p className="no-tools">No tools loaded — RELAY blocked this service before discovery.</p>}</section>
  </>;
}
