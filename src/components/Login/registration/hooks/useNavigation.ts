import { useState, useCallback, useMemo } from 'react';

export interface UseNavigationReturn {
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const useNavigation = (totalSteps: number = 4): UseNavigationReturn => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);
  
  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, [totalSteps]);
  
  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);
  
  return useMemo(
    () => ({
      currentStep,
      nextStep,
      prevStep,
      goToStep,
      reset,
      isFirstStep: currentStep === 0,
      isLastStep: currentStep === totalSteps - 1,
    }),
    [currentStep, nextStep, prevStep, goToStep, reset, totalSteps]
  );
};