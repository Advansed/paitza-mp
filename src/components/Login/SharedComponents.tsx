import React from 'react'
import { IonInput, IonSpinner, IonButton, IonLabel, IonIcon } from '@ionic/react'
import type { AutocompleteTypes } from '@ionic/core'
import { closeOutline } from 'ionicons/icons'
import { formatPhoneInputDisplay } from './phone'

// ======================
// ВВОД ТЕЛЕФОНА (E.164, международный)
// ======================

interface MaskedInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

/** Свободный ввод телефона в международном формате (без фиксированной маски +7) */
export const MaskedInput: React.FC<MaskedInputProps> = ({
  placeholder,
  value,
  onChange,
  onBlur,
  error
}) => {
  return (
    <div className="masked-input-container">
      <div className="l-input">
        <IonInput
          type="tel"
          inputMode="tel"
          autocomplete="tel"
          placeholder={placeholder}
          value={value}
          onIonInput={(e) => onChange(formatPhoneInputDisplay(e.detail.value ?? ''))}
          onIonBlur={onBlur}
        />
      </div>
      {error && <div className="error-text cl-red fs-11">{error}</div>}
    </div>
  )
}

// ======================
// ВВОД ПАРОЛЯ
// ======================

interface PasswordInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  autocomplete?: AutocompleteTypes
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  error,
  autocomplete = 'current-password'
}) => {
  return (
    <div className="password-input-container">
      <div className="l-input">
        <IonInput
          type="password"
          placeholder={placeholder}
          value={value}
          autocomplete={autocomplete}
          onIonInput={(e) => onChange(e.detail.value || '')}
          onIonBlur={onBlur}
        />
      </div>
      {error && <div className="error-text cl-red fs-11">{error}</div>}
    </div>
  )
}

// ======================
// ОБЫЧНЫЙ ВВОД
// ======================

interface TextInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  type?: 'text' | 'email'
}

export const TextInput: React.FC<TextInputProps> = ({ 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  error,
  type = 'text'
}) => {
  return (
    <div className="text-input-container">
      <div className="l-input">
        <IonInput
          type={type}
          placeholder={placeholder}
          value={value}
          onIonInput={(e) => onChange(e.detail.value || '')}
          onIonBlur={onBlur}
        />
      </div>
      {error && <div className="error-text cl-red fs-11">{error}</div>}
    </div>
  )
}

// ======================
// ПРОГРЕСС-БАР
// ======================

interface ProgressBarProps {
  current: number
  total: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.round((current / (total - 1)) * 100)
  
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-text fs-08 cl-gray a-center mt-05">
        Шаг {current + 1} из {total}
      </div>
    </div>
  )
}

// ======================
// АЛЕРТ ОШИБКИ
// ======================

interface ErrorAlertProps {
  error: string
  onClose: () => void
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null
  
  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="fs-11 cl-red a-center">
          <b>{error}</b>
        </div>
        <IonButton fill="clear" size="small" onClick={onClose}>
          <IonIcon icon={ closeOutline } />
        </IonButton>
      </div>
    </div>
  )
}


// ======================
// СПИННЕР ЗАГРУЗКИ
// ======================

export const LoadingSpinner: React.FC = () => (
  <div className="loading-overlay">
    <div className="loading-content">
      <IonSpinner name="crescent" />
      <div className="fs-08 cl-gray mt-05">Подождите...</div>
    </div>
  </div>
)

// ======================
// КНОПКИ ФОРМЫ
// ======================

interface FormButtonsProps {
  onNext: () => void
  onBack?: () => void
  nextText: string
  backText?: string
  disabled?: boolean
  loading?: boolean
}

export const FormButtons: React.FC<FormButtonsProps> = ({ 
  onNext, 
  onBack, 
  nextText, 
  backText = "Назад",
  disabled = false,
  loading = false
}) => {
  return (
    <div className="form-buttons mt-1">
      {onBack && (
        <IonButton
          fill="clear"
          color="medium"
          onClick={onBack}
          disabled={loading}
        >
          <IonLabel>{backText}</IonLabel>
        </IonButton>
      )}
      
      <IonButton
        expand="block"
        className="l-button"
        onClick={onNext}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <IonSpinner name="crescent" />
            <span className="ml-05">Загрузка...</span>
          </>
        ) : (
          <b>{nextText}</b>
        )}
      </IonButton>
    </div>
  )
}

// ======================
// НАВИГАЦИОННЫЕ ССЫЛКИ
// ======================

interface NavigationLinksProps {
  links: {
    text: string
    onClick: () => void
  }[]
}

export const NavigationLinks: React.FC<NavigationLinksProps> = ({ links }) => {
  return (
    <div className="navigation-links">
      {links.map((link, index) => (
        <div key={index} className="mt-1" onClick={link.onClick}>
          <IonLabel className="link-text">
            {link.text}
          </IonLabel>
        </div>
      ))}
    </div>
  )
}