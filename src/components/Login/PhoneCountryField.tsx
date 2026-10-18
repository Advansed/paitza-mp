import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CountryCode } from 'libphonenumber-js'
import { ChevronDown, Check } from 'lucide-react'
import {
  formatNationalPhoneInput,
  nationalPhonePlaceholder,
  parseLoginPhoneParts,
  splitE164ToParts,
} from './phone'
import {
  CIS_COUNTRIES,
  DEFAULT_LOGIN_COUNTRY,
  OTHER_COUNTRIES,
  countryFlagUrl,
  findCountryByIso,
  type LoginCountry,
} from './countries'

export type PhoneCountryFieldProps = {
  /** E.164 или частичный номер с «+» — синхронизируется с родителем */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  id?: string
  label?: string
  placeholder?: string
}

function toStoredPhone(country: LoginCountry, national: string): string {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  const parsed = parseLoginPhoneParts(country.iso as CountryCode, digits)
  return parsed.ok ? parsed.e164 : `+${country.dial}${digits}`
}

function displayNational(nationalDigitsOrMasked: string, iso: CountryCode): string {
  const digits = nationalDigitsOrMasked.replace(/\D/g, '')
  if (!digits) return ''
  return formatNationalPhoneInput(digits, iso)
}

export const PhoneCountryField: React.FC<PhoneCountryFieldProps> = ({
  value,
  onChange,
  onBlur,
  error,
  id = 'auth-phone',
  label = 'Номер телефона',
  placeholder,
}) => {
  const [country, setCountry] = useState<LoginCountry>(() => {
    if (value) return findCountryByIso(splitE164ToParts(value).countryIso)
    return DEFAULT_LOGIN_COUNTRY
  })
  const [nationalPhone, setNationalPhone] = useState(() => {
    if (!value) return ''
    const parts = splitE164ToParts(value)
    return displayNational(parts.national, parts.countryIso as CountryCode)
  })
  const [countryOpen, setCountryOpen] = useState(false)
  const countryRef = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef(value)

  const maskPlaceholder = useMemo(
    () => placeholder ?? nationalPhonePlaceholder(country.iso as CountryCode),
    [placeholder, country.iso]
  )

  useEffect(() => {
    if (!value || value === lastEmitted.current) return
    const parts = splitE164ToParts(value)
    const nextCountry = findCountryByIso(parts.countryIso)
    setCountry(nextCountry)
    setNationalPhone(displayNational(parts.national, nextCountry.iso as CountryCode))
  }, [value])

  useEffect(() => {
    if (!countryOpen) return
    const onDoc = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [countryOpen])

  const emit = (c: LoginCountry, national: string) => {
    const next = toStoredPhone(c, national)
    lastEmitted.current = next
    onChange(next)
  }

  const handleCountrySelect = (c: LoginCountry) => {
    const remasked = displayNational(nationalPhone, c.iso as CountryCode)
    setCountry(c)
    setNationalPhone(remasked)
    setCountryOpen(false)
    emit(c, remasked)
  }

  const handlePhoneChange = (raw: string) => {
    const next = formatNationalPhoneInput(raw, country.iso as CountryCode)
    setNationalPhone(next)
    emit(country, next)
  }

  const renderOption = (c: LoginCountry) => (
    <li key={c.iso + c.name}>
      <button
        type="button"
        className={c.iso === country.iso ? 'auth-country-option is-active' : 'auth-country-option'}
        onClick={() => handleCountrySelect(c)}
        role="option"
        aria-selected={c.iso === country.iso}
      >
        <img
          className="auth-flag-img"
          src={countryFlagUrl(c.iso, 40)}
          srcSet={`${countryFlagUrl(c.iso, 80)} 2x`}
          width={28}
          height={20}
          alt=""
          loading="lazy"
        />
        <span className="auth-country-meta">
          <span className="auth-country-name">{c.name}</span>
          <span className="auth-dial-muted">+{c.dial}</span>
        </span>
        {c.iso === country.iso && (
          <Check size={16} strokeWidth={2.5} className="auth-check" aria-hidden />
        )}
      </button>
    </li>
  )

  return (
    <div className="auth-phone-field">
      {label && (
        <label className="auth-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="auth-phone-row">
        <div className="auth-country" ref={countryRef}>
          <button
            type="button"
            className="auth-country-btn"
            onClick={() => setCountryOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={countryOpen}
          >
            <img
              className="auth-flag-img"
              src={countryFlagUrl(country.iso, 40)}
              srcSet={`${countryFlagUrl(country.iso, 80)} 2x`}
              width={22}
              height={16}
              alt=""
              loading="lazy"
            />
            <span className="auth-dial">+{country.dial}</span>
            <ChevronDown size={16} strokeWidth={2} className="auth-chevron" />
          </button>
          {countryOpen && (
            <ul className="auth-country-list" role="listbox">
              <li className="auth-country-section" aria-hidden>
                Страны СНГ
              </li>
              {CIS_COUNTRIES.map(renderOption)}
              {OTHER_COUNTRIES.length > 0 && (
                <li className="auth-country-section" aria-hidden>
                  Другие
                </li>
              )}
              {OTHER_COUNTRIES.map(renderOption)}
            </ul>
          )}
        </div>
        <input
          id={id}
          className="auth-input auth-phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={maskPlaceholder}
          value={nationalPhone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={() => onBlur?.()}
        />
      </div>
      {error && <div className="auth-error">{error}</div>}
    </div>
  )
}
