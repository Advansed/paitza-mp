// src/Store/useWorkNavigation.ts
import { useCallback } from 'react'
import { useWorkStore } from '../workStore'
import { WorkPageType } from '../types'

const MAX_WORK_NAV_HISTORY = 50

export const useWorkNavigation = () => {
  const currentPage         = useWorkStore(state => state.currentPage)
  const navigationHistory   = useWorkStore(state => state.navigationHistory)

  const navigateTo = useCallback((page: WorkPageType) => {
    const state = useWorkStore.getState()
    const appended = [...state.navigationHistory, page]
    const capped =
      appended.length > MAX_WORK_NAV_HISTORY
        ? appended.slice(-MAX_WORK_NAV_HISTORY)
        : appended
    state.setNavigationHistory(capped)
    state.setCurrentPage(page)
  }, [])

  const goBack = useCallback(() => {
    const state = useWorkStore.getState()
    const hist = state.navigationHistory
    if (hist.length <= 1) {
      state.setCurrentPage({ type: 'list' })
      return
    }
    const nextHist = hist.slice(0, -1)
    const prev = nextHist[nextHist.length - 1]
    state.setNavigationHistory(nextHist)
    state.setCurrentPage(prev)
  }, [])

  return {
    currentPage,
    navigationHistory,
    navigateTo,
    goBack
  }
}