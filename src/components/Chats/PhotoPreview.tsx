// src/components/Chats/PhotoPreview.tsx
import React, { useState, useRef } from 'react';
import { IonModal, IonButton, IonIcon } from '@ionic/react';
import { closeOutline, addOutline, removeOutline } from 'ionicons/icons';
import './PhotoPreview.css';

interface PhotoPreviewProps {
  imageUrl: string;
  closeModal: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({ imageUrl, closeModal }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleClose = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    closeModal();
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <IonModal isOpen={imageUrl !== ''} onDidDismiss={handleClose} className="photo-preview-modal">
      <div className="photo-preview-container">
        <div className="photo-preview-header">
          <span className="photo-preview-title">Просмотр изображения</span>
          <IonButton fill="clear" onClick={handleClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </div>

        <div className="photo-preview-body">
          <div className="photo-preview-controls">
            <IonButton fill="clear" onClick={handleZoomOut} disabled={scale <= 1}>
              <IonIcon icon={removeOutline} />
            </IonButton>
            <span className="photo-preview-zoom-text">{Math.round(scale * 100)}%</span>
            <IonButton fill="clear" onClick={handleZoomIn} disabled={scale >= 5}>
              <IonIcon icon={addOutline} />
            </IonButton>
          </div>

          <div 
            className="photo-preview-image-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Просмотр"
                className="photo-preview-image"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </IonModal>
  );
};