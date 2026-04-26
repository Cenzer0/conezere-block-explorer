import { format } from 'date-fns';
import { useNetwork } from '../context/NetworkContext';
import { useState, useEffect } from 'react';
import { Search, Info, Copy, Check, ShieldCheck, Zap, Activity, ExternalLink, Clock } from 'lucide-react';
import { formatAddress, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface DetailsProps {
  type: 'address' | 'tx' | 'block';
  id: string;
  onClose: () => void;
}

export function DetailsView({ type, id, onClose }: DetailsProps) {
  const { client, currentNetwork } = useNetwork();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerLink = () => {
    if (!currentNetwork.explorer) return null;
    const baseUrl = currentNetwork.explorer.endsWith('/') ? currentNetwork.explorer.slice(0, -1) : currentNetwork.explorer;
    if (type === 'address') return `${baseUrl}/address/${id}`;
    if (type === 'tx') return `${baseUrl}/tx/${id}`;
    if (type === 'block') return `${baseUrl}/block/${id}`;
    return null;
  };

  const explorerLink = getExplorerLink();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (type === 'block') {
          const block = await client.getBlock({ blockNumber: BigInt(id) });
          setData(block);
        } else if (type === 'tx') {
          const tx = await client.getTransaction({ hash: id as `0x${string}` });
          setData(tx);
        } else if (type === 'address') {
          const balance = await client.getBalance({ address: id as `0x${string}` });
          const code = await client.getBytecode({ address: id as `0x${string}` });
          setData({ balance, isContract: (code && code !== '0x'), address: id });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, type]);

  const analyzeContract = async () => {
    if (!data?.isContract) return;
    setAnalyzing(true);
    try {
      const code = await client.getBytecode({ address: id as `0x${string}` });
      const prompt = `Analyze this smart contract bytecode and explain its likely purpose and potential security risks in a brief, professional manner for a blockchain explorer. Address: ${id}. Bytecode snippet: ${code?.slice(0, 500)}...`;
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAnalysis(result.text || 'Unable to analyze contract at this time.');
    } catch (e) {
      setAnalysis('Unable to analyze contract at this time.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-2xl z-[100] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.3em] font-black text-white ml-2">Scanning Chain...</span>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:max-w-2xl bg-[#0a0c10] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[100] border-l border-white/5 overflow-y-auto"
    >
      <div className="sticky top-0 bg-[#030712]/80 backdrop-blur-3xl px-6 md:px-12 py-6 md:py-8 border-b border-white/5 flex justify-between items-center z-10">
        <div>
          <span className="text-[10px] uppercase font-black text-indigo-400 tracking-[0.2em] mb-2 block">System Entity</span>
          <h2 className="text-2xl md:text-3xl font-serif italic font-bold text-white flex items-center gap-3">
            {type === 'address' ? (data.isContract ? 'Contract' : 'Identity') : type === 'tx' ? 'Transaction' : 'Block'} 
            <span className="text-white/10">/</span>
          </h2>
        </div>
        <button 
          onClick={onClose} 
          className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all font-black text-slate-500 shadow-inner group"
        >
          <span className="group-hover:scale-110 transition-transform">✕</span>
        </button>
      </div>

      <div className="p-6 md:p-12 space-y-12">
        <div className="bg-[#030712]/40 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-indigo-500/50 rounded-full animate-ping" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">{type} Signature</span>
            <div className="flex gap-4">
              <button 
                onClick={copyToClipboard}
                className="text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Hash Captured</span>}
              </button>
              {explorerLink && (
                <a 
                  href={explorerLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-slate-500 hover:text-indigo-400 transition-colors"
                  title="View on External Node"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <p className="font-mono text-xs md:text-sm break-all font-black text-indigo-300 leading-relaxed tracking-tight">{id}</p>
        </div>

        {type === 'block' && data?.timestamp && (
           <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6 shadow-xl flex items-center gap-6">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                 <Clock size={24} />
              </div>
              <div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Block Timestamp</span>
                 <div className="text-xl font-mono font-bold text-white">
                    {format(new Date(Number(data.timestamp) * 1000), 'PPPpp')}
                 </div>
                 <div className="text-[10px] text-slate-500 font-mono italic mt-1">
                    UNIX: {data.timestamp.toString()}
                 </div>
              </div>
           </div>
        )}

        {type === 'address' && (
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2 tracking-widest">Balance</span>
                <div className="text-2xl font-mono font-bold text-white">{(Number(data.balance) / 1e18).toFixed(4)} <span className="text-xs text-indigo-400">{currentNetwork.currency}</span></div>
             </div>
             <div className="p-6 rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2 tracking-widest">Type</span>
                <div className="text-2xl font-serif italic font-bold text-white">{data.isContract ? 'Contract' : 'EOA'}</div>
             </div>
          </div>
        )}

        {data?.isContract && (
          <div className="space-y-4">
             <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-indigo-500/30 p-6 rounded-xl relative overflow-hidden shadow-2xl shadow-indigo-500/5">
                <div className="flex items-center gap-3 mb-4 relative z-10">
                   <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20"><ShieldCheck size={20}/></div>
                   <div>
                      <h4 className="font-bold text-white leading-tight">Contract Analysis</h4>
                      <p className="text-[10px] text-indigo-400/60 uppercase tracking-widest font-bold">Powered by Gemini AI Intelligence</p>
                   </div>
                </div>
                
                {analysis ? (
                  <div className="text-slate-300 text-sm border-t border-indigo-500/10 pt-4 leading-relaxed relative z-10">
                     {analysis}
                  </div>
                ) : (
                  <button 
                    onClick={analyzeContract}
                    disabled={analyzing}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 relative z-10 shadow-xl shadow-indigo-500/10"
                  >
                    {analyzing ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
                    {analyzing ? 'Scanning Bytecode...' : 'Deep Scan Architecture'}
                  </button>
                )}
             </div>
          </div>
        )}

        <div className="space-y-4">
           <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Technical Attributes</h4>
           <div className="divide-y divide-[#1e293b] border-y border-[#1e293b]">
              {Object.entries(data || {}).map(([key, val]) => (
                key !== 'transactions' && typeof val !== 'object' && key !== 'isContract' && (
                  <div key={key} className="py-4 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-tighter">{key}</span>
                    <span className="font-mono text-indigo-300 bg-[#1e293b]/30 px-2 py-1 rounded">{String(val)}</span>
                  </div>
                )
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
