import { useNetwork } from '../context/NetworkContext';
import { formatAddress, formatHash } from '../lib/utils';
import { useState, useEffect, useRef } from 'react';
import type { Block, Transaction } from 'viem';
import { formatUnits } from 'viem';
import { Box, ArrowRight, Clock, Hash, Fuel, ExternalLink, Activity, Search as SearchIcon, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DetailsView } from '../components/DetailsView';
import { AnimatePresence, motion } from 'motion/react';
import { AnalysisTools } from '../components/AnalysisTools';

export function Dashboard() {
  const { client, currentNetwork } = useNetwork();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ gasPrice: '0', tps: '0', utilization: '0', peerCount: '—' });
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'address' | 'tx' | 'block', id: string } | null>(null);
  const prevBlockNum = useRef<bigint | null>(null);

  useEffect(() => {
    // Reset state when network changes
    setBlocks([]);
    setTransactions([]);
    setStats({ gasPrice: '0', tps: '0', utilization: '0', peerCount: '—' });
    prevBlockNum.current = null;
  }, [currentNetwork.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const latestBlock = await client.getBlock({ includeTransactions: true });
        
        // Deduplicate and store blocks
        setBlocks(prev => {
          const exists = prev.find(b => b.number === latestBlock.number);
          if (exists) return prev;
          return [latestBlock, ...prev].slice(0, 10);
        });
        
        // Store transactions
        if (latestBlock.transactions.length > 0) {
          const firstTx = latestBlock.transactions[0];
          if (typeof firstTx !== 'string') {
            setTransactions(prev => {
               const newTxs = latestBlock.transactions as Transaction[];
               const combined = [...newTxs, ...prev];
               const unique = combined.filter((v, i, a) => a.findIndex(t => t.hash === v.hash) === i);
               return unique.slice(0, 15);
            });
          }
        }

        // --- Real gas price from RPC ---
        let gasPriceGwei = '0';
        try {
          const gasPrice = await client.getGasPrice();
          gasPriceGwei = (Number(formatUnits(gasPrice, 9))).toFixed(2);
        } catch {
          // Fallback: use baseFeePerGas from latest block
          if (latestBlock.baseFeePerGas) {
            gasPriceGwei = (Number(formatUnits(latestBlock.baseFeePerGas, 9))).toFixed(2);
          }
        }

        // --- Real TPS: compute from the previous block ---
        let tps = '0.0';
        try {
          if (latestBlock.number && latestBlock.number > 1n) {
            const prevBlock = await client.getBlock({ blockNumber: latestBlock.number - 1n });
            const timeDelta = Number(latestBlock.timestamp - prevBlock.timestamp);
            if (timeDelta > 0) {
              const txCount = latestBlock.transactions.length;
              tps = (txCount / timeDelta).toFixed(1);
            }
          }
        } catch {
          tps = '—';
        }

        // --- Real block utilization (gasUsed / gasLimit) ---
        let utilization = '0';
        if (latestBlock.gasLimit && latestBlock.gasLimit > 0n) {
          const pct = (Number(latestBlock.gasUsed) / Number(latestBlock.gasLimit)) * 100;
          utilization = pct.toFixed(1);
        }

        // --- Peer count (if supported by RPC) ---
        let peerCount = '—';
        try {
          // Some RPCs don't support this, so we catch silently
          const result = await (client as any).request({ method: 'net_peerCount' });
          if (result) {
            peerCount = String(parseInt(result, 16));
          }
        } catch {
          // Not supported by most public RPCs, that's fine
        }

        setStats({
          gasPrice: gasPriceGwei,
          tps,
          utilization,
          peerCount,
        });

        prevBlockNum.current = latestBlock.number;
      } catch (e) {
        console.error('Fetch error:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [client, currentNetwork.id]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!search) return;

    if (search.startsWith('0x')) {
      if (search.length === 66) {
        setSelectedEntity({ type: 'tx', id: search });
      } else if (search.length === 42) {
        setSelectedEntity({ type: 'address', id: search });
      }
    } else if (!isNaN(Number(search))) {
      setSelectedEntity({ type: 'block', id: search });
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 relative bg-transparent pt-32">
      <AnimatePresence>
        {selectedEntity && (
          <DetailsView 
            type={selectedEntity.type} 
            id={selectedEntity.id} 
            onClose={() => setSelectedEntity(null)} 
          />
        )}
      </AnimatePresence>

      <section className="py-24 flex flex-col items-center text-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
        
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-indigo-500/10 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
        >
          Institutional Grade Chain Monitoring
        </motion.div>
        
        <h1 className="text-7xl md:text-9xl font-serif italic font-bold tracking-tighter mb-6 leading-none text-white">
          Conezere <span className="text-indigo-400">Scan.</span>
        </h1>
        
        <p className="text-slate-400 mb-12 font-mono text-[10px] uppercase tracking-[0.4em] max-w-lg opacity-80">
          Deciphering {currentNetwork.name} Architecture in Real-time
        </p>
        
        <form onSubmit={handleSearch} className="w-full max-w-3xl relative group px-4">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Address / Txn Hash / Block..."
              className="w-full px-10 py-6 bg-[#030712]/40 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] focus:border-indigo-500/50 outline-none text-base md:text-xl transition-all font-mono text-white placeholder:text-slate-600 tracking-tight"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
               <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center gap-2">
                 <SearchIcon size={14}/>
                 <span className="hidden sm:inline">Explore</span>
               </button>
            </div>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Block Utilization', value: `${stats.utilization}%`, sub: Number(stats.utilization) > 80 ? 'High Load' : Number(stats.utilization) > 50 ? 'Moderate' : 'Low Load', icon: <Cpu size={18} className="text-indigo-400" /> },
          { label: 'Gas Protocol', value: `${stats.gasPrice} Gwei`, sub: Number(stats.gasPrice) < 15 ? 'Optimal' : Number(stats.gasPrice) < 50 ? 'Moderate' : 'Congested', icon: <Fuel size={18} className="text-amber-400" /> },
          { label: 'Velocity', value: stats.tps, sub: 'TX/S Active', icon: <Activity size={18} className="text-purple-400" /> },
          { label: 'Network Peers', value: stats.peerCount, sub: stats.peerCount !== '—' ? 'Connected Nodes' : 'Not Available', icon: <TrendingUp size={18} className="text-emerald-400" /> },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#030712]/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 shadow-2xl hover:border-indigo-500/40 transition-all cursor-default group"
          >
            <div className="flex justify-between items-start mb-8">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.3em]">{stat.label}</span>
              <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">{stat.icon}</div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-mono font-black tracking-tighter text-white leading-none">{stat.value}</span>
              <div className="flex items-center gap-2 mt-2">
                {stat.sub && <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{stat.sub}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnalysisTools />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Blocks Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-4">
            <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
              Network Pulse <span className="text-indigo-500/40 font-mono text-sm not-italic font-black flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live</span>
            </h3>
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors">Archive View</button>
          </div>
          <div className="bg-[#030712]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5">
              {blocks.map((block, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={block.number?.toString()} 
                  onClick={() => setSelectedEntity({ type: 'block', id: String(block.number) })}
                  className="px-8 py-6 hover:bg-white/[0.02] group transition-all cursor-pointer flex justify-between items-center border-l-4 border-transparent hover:border-indigo-500"
                >
                  <div className="flex gap-6 items-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-mono text-xs text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                      BK
                    </div>
                    <div>
                      <div className="font-mono text-lg font-black text-white group-hover:text-indigo-300 transition-colors">#{block.number?.toString()}</div>
                      <div className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(Number(block.timestamp) * 1000))} ago
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-600 mb-1">Validator Node</div>
                    <div className="text-xs font-mono text-indigo-400/80">{formatAddress(block.miner)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Transactions Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-4">
            <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
              Broadcasting <span className="text-indigo-500/40 font-mono text-sm not-italic font-black uppercase tracking-widest">Mem-Pool</span>
            </h3>
            <button className="text-[10px] bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all font-black uppercase tracking-widest">Explorer</button>
          </div>
          <div className="bg-[#030712]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5">
              {transactions.map((tx, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={tx.hash} 
                  onClick={() => setSelectedEntity({ type: 'tx', id: tx.hash })}
                  className="px-8 py-6 hover:bg-white/[0.02] group transition-all cursor-pointer flex justify-between items-center border-l-4 border-transparent hover:border-emerald-500"
                >
                  <div className="flex gap-6 items-center">
                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-emerald-500/20 transition-all border border-white/5 group-hover:border-emerald-500/30">
                      <Hash size={18} className="text-indigo-400 group-hover:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-black text-white group-hover:text-emerald-300 transition-colors truncate w-32 md:w-48">
                        {formatHash(tx.hash)}
                      </div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">
                        Origin <span className="text-indigo-400">{formatAddress(tx.from)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-mono font-black text-white">
                      {(Number(tx.value) / 1e18).toFixed(4)} <span className="text-xs text-indigo-400">{currentNetwork.currency}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-2">
                       <ShieldCheck size={10} /> Validated
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

