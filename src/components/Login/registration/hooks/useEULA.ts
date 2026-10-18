import { useState, useCallback } from 'react';

export interface UseEULAReturn {
  isEULAOpen: boolean;
  isEULAAccepted: boolean;
  openEULA: () => void;
  closeEULA: () => void;
  toggleEULA: () => void;
  acceptEULA: () => void;
  declineEULA: () => void;
  setEULAAccepted: (accepted: boolean) => void;
  validateEULA: () => string | null;
}

export const useEULA = (initialState: boolean = false): UseEULAReturn => {
  const [isEULAOpen, setIsEULAOpen] = useState(false);
  const [isEULAAccepted, setIsEULAAccepted] = useState(initialState);

  const openEULA = useCallback(() => {
    setIsEULAOpen(true);
  }, []);

  const closeEULA = useCallback(() => {
    setIsEULAOpen(false);
  }, []);

  const toggleEULA = useCallback(() => {
    setIsEULAOpen(prev => !prev);
  }, []);

  const acceptEULA = useCallback(() => {
    setIsEULAAccepted(true);
    setIsEULAOpen(false);
  }, []);

  const declineEULA = useCallback(() => {
    setIsEULAAccepted(false);
    setIsEULAOpen(false);
  }, []);

  const setEULAAccepted = useCallback((accepted: boolean) => {
    setIsEULAAccepted(accepted);
  }, []);

  const validateEULA = useCallback((): string | null => {
    if (!isEULAAccepted) {
      return 'Необходимо принять пользовательское соглашение';
    }
    return null;
  }, [isEULAAccepted]);

  return {
    isEULAOpen,
    isEULAAccepted,
    openEULA,
    closeEULA,
    toggleEULA,
    acceptEULA,
    declineEULA,
    setEULAAccepted,
    validateEULA
  };
};