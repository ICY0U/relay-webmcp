'use client';

import { useMemo, useState } from 'react';
import { approveInternetTransfer, INITIAL_STATE, POLICY, type RelayService, type RelayState } from '@/lib/relay';
import { useWebMCP } from '@/lib/use-webmcp';

type Drawer = 'permissions' | 'receipts' | 'activity' | 'service' | null;

export default function RelayApp() {
  const [state, setState] = useState<RelayState>(INITIAL_STATE);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [selectedService, setSelectedService] = useState<RelayService | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const commitTransfer = () => {
    setState((current) => approveInternetTransfer(current));
    setApprovalOpen(false);
    setToast('Approved and completed · receipt created');
    window.setTimeout(() => setToast(null), 3200);
  };
  const webmcp = useWebMCP(state, () => setApprovalOpen(true), commitTransfer);
  const allowed = state.services.filter((service) => service.tone !== 'blocked');
  const completed = allowed.filter((service) => service.tone === 'done').length;
  const isComplete = state.approvalStatus === 'approved';
  const percentage = Math.round((completed / allowed.length) * 100);

  const activity = useMemo(() => [
    { time: '13:18:08', label: 'Postway created a forwarding receipt', kind: 'Tool result' },
    { time: '13:18:04', label: 'Northstar scheduled the energy move', kind: 'Tool call' },
    { time: '13:18:00', label: 'Civic committed the address update', kind: 'Tool call' },
    { time: '13:17:54', label: 'RELAY checked your delegation policy', kind: 'Policy check' },
  ], []);

  function openService(service: RelayService) {
    setSelectedService(service);
    setDrawer('service');
  }

  return (
    <main className="app-shell">
      <aside className="rail" aria-label="Primary navigation">
        <button className="brand-mark" aria-label="Relay home" onClick={() => setDrawer(null)}>R</button>
        <nav className="rail-nav">
          <button className={`rail-button ${drawer === null ? 'active' : ''}`} onClick={() => setDrawer(null)} aria-label="Mission"><span>⌁</span></button>
          <button className={`rail-button ${drawer === 'activity' ? 'active' : ''}`} onClick={() => setDrawer('activity')} aria-label="Activity"><span>↗</span></button>
          <button className={`rail-button ${drawer === 'permissions' ? 'active' : ''}`} onClick={() => setDrawer('permissions')} aria-label="Permissions"><span>◇</span></button>
          <button className={`rail-button ${drawer === 'receipts' ? 'active' : ''}`} onClick={() => setDrawer('receipts')} aria-label="Receipts"><span>▤</span></button>
        </nav>
        <button className="rail-button profile" aria-label="Profile">DA</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">Mission control</p><h1>Moving home</h1></div>
          <div className="topbar-actions">
            <span className={`secure-badge ${webmcp.supported ? 'connected' : ''}`} title={webmcp.supported ? `${webmcp.registeredCount} tools registered` : 'Use ChatGPT browser or Chrome with WebMCP enabled'}>
              <i /> {webmcp.supported ? `${webmcp.registeredCount} WebMCP tools live` : 'Safe local mode'}
            </span>
            <button className="ghost-button" onClick={() => setDrawer('permissions')} aria-label="Mission options">•••</button>
          </div>
        </header>

        <div className="mission-layout">
          <section className="mission-main">
            <div className={`mission-summary ${isComplete ? 'complete' : ''}`}>
              <div>
                <span className="status-pill running"><i /> {isComplete ? 'Mission complete' : 'Mission in progress'}</span>
                <h2>{isComplete ? 'Everything allowed is done.' : 'Your move is almost coordinated.'}</h2>
                <p>{isComplete ? '4 actions completed. One protected service was left untouched.' : '3 of 4 allowed actions completed. One decision needs your approval.'}</p>
              </div>
              <div className="progress-orbit" style={{ '--progress': `${percentage}%` } as React.CSSProperties} aria-label={`${percentage} percent complete`}><span>{percentage}%</span></div>
            </div>

            <div className="intent-card">
              <div className="intent-icon">✦</div>
              <div><p className="card-label">Your intent</p><p className="intent-copy">“I’m moving on September 15. Update everything, but don’t change my employer details or any marketing preferences.”</p></div>
              <button className="text-button" onClick={() => setDrawer('permissions')}>View rules</button>
            </div>

            <div className="section-heading">
              <div><p className="eyebrow">Live execution</p><h3>Service plan</h3></div>
              <span className="muted-time">Updated just now</span>
            </div>

            <div className="service-list" data-testid="service-list">
              {state.services.map((service, index) => (
                <article className={`service-row ${service.tone}`} key={service.id} onClick={() => openService(service)}>
                  <div className="step-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="service-icon">{service.icon}</div>
                  <div className="service-copy"><strong>{service.name}</strong><span>{service.detail}</span></div>
                  <span className={`service-status ${service.tone}`}><i /> {service.status}</span>
                  <button className="row-action" aria-label={`Open ${service.name}`}>›</button>
                </article>
              ))}
            </div>
          </section>

          {!isComplete ? (
            <aside className="decision-panel" data-testid="approval-card">
              <div className="decision-accent" />
              <div className="decision-heading"><span className="status-pill review"><i /> Approval required</span><span className="decision-count">1 of 1</span></div>
              <div className="provider-lockup"><div className="provider-logo">W</div><div><strong>Wavelength</strong><span>Internet transfer</span></div></div>
              <h2>Your current plan isn’t available at the new address.</h2>
              <p className="decision-body">Wavelength found a faster plan, but it changes your monthly price. RELAY paused before making the change.</p>
              <PriceChange />
              <div className="permission-note"><span>◇</span><p><strong>Your approval boundary</strong>RELAY must ask before increasing a recurring cost.</p></div>
              <button className="primary-button" onClick={() => setApprovalOpen(true)}>Review & approve <span>→</span></button>
              <button className="secondary-button" onClick={() => openService(state.services[3])}>Choose another option</button>
              <p className="safety-copy">No changes will be made until you approve.</p>
            </aside>
          ) : (
            <aside className="decision-panel success-panel" data-testid="completion-card">
              <div className="success-seal">✓</div>
              <p className="eyebrow">Mission complete</p>
              <h2>Your move is coordinated.</h2>
              <p className="decision-body">Every action allowed by your delegation is complete. Employer records and marketing preferences remained untouched.</p>
              <div className="final-receipt">
                <span>Latest receipt</span>
                <strong>{state.receipts.at(-1)?.receiptId}</strong>
                <small>Human approved · Wavelength</small>
              </div>
              <button className="primary-button" onClick={() => setDrawer('receipts')}>View all receipts <span>→</span></button>
              <button className="secondary-button" onClick={() => setState(INITIAL_STATE)}>Reset demo mission</button>
            </aside>
          )}
        </div>
      </section>

      {drawer && (
        <div className="drawer-backdrop" onMouseDown={() => setDrawer(null)}>
          <aside className="drawer" aria-modal="true" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close panel">×</button>
            {drawer === 'permissions' && <PermissionsPanel />}
            {drawer === 'receipts' && <ReceiptsPanel state={state} />}
            {drawer === 'activity' && <ActivityPanel activity={activity} webmcp={webmcp} />}
            {drawer === 'service' && selectedService && <ServicePanel service={selectedService} />}
          </aside>
        </div>
      )}

      {approvalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setApprovalOpen(false)}>
          <section className="approval-modal" aria-modal="true" role="dialog" aria-labelledby="approval-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setApprovalOpen(false)} aria-label="Close approval">×</button>
            <span className="modal-kicker">Human checkpoint · PROP-WAV-300</span>
            <h2 id="approval-title">Approve a £6 monthly increase?</h2>
            <p>Confirm the exact change below. This approval is single-use and applies only to this proposal.</p>
            <PriceChange />
            <dl className="approval-facts">
              <div><dt>Move date</dt><dd>15 September 2026</dd></div>
              <div><dt>Contract</dt><dd>12 months</dd></div>
              <div><dt>Permission</dt><dd>One action only</dd></div>
            </dl>
            <form {...{ toolname: 'relay_approve_internet_proposal', tooldescription: 'Present the Wavelength proposal for manual human approval. The agent may fill this form but cannot submit it.' }} onSubmit={(event) => { event.preventDefault(); commitTransfer(); }}>
              <input type="hidden" name="proposalId" value="PROP-WAV-300" {...{ toolparamdescription: 'The exact proposal awaiting human approval.' }} />
              <button className="primary-button" type="submit">Approve once & continue <span>→</span></button>
            </form>
            <button className="secondary-button" onClick={() => setApprovalOpen(false)}>Not now</button>
            <p className="safety-copy">Only you can press approve. RELAY records the decision.</p>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
      <div className="frame-bank" aria-hidden="true">
        {state.services.filter((service) => service.tools.length).map((service) => <iframe key={service.id} src={`/providers/${service.id}`} title={`${service.name} WebMCP provider`} allow="tools" />)}
      </div>
    </main>
  );
}

