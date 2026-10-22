import { useCallback, useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const connected = !!state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
    } catch (e) {
      console.log('Network check failed:', e);
      setIsConnected(true); // check fail hone pe user ko block mat karo
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    let subscription: any;
    try {
      subscription = Network.addNetworkStateListener((state) => {
        const connected = !!state.isConnected && state.isInternetReachable !== false;
        setIsConnected(connected);
      });
    } catch (e) {
      console.log('Network listener not available:', e);
    }

    const interval = setInterval(checkConnection, 10000);

    return () => {
      subscription?.remove?.();
      clearInterval(interval);
    };
  }, [checkConnection]);

  return { isConnected, checking, checkConnection };
}