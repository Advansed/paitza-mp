// RateField.tsx
import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { starOutline, star } from 'ionicons/icons';
import styles from './RateField.module.css';

interface RateFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
  validate?: boolean;
}

export const RateField: React.FC<RateFieldProps> = ({ 
  label, 
  value, 
  onChange,
  disabled = false,
  error
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const handleStarClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating: number) => {
    if (!disabled) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || value;

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      
      <div 
        className={styles.rateContainer}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starNumber) => (
          <button
            key={starNumber}
            type="button"
            className={`${styles.starButton} ${disabled ? styles.disabled : ''}`}
            onClick={() => handleStarClick(starNumber)}
            onMouseEnter={() => handleStarHover(starNumber)}
            disabled={disabled}
            aria-label={`Оценка ${starNumber} из 5`}
          >
            <IonIcon 
              icon={starNumber <= displayRating ? star : starOutline}
              className={`${styles.starIcon} ${
                starNumber <= displayRating ? styles.filled : styles.outline
              } ${
                starNumber <= hoveredRating && !disabled ? styles.hovered : ''
              }`}
            />
          </button>
        ))}
        
        {value > 0 && (
          <span className={styles.ratingText}>
            {value} из 5
          </span>
        )}
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};