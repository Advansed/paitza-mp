// URL базовый адрес API
import { logApiError, logApiRequest, logApiResponse } from '../utils/apiLogger';

export const URL = "https://paitza.com/api2";

export const version = '1.0.1'

export const api = async (endpoint: string, data: any) => {
    logApiRequest('http', endpoint, data);
    try {
      const res = await fetch(`${URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });
      const json = await res.json();
      logApiResponse('http', endpoint, json);
      return json;
    } catch (error) {
      logApiError('http', endpoint, error);
      throw error;
    }
};

export const getVersion = async() => {
    logApiRequest('http', 'api/getVersion');
    try {
      const res = await fetch(`${URL}/api/getVersion`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      logApiResponse('http', 'api/getVersion', json);
      return json;
    } catch (error) {
      logApiError('http', 'api/getVersion', error);
      throw error;
    }
};
