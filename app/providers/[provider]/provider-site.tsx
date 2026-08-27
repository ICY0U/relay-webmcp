'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ProviderConfig = { id: string; name: string; category: string; accent: string; account: string; headline: string };

const toolSets: Record<string, Array<{ name: string; description: string; readOnly?: boolean; execute: (input: Record<string, unknown>) => unknown }>> = {
  civic: [
    { name: 'council_get_account', description: 'Get the signed-in fictional council account and current registered address.', readOnly: true, execute: () => ({ accountId: 'CT-1842-77', address: '42 Willow Road', marketingPreferences: 'unchanged' }) },
    { name: 'council_preview_move', description: 'Preview a fictional council address change without modifying the account.', readOnly: true, execute: () => ({ status: 'ready', before: '42 Willow Road', after: '18 River Lane', fee: 0 }) },
    { name: 'council_commit_move', description: 'Commit the previously previewed fictional council address change.', execute: () => ({ status: 'completed', receiptId: 'RCT-CIV-0915', address: '18 River Lane' }) },
  ],
  northstar: [
    { name: 'energy_check_area', description: 'Check fictional Northstar energy coverage for the new address.', readOnly: true, execute: () => ({ available: true, fuel: ['electricity', 'gas'], address: '18 River Lane' }) },
    { name: 'energy_preview_move', description: 'Preview moving the current fictional energy tariff to a new address.', readOnly: true, execute: () => ({ status: 'ready', tariff: 'Northstar Flex', estimatedChange: 0 }) },
    { name: 'energy_schedule_move', description: 'Schedule the previewed fictional energy service move.', execute: () => ({ status: 'completed', receiptId: 'RCT-ENE-0915', date: '2026-09-15' }) },
  ],
  postway: [
    { name: 'postal_preview_forwarding', description: 'Preview fictional mail forwarding duration, fee, and destination.', readOnly: true, execute: () => ({ status: 'ready', months: 6, fee: 42, destination: '18 River Lane' }) },
    { name: 'postal_schedule_forwarding', description: 'Schedule the previewed fictional mail forwarding request.', execute: () => ({ status: 'completed', receiptId: 'RCT-PST-0915', months: 6 }) },
  ],
  wavelength: [
    { name: 'internet_get_account', description: 'Get the fictional Wavelength account and current broadband plan.', readOnly: true, execute: () => ({ accountId: 'WV-7719-04', plan: 'Standard 100', monthlyCost: 36 }) },
    { name: 'internet_check_availability', description: 'Check fictional Wavelength plans at the destination address.', readOnly: true, execute: () => ({ available: [{ plan: 'Fibre 300', monthlyCost: 42, contractMonths: 12 }] }) },
  ],
};

export default function ProviderSite({ config }: { config: ProviderConfig }) {
  const [toolsReady, setToolsReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    <header className="provider-nav"><Link href="/" className="provider-brand"><b>{config.name[0]}</b><span>{config.name}<small>{config.category}</small></span></Link><nav><a href="#account">Account</a><a href="#move">Moving home</a><Link href="/">Back to RELAY</Link></nav></header>
    <section className="provider-page-hero"><div><span className="provider-tag">Moving home</span><h1>{config.headline}</h1><p>This fictional service demonstrates how independent websites expose precise actions to RELAY through WebMCP.</p><a href="#move" className="provider-cta">Review your move <span>↓</span></a></div><div className="provider-orb"><span>{config.name[0]}</span><i /></div></section>
    <section className="provider-content" id="account">
      <article><p className="eyebrow">Account</p><h2>Hello, David.</h2><dl><div><dt>Account number</dt><dd>{config.account}</dd></div><div><dt>Current address</dt><dd>42 Willow Road</dd></div><div><dt>Move date</dt><dd>15 September 2026</dd></div></dl></article>
      <article id="move"><p className="eyebrow">WebMCP service</p><h2>{toolsReady ? `${toolSets[config.id]?.length ?? 0} tools ready` : 'Human fallback ready'}</h2><p className="provider-explain">The agent and this page share the same structured actions. Every change is validated and reflected visibly.</p><div className="provider-tool-chips">{toolSets[config.id]?.map((tool) => <code key={tool.name}>{tool.name}</code>)}</div></article>
      {config.id === 'wavelength' && <article className="provider-form-card"><p className="eyebrow">Manual approval form</p><h2>Confirm Fibre 300</h2><p className="provider-explain">An agent may prepare this semantic form, but only you can submit it.</p>{submitted ? <div className="provider-success">✓ Approval recorded for RELAY</div> : <form {...{ toolname: 'wavelength_confirm_plan', tooldescription: 'Prepare the Fibre 300 transfer for manual human confirmation. Do not submit for the user.' }} onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label>Proposal<input name="proposalId" value="PROP-WAV-300" readOnly {...{ toolparamdescription: 'The RELAY proposal identifier.' }} /></label><label>Plan<input name="plan" value="Fibre 300 · £42/month" readOnly /></label><button type="submit">Confirm plan</button></form>}</article>}
    </section>
    <footer className="provider-footer"><span>Fictional demonstration service</span><span>Powered by structured WebMCP tools</span></footer>
  </main>;
}
