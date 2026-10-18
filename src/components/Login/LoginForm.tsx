// src/components/Login/LoginForm.tsx

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { parseLoginPhone, validateLoginPhoneRaw } from './phone'
import { PhoneCountryField } from './PhoneCountryField'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import './Login.css'

interface LoginFormProps {
  onLogin: (phone: string, password: string) => Promise<boolean>
  onSwitchToRegister: () => void
  onSwitchToRecovery: () => void
}

interface FormErrors {
  phone?: string
  password?: string
}

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value : (value ?? '').toString()
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onSwitchToRegister,
  onSwitchToRecovery,
}) => {
  const { t } = useTranslation('auth')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const login = localStorage.getItem('gvrs.login')
    if (login) {
      setPhone(login)
      setPassword(localStorage.getItem('gvrs.password') ?? '')
    }
  }, [])

  const clearError = (field: keyof FormErrors) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    clearError('phone')
  }

  const handlePasswordChange = (value: string) => {
    setPassword(normalizeString(value))
    clearError('password')
  }

  const validate = useCallback(() => {
    const phoneErr = validateLoginPhoneRaw(phone) || undefined
    const pass = normalizeString(password)
    let passwordErr: string | undefined
    if (!pass.trim()) passwordErr = t('passwordRequired')
    else if (pass.length < 4) passwordErr = t('passwordShort')

    setFormErrors({
      phone: phoneErr,
      password: passwordErr,
    })
    return !phoneErr && !passwordErr
  }, [phone, password, t])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!validate()) return

      const parsed = parseLoginPhone(phone)
      if (!parsed.ok) {
        setFormErrors((prev) => ({ ...prev, phone: parsed.error }))
        return
      }

      setIsSubmitting(true)
      try {
        await onLogin(parsed.e164, normalizeString(password))
      } finally {
        setIsSubmitting(false)
      }
    },
    [validate, phone, password, onLogin]
  )

  const phoneOk = phone.trim().length > 0 && !formErrors.phone
  const passwordOk = normalizeString(password).trim().length > 0 && !formErrors.password
  const canSubmit = phoneOk && passwordOk && !isSubmitting

  return (
    <div className="auth-page auth-page-login">
      <div className="auth-brand-row">
        <img
          src="/landing/logo.jpg"
          alt=""
          className="auth-brand-logo"
          width={44}
          height={44}
        />
        <span>PAITZA</span>
        <div className="auth-brand-lang">
          <LanguageSwitcher variant="inline" />
        </div>
      </div>

      <header className="auth-hero">
        <h1 className="auth-hero-title">{t('loginTitle')}</h1>
        <p className="auth-hero-sub">{t('loginSub')}</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <PhoneCountryField
          id="login-phone"
          label={t('phone')}
          value={phone}
          onChange={handlePhoneChange}
          error={formErrors.phone}
          onBlur={() => {
            if (phone) {
              const err = validateLoginPhoneRaw(phone)
              setFormErrors((p) => ({ ...p, phone: err || undefined }))
            }
          }}
        />

        <label className="auth-label auth-label-spaced" htmlFor="login-password">
          {t('password')}
        </label>
        <div className="auth-input-icon-wrap">
          <input
            id="login-password"
            className="auth-input auth-input-with-icon"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={() => {
              const pass = normalizeString(password)
              if (!pass.trim()) setFormErrors((p) => ({ ...p, password: t('passwordRequired') }))
              else if (pass.length < 4)
                setFormErrors((p) => ({ ...p, password: t('passwordShort') }))
            }}
          />
          <button
            type="button"
            className="auth-input-icon-btn"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
          </button>
        </div>
        {formErrors.password && <div className="auth-error">{formErrors.password}</div>}
        <button type="button" className="auth-link-forgot" onClick={onSwitchToRecovery}>
          {t('forgot')}
        </button>

        <button type="submit" className="auth-btn-primary" disabled={!canSubmit}>
          {isSubmitting ? t('signingIn') : t('signIn')}
        </button>

        <p className="auth-footer-text">
          {t('noAccount')}{' '}
          <button type="button" className="auth-footer-action" onClick={onSwitchToRegister}>
            {t('signUp')}
          </button>
        </p>
      </form>
    </div>
  )
}
