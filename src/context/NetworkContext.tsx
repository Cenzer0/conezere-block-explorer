import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPublicClient, http, defineChain, type PublicClient } from 'viem';
import { mainnet, polygon, arbitrum, optimism, bsc } from 'viem/chains';

export interface NetworkConfig {
  id: number;
  name: string;
  rpcUrl: string;
  icon?: string;
  currency: string;
  explorer?: string;
}

const DEFAULT_NETWORKS: NetworkConfig[] = [
  { id: 1409, name: 'Conezere Mainnet', rpcUrl: 'http://34.46.9.227/ext/bc/2uGdV4SxbfenVSF7iaLuQm3cUUYTZRWSergBZKXvCATrz5uZSh/rpc', currency: 'CNZR', explorer: 'https://conezerescan.cnzr.biz.id' },
  { id: 137, name: 'Polygon', rpcUrl: 'https://polygon-rpc.com', currency: 'MATIC', explorer: 'https://polygonscan.com' },
  { id: 42161, name: 'Arbitrum One', rpcUrl: 'https://arb1.arbitrum.io/rpc', currency: 'ETH', explorer: 'https://arbiscan.io' },
  { id: 56, name: 'Binance Smart Chain', rpcUrl: 'https://bsc-dataseed.binance.org', currency: 'BNB', explorer: 'https://bscscan.com' },
];

interface NetworkContextType {
  currentNetwork: NetworkConfig;
  networks: NetworkConfig[];
  setCurrentNetwork: (network: NetworkConfig) => void;
  addNetwork: (network: NetworkConfig) => void;
  client: PublicClient;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networks, setNetworks] = useState<NetworkConfig[]>(() => {
    const saved = localStorage.getItem('explorer_networks');
    let loaded = saved ? JSON.parse(saved) : DEFAULT_NETWORKS;

    // Self-correction for problematic RPC URLs (llamarpc.com or cloudflare-eth.com)
    loaded = loaded.map((net: NetworkConfig) => {
      const defaultMatch = DEFAULT_NETWORKS.find(d => d.id === net.id);
      if (defaultMatch && (net.rpcUrl.includes('llamarpc.com') || net.rpcUrl.includes('cloudflare-eth.com'))) {
        return { ...net, rpcUrl: defaultMatch.rpcUrl };
      }
      return net;
    });

    return loaded;
  });

  const [currentNetwork, setCurrentNetworkState] = useState<NetworkConfig>(networks[0]);

  useEffect(() => {
    localStorage.setItem('explorer_networks', JSON.stringify(networks));
  }, [networks]);

  const setCurrentNetwork = (network: NetworkConfig) => {
    setCurrentNetworkState(network);
  };

  const addNetwork = (network: NetworkConfig) => {
    setNetworks(prev => [...prev, network]);
    setCurrentNetworkState(network);
  };

  const customChain = defineChain({
    id: currentNetwork.id,
    name: currentNetwork.name,
    nativeCurrency: { name: currentNetwork.currency, symbol: currentNetwork.currency, decimals: 18 },
    rpcUrls: {
      default: { http: [currentNetwork.rpcUrl] },
      public: { http: [currentNetwork.rpcUrl] },
    },
  });

  const client = createPublicClient({
    chain: customChain,
    transport: http(),
  });

  return (
    <NetworkContext.Provider value={{ currentNetwork, networks, setCurrentNetwork, addNetwork, client }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
