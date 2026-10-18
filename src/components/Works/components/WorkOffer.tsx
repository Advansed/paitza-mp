import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonLoading } from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import { WorkInfo, CreateOfferData, OfferInfo, WorkStatus } from '../types';
import { workFormatters } from '../utils';
import './WorkOffer.css';
import { transportGetters } from '../../../Store/transportStore';
import { WizardHeader } from '../../Header/WizardHeader';


interface WorkOfferProps {
    work:       WorkInfo;
    onBack:     () => void;
    onOffer:    ( offer: OfferInfo ) => Promise<boolean>;
}

export const WorkOffer: React.FC<WorkOfferProps> = ({ work, onBack, onOffer }) => {
    const [formData, setFormData] = useState<CreateOfferData>({
        workId:         work.guid,
        transportId:    transportGetters.getData()?.guid || "",
        price:          work.price,
        weight:         work.weight,
        comment:        ""
    });

    const transport = transportGetters.getData();
        
    const [ loading, setLoading ]   = useState(false);
    const [ error,   setError ]     = useState("");


    const handleSubmit = async() => {
        // Валидация
        
        if (!formData.price || formData.price <= 0) {
            setError("Укажите корректную цену");
            return;
        }
        
        if (!formData.weight || formData.weight <= 0) {
            setError("Укажите корректный вес");
            return;
        }

        // Формируем данные для отправки
        const offerData: OfferInfo = {

            guid:       work.cargo,
            recipient:  work.recipient,
            price:      formData.price,
            weight:     formData.weight,
            volume:     work.volume,
            transport:  transport?.guid || '',
            comment:    formData.comment || '',
            status:     nextStatus(work.status)
        };

        const result = await onOffer( offerData )

        onBack()
    };

    const handleReset = () => {

        setFormData({

            workId:         work.guid,
            transportId:    "",
            price:          work.price,
            weight:         work.weight,
            comment:        ""

        });

    };

    return (
        <div className="work-offer-info">
            <WizardHeader 
                title   = 'Создание предложения'
                onBack  = { onBack }
            />
            <div className="ml-2 cl-prim fs-09 a-center">{ work.name }</div>

            <div className="content">
                
                {/* Форма предложения */}
                <div className="field flex fl-space">
                    <div className="label fs-09">Транспорт</div>
                    <div className="transport-select">
                        { transport?.name }
                    </div>
                </div>

                <div className="field">
                    <div className="label">Ваша цена (₽)</div>
                    <div className="offer-input-wrapper">
                        <input
                            type="number"
                            className="custom-text-input"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                            placeholder="Введите цену"
                        />
                    </div>
                </div>

                <div className="field">
                    <div className="label">Вес (тонн)</div>
                    <div className="offer-input-wrapper">
                        <input
                            type="number"
                            className="custom-text-input"
                            value={formData.weight}
                            onChange={(e) => {
                                const weight = Number(e.target.value) || 0;
                                const baseWeight = Number(work.weight) || 0;
                                const basePrice = Number(work.price) || 0;
                                const price =
                                    baseWeight > 0 && weight > 0
                                        ? Math.round((basePrice / baseWeight) * weight)
                                        : 0;
                                setFormData({ ...formData, weight, price });
                            }}
                            placeholder="Введите вес"
                            step="0.1"
                        />
                    </div>
                </div>

                <div className="field">
                    <div className="label">Комментарий (необязательно)</div>
                    <div className="offer-input-wrapper">
                        <textarea
                            className="custom-textarea"
                            value={formData.comment}
                            onChange={(e) => setFormData({...formData, comment: e.target.value})}
                            placeholder="Дополнительная информация..."
                            rows={4}
                        />
                    </div>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <div className="buttons">
                    <IonButton
                        onClick     = { handleSubmit }
                        disabled    = { loading }
                    >
                        Отправить предложение
                    </IonButton>
                    <IonButton
                        fill        = "outline"
                        onClick     = { handleReset }
                        disabled    = { loading }
                    >
                        Сбросить
                    </IonButton>
                </div>
            </div>

            <IonLoading
                isOpen={loading}
                message="Отправка предложения..."
            />
        </div>
    );
};


function nextStatus( status: WorkStatus) {

    switch(status) {
        case WorkStatus.NEW:            return 11;
        case WorkStatus.TO_LOAD:        return 13;
        case WorkStatus.LOADING:        return 15;
        case WorkStatus.IN_WORK:        return 17;
        case WorkStatus.UNLOADING:      return 19;
        case WorkStatus.REJECTED:       return 11;
        default: return 22;
    }
    
    // NEW             = "Новый",              // Доступна для предложения             10
    // OFFERED         = "Торг",               // Водитель сделал предложение          11    
    // TO_LOAD         = "На погрузку",        // Едет на погрузку                     12    
    // ON_LOAD         = "На погрузке",        // Прибыл на погрузку                   13 
    // LOADING         = "Загружается",        // Загружается                          14 
    // LOADED          = "Загружено",          // Загрузился                           15 
    // IN_WORK         = "В работе",           // Груз в работе                        16
    // TO_UNLOAD       = "Доставлено",         // Прибыл на место выгрузки             17
    // UNLOADING       = "Выгружается",        // Груз выгружается                     18
    // UNLOADED        = "Выгружено",          // Груз выгружен                        19
    // COMPLETED       = "Завершено" ,         // Работа завершена                     20
    // REJECTED        = "Отказано"            // Отказано                             21           
}