function PriceChange() {
  return <div className="price-card"><div><span>Current</span><strong>£36<span>/mo</span></strong></div><div className="price-arrow">→</div><div><span>New plan</span><strong>£42<span>/mo</span></strong></div></div>;
}

function PanelHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return <div className="drawer-heading"><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{body}</p></div>;
}

function PermissionsPanel() {
  return <><PanelHeading kicker="Delegation policy" title="You decide the boundaries." body="RELAY checks this policy before every tool call and refuses anything outside it." />
    <div className="policy-id"><span>Active policy</span><strong>{POLICY.id}</strong><small>Expires {POLICY.expires}</small></div>
    <PolicyGroup tone="allow" title="Agent may use" items={POLICY.allowed} />
    <PolicyGroup tone="review" title="Always ask me" items={POLICY.approvalRequired} />
    <PolicyGroup tone="deny" title="Never change" items={POLICY.forbidden} />
  </>;
}

function PolicyGroup({ tone, title, items }: { tone: string; title: string; items: string[] }) {
  return <section className={`policy-group ${tone}`}><h3><i />{title}</h3>{items.map((item) => <p key={item}><span>{tone === 'deny' ? '×' : '✓'}</span>{item}</p>)}</section>;
}

function ReceiptsPanel({ state }: { state: RelayState }) {
  return <><PanelHeading kicker="Append-only audit" title={`${state.receipts.length} action receipts`} body="Every external change has a compact, inspectable record." />
    <div className="receipt-list">{[...state.receipts].reverse().map((receipt) => <article className="receipt" key={receipt.receiptId}><div className="receipt-top"><span className="receipt-check">✓</span><span>{receipt.service}</span><code>{receipt.receiptId}</code></div><h3>{receipt.action}</h3><div className="receipt-change"><span>{receipt.before}</span><b>→</b><span>{receipt.after}</span></div><footer><span>{receipt.approvedBy}</span><time>{new Date(receipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</time></footer></article>)}</div>
  </>;
}

function ActivityPanel({ activity, webmcp }: { activity: { time: string; label: string; kind: string }[]; webmcp: { supported: boolean | null; registeredCount: number } }) {
  return <><PanelHeading kicker="Agent trace" title="Structured, not simulated." body="This timeline mirrors the same state used by the visible UI and WebMCP callbacks." />
    <div className={`mcp-status ${webmcp.supported ? 'live' : ''}`}><i /><div><strong>{webmcp.supported ? 'WebMCP available' : 'Browser API unavailable'}</strong><span>{webmcp.supported ? `${webmcp.registeredCount} RELAY tools registered` : 'The human demo remains fully usable.'}</span></div></div>
    <div className="activity-list">{activity.map((item) => <article key={item.time}><time>{item.time}</time><div><span>{item.kind}</span><p>{item.label}</p></div></article>)}</div>
  </>;
}

function ServicePanel({ service }: { service: RelayService }) {
  return <><PanelHeading kicker="Fictional service" title={service.name} body={service.summary} />
    <div className="provider-preview"><div className="provider-hero"><span className={`provider-big provider-${service.id}`}>{service.icon}</span><div><strong>{service.name}</strong><p>{service.detail}</p></div></div><div className="mock-account"><span>Account holder</span><strong>David Adams</strong><span>Move date</span><strong>15 September 2026</strong></div><a href={`/providers/${service.id}`} target="_blank" rel="noreferrer">Open fictional service site <span>↗</span></a></div>
    <section className="tool-list"><p className="eyebrow">Tools exposed by this service</p>{service.tools.length ? service.tools.map((tool) => <code key={tool}>{tool}</code>) : <p className="no-tools">No tools loaded—RELAY blocked this service before discovery.</p>}</section>
  </>;
}
