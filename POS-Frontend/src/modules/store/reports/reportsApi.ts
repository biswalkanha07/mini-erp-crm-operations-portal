import { api } from '../../../api';
import { CustomerReportsResponse } from './types';


export const getCustomerReports = async (storeId: string, searchTerm?: string): Promise<CustomerReportsResponse> => {
  try {
    console.log('Fetching customer reports for storeId:', storeId, 'searchTerm:', searchTerm);
    const response = await api.get(`/reports/customers/${storeId}`, {
      params: searchTerm ? { searchTerm } : undefined
    });
    console.log('Customer reports response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer reports:', error);
    throw error;
  }
};


export const getCustomerReportsByDateRange = async (
  storeId: string,
  startDate: string,
  endDate: string,
  searchTerm?: string
): Promise<CustomerReportsResponse> => {
  try {
    console.log('Fetching customer reports by date range:', { storeId, startDate, endDate, searchTerm });
    const params: any = { startDate, endDate };
    if (searchTerm) params.searchTerm = searchTerm;
    const response = await api.get(`/reports/customers/${storeId}`, { params });
    console.log('Customer reports by date range response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer reports by date range:', error);
    throw error;
  }
};

// Test function to check sales data
export const testSalesData = async (storeId: string) => {
  try {
    console.log('Testing sales data for storeId:', storeId);
    const response = await api.get(`/reports/test-sales/${storeId}`);
    console.log('Test sales data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error testing sales data:', error);
    throw error;
  }
};
