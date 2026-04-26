import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNetwork } from '../context/NetworkContext';
import { Share2, Filter, Maximize2, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { formatUnits, type Block } from 'viem';

interface ChartDataPoint {
  time: string;
  gas: number;
  volume: number;
  blockNumber: string;
}

interface ContractDistribution {
  label: string;
  value: string;
  color: string;
  rawPercent: number;
}

export function AnalysisTools() {
  const { client, currentNetwork } = useNetwork();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [distribution, setDistribution] = useState<ContractDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    try {
      setError(null);
      const latestBlock = await client.getBlock();
      const latestNum = latestBlock.number;
      if (!latestNum) return;

      // Fetch last 12 blocks for chart data
      const blockCount = 12;
      const blockPromises: Promise<Block>[] = [];
      for (let i = 0; i < blockCount; i++) {
        const num = latestNum - BigInt(i);
        if (num >= 0n) {
          blockPromises.push(
            client.getBlock({ blockNumber: num, includeTransactions: true })
          );
        }
      }

      const blocks = await Promise.all(blockPromises);
      // Reverse so oldest is first (left of chart)
      blocks.reverse();

      const dataPoints: ChartDataPoint[] = blocks.map((block) => {
        // Gas price: use baseFeePerGas if available (EIP-1559), otherwise estimate from gasUsed
        const baseFee = block.baseFeePerGas
          ? Number(formatUnits(block.baseFeePerGas, 9))
          : 0;

        // Volume = number of transactions in this block
        const txCount = block.transactions?.length || 0;

        // Format block number for x-axis
        const blockNum = block.number?.toString() || '0';

        return {
          time: `#${blockNum.slice(-5)}`,
          gas: Math.round(baseFee * 100) / 100,
          volume: txCount,
          blockNumber: blockNum,
        };
      });

      setChartData(dataPoints);
    } catch (e) {
      console.error('Chart data fetch error:', e);
      setError('Failed to fetch chart data');
    }
  }, [client]);

  const fetchDistribution = useCallback(async () => {
    try {
      const latestBlock = await client.getBlock({
        includeTransactions: true,
      });

      const txs = latestBlock.transactions;
      if (!txs || txs.length === 0 || typeof txs[0] === 'string') {
        // No transactions or only hashes returned
        setDistribution([
          { label: 'No Recent Data', value: '100%', color: 'bg-slate-500', rawPercent: 100 },
        ]);
        return;
      }

      // Categorize transactions by analyzing their properties
      let contractCreations = 0;
      let contractInteractions = 0;
      let plainTransfers = 0;
      let totalTxs = 0;

      for (const tx of txs) {
        if (typeof tx === 'string') continue;
        totalTxs++;

        if (!tx.to) {
          // Contract creation (no 'to' address)
          contractCreations++;
        } else if (tx.input && tx.input !== '0x' && tx.input.length > 2) {
          // Has input data = contract interaction
          contractInteractions++;
        } else {
          // Simple value transfer
          plainTransfers++;
        }
      }

      if (totalTxs === 0) {
        setDistribution([
          { label: 'No Transactions', value: '100%', color: 'bg-slate-500', rawPercent: 100 },
        ]);
        return;
      }

      // Calculate actual percentages
      const creationPct = Math.round((contractCreations / totalTxs) * 100);
      const interactionPct = Math.round((contractInteractions / totalTxs) * 100);
      const transferPct = 100 - creationPct - interactionPct;

      const dist: ContractDistribution[] = [];
      if (interactionPct > 0) {
        dist.push({
          label: 'Contract Calls',
          value: `${interactionPct}%`,
          color: 'bg-indigo-500',
          rawPercent: interactionPct,
        });
      }
      if (transferPct > 0) {
        dist.push({
          label: `${currentNetwork.currency} Transfers`,
          value: `${transferPct}%`,
          color: 'bg-emerald-500',
          rawPercent: transferPct,
        });
      }
      if (creationPct > 0) {
        dist.push({
          label: 'Contract Deployments',
          value: `${creationPct}%`,
          color: 'bg-purple-500',
          rawPercent: creationPct,
        });
      }

      // Sort by percentage descending
      dist.sort((a, b) => b.rawPercent - a.rawPercent);
      setDistribution(dist);
    } catch (e) {
      console.error('Distribution fetch error:', e);
      setDistribution([
        { label: 'Unavailable', value: '100%', color: 'bg-slate-500', rawPercent: 100 },
      ]);
    }
  }, [client, currentNetwork.currency]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchChartData(), fetchDistribution()]);
      setLoading(false);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchChartData, fetchDistribution]);

  return (
    <section className="mt-12 space-y-6">
      <div className="flex justify-between items-end px-2">
        <div>
           <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
             On-chain Pulse
             {loading && <Loader2 size={16} className="text-indigo-400 animate-spin" />}
           </h3>
           <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Live Network Telemetry — {currentNetwork.name}</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-[#1e293b] rounded-md text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center gap-2 border border-[#334155]">
             <Filter size={12}/> Filter
           </button>
           <button className="px-4 py-2 bg-[#1e293b] rounded-md text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center gap-2 border border-[#334155]">
             <Share2 size={12}/> Export
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#0f172a]/40 backdrop-blur-md rounded-none border border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h4 className="font-bold text-lg mb-1 text-white">Network Activity</h4>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-tighter">
                  {error ? error : 'Txn Count vs Base Fee (Recent Blocks)'}
                </p>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <span className="text-[10px] font-bold uppercase text-slate-400">Txn Count</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-bold uppercase text-slate-400">Base Fee (Gwei)</span>
                </div>
             </div>
          </div>
          
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                     <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#ffffff05" fontSize={10} fontWeight="bold" hide />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                     itemStyle={{ color: '#e2e8f0' }}
                     formatter={(value: number, name: string) => {
                       if (name === 'gas') return [`${value} Gwei`, 'Base Fee'];
                       if (name === 'volume') return [`${value} txns`, 'Transactions'];
                       return [value, name];
                     }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2} fill="url(#colorVol)" />
                  <Area type="monotone" dataKey="gas" stroke="#10b981" fill="url(#colorGas)" strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-slate-600 text-sm font-mono">
                  {loading ? 'Fetching block data...' : 'No data available'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-none border border-white/5 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Maximize2 size={120} className="text-white" />
           </div>
           <div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded w-fit mb-6">
                 <Maximize2 size={24} className="text-indigo-400" />
              </div>
              <h4 className="text-2xl font-serif italic mb-2 leading-tight text-white">Transaction<br/>Distribution</h4>
              <p className="text-slate-500 text-xs font-mono uppercase tracking-tighter">Latest Block Analysis</p>
           </div>
           
           <div className="space-y-4">
              {distribution.length > 0 ? (
                distribution.map(item => (
                  <div key={item.label} className="space-y-1">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>{item.label}</span>
                        <span className="text-white">{item.value}</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: item.value }}></div>
                     </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-xs font-mono text-center py-4">
                  {loading ? 'Analyzing...' : 'No data'}
                </div>
              )}
           </div>
        </div>
      </div>
    </section>
  );
}
