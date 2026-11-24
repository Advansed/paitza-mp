import { useCompanyStore } from './Store/companyStore'

export type AppPlan = 'basic' | 'pro'

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'pro'
}

export function useAppPlan(): AppPlan {
  const plan = useCompanyStore((state) => state.data?.plan)
  return isProPlan(plan) ? 'pro' : 'basic'
}

export function useProUnlocked(): boolean {
  return Boolean(useCompanyStore((state) => state.data?.pro_unlocked))
}
