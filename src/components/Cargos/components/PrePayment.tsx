// components/PrepaymentPage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CargoInfo, useCargoStore } from '../../../Store/cargoStore';
import './PrePayment.css'
import { formatters } from '../../../utils/utils';
import { useAccountStore } from '../../../Store/accountStore';
import { IonButton } from '@ionic/react';
import { ChevronLeft } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import { useLoginStore, useToken } from '../../../Store/loginStore';
import { useSocket } from '../../../Store/useSocket';

interface PrepaymentPageProps {
  cargo: CargoInfo;
  onBack: () => void;
}

export const PrepaymentPage: React.FC<PrepaymentPageProps> = ({ cargo, onBack }) => {
  const [amount, setAmount]                 = useState<string>(() => {
    const advance = Number(cargo.advance) || 0;
    return advance > 0 ? String(advance) : '';
  });
  const { accountData, isLoading, set_prepayment, del_prepayment } = useData(cargo, onBack)

  const history = useHistory()

  const handleSubmit                        = async () => {
    if (parseFloat(amount) <= 0) {
      alert('Введите сумму предоплаты');
      return;
    }

    if (parseFloat(amount) > (Number(cargo.cost) || Number(cargo.price) || 0)) {
      alert('Сумма предоплаты не может превышать стоимость груза');
      return;
    }

    set_prepayment({ 
        cargo_id:       cargo.guid, 
        prepayment:     parseFloat(amount) || 0, 
        description:    "Предоплата за груз " + cargo.name,
        currency:       accountData?.currency,
        type:           1
    })

    
  };

  const handleDelSubmit                     = async () => {

      del_prepayment({ 
          cargo_id:       cargo.guid, 
          type:           1
      })

  };

  const handlePayment                       = async () => {
      const needed = Math.max(0, (parseFloat(amount) || 0) - (accountData?.balance || 0));
      history.push({
        pathname: '/finance',
        state: { amount: needed },
        search: needed > 0 ? `?amount=${needed}` : undefined,
      });
  }

  const percent  = () => {
    const price = Number(cargo.price) || 0;
    if (price <= 0) return 0;
    return (parseFloat(amount) || 0) * 100 / price;
  }

  return (
    <div className="prepayment-page">
      <div className="prepayment-top-bar">
        <button type="button" className="prepayment-back-btn" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
          К заказу
        </button>
      </div>
      <h1 className="prepayment-page-title">Спецсчёт</h1>

      <div style={{ paddingLeft: '0.5em', paddingRight: '0.5em' }}>
      <div className="prepayment-form">
        <div className="cargo-info">
          <h3>Информация о перевозке: </h3>
          <p className="flex fl-space">
            <strong>Груз:</strong>
            <div>{cargo.name}</div>
          </p>

          <p className="flex fl-space">
            <strong>Стоимость:</strong>
            <div>{formatters.currency(cargo.price)} </div>
          </p>

          <div className="mt-1">
            <p className="flex fl-space">
              <strong>Баланс:</strong>
              <div>{formatters.currency(accountData?.balance || 0)}</div>
            </p>

            <p className="flex fl-space">
              <strong>Аванс:</strong>
              <div>
                {formatters.currency(parseFloat(amount) || 0)} - ({percent().toFixed(2)}%)
              </div>
            </p>

            {((accountData?.balance || 0) - (parseFloat(amount) || 0)) < 0 && (
              <>
                <p className="flex fl-space">
                  <strong>К доплате:</strong>
                  <div>{formatters.currency((parseFloat(amount) || 0) - (accountData?.balance || 0))}</div>
                </p>
              </>
            )}

            {((accountData?.balance || 0) - (parseFloat(amount) || 0)) >= 0 && (
              <>
                <p className="flex fl-space">
                  <strong>Остаток баланса:</strong>
                  <div>
                    {formatters.currency(((accountData?.balance || 0) - parseFloat(amount) || 0))}
                  </div>
                </p>
              </>
            )}

            <p className="flex fl-space">
              {percent() === 0 && (
                <>
                  <div className="circle-3"></div>
                  <div>{' ' + percent().toFixed(2) + '% (Не серьезно)'}</div>
                </>
              )}
              {percent() > 0 && percent() < 100 && (
                <>
                  <div className="circle-2"></div>
                  <div>{' ' + percent().toFixed(2) + '% (Сомнительно)'}</div>
                </>
              )}
              {percent() === 100 && (
                <>
                  <div className="circle-1"></div>
                  <div>{' ' + percent().toFixed(2) + '% (Конкретно)'}</div>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="amount-input">
          <label htmlFor="amount">Сумма предоплаты:</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => {
              let value = parseFloat(e.target.value)
              if (value > cargo.price) value = cargo.price
              setAmount(value.toString())
            }}
            min="0"
            max={cargo.price - (cargo.advance || 0)}
            placeholder="Введите сумму"
          />
          <small>Доступно для оплаты: {cargo.price} ₽</small>
        </div>

        <div className="actions">
          {((accountData?.balance || 0) - (parseFloat(amount) || 0)) < 0 && (
            <IonButton
              expand="block"
              onClick={() => {
                handlePayment()
              }}
            >
              {"К оплате " + formatters.currency(-((accountData?.balance || 0) - (parseFloat(amount) || 0)))}
            </IonButton>
          )}

          {((accountData?.balance || 0) - (parseFloat(amount) || 0)) > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || (parseFloat(amount) || 0) <= 0 || (accountData?.balance || 0) < parseFloat(amount)}
              className="submit-button"
            >
              {isLoading ? 'Создание...' : 'Создать предоплату'}
            </button>
          )}

          {cargo.advance !== 0 && (
            <IonButton
              onClick={handleDelSubmit}
              disabled={isLoading || (parseFloat(amount) || 0) <= 0 || (accountData?.balance || 0) < parseFloat(amount)}
              color="danger"
            >
              {isLoading ? 'Удаление...' : 'Удалить предоплату'}
            </IonButton>
          )}

          <button onClick={onBack} className="cancel-button">
            Отмена
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};


