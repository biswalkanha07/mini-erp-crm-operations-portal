import { api } from '../api'; // Import your configured axios instance

type MarginType = 'percent' | 'absolute';

const storePriceAPI = {
  getAll: (storeId: string) => api.get(`/store-prices/${storeId}`),
  updateMargin: (storeId: string, sku: string, marginType: MarginType, marginValue: number) =>
    api.put(`/store-prices/${storeId}/${sku}`, { marginType, marginValue })
};

export default storePriceAPI;
