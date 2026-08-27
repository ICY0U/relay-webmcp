import ProviderSite from './provider-site';

const providers = {
  civic: { id: 'civic', name: 'Civic', category: 'Council services', accent: '#197052', account: 'CT-1842-77', headline: 'Your home, connected to your council.' },
  northstar: { id: 'northstar', name: 'Northstar', category: 'Energy', accent: '#e89125', account: 'NS-9401-38', headline: 'Power that moves with you.' },
  postway: { id: 'postway', name: 'Postway', category: 'Postal services', accent: '#d54e4e', account: 'PW-3840-11', headline: 'Your post, wherever life goes.' },
  wavelength: { id: 'wavelength', name: 'Wavelength', category: 'Broadband', accent: '#4262d0', account: 'WV-7719-04', headline: 'Faster internet at your new home.' },
} as const;

export default async function ProviderPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const config = providers[provider as keyof typeof providers] ?? providers.civic;
  return <ProviderSite config={config} />;
}
