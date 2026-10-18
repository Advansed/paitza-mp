/**
 * Регистрация: 0 — данные, 1 — SMS, 2 — пароль
 */

import React, { useCallback, memo, lazy, Suspense, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Send, Calendar } from 'lucide-react'
import { FioSuggestions, type DaDataFioSuggestion } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { PhoneCountryField } from '../PhoneCountryField'
import { useReg, UseRegReturn } from './hooks/useReg'
import { useEULA } from './hooks/useEULA'
import { splitFioString } from './registrationPayload'
import type { OtpTransport } from '../otpTransport'
import { DADATA_TOKEN } from '../../../utils/dadata'
import '../Login.css'

const EULA = lazy(() => import('./eula'))

interface RegistrationFormProps {
  onSwitchToLogin?: () => void
  onSwitchToRecovery?: () => void
}

function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const p1 = digits.slice(0, 2)
  const p2 = digits.slice(2, 4)
  const p3 = digits.slice(4, 8)
  if (digits.length <= 2) return p1
  if (digits.length <= 4) return `${p1}.${p2}`
  return `${p1}.${p2}.${p3}`
}

// ======================
// ШАГ 0: ДАННЫЕ
// ======================

const StepPersonalInfo: React.FC<{
  reg: UseRegReturn
  onOpenEula: () => void
}> = memo(({ reg, onOpenEula }) => {
  const { t } = useTranslation('auth')
  const otpTransport: OtpTransport =
    reg.formData.otpTransport === 'telegram' ? 'telegram' : 'sms'

  const f = reg.formData
  const err = reg.formErrors

  const canSubmit =
    Boolean(f.name?.trim()) &&
    f.name.trim().split(/\s+/).length >= 2 &&
    Boolean(f.birthDate?.trim()) &&
    Boolean(f.birthPlace?.trim()) &&
    (f.gender === 'male' || f.gender === 'female') &&
    Boolean(f.phone?.trim()) &&
    Boolean(f.consentPersonalData) &&
    Boolean(f.consentUserAgreement) &&
    !reg.isLoading

  const applyFio = useCallback(
    (
      full: string,
      parts?: {
        surname?: string | null
        name?: string | null
        patronymic?: string | null
        gender?: string
      }
    ) => {
      // Не trim'им full — иначе пробел при наборе сразу съедается controlled value
      const split = splitFioString(full)
      const lastName = (parts?.surname ?? split.lastName).trim()
      const firstName = (parts?.name ?? split.firstName).trim()
      const middleName = (parts?.patronymic ?? split.middleName).trim()
      reg.updateFormData('name', full)
      reg.updateFormData('lastName', lastName)
      reg.updateFormData('firstName', firstName)
      reg.updateFormData('middleName', middleName)
      if (parts?.gender === 'MALE') reg.updateFormData('gender', 'male')
      if (parts?.gender === 'FEMALE') reg.updateFormData('gender', 'female')
    },
    [reg]
  )

  const fioValue: DaDataFioSuggestion | undefined = f.name
    ? ({
        value: f.name,
        unrestricted_value: f.name,
        data: {
          surname: f.lastName || null,
          name: f.firstName || null,
          patronymic: f.middleName || null,
          gender: f.gender === 'male' ? 'MALE' : f.gender === 'female' ? 'FEMALE' : 'UNKNOWN',
          qc: '0',
          source: null,
        },
      } as DaDataFioSuggestion)
    : undefined

  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault()
        void reg.submitStep()
      }}
    >
      <section className="auth-section" aria-labelledby="reg-sec-personal">
        <h2 id="reg-sec-personal" className="auth-section-title">
          {t('personal')}
        </h2>

        <div className="auth-fields">
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-fio">
              {t('fullName')}
            </label>
            <div className="auth-dadata">
              <FioSuggestions
                token={DADATA_TOKEN}
                value={fioValue}
                onChange={(suggestion) => {
                  if (!suggestion) return
                  applyFio(suggestion.value, suggestion.data)
                }}
                inputProps={{
                  id: 'reg-fio',
                  className: 'auth-input',
                  placeholder: t('fullNamePh'),
                  autoComplete: 'name',
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    applyFio(e.target.value)
                  },
                }}
              />
            </div>
            {err.name && <div className="auth-error">{err.name}</div>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-birthDate">
              {t('birthDate')}
            </label>
            <div className="auth-input-icon-wrap">
              <input
                id="reg-birthDate"
                className="auth-input auth-input-with-icon"
                placeholder={t('birthDatePh')}
                inputMode="numeric"
                value={f.birthDate || ''}
                onChange={(e) =>
                  reg.updateFormData('birthDate', formatBirthDateInput(e.target.value))
                }
                autoComplete="bday"
              />
              <Calendar className="auth-input-icon" size={18} strokeWidth={2} aria-hidden />
            </div>
            {err.birthDate && <div className="auth-error">{err.birthDate}</div>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-birthPlace">
              {t('birthPlace')}
            </label>
            <input
              id="reg-birthPlace"
              className="auth-input"
              placeholder={t('birthPlacePh')}
              value={f.birthPlace || ''}
              onChange={(e) => reg.updateFormData('birthPlace', e.target.value)}
            />
            {err.birthPlace && <div className="auth-error">{err.birthPlace}</div>}
          </div>

          <div className="auth-field">
            <div className="auth-label" id="reg-gender-label">
              {t('gender')}
            </div>
            <div
              className="auth-gender-tabs"
              role="radiogroup"
              aria-labelledby="reg-gender-label"
            >
              <button
                type="button"
                role="radio"
                aria-checked={f.gender === 'male'}
                className={
                  f.gender === 'male' ? 'auth-gender-tab is-active' : 'auth-gender-tab'
                }
                onClick={() => reg.updateFormData('gender', 'male')}
              >
                {t('male')}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={f.gender === 'female'}
                className={
                  f.gender === 'female' ? 'auth-gender-tab is-active' : 'auth-gender-tab'
                }
                onClick={() => reg.updateFormData('gender', 'female')}
              >
                {t('female')}
              </button>
            </div>
            {err.gender && <div className="auth-error">{err.gender}</div>}
          </div>
        </div>
      </section>

      <section className="auth-section" aria-labelledby="reg-sec-contacts">
        <h2 id="reg-sec-contacts" className="auth-section-title">
          {t('contacts')}
        </h2>

        <div className="auth-fields">
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">
              {t('emailOptional')}
            </label>
            <input
              id="reg-email"
              className="auth-input"
              type="email"
              placeholder="name@example.com"
              value={f.email || ''}
              onChange={(e) => reg.updateFormData('email', e.target.value)}
              autoComplete="email"
            />
            {err.email && <div className="auth-error">{err.email}</div>}
          </div>

          <div className="auth-field">
            <PhoneCountryField
              id="reg-phone"
              value={f.phone || ''}
              onChange={(value) => reg.updateFormData('phone', value)}
              onBlur={() => {
                if (f.phone) reg.validateField('phone', f.phone)
              }}
              error={err.phone}
            />
          </div>

          <div className="auth-field">
            <div className="auth-label" id="reg-otp-label">
              {t('otpWhere')}
            </div>
            <div className="auth-otp-tabs" role="tablist" aria-labelledby="reg-otp-label">
              <button
                type="button"
                role="tab"
                aria-selected={otpTransport === 'sms'}
                className={otpTransport === 'sms' ? 'auth-otp-tab is-active' : 'auth-otp-tab'}
                onClick={() => reg.updateFormData('otpTransport', 'sms')}
              >
                <MessageSquare size={18} strokeWidth={2} aria-hidden />
                SMS
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={otpTransport === 'telegram'}
                className={
                  otpTransport === 'telegram' ? 'auth-otp-tab is-active' : 'auth-otp-tab'
                }
                onClick={() => reg.updateFormData('otpTransport', 'telegram')}
              >
                <Send size={18} strokeWidth={2} aria-hidden />
                Telegram
              </button>
            </div>
            <p className="auth-hint">
              {otpTransport === 'telegram'
                ? t('otpTelegram')
                : t('otpSms')}
            </p>
          </div>
        </div>
      </section>

      <section className="auth-section auth-section-last" aria-labelledby="reg-sec-consents">
        <h2 id="reg-sec-consents" className="auth-section-title">
          {t('consents')}
        </h2>

        <div className="auth-consents">
          <label className="auth-consent">
            <input
              type="checkbox"
              checked={Boolean(f.consentPersonalData)}
              onChange={(e) => reg.updateFormData('consentPersonalData', e.target.checked)}
            />
            <span>
              {t('accept')}{' '}
              <span className="auth-consent-link">{t('pdConsent')}</span>
            </span>
          </label>
          {err.consentPersonalData && <div className="auth-error">{err.consentPersonalData}</div>}

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={Boolean(f.consentUserAgreement)}
              onChange={(e) => reg.updateFormData('consentUserAgreement', e.target.checked)}
            />
            <span>
              {t('accept')}{' '}
              <button type="button" className="auth-inline-link" onClick={onOpenEula}>
                {t('userAgreement')}
              </button>
            </span>
          </label>
          {err.consentUserAgreement && <div className="auth-error">{err.consentUserAgreement}</div>}

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={Boolean(f.consentMarketing)}
              onChange={(e) => reg.updateFormData('consentMarketing', e.target.checked)}
            />
            <span>
              {t('adsAccept')}{' '}
              <span className="auth-consent-link">{t('adsConsent')}</span>
            </span>
          </label>
        </div>
      </section>

      {reg.error && <div className="auth-error auth-error-block">{reg.error}</div>}

      <div className="auth-form-actions">
        <button type="submit" className="auth-btn-primary" disabled={!canSubmit}>
          {reg.isLoading ? t('sending') : t('getCode')}
        </button>
      </div>
    </form>
  )
})