export const useData = ( cargo: CargoInfo, onBack ) => {
  const token                               = useToken()
  const id                                  = useLoginStore( state => state.id )
  // Используем ху  zки из accountStore
  const accountData                         = useAccountStore( state => state.accountData )
  const isLoading                           = useAccountStore( state => state.isLoading )
  const setLoading                          = useAccountStore( state => state.setLoading )
  const { socket }                          = useSocket()
  const pendingRequests                     = useRef<Map<string, { resolve: Function, reject: Function }>>(new Map());

  const updateCargo                         = useCargoStore( state => state.updateCargo )

  useEffect(()=>{
  },[accountData])
  
    // Универсальная функция для socket запросов с ответом
    const socketRequest                     = useCallback((event: string, data: any, responseEvent: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        const requestId = `${event}_${Date.now()}`;
        if(!socket) return
        
        // Сохраняем промис для данного запроса
        pendingRequests.current.set(requestId, { resolve, reject });
        
        // Обработчик успешного ответа
        const onSuccess = (response: any) => {
          if( response.success ){
  
            const pending = pendingRequests.current.get( requestId );
            if (pending) {
              pendingRequests.current.delete(requestId);
              pending.resolve({ success: true, data: response.data });
            }
  
          } else {
            const pending = pendingRequests.current.get( requestId );
            if (pending) {
              pendingRequests.current.delete(requestId);
              pending.resolve({ success: false, error: response.message || 'Ошибка сервера' });
            }
          }
  
          socket.off(responseEvent, onSuccess);
        
        };
        
        // Подписываемся на события
        socket.on(responseEvent, onSuccess);
        
        // Таймаут
        setTimeout(() => {
          const pending = pendingRequests.current.get(requestId);
          if (pending) {
            pendingRequests.current.delete(requestId);
            socket.off(responseEvent, onSuccess);
            pending.resolve({ success: false, error: 'Время ожидания истекло' });
          }
        }, 10000); // 10 сек таймаут
        
        // Отправляем запрос
        socket.emit(event, { ...data, requestId });
      });
    }, []);
  
    const set_payment                       = async (data: any): Promise<any> => {
      setLoading( true )
  
      try {
        
        const result = await socketRequest(
          'create_payment_sbp', 
          { token, ...data },
          'create_payment_sbp'
        );
              
        return result;
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        return { success: false, data: null, message: errorMsg };
      } finally {
        setLoading( false );
      }
    };

    const set_prepayment                    = async (data: any): Promise<any> => {
      setLoading( true )
  
      try {
        
        const result = await socketRequest(
          'set_document', 
          { token, ...data },
          'set_document'
        );
              
        if(result.success) {
            cargo.advance = data.prepayment; 
            updateCargo( cargo.guid, cargo)
        }
        
        onBack()
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        return { success: false, data: null, message: errorMsg };
      } finally {
        setLoading( false );
      }
    };

    const del_prepayment                    = async (data: any): Promise<any> => {
      setLoading( true )
  
      try {
        
        const result = await socketRequest(
          'del_document', 
          { token, ...data },
          'del_document'
        );
              
        if(result.success) {
            cargo.advance = 0; 
            updateCargo( cargo.guid, cargo)
        }
        
        onBack()
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        return { success: false, data: null, message: errorMsg };
      } finally {
        setLoading( false );
      }
    };

  return {
    id,
    accountData,
    isLoading,
    set_payment,
    del_prepayment,
    set_prepayment
  }
}