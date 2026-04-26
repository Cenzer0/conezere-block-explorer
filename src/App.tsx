import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { useEffect, useState } from 'react';

const queryClient = new QueryClient();

function AppContent() {
  const { currentNetwork } = useNetwork();
  
  // We recreate the wagmi config whenever the network changes
  // This is a bit advanced but needed for "any network" support
  const [config, setConfig] = useState(() => createConfig({
    chains: [mainnet], // dummy
    transports: { [mainnet.id]: http() },
  }));

  useEffect(() => {
    // In a real app, we'd use a dynamic wagmi config
    // For this explorer, we'll use raw viem client for most things read-only
    // but keep wagmi for potential wallet connection
  }, [currentNetwork]);

  return (
    <div className="min-h-screen bg-[#0a0c10] selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <Dashboard />
      <footer className="max-w-7xl mx-auto px-4 py-24 border-t border-white/5 mt-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-indigo-500/50 to-transparent" />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="flex flex-col gap-6">
            <span className="font-serif italic font-black tracking-tighter text-4xl text-white">Conezere<span className="text-indigo-500">.</span></span>
            <p className="text-xs text-slate-500 max-w-xs font-mono uppercase tracking-widest leading-loose opacity-60">
              The definitive ledger analysis interface for custom chain architectures. Engineering precision into the decentralized web.
            </p>
            <div className="flex gap-4">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                 </div>
               ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="flex flex-col gap-4">
              <span className="text-indigo-400">Network</span>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Mainnet</button>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Testnet</button>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Beacon</button>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-indigo-400">Analytics</span>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Gas Tracker</button>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Nodes</button>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Stats</button>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-indigo-400">Resources</span>
              <button className="text-slate-500 hover:text-white transition-colors text-left">Docs</button>
              <button className="text-slate-500 hover:text-white transition-colors text-left">API</button>
              <button className="text-slate-500 hover:text-white transition-colors text-left">GitHub</button>
            </div>
          </div>
        </div>
        
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-mono text-slate-600 uppercase tracking-[0.3em]">
          <span>© 2026 Conezere Labs | All Rights Reserved</span>
          <div className="flex gap-8">
             <span className="hover:text-indigo-400 cursor-pointer transition-colors">Privacy</span>
             <span className="hover:text-indigo-400 cursor-pointer transition-colors">Terms</span>
             <span className="hover:text-indigo-400 cursor-pointer transition-colors">Status: Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <AppContent />
      </NetworkProvider>
    </QueryClientProvider>
  );
}