// ======================
// ШАГ 1: SMS
// ======================

const StepVerification: React.FC<{ reg: UseRegReturn }> = memo(({ reg }) => {
  const { t } = useTranslation('auth')
  const otpTransport: OtpTransport =
    reg.formData.otpTransport === 'telegram' ? 'telegram' : 'sms'

  const [pin, setPin] = useState(['', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handlePinChange = useCallback(
    (value: string, index: number) => {
      const digits = value.replace(/\D/g, '')
      const newPin = [...pin]

      if (digits.length === 0) {
        newPin[index] = ''
      } else if (digits.length === 1) {
        newPin[index] = digits
      } else {
        for (let i = 0; i < digits.length && index + i < 4; i++) {
          newPin[index + i] = digits[i]!
        }
      }

      setPin(newPin)
      reg.updateFormData('pincode', newPin.join(''))

      if (digits.length > 0) {
        const firstEmpty = newPin.findIndex((c) => c === '')
        requestAnimationFrame(() => {
          if (firstEmpty >= 0) inputRefs.current[firstEmpty]?.focus()
          else inputRefs.current[3]?.focus()
        })
      }
    },
    [reg, pin]
  )

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <form
      className="auth-form auth-form-relaxed auth-form-verify"
      onSubmit={(e) => {
        e.preventDefault()
        void reg.submitStep()
      }}
    >
      <p className="auth-step-lead">
        {otpTransport === 'telegram' ? t('otpTelegramTitle') : t('otpSmsTitle')}
      </p>
      <p className="auth-hint auth-hint-center">{reg.formData.phone || ''}</p>

      <div className="auth-pin-row">
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={pin[index]}
            onChange={(e) => handlePinChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="auth-pin-input"
          />
        ))}
      </div>

      {reg.error && <div className="auth-error auth-error-block">{reg.error}</div>}

      <div className="auth-form-actions">
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={pin.some((d) => d === '') || reg.isLoading}
        >
          {reg.isLoading ? t('checking') : t('confirm')}
        </button>

        <button type="button" className="auth-btn-secondary auth-btn-spaced" onClick={reg.prevStep}>
          {t('editData')}
        </button>
      </div>
    </form>
  )
})

