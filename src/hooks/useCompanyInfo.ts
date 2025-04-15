import { useState, useEffect, useCallback } from 'react';
import * as CompanyService from '../services/CompanyService';
import { CompanyInfo } from '../services/CompanyService';

/**
 * Hook for accessing and managing company information
 */
export const useCompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch company information
   */
  const fetchCompanyInfo = useCallback(async () => {
    try {
      setLoading(true);
      const info = await CompanyService.getCompanyInfo();
      setCompanyInfo(info);
      setError(null);
    } catch (err) {
      console.error('Error fetching company info:', err);
      setError('Could not load company information');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save or update company information
   */
  const updateCompanyInfo = useCallback(async (info: CompanyInfo) => {
    try {
      setLoading(true);
      await CompanyService.saveCompanyInfo(info);
      setCompanyInfo(info);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error updating company info:', err);
      setError('Could not update company information');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear company information
   */
  const clearCompanyInfo = useCallback(async () => {
    try {
      setLoading(true);
      await CompanyService.clearCompanyInfo();
      setCompanyInfo(null);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error clearing company info:', err);
      setError('Could not clear company information');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load company info on initial mount
  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  return {
    companyInfo,
    loading,
    error,
    updateCompanyInfo,
    clearCompanyInfo,
    refreshCompanyInfo: fetchCompanyInfo
  };
};

export default useCompanyInfo;