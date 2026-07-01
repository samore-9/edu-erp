// src/hooks/useFetch.js — Generic data-fetch hook
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * useFetch — fetch data from the API with automatic loading/error handling.
 *
 * @param {string|null} url  — API path to fetch (null = skip fetch)
 * @param {object}      deps — extra dependencies that trigger a refetch
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch('/students?limit=20');
 */
const useFetch = (url, deps = []) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError]     = useState(null);

  const fetch_ = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
};

export default useFetch;