// ======================
// ШАГ 2: ПАРОЛЬ
// ======================

const StepSetPassword: React.FC<{
  reg: UseRegReturn
  toLogin?: () => void
}> = memo(({ reg, toLogin }) => {
  const { t } = useTranslation('auth')
  const passwordsMatch =
    reg.formData.password &&
    reg.formData.password1 &&
    reg.formData.password === reg.formData.password1

  return (
    <form
      className="auth-form auth-form-relaxed"
      onSubmit={(e) => {
        e.preventDefault()
        void reg.submitStep().then(() => {
          /* после успешного ответа сокета reset; toLogin — по желанию */
        })
      }}
    >
      <p className="auth-step-lead">{t('passwordLead')}</p>

      <div className="auth-fields auth-fields-relaxed">
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password">
            {t('password')}
          </label>
          <input
            id="reg-password"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="••••"
            value={reg.formData.password || ''}
            onChange={(e) => reg.updateFormData('password', e.target.value)}
          />
          {reg.formErrors.password && <div className="auth-error">{reg.formErrors.password}</div>}
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password1">
            {t('passwordConfirm')}
          </label>
          <input
            id="reg-password1"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="••••"
            value={reg.formData.password1 || ''}
            onChange={(e) => reg.updateFormData('password1', e.target.value)}
          />
          {reg.formErrors.password1 && <div className="auth-error">{reg.formErrors.password1}</div>}
        </div>
      </div>

      {reg.error && <div className="auth-error auth-error-block">{reg.error}</div>}

      <div className="auth-form-actions">
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={!passwordsMatch || reg.isLoading}
        >
          {reg.isLoading ? t('saving') : t('save', { ns: 'common' })}
        </button>
      </div>

      {toLogin && (
        <p className="auth-footer-text">
          — {t('haveAccount')}{' '}
          <button type="button" className="auth-footer-action" onClick={toLogin}>
            {t('signIn')}
          </button>
        </p>
      )}
    </form>
  )
})

