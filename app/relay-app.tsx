'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';
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
  Sparkles,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { approveInternetTransfer, beginService, completeService, grantInternetApproval, INITIAL_STATE, POLICY, requestInternetApproval, startMission, type RelayService, type RelayState } from '@/lib/relay';
import { useWebMCP } from '@/lib/use-webmcp';

type Drawer = 'permissions' | 'receipts' | 'activity' | 'service' | null;

const navItems = [
  { id: null, label: 'Mission', icon: Home },
  { id: 'activity' as const, label: 'Activity', icon: ActivityIcon },
  { id: 'permissions' as const, label: 'Permissions', icon: ShieldCheck },
  { id: 'receipts' as const, label: 'Receipts', icon: ReceiptText },
];

function ServiceGlyph({ id }: { id: string }) {
  const Icon = id === 'civic' ? Home : id === 'northstar' ? Zap : id === 'postway' ? Mail : id === 'wavelength' ? Wifi : BriefcaseBusiness;
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
  const runToken = useRef(0);

  const runMission = useCallback(async () => {
    const token = ++runToken.current;
    const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    setRunMode('contained');
    setState((current) => startMission(current));
    await wait(450);
    for (const serviceId of ['civic', 'northstar', 'postway']) {
      if (token !== runToken.current) return;
      setState((current) => beginService(current, serviceId));
      await wait(720);
      if (token !== runToken.current) return;
      setState((current) => completeService(current, serviceId));
      await wait(360);
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
      setState((current) => approveInternetTransfer(current));
      setToast('Mission complete — 4 verified receipts created');
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
    onCommit: () => {
      setState((current) => approveInternetTransfer(current));
      setToast('Agent commit verified — receipt RCT-WAV-0915 created');
      window.setTimeout(() => setToast(null), 3400);
    },
    onRunMission: runMission,
  });
  const allowed = state.services.filter((service) => service.tone !== 'blocked');
  const completed = allowed.filter((service) => service.tone === 'done').length;
  const isComplete = state.missionStatus === 'complete';
  const isReady = state.missionStatus === 'ready';
  const isRunning = state.missionStatus === 'running';
  const isCommitting = state.missionStatus === 'committing';
  const percentage = Math.round((completed / allowed.length) * 100);

  const resetMission = () => {
    runToken.current += 1;
    setRunMode(null);
    setApprovalOpen(false);
    setState(INITIAL_STATE);
    setToast('Demo reset — ready for a fresh run');
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
            </button>
          ))}
        </nav>

        <div className="sidebar-trust">
          <LockKeyhole size={16} />
          <div><strong>Delegation active</strong><span>Expires 15 Sep</span></div>
        </div>

        <button className="user-menu" aria-label="David Adams profile">
          <span className="user-avatar">DA</span>
          <span><strong>David Adams</strong><small>Mission owner</small></span>
          <MoreHorizontal size={17} />
        </button>
      </aside>

      <section className="app-workspace">
        <header className="app-topbar">
          <div className="title-group">
            <span className="breadcrumb">Missions <ChevronRight size={13} /> Moving home</span>
            <h1>Moving home</h1>
          </div>
          <div className="topbar-tools">
            <span className={`mcp-chip ${webmcp.supported ? 'live' : ''}`} title={webmcp.supported ? `${webmcp.registeredCount} tools registered` : 'Human demo mode remains fully available'}>
              <RadioTower size={14} />
              <span>{webmcp.supported ? `${webmcp.registeredCount} tools live` : 'Demo mode'}</span>
            </span>
            <button className="icon-button" onClick={() => setDrawer('permissions')} aria-label="Mission settings"><MoreHorizontal size={19} /></button>
          </div>
        </header>

        <div className="dashboard-grid">
          <section className="dashboard-primary">
            <section className={`mission-hero ${isComplete ? 'complete' : ''}`}>
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-heading-row">
                <span className="live-status"><i /> {isComplete ? 'Completed within your rules' : isReady ? 'Ready for secure delegation' : isRunning || isCommitting ? 'Agent executing live' : 'Agent paused safely'}</span>
                <span className="mission-id">MISSION-MOVE-0915</span>
              </div>
              <h2>{isComplete ? 'Your move is coordinated.' : isReady ? 'Move home without the admin.' : isRunning || isCommitting ? 'Coordinating your move now.' : 'One decision needs you.'}</h2>
              <p className="hero-subtitle">{isComplete ? 'Every permitted action is complete. Protected details were left untouched.' : isReady ? 'One instruction becomes a safe, auditable plan across five services.' : isRunning || isCommitting ? 'RELAY is calling structured service tools and recording every result.' : 'Three services are complete. RELAY stopped before changing your monthly cost.'}</p>
              <button className="intent-surface" onClick={() => setDrawer('permissions')}>
                <Sparkles size={17} />
                <span><small>Your instruction</small>“Move me on 15 September. Don’t touch employer details or marketing preferences.”</span>
                <ChevronRight size={18} />
              </button>
              <div className="hero-progress-row">
                <div className="progress-copy"><strong>{completed} of {allowed.length}</strong><span>allowed actions complete</span></div>
                <div className="progress-track" aria-label={`${percentage} percent complete`}><span style={{ width: `${percentage}%` }} /></div>
                <strong className="progress-percent">{percentage}%</strong>
              </div>
            </section>

            <section className="execution-card">
              <header className="section-header">
                <div><span className="section-kicker"><Network size={13} /> Live execution</span><h2>Service plan</h2><p>RELAY previews every change, checks your rules, then acts.</p></div>
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
            {isReady ? (
              <section className="approval-card launch-card" data-testid="launch-card">
                <div className="attention-icon launch-icon"><Bot size={22} /></div>
                <span className="approval-eyebrow">Built-in RELAY agent</span>
                <h2>Run the mission here</h2>
                <p>RELAY will inspect your permissions, coordinate each service, stop for your decision, and finish with verified receipts—all on this screen.</p>
                <div className="run-summary">
                  <span><Network size={16} /><strong>4 service connections</strong></span>
                  <span><ShieldCheck size={16} /><strong>1 protected human decision</strong></span>
                  <span><ReceiptText size={16} /><strong>Live action receipts</strong></span>
                </div>
                <button className="primary-action" onClick={() => void runMission()}>Start secure mission <Play size={15} fill="currentColor" /></button>
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
                <div className="mini-progress"><span style={{ width: `${percentage}%` }} /></div>
                <span className="no-action-note"><LockKeyhole size={12} /> RELAY will pause automatically if your rules require it</span>
              </section>
            ) : !isComplete ? (
              <section className="approval-card" data-testid="approval-card">
                <div className="attention-icon"><CircleAlert size={22} /></div>
                <span className="approval-eyebrow">Your decision</span>
                <h2>Approve one plan change</h2>
                <p>Wavelength can move your internet, but your monthly cost would increase.</p>
                <div className="provider-lockup-v2"><span className="provider-icon provider-wavelength"><Wifi size={18} /></span><span><strong>Wavelength</strong><small>Internet transfer · 15 Sep</small></span></div>
                <PriceChange />
                <div className="boundary-message"><ShieldCheck size={18} /><span><strong>RELAY stopped here automatically</strong>Your rules require approval for any recurring price increase.</span></div>
                <button className="primary-action" onClick={requestApproval}>Review this decision <ArrowRight size={17} /></button>
                <button className="quiet-action" onClick={() => openService(state.services[3])}>Compare provider options</button>
                <span className="no-action-note"><LockKeyhole size={12} /> Nothing changes until you approve</span>
              </section>
            ) : (
              <section className="approval-card completion-card" data-testid="completion-card">
                <div className="completion-mark"><BadgeCheck size={31} /></div>
                <span className="approval-eyebrow">Mission complete</span>
                <h2>Everything allowed is done</h2>
                <p>Four services were updated. Employer details and marketing preferences stayed protected.</p>
                <div className="latest-receipt"><FileCheck2 size={20} /><span><small>Latest action receipt</small><strong>{state.receipts.at(-1)?.receiptId}</strong><em>Human approved · Wavelength</em></span></div>
                <button className="primary-action" onClick={() => setDrawer('receipts')}>Review action receipts <ArrowRight size={17} /></button>
                <button className="quiet-action" onClick={resetMission}><RefreshCw size={14} /> Reset demo mission</button>
              </section>
            )}

            <section className="guardrail-card">
              <header><ShieldCheck size={18} /><span><strong>Your guardrails are active</strong><small>{POLICY.id}</small></span></header>
              <ul>
                <li><Check size={14} /><span>Address and move date allowed</span></li>
                <li><CircleAlert size={14} /><span>Price increases need approval</span></li>
                <li><Ban size={14} /><span>Employer and marketing blocked</span></li>
              </ul>
              <button onClick={() => setDrawer('permissions')}>See all permissions <ChevronRight size={15} /></button>
            </section>
          </aside>
        </div>
      </section>

      {drawer && (
        <div className="drawer-backdrop" onMouseDown={() => setDrawer(null)}>
          <aside className="drawer relay-drawer" aria-modal="true" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close panel"><X size={18} /></button>
            {drawer === 'permissions' && <PermissionsPanel />}
            {drawer === 'receipts' && <ReceiptsPanel state={state} />}
            {drawer === 'activity' && <ActivityPanel activity={state.activity} webmcp={webmcp} />}
            {drawer === 'service' && selectedService && <ServicePanel service={selectedService} />}
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
              <div><dt>Move date</dt><dd>15 September 2026</dd></div>
              <div><dt>New contract</dt><dd>12 months</dd></div>
              <div><dt>Permission scope</dt><dd>This transfer only</dd></div>
            </dl>
            <div className="approval-explainer"><Info size={16} /><span><strong>What RELAY will do</strong>Approve Fibre 300, schedule the transfer, and create a permanent action receipt.</span></div>
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

function PriceChange({ expanded = false }: { expanded?: boolean }) {
  return <div className={`price-comparison ${expanded ? 'expanded' : ''}`}>
    <div><small>Current plan</small><strong>Standard 100</strong><span>£36 <em>/ month</em></span></div>
    <span className="comparison-arrow"><ArrowRight size={17} /></span>
    <div className="proposed"><small>Proposed</small><strong>Fibre 300</strong><span>£42 <em>/ month</em></span></div>
  </div>;
}

function PanelHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return <div className="drawer-heading relay-drawer-heading"><span className="section-kicker">{kicker}</span><h2>{title}</h2><p>{body}</p></div>;
}

function PermissionsPanel() {
  return <><PanelHeading kicker="Delegation policy" title="You set the boundaries." body="RELAY checks this policy before every tool call and refuses anything outside it." />
    <div className="policy-id"><span>Active policy</span><strong>{POLICY.id}</strong><small>Expires {POLICY.expires}</small></div>
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
    {state.receipts.length === 0 ? <div className="empty-panel"><ReceiptText size={25} /><strong>No actions yet</strong><p>Run the mission and verified receipts will appear here in real time.</p></div> : <div className="receipt-list">{[...state.receipts].reverse().map((receipt) => <article className="receipt" key={receipt.receiptId}><div className="receipt-top"><span className="receipt-check"><Check size={12} /></span><span>{receipt.service}</span><code>{receipt.receiptId}</code></div><h3>{receipt.action}</h3><div className="receipt-change"><span>{receipt.before}</span><ArrowRight size={13} /><span>{receipt.after}</span></div><footer><span>{receipt.approvedBy}</span><time>{new Date(receipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</time></footer></article>)}</div>}
  </>;
}

function ActivityPanel({ activity, webmcp }: { activity: RelayState['activity']; webmcp: { supported: boolean | null; registeredCount: number } }) {
  return <><PanelHeading kicker="Agent trace" title="Structured, not simulated." body="This timeline mirrors the same state used by the visible UI and WebMCP callbacks." />
    <div className={`mcp-status ${webmcp.supported ? 'live' : ''}`}><RadioTower size={18} /><div><strong>{webmcp.supported ? 'WebMCP available' : 'Human demo mode'}</strong><span>{webmcp.supported ? `${webmcp.registeredCount} RELAY tools registered` : 'The full visible flow remains available.'}</span></div></div>
    {activity.length === 0 ? <div className="empty-panel"><ActivityIcon size={25} /><strong>Waiting to begin</strong><p>The live agent trace will appear here as each structured action runs.</p></div> : <div className="activity-list">{activity.map((item) => <article key={item.id}><time>{new Date(item.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time><div><span>{item.kind}</span><p>{item.label}</p></div></article>)}</div>}
  </>;
}

function ServicePanel({ service }: { service: RelayService }) {
  return <><PanelHeading kicker="Fictional service" title={service.name} body={service.summary} />
    <div className="provider-preview"><div className="provider-hero"><span className={`provider-big provider-${service.id}`}><ServiceGlyph id={service.id} /></span><div><strong>{service.name}</strong><p>{service.detail}</p></div></div><div className="mock-account"><span>Account holder</span><strong>David Adams</strong><span>Move date</span><strong>15 September 2026</strong></div><a href={`/providers/${service.id}`} target="_blank" rel="noreferrer">Open fictional service site <ExternalLink size={14} /></a></div>
    <section className="tool-list"><p className="section-kicker">RELAY tools for this service</p>{service.tools.length ? service.tools.map((tool) => <code key={tool}>{tool}</code>) : <p className="no-tools">No tools loaded — RELAY blocked this service before discovery.</p>}</section>
  </>;
}
