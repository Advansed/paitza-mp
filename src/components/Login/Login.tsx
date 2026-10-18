// src/components/Login/Login.tsx

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useLogin } from '../../Store/useLogin'
import { LoginForm } from './LoginForm'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import { LoadingSpinner } from './SharedComponents'
import { RegistrationForm } from './registration'
import './Login.css'
import RecoveryForm from './recovery/RecoveryForm'

export type LoginFormMode = 'login' | 'register' | 'recovery'

type LoginProps = {
  initialMode?: LoginFormMode
  variant?: 'page' | 'modal'
  onClose?: () => void
}

const Login: React.FC<LoginProps> = ({
  initialMode = 'login',
  variant = 'page',
  onClose,
}) => {
  const { t } = useTranslation('auth')
  const { isLoading, login } = useLogin()
  const [currentForm, setCurrentForm] = useState<LoginFormMode>(initialMode)

  useEffect(() => {
    setCurrentForm(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (variant !== 'modal') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant, onClose])

  const handleLogin = async (phone: string, password: string): Promise<boolean> => {
    return await login(phone, password)
  }

  const panel = (
    <section
      className={`login-panel${variant === 'modal' ? ' login-panel-modal' : ''}${
        currentForm === 'login' ? ' login-panel--login' : ''
      }`}
    >
      {currentForm !== 'login' && (
        <div className="login-lang">
          <LanguageSwitcher variant="inline" />
        </div>
      )}
      {variant === 'modal' && (
        <button
          type="button"
          className="login-modal-close"
          aria-label={t('close', { ns: 'common' })}
          onClick={onClose}
        >
          <X size={18} strokeWidth={2} />
        </button>
      )}
      {currentForm === 'login' && (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentForm('register')}
          onSwitchToRecovery={() => setCurrentForm('recovery')}
        />
      )}

      {currentForm === 'register' && (
        <RegistrationForm
          onSwitchToLogin={() => setCurrentForm('login')}
          onSwitchToRecovery={() => setCurrentForm('recovery')}
        />
      )}

      {currentForm === 'recovery' && (
        <RecoveryForm
          onSwitchToLogin={() => setCurrentForm('login')}
          onSwitchToRegister={() => setCurrentForm('register')}
        />
      )}
    </section>
  )

  if (variant === 'modal') {
    return (
      <div
        className="login-modal-overlay"
        role="presentation"
        onClick={onClose}
      >
        {isLoading && <LoadingSpinner />}
        <div
          className="login-modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={currentForm === 'register' ? t('registerDialog') : currentForm === 'recovery' ? t('recoveryDialog') : t('loginDialog')}
          onClick={(e) => e.stopPropagation()}
        >
          {panel}
        </div>
      </div>
    )
  }

  return (
    <div className="login-root">
      {isLoading && <LoadingSpinner />}
      <div className="login-split login-split-solo">
        {panel}
      </div>
    </div>
  )
}

export default Login
