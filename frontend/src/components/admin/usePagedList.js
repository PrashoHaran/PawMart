import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

// Fetches a paginated admin list; resets to page 1 whenever filters change.
export function usePagedList(path, filters, limit = 20) {
  const { token } = useAuth();
  const filterKey = JSON.stringify(filters);
  // The page belongs to a filter combination, so new filters start at page 1.
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = useCallback((next) => setPageState({ key: filterKey, page: next }), [filterKey]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const reload = useCallback(() => {
    const params = new URLSearchParams({ page, limit });
    for (const [key, value] of Object.entries(JSON.parse(filterKey))) {
      if (value) params.set(key, value);
    }
    return apiRequest(`${path}?${params}`, { token })
      .then(({ data, meta }) => {
        setItems(data);
        setTotal(meta?.total ?? data.length);
        setLoadedAt(Date.now());
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [path, filterKey, page, limit, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, total, page, setPage, pages: Math.max(1, Math.ceil(total / limit)), loading, error, reload, loadedAt };
}

export function errorText(err) {
  return err.details?.[0]?.message ?? err.message;
}
