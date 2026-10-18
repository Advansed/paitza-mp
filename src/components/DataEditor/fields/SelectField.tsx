// src/components/DataEditor/fields/SelectField.tsx
import React, { useState, useRef, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline, checkmarkOutline } from 'ionicons/icons';
import styles from './SelectField.module.css';

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  validate?: boolean;

}

export const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  value, 
  options, 
  onChange,
  placeholder = "Выберите...",
  disabled = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Скролл к выбранному элементу при открытии
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedIndex = options.indexOf(value);
      if (selectedIndex >= 0) {
        setHighlightedIndex(selectedIndex);
        const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [isOpen, value, options]);

  // Обработка клавиатурной навигации
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      
      default:
        // Поиск по первым буквам
        if (isOpen && e.key.length === 1 && /[a-zA-Zа-яА-Я0-9]/.test(e.key)) {
          const newSearchTerm = searchTerm + e.key.toLowerCase();
          setSearchTerm(newSearchTerm);
          
          // Поиск опции
          const index = options.findIndex(option => 
            option.toLowerCase().startsWith(newSearchTerm)
          );
          
          if (index >= 0) {
            setHighlightedIndex(index);
            const element = dropdownRef.current?.children[index] as HTMLElement;
            element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
          
          // Сброс поискового термина через секунду
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm('');
          }, 1000);
        }
    }
  };

  // Обработка выбора опции
  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Получение отображаемого значения
  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  return (
    <div className={styles.field} ref={containerRef}>
      <label className={styles.label}>{label}</label>
      
      <div className={styles.selectContainer}>
        {/* Кастомный select trigger */}
        <div
          className={`${styles.selectTrigger} ${isOpen ? styles.open : ''} ${error ? styles.error : ''} ${isPlaceholder ? styles.placeholder : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
        >
          <span className={styles.selectValue}>{displayValue}</span>
          <div className={`${styles.iconWrapper} ${isOpen ? styles.rotated : ''}`}>
            <IonIcon icon={chevronDownOutline} className={styles.icon} />
          </div>
        </div>

        {/* Dropdown список */}
        <div 
          className={`${styles.dropdown} ${isOpen ? styles.dropdownOpen : ''}`}
          ref={dropdownRef}
          role="listbox"
        >
          {options.length > 0 ? (
            options.map((option, index) => (
              <div
                key={option}
                className={`${styles.dropdownItem} ${value === option ? styles.selected : ''} ${highlightedIndex === index ? styles.highlighted : ''}`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={value === option}
              >
                <span className={styles.optionText}>{option}</span>
                {value === option && (
                  <IonIcon icon={checkmarkOutline} className={styles.checkIcon} />
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyMessage}>Нет доступных опций</div>
          )}
        </div>
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
