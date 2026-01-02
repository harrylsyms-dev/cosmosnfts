import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface UseMetaMaskReturn {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  isPolygon: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToPolygon: () => Promise<void>;
  error: string | null;
}

const POLYGON_CHAIN_ID = 137;
const POLYGON_CHAIN_ID_HEX = '0x89';

export function useMetaMask(): UseMetaMaskReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPolygon = chainId === POLYGON_CHAIN_ID;

  useEffect(() => {
    checkIfConnected();

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  async function checkIfConnected() {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);

        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex, 16));
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
    }
  }

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);

        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        setChainId(currentChainId);

        // If not on Polygon, prompt to switch
        if (currentChainId !== POLYGON_CHAIN_ID) {
          await switchToPolygon();
        }
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection in MetaMask.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      console.error('Failed to connect:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
  }, []);

  const switchToPolygon = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
      });
      setChainId(POLYGON_CHAIN_ID);
    } catch (err: any) {
      // Chain doesn't exist, add it
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_CHAIN_ID_HEX,
                chainName: 'Polygon Mainnet',
                rpcUrls: ['https://polygon-rpc.com'],
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://polygonscan.com'],
              },
            ],
          });
          setChainId(POLYGON_CHAIN_ID);
        } catch (addError) {
          console.error('Failed to add Polygon chain:', addError);
          setError('Failed to add Polygon network. Please add it manually in MetaMask.');
        }
      } else {
        console.error('Failed to switch to Polygon:', err);
        setError('Failed to switch to Polygon network.');
      }
    }
  }, []);

  function handleAccountsChanged(accounts: string[]) {
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      setIsConnected(true);
    } else {
      setAddress(null);
      setIsConnected(false);
    }
  }

  function handleChainChanged(newChainId: string) {
    setChainId(parseInt(newChainId, 16));
    // Reload the page on chain change to reset state
    window.location.reload();
  }

  return {
    address,
    isConnected,
    chainId,
    isPolygon,
    connect,
    disconnect,
    switchToPolygon,
    error,
  };
}

export default useMetaMask;
