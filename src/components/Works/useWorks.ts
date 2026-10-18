// src/Store/useWorks.ts
import { useCallback, useState } from 'react'
import { useToast } from '../Toast'
import { useSocket } from '../../Store/useSocket'
import { useToken } from '../../Store/loginStore'
import { useWorkStore, workActions, workGetters, rememberOfferedWork, forgetOfferedWork, initWorkSocketHandlers }
  from './workStore'
import { WorkInfo, WorkFilters, OfferInfo, WorkStatus }
  from './types'
import type { ContractData } from './components/WorkView/index'

export const useWorks = () => {
  const token = useToken()
  const { socket, emit, once } = useSocket()
  const toast = useToast()

  // ============================================
  // СОСТОЯНИЕ
  // ============================================
  const works = useWorkStore(state => state.works)
  const archiveWorks = useWorkStore(state => state.archiveWorks)
  const isLoading = useWorkStore(state => state.isLoading)
  const filters = useWorkStore(state => state.filters)
  const searchQuery = useWorkStore(state => state.searchQuery)

  const [contract, setContract] = useState<string>()

  // ============================================
  // ФИЛЬТРЫ И ПОИСК
  // ============================================
  const setFilters = useCallback((newFilters: WorkFilters) => {
    workActions.setFilters(newFilters)
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    workActions.setSearchQuery(query)
  }, [])

  // ============================================
  // ОПЕРАЦИИ С ПРЕДЛОЖЕНИЯМИ
  // ============================================
  const setOffer = useCallback(async (
    data: OfferInfo,
    source?: { guid?: string; cargo?: string }
  ): Promise<boolean> => {
    if (!socket) {
      toast.error('Нет соединения с сервером');
      return false;
    }

    workActions.setLoading(true);
    initWorkSocketHandlers(socket);

    return new Promise((resolve) => {
      let settled = false;
      const timerRef: { id?: ReturnType<typeof setTimeout> } = {};
      let handleOfferResponse: (response: {
        success?: boolean;
        error?: string;
        message?: string;
        data?: WorkInfo | Partial<WorkInfo>;
      }) => void = () => {};

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        if (timerRef.id !== undefined) clearTimeout(timerRef.id);
        socket.off('set_offer', handleOfferResponse);
        workActions.setLoading(false);
        resolve(value);
      };

      try {
        const offerData = {
          ...data,
          createdAt: new Date().toISOString()
        };

        handleOfferResponse = (response: {
          success?: boolean;
          error?: string;
          message?: string;
          data?: WorkInfo | Partial<WorkInfo>;
        }) => {
          if (settled) return;
          if (response?.success) {
            const ref = {
              guid: source?.guid || data.guid,
              cargo: source?.cargo || data.guid,
            };
            rememberOfferedWork(ref);
            workActions.updateWork(ref, {
              status: WorkStatus.OFFERED,
              price: data.price,
              weight: data.weight,
              volume: data.volume,
              transport: data.transport,
            });

            toast.success('Предложение успешно создано');
            finish(true);
          } else {
            toast.error(response?.error || response?.message || 'Ошибка создания предложения');
            finish(false);
          }
        };

        socket.once('set_offer', handleOfferResponse);
        socket.emit('set_offer', { token, ...offerData });

        timerRef.id = setTimeout(() => {
          toast.error('Таймаут ожидания ответа от сервера');
          finish(false);
        }, 10000);
      } catch (error) {
        console.error('Error creating offer:', error);
        toast.error('Ошибка создания предложения');
        finish(false);
      }
    });
  }, [socket, token, toast]);


  const delOffer = useCallback(async (data: OfferInfo): Promise<boolean> => {
    if (!socket) {
      toast.error('Нет соединения с сервером');
      return false;
    }

    workActions.setLoading(true);

    return new Promise((resolve) => {
      let settled = false;
      const timerRef: { id?: ReturnType<typeof setTimeout> } = {};

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        if (timerRef.id !== undefined) clearTimeout(timerRef.id);
        workActions.setLoading(false);
        resolve(value);
      };

      try {
        const offerData = {
          ...data,
          createdAt: new Date().toISOString()
        };

        const handleOfferResponse = (response: {
          success: boolean;
          error?: string;
          data?: WorkInfo | Partial<WorkInfo>;
        }) => {
          if (response.success) {
            forgetOfferedWork(String(data.guid));
            workActions.updateWork(String(data.guid), {
              status: WorkStatus.NEW,
            });

            toast.success('Предложение успешно удалено');
            finish(true);
          } else {
            toast.error(response.error || 'Ошибка удаления предложения');
            finish(false);
          }
        };

        socket.once('del_offer', handleOfferResponse);
        socket.emit('del_offer', { token, ...offerData });

        timerRef.id = setTimeout(() => {
          toast.error('Таймаут ожидания ответа от сервера');
          finish(false);
        }, 10000);
      } catch (error) {
        console.error('Error deleting offer:', error);
        toast.error('Ошибка удаления предложения');
        finish(false);
      }
    });
  }, [socket, token, toast]);


  const setStatus = useCallback(async (work: WorkInfo): Promise<boolean> => {
    if (!socket) {
      toast.error('Нет соединения с сервером');
      return false;
    }

    workActions.setLoading(true);

    return new Promise((resolve) => {
      let settled = false;
      const timerRef: { id?: ReturnType<typeof setTimeout> } = {};

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        if (timerRef.id !== undefined) clearTimeout(timerRef.id);
        workActions.setLoading(false);
        resolve(value);
      };

      try {
        const offerData = {
          guid: work.guid,
          recipient: work.recipient,
          status: nextStatus(work.status),
          createdAt: new Date().toISOString()
        };

        const handleStatusResponse = (response: { success: boolean; error?: string }) => {
          if (response.success) {
            const next = statusCodeToWorkStatus(offerData.status);
            if (next) {
              workActions.updateWork(work.guid, { status: next });
            }
            toast.success('Статус успешно обновлен');
            finish(true);
          } else {
            toast.error(response.error || 'Ошибка обновления статуса');
            finish(false);
          }
        };

        socket.once('set_status', handleStatusResponse);
        toast.info('Отправка статуса...');
        socket.emit('set_status', { token, ...offerData });

        timerRef.id = setTimeout(() => {
          toast.error('Таймаут ожидания ответа от сервера');
          finish(false);
        }, 10000);
      } catch (error) {
        console.error('Error creating offer:', error);
        toast.error('Ошибка создания предложения');
        finish(false);
      }
    });
  }, [socket, token, toast]);


  const setDeliver = useCallback(async (data: OfferInfo): Promise<boolean> => {
    if (!socket) {
      toast.error('Нет соединения с сервером')
      return false
    }

    workActions.setLoading(true)
    try {
      const offerData = {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      socket.emit('delivered', { token, ...offerData })
      return true
    } catch (error) {
      console.error('Error creating offer:', error)
      toast.error('Ошибка создания предложения')
      return false
    } finally {
      workActions.setLoading(false)
    }
  }, [token, socket, toast])


  const create_contract = useCallback(async (info: WorkInfo): Promise<boolean> => {
    if (!socket) {
      toast.error('Нет соединения с сервером')
      return false
    }

    workActions.setLoading(true);

    return new Promise((resolve) => {
      let settled = false;
      const timerRef: { id?: ReturnType<typeof setTimeout> } = {};

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        if (timerRef.id !== undefined) clearTimeout(timerRef.id);
        workActions.setLoading(false);
        resolve(value);
      };

      socket.once('create_contract', (data: { success: boolean; message?: string; data?: unknown }) => {
        if (data.success) {
          toast.success('Договор создан');
          finish(true);
        } else {
          toast.error('Ошибка при создании договора: ' + (data.message || 'Неизвестная ошибка'));
          finish(false);
        }
      });

      socket.emit('create_contract', {
        token: token,
        id: info.guid,
      });

      timerRef.id = setTimeout(() => {
        toast.error('Таймаут ожидания ответа от сервера');
        finish(false);
      }, 10000);
    });
  }, [socket, token, toast]);


  const get_contract = useCallback(async (info: WorkInfo) => {

    if (!socket) {
      toast.error('Нет соединения с сервером')
      return false
    }

    workActions.setLoading(true);

    socket.once('get_pdf1', (data: { success: boolean; message?: string; data: string }) => {
      if (data.success) {

        setContract('data:application/pdf;base64,' + data.data)

      } else {

        console.error("Ошибка при принятии заявки:", data.message);

      }
      workActions.setLoading(false);
    });

    socket.emit('get_pdf1', {
      token: token,
      id: info.guid,
    });

  }, [token, socket, toast]);


  const get_contract_data = useCallback(async (work: WorkInfo): Promise<ContractData | undefined> => {
    if (!socket) {
      toast.error('Нет соединения с сервером');
      return undefined;
    }

    workActions.setLoading(true);

    return new Promise((resolve) => {
      let settled = false;
      const timerRef: { id?: ReturnType<typeof setTimeout> } = {};

      const finish = (value: ContractData | undefined) => {
        if (settled) return;
        settled = true;
        if (timerRef.id !== undefined) clearTimeout(timerRef.id);
        workActions.setLoading(false);
        resolve(value);
      };

      once('get_contract', (data: { success: boolean; message?: string; data: ContractData }) => {
        if (data.success) {
          finish(data.data);
        } else {
          toast.error(data.message || 'Ошибка при получении договора');
          finish(undefined);
        }
      });

      emit('get_contract', {
        token: token,
        id: work.guid,
      });

      timerRef.id = setTimeout(() => {
        toast.error('Таймаут ожидания ответа от сервера');
        finish(undefined);
      }, 10000);
    });
  }, [token, socket, emit, once, toast]);


  const set_contract = useCallback(async (info: WorkInfo, sign: string): Promise<boolean> => {
    if (!socket) {
      toast.error('Нет соединения с сервером')
      return false
    }

    return new Promise((resolve) => {
      let settled = false
      const timerRef: { id?: ReturnType<typeof setTimeout> } = {}

      const finish = (ok: boolean) => {
        if (settled) return
        settled = true
        if (timerRef.id !== undefined) clearTimeout(timerRef.id)
        resolve(ok)
      }

      timerRef.id = setTimeout(() => {
        toast.error('Таймаут ожидания ответа от сервера')
        finish(false)
      }, 10000)

      const handler = (data: { success: boolean; message?: string; data?: unknown }) => {
        if (settled) return
        if (data.success) {
          toast.success('Договор подписан')
          workActions.updateWork(info.guid, { signed: true })
          finish(true)
        } else {
          toast.error('Ошибка при принятии заявки:' + (data.message || ''))
          finish(false)
        }
      }

      socket.once('set_contract', handler)

      socket.emit('set_contract', {
        token: token,
        id: info.guid,
        cargo_id: info.cargo || info.guid,
        sign: sign
      })
    })
  }, [token, socket, toast]);

  // ============================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================
  const refreshWorks = useCallback(async (): Promise<void> => {
    if (!socket) return
    socket.emit('get_works', { token })
  }, [token, socket])

  // ============================================
  // УТИЛИТЫ
  // ============================================
  const getWork = useCallback((guid: string): WorkInfo | undefined => {
    return workGetters.getWork(guid) || workGetters.getArchiveWork(guid)
  }, [])


  function nextStatus(status: WorkStatus) {

    switch (status) {
      case WorkStatus.NEW: return 11;
      case WorkStatus.OFFERED: return 12;
      case WorkStatus.TO_LOAD: return 13;
      case WorkStatus.ON_LOAD: return 15;
      case WorkStatus.LOADING: return 15;
      case WorkStatus.LOADED: return 16;
      case WorkStatus.IN_WORK: return 17;
      case WorkStatus.TO_UNLOAD: return 18;
      case WorkStatus.UNLOADING: return 19;
      case WorkStatus.UNLOADED: return 20;
      case WorkStatus.COMPLETED: return 20;
      case WorkStatus.REJECTED: return 11;
      default:
        console.warn('[useWorks] nextStatus: неизвестный статус', status);
        return 20;
    }
  }

  function statusCodeToWorkStatus(code: number): WorkStatus | null {
    switch (code) {
      case 10: return WorkStatus.NEW;
      case 11: return WorkStatus.OFFERED;
      case 12: return WorkStatus.TO_LOAD;
      case 13: return WorkStatus.ON_LOAD;
      case 14: return WorkStatus.LOADING;
      case 15: return WorkStatus.LOADED;
      case 16: return WorkStatus.IN_WORK;
      case 17: return WorkStatus.TO_UNLOAD;
      case 18: return WorkStatus.UNLOADING;
      case 19: return WorkStatus.UNLOADED;
      case 20: return WorkStatus.COMPLETED;
      case 21: return WorkStatus.REJECTED;
      default: return null;
    }
  }

  return {
    // Состояние
    contract,
    works,
    archiveWorks,
    isLoading,
    filters,
    searchQuery,

    // Фильтры
    setFilters,
    setSearchQuery,
    create_contract,
    get_contract,
    get_contract_data,
    setContract,
    set_contract,

    // Загрузка
    refreshWorks,
    setDeliver,
    setStatus,
    setOffer,
    delOffer,

    // Утилиты
    getWork
  }
}