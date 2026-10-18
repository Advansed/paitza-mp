import i18n from '../i18n'

export const USER_TYPES = { CUSTOMER: 1, CARRIER: 2, DISPATCHER: 3 } as const

/** Исполнительская сторона: перевозчик или диспетчер */
export const isExecutorRole = (t?: number | null) => t === USER_TYPES.CARRIER || t === USER_TYPES.DISPATCHER

export const isDispatcher = (t?: number | null) => t === USER_TYPES.DISPATCHER

export const roleLabel = (t?: number | null) =>
  i18n.t(
    t === USER_TYPES.DISPATCHER
      ? 'roleDispatcher'
      : t === USER_TYPES.CARRIER
        ? 'roleCarrier'
        : 'roleCustomer',
    { ns: 'common' }
  )

export const panelLabel = (t?: number | null) =>
  i18n.t(
    t === USER_TYPES.DISPATCHER
      ? 'panelDispatcher'
      : t === USER_TYPES.CARRIER
        ? 'panelCarrier'
        : 'panelCustomer',
    { ns: 'common' }
  )
