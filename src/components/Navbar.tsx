import { useNetwork } from '../context/NetworkContext';
import { Search, Globe, Plus, Cpu, Wallet } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { currentNetwork, networks, setCurrentNetwork, addNetwork } = useNetwork();
  const [showAdd, setShowAdd] = useState(false);
  const [newNet, setNewNet] = useState({ name: '', rpcUrl: '', id: '', currency: '', explorer: '' });
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
       try {
         const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
         setAddress(accounts[0]);
       } catch (e) {
         console.error('Wallet error:', e);
       }
    } else {
       alert('Please install MetaMask!');
    }
  };

  const handleAdd = (e: React.FormEvent) => {
// ...
    e.preventDefault();
    addNetwork({
      id: Number(newNet.id),
      name: newNet.name,
      rpcUrl: newNet.rpcUrl,
      currency: newNet.currency,
      explorer: newNet.explorer,
    });
    setShowAdd(false);
    setNewNet({ name: '', rpcUrl: '', id: '', currency: '', explorer: '' });
  };

  return (
    <>
      <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-4xl">
      <nav className="px-4 md:px-8 py-2 md:py-3 bg-[#030712]/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] flex items-center justify-between transition-all hover:border-white/20">
        <div className="flex items-center gap-4 md:gap-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <span className="font-serif italic font-black text-lg md:text-xl tracking-tighter text-white">Conezere<span className="text-indigo-500">.</span></span>
          </motion.div>
        </div>

      <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={connectWallet}
            className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all text-[9.5px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-white/5"
          >
            <Wallet size={12} className="text-indigo-400" />
            <span className="hidden xs:inline">{address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Connect'}</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-0.5 md:mx-1" />

          <div className="relative group">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 hover:text-white hover:border-indigo-500/40 transition-all text-[9.5px] md:text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="max-w-[70px] md:max-w-none truncate">{currentNetwork.name}</span>
            </motion.button>
            
            <div className="absolute right-0 top-full mt-4 w-64 bg-[#030712]/90 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-3 overflow-hidden z-[70]">
              <div className="px-6 py-2 text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Active Networks</div>
              {networks.map(net => (
                <button
                  key={net.id}
                  onClick={() => setCurrentNetwork(net)}
                  className={`w-full text-left px-6 py-2.5 hover:bg-indigo-500/20 hover:text-white transition-colors text-xs font-bold ${currentNetwork.id === net.id ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-400'}`}
                >
                  {net.name}
                </button>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2">
                <button 
                  onClick={() => setShowAdd(true)}
                  className="w-full text-left px-6 py-3 hover:bg-white/5 text-indigo-400 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Plus size={12} />
                  </div>
                  Add Custom Network
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(79,70,229,0.1)] border border-[#1e293b]"
            >
              <h3 className="text-2xl font-serif italic font-bold mb-6 text-white text-center">Add Network</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-widest">Network Name</label>
                  <input 
                    required
                    value={newNet.name}
                    onChange={e => setNewNet({...newNet, name: e.target.value})}
                    className="w-full bg-[#1e293b] px-4 py-2.5 rounded-lg border border-[#334155] focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 text-sm"
                    placeholder="Nexus Chain"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-widest">RPC URL</label>
                  <input 
                    required
                    value={newNet.rpcUrl}
                    onChange={e => setNewNet({...newNet, rpcUrl: e.target.value})}
                    className="w-full bg-[#1e293b] px-4 py-2.5 rounded-lg border border-[#334155] focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 text-sm"
                    placeholder="https://rpc.nexus..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-widest">Chain ID</label>
                    <input 
                      required
                      value={newNet.id}
                      onChange={e => setNewNet({...newNet, id: e.target.value})}
                      className="w-full bg-[#1e293b] px-4 py-2.5 rounded-lg border border-[#334155] focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 text-sm font-mono"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-widest">Currency</label>
                    <input 
                      required
                      value={newNet.currency}
                      onChange={e => setNewNet({...newNet, currency: e.target.value})}
                      className="w-full bg-[#1e293b] px-4 py-2.5 rounded-lg border border-[#334155] focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 text-sm font-mono"
                      placeholder="ETH"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-widest">Explorer URL (Optional)</label>
                  <input 
                    value={newNet.explorer}
                    onChange={e => setNewNet({...newNet, explorer: e.target.value})}
                    className="w-full bg-[#1e293b] px-4 py-2.5 rounded-lg border border-[#334155] focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 text-sm"
                    placeholder="https://etherscan.io"
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#334155] text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                  >
                    Add Chain
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
