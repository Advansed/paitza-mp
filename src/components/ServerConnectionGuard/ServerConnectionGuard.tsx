// src/components/ServerConnectionGuard/ServerConnectionGuard.tsx
import React, { useCallback, useEffect, useState } from 'react';
import i18n from '../../i18n';
import { useSocket } from '../../Store/useSocket';
import { ReconnectToServerForm } from '../ReconnectToServerForm/ReconnectToServerForm';
import { useSocketStore } from '../../Store/socketStore';
import { v4 as uuidv4 } from 'uuid';

const OVERLAY_DELAY_MS = 5000;

interface ServerConnectionGuardProps {
  children: React.ReactNode;
}

export const ServerConnectionGuard: React.FC<ServerConnectionGuardProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { connect } = useSocket();

  const isConnected = useSocketStore((state) => state.isConnected);
  const isConnecting = useSocketStore((state) => state.isConnecting);

  useEffect(() => {
    if (isConnected) {
      setHasConnectedOnce(true);
      setShowOverlay(false);
      return;
    }

    if (!hasConnectedOnce) return;

    const timer = window.setTimeout(() => {
      setShowOverlay(true);
    }, OVERLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isConnected, hasConnectedOnce]);

  const checkServerConnection = useCallback(async () => {
    setError(null);

    try {
      if (isConnected) return;

      let token = localStorage.getItem('gvr.io.token') as string || '';
      if (!token) {
        token = (await generateToken()) || '';
        localStorage.setItem('gvr.io.token', token);
      }

      await connect(token);
    } catch (err: any) {
      setError(err.message || i18n.t('serverDown', { ns: 'common' }));
    }
  }, [isConnected, connect]);

  useEffect(() => {
    void checkServerConnection();
  }, [checkServerConnection]);

  const reconnectForm = (
    <ReconnectToServerForm
      isConnecting={isConnecting}
      error={error}
      onRetry={checkServerConnection}
      overlay={hasConnectedOnce}
    />
  );

  if (!hasConnectedOnce) {
    return reconnectForm;
  }

  return (
    <>
      {children}
      {showOverlay && reconnectForm}
    </>
  );
};

async function generateToken() {
  const uniqueId = uuidv4();
  return uniqueId;
}
