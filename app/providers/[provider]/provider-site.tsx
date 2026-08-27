'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation avoids a vinext RSC prefetch failure on deployed provider pages. */

import { useEffect, useMemo, useState } from 'react';
import { approveInternetTransfer, beginService, completeService, INITIAL_STATE, requestInternetApproval, startMission, type RelayState } from '@/lib/relay';
import { loadRelayState, mutateRelayState, RELAY_STORAGE_KEY } from '@/lib/relay-storage';

type ProviderConfig = { id: string; name: string; category: string; accent: string; account: string; headline: string };
type ProviderTool = { name: string; description: string; readOnly?: boolean; execute: (input: Record<string, unknown>) => unknown };

function startProvider(serviceId: string) {
  return mutateRelayState((state) => beginService(startMission(state), serviceId));
}

const toolSets: Record<string, ProviderTool[]> = {
  civic: [
    { name: 'council_get_account', description: 'Get the signed-in fictional council account and current registered address.', readOnly: true, execute: () => {
      const state = loadRelayState();
      return { accountId: state.providers.civic.accountId, address: state.providers.civic.registeredAddress, marketingPreferences: state.providers.hearth.marketingPreferences };
    } },
    { name: 'council_preview_move', description: 'Preview a fictional council address change without modifying the account.', readOnly: true, execute: () => {
      const state = startProvider('civic');
      return { status: 'ready', before: state.mission.currentAddress, after: state.mission.newAddress, fee: 0 };
    } },
    { name: 'council_commit_move', description: 'Commit the previously previewed fictional council address change.', execute: () => {
      const state = mutateRelayState((current) => completeService(current, 'civic'));
      return { status: 'completed', receiptId: 'RCT-CIV-0915', address: state.providers.civic.registeredAddress };
    } },
  ],
  northstar: [
    { name: 'energy_check_area', description: 'Check fictional Northstar energy coverage for the new address.', readOnly: true, execute: () => {
      const state = loadRelayState();
      return { available: true, fuel: ['electricity', 'gas'], address: state.mission.newAddress, postcode: state.mission.postcode };
    } },
    { name: 'energy_preview_move', description: 'Preview moving the current fictional energy tariff to a new address.', readOnly: true, execute: () => {
      const state = startProvider('northstar');
      return { status: 'ready', tariff: state.providers.northstar.tariff, estimatedChange: 0, date: state.mission.moveDate };
    } },
    { name: 'energy_schedule_move', description: 'Schedule the previewed fictional energy service move.', execute: () => {
      const state = mutateRelayState((current) => completeService(current, 'northstar'));
      return { status: 'completed', receiptId: 'RCT-ENE-0915', date: state.providers.northstar.moveDate };
    } },
  ],
  clearflow: [
    { name: 'water_get_account', description: 'Get the fictional Clearflow water account and current service address.', readOnly: true, execute: () => {
      const state = loadRelayState();
      return { accountId: state.providers.clearflow.accountId, address: state.providers.clearflow.serviceAddress, plan: state.providers.clearflow.plan };
    } },
    { name: 'water_preview_move', description: 'Preview opening fictional water service at the destination.', readOnly: true, execute: () => {
      const state = startProvider('clearflow');
      return { status: 'ready', plan: state.providers.clearflow.plan, destination: state.mission.newAddress, estimatedChange: 0 };
    } },
    { name: 'water_schedule_move', description: 'Schedule the previewed fictional water service move.', execute: () => {
      const state = mutateRelayState((current) => completeService(current, 'clearflow'));
      return { status: 'completed', receiptId: 'RCT-WTR-0915', address: state.providers.clearflow.serviceAddress };
    } },
  ],
  postway: [
    { name: 'postal_preview_forwarding', description: 'Preview fictional mail forwarding duration, fee, and destination.', readOnly: true, execute: () => {
      const state = startProvider('postway');
      return { status: 'ready', months: state.mission.forwardingMonths, fee: 42, destination: state.mission.newAddress };
    } },
    { name: 'postal_schedule_forwarding', description: 'Schedule the previewed fictional mail forwarding request.', execute: () => {
      const state = mutateRelayState((current) => completeService(current, 'postway'));
      return { status: 'completed', receiptId: 'RCT-PST-0915', months: state.providers.postway.forwardingMonths };
    } },
  ],
  haven: [
    { name: 'insurance_get_policy', description: 'Get the fictional Haven policy, insured address, and monthly premium.', readOnly: true, execute: () => {
      const state = loadRelayState();
      return { accountId: state.providers.haven.accountId, address: state.providers.haven.insuredAddress, cover: state.providers.haven.cover, monthlyPremium: state.providers.haven.monthlyPremium };
    } },
    { name: 'insurance_preview_address_change', description: 'Preview moving fictional home cover without changing the premium.', readOnly: true, execute: () => {
      const state = startProvider('haven');
      return { status: 'ready', destination: state.mission.newAddress, currentPremium: 28, proposedPremium: 28 };
    } },
    { name: 'insurance_commit_address_change', description: 'Commit the previewed fictional insured-address change.', execute: () => {
      const state = mutateRelayState((current) => completeService(current, 'haven'));
      return { status: 'completed', receiptId: 'RCT-HVN-0915', address: state.providers.haven.insuredAddress };
    } },
  ],
  wavelength: [
    { name: 'internet_get_account', description: 'Get the fictional Wavelength account and current broadband plan.', readOnly: true, execute: () => {
      const state = loadRelayState();
      return { accountId: state.providers.wavelength.accountId, plan: state.providers.wavelength.plan, monthlyCost: state.providers.wavelength.monthlyCost, address: state.providers.wavelength.serviceAddress };
    } },
    { name: 'internet_check_availability', description: 'Check fictional Wavelength plans at the destination address.', readOnly: true, execute: () => {
      const state = loadRelayState();
      return { address: state.mission.newAddress, available: [{ proposalId: 'PROP-WAV-300', plan: 'Fibre 300', monthlyCost: 42, contractMonths: 12 }] };
    } },
    { name: 'internet_preview_transfer', description: 'Preview the transfer and enforce the active recurring-cost guardrail.', readOnly: true, execute: () => {
      const state = mutateRelayState((current) => requestInternetApproval(beginService(startMission(current), 'wavelength')));
      return state.approvalStatus === 'approved'
        ? { status: 'completed_within_policy', receiptId: 'RCT-WAV-0915' }
        : { status: 'approval_required', proposalId: 'PROP-WAV-300', increase: 6 };
    } },
    { name: 'internet_commit_transfer', description: 'Commit only after the matching human approval exists.', execute: () => {
      const current = loadRelayState();
      if (!['granted', 'approved'].includes(current.approvalStatus)) return { status: 'denied', reason: 'human_approval_required' };
      const state = mutateRelayState((value) => approveInternetTransfer(value));
      return { status: 'completed', receiptId: state.receipts.at(-1)?.receiptId };
    } },
  ],
};

