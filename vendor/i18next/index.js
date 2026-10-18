const listeners = new Map()

const state = {
  language: 'ru',
  fallbackLng: 'ru',
  defaultNS: 'translation',
  resources: {},
  ready: false,
}

function bag(lng, ns) {
  return state.resources[lng]?.[ns]
}

function read(lng, ns, key) {
  const value = bag(lng, ns)?.[key]
  return typeof value === 'string' ? value : undefined
}

function pluralForm(lng, count) {
  const locale = lng.startsWith('zh') ? 'zh-CN' : lng.startsWith('en') ? 'en' : 'ru'
  try {
    return new Intl.PluralRules(locale).select(count)
  } catch {
    return count === 1 ? 'one' : 'other'
  }
}

function resolve(key, options = {}) {
  let ns = options.ns || state.defaultNS
  let name = key
  const colon = key.indexOf(':')
  if (colon > 0) {
    ns = key.slice(0, colon)
    name = key.slice(colon + 1)
  }

  const lng = options.lng || state.language || state.fallbackLng
  const chain = lng === state.fallbackLng ? [lng] : [lng, state.fallbackLng]
  const keys = []
  if (options.count != null) {
    const count = Number(options.count)
    for (const lang of chain) {
      const form = pluralForm(lang, count)
      keys.push([lang, `${name}_${form}`], [lang, `${name}_other`], [lang, name])
    }
  } else {
    for (const lang of chain) keys.push([lang, name])
  }

  for (const [lang, candidate] of keys) {
    const value = read(lang, ns, candidate)
    if (value != null) return interpolate(value, options)
  }
  if (typeof options.defaultValue === 'string') return interpolate(options.defaultValue, options)
  return name
}

function interpolate(text, options) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, token) => {
    const value = options[token]
    return value == null ? '' : String(value)
  })
}

function emit(event, payload) {
  const set = listeners.get(event)
  if (!set) return
  for (const handler of set) handler(payload)
}

const i18n = {
  get language() {
    return state.language
  },
  set language(value) {
    state.language = value
  },
  get resolvedLanguage() {
    return state.language
  },
  use() {
    return i18n
  },
  get isInitialized() {
    return state.ready
  },
  init(options = {}) {
    state.resources = options.resources || {}
    state.fallbackLng = typeof options.fallbackLng === 'string' ? options.fallbackLng : 'ru'
    state.defaultNS = typeof options.defaultNS === 'string' ? options.defaultNS : 'translation'
    state.language = typeof options.lng === 'string' ? options.lng : state.fallbackLng
    state.ready = true
    return Promise.resolve(i18n)
  },
  addResourceBundle(lng, ns, resources) {
    if (!state.resources[lng]) state.resources[lng] = {}
    state.resources[lng][ns] = { ...(state.resources[lng][ns] || {}), ...(resources || {}) }
  },
  t(key, options) {
    return resolve(String(key), options)
  },
  changeLanguage(lng) {
    state.language = lng
    emit('languageChanged', lng)
    return Promise.resolve()
  },
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(handler)
  },
  off(event, handler) {
    listeners.get(event)?.delete(handler)
  },
}

export default i18n
