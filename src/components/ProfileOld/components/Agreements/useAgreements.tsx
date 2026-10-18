// src/hooks/useAgreements.ts

import { useCallback } from "react"
import { loginActions, loginGetters, useLoginStore, useToken, type Agreements } from "../../../../Store/loginStore"
import { useSocket } from "../../../../Store/useSocket"

export const useAgreements = () => {
  const agreements  = useLoginStore(state => state.agreements)
  const isLoading   = useLoginStore(state => state.isLoading)
  const { emit }    = useSocket()
  const token       = useToken();

  const saveAgreement = useCallback((agreementType: keyof Agreements, value: boolean) => {
    if (isLoading) return
    if (loginGetters.getAgreement(agreementType) === value) return
    loginActions.setAgreement(agreementType, value)
    emit("set_agreement", { token, [agreementType]: value })
  }, [emit, isLoading, token])

  const toggleAgreement = (agreementType: keyof typeof agreements) => {
    saveAgreement(agreementType, !loginGetters.getAgreement(agreementType))
  }

  return {

    agreements, 
    isLoading,
    toggleAgreement,
    saveAgreement,
    hasAgreement:       (agreementType: keyof typeof agreements) => agreements[agreementType],
    hasAllAgreements:   () => Object.values(agreements).every(Boolean),
    hasAnyAgreement:    () => Object.values(agreements).some(Boolean)

  }
}