// ======================
// КОРЕНЬ
// ======================

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSwitchToLogin }) => {
  const { t } = useTranslation('auth')
  const reg = useReg({ onRegistered: onSwitchToLogin })
  const eula = useEULA(false)

  const titles = [t('regData'), t('regConfirm'), t('regPassword')] as const
  const title = titles[reg.registrationStep] ?? t('regData')
  const isRelaxedStep = reg.registrationStep === 1 || reg.registrationStep === 2

  return (
    <div
      className={
        isRelaxedStep
          ? 'auth-page auth-page-reg auth-page-relaxed'
          : 'auth-page auth-page-reg'
      }
    >
      <header className="auth-hero">
        <h1 className="auth-hero-title">{title}</h1>
        <p className="auth-hero-sub">{t('brand')} / PAITZA</p>
      </header>

      <div
        className={
          isRelaxedStep
            ? 'auth-card auth-card-reg auth-card-relaxed'
            : 'auth-card auth-card-reg'
        }
      >
        {reg.registrationStep === 0 && (
          <StepPersonalInfo reg={reg} onOpenEula={eula.openEULA} />
        )}
        {reg.registrationStep === 1 && <StepVerification reg={reg} />}
        {reg.registrationStep === 2 && (
          <StepSetPassword reg={reg} toLogin={onSwitchToLogin} />
        )}

        {reg.registrationStep === 0 && onSwitchToLogin && (
          <p className="auth-footer-text">
            — {t('haveAccount')}{' '}
            <button type="button" className="auth-footer-action" onClick={onSwitchToLogin}>
              {t('signIn')}
            </button>
          </p>
        )}
      </div>

      <Suspense fallback={null}>
        <EULA
          check={eula.isEULAAccepted}
          onClose={eula.closeEULA}
          isOpen={eula.isEULAOpen}
          setCheck={(v) => {
            eula.setEULAAccepted(v)
            reg.updateFormData('consentUserAgreement', v)
          }}
        />
      </Suspense>
    </div>
  )
}

export default RegistrationForm