function providerRows(config: ProviderConfig, state: RelayState) {
  if (config.id === 'civic') return [['Registered address', state.providers.civic.registeredAddress], ['Last updated', state.providers.civic.lastUpdated ? new Date(state.providers.civic.lastUpdated).toLocaleTimeString('en-GB') : 'Not changed']];
  if (config.id === 'northstar') return [['Service address', state.providers.northstar.serviceAddress], ['Move status', state.providers.northstar.moveDate ? `Scheduled · ${state.providers.northstar.moveDate}` : 'Not scheduled']];
  if (config.id === 'clearflow') return [['Service address', state.providers.clearflow.serviceAddress], ['Move status', state.providers.clearflow.moveDate ? `Scheduled · ${state.providers.clearflow.moveDate}` : 'Not scheduled']];
  if (config.id === 'postway') return [['Forwarding address', state.providers.postway.forwardingAddress ?? 'Not active'], ['Duration', state.providers.postway.forwardingMonths ? `${state.providers.postway.forwardingMonths} months` : '—']];
  if (config.id === 'haven') return [['Insured address', state.providers.haven.insuredAddress], ['Cover', `${state.providers.haven.cover} · £${state.providers.haven.monthlyPremium}/mo`]];
  return [['Current plan', `${state.providers.wavelength.plan} · £${state.providers.wavelength.monthlyCost}/mo`], ['Service address', state.providers.wavelength.serviceAddress]];
}

export default function ProviderSite({ config }: { config: ProviderConfig }) {
  const [toolsReady, setToolsReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [relayState, setRelayState] = useState<RelayState>(INITIAL_STATE);
  const rows = useMemo(() => providerRows(config, relayState), [config, relayState]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRelayState(loadRelayState()), 0);
    const sync = (event: StorageEvent) => { if (event.key === RELAY_STORAGE_KEY) setRelayState(loadRelayState()); };
    const sameTabSync = (event: Event) => setRelayState((event as CustomEvent<RelayState>).detail);
    window.addEventListener('storage', sync);
    window.addEventListener('relay-state-change', sameTabSync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage', sync);
      window.removeEventListener('relay-state-change', sameTabSync);
    };
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    const tools = toolSets[config.id] ?? [];
    if (!context?.registerTool) return;
    Promise.all(tools.map((tool) => Promise.resolve(context.registerTool({
      name: tool.name,
      title: tool.name.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '),
      description: tool.description,
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: tool.readOnly ? { readOnlyHint: true } : undefined,
      execute: (input) => tool.execute((input && typeof input === 'object' ? input : {}) as Record<string, unknown>),
    }))))
      .then(() => setToolsReady(true))
      .catch(() => setToolsReady(false));
    return () => { if (context.unregisterTool) tools.forEach((tool) => void context.unregisterTool?.(tool.name)); };
  }, [config.id]);

  return <main className="provider-site" style={{ '--provider-accent': config.accent } as React.CSSProperties}>
    <header className="provider-nav"><a href="/" className="provider-brand"><b>{config.name[0]}</b><span>{config.name}<small>{config.category}</small></span></a><nav><a href="#account">Account</a><a href="#move">Moving home</a><a href="/">Back to RELAY</a></nav></header>
    <section className="provider-page-hero"><div><span className="provider-tag">Persistent fictional account</span><h1>{config.headline}</h1><p>This service reads and writes the same browser-local provider ledger used by RELAY and its WebMCP actions.</p><a href="#move" className="provider-cta">Review live account <span>↓</span></a></div><div className="provider-orb"><span>{config.name[0]}</span><i /></div></section>
    <section className="provider-content" id="account">
      <article><p className="eyebrow">Live account</p><h2>Hello, David.</h2><dl><div><dt>Account number</dt><dd>{config.account}</dd></div>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>
      <article id="move"><p className="eyebrow">WebMCP service</p><h2>{toolsReady ? `${toolSets[config.id]?.length ?? 0} tools ready` : 'Human fallback ready'}</h2><p className="provider-explain">Tool mutations update this account, RELAY’s execution plan, and its receipt ledger together.</p><div className="provider-tool-chips">{toolSets[config.id]?.map((tool) => <code key={tool.name}>{tool.name}</code>)}</div></article>
      {config.id === 'wavelength' && <article className="provider-form-card"><p className="eyebrow">Manual approval form</p><h2>Confirm Fibre 300</h2><p className="provider-explain">An agent may prepare this semantic form, but only you can submit it.</p>{submitted ? <div className="provider-success">✓ Approval recorded for RELAY</div> : <form {...{ toolname: 'wavelength_confirm_plan', tooldescription: 'Prepare the Fibre 300 transfer for manual human confirmation. Do not submit for the user.' }} onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label>Proposal<input name="proposalId" value="PROP-WAV-300" readOnly {...{ toolparamdescription: 'The RELAY proposal identifier.' }} /></label><label>Plan<input name="plan" value="Fibre 300 · £42/month" readOnly /></label><button type="submit">Confirm plan</button></form>}</article>}
    </section>
    <footer className="provider-footer"><span>Fictional demonstration service</span><span>Persistent browser-local ledger · WebMCP ready</span></footer>
  </main>;
}
