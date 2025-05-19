import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

function useInfiniteScroll<T>(
  fetchData: (page: number) => Promise<T[]>,
  options: UseInfiniteScrollOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const { threshold = 0.1, rootMargin = '0px' } = options;

  // Function to reset the scroll and data
  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetchData(1)
      .then(newData => {
        setData(newData);
        setHasMore(newData.length > 0);
      })
      .catch(err => {
        setError(err.message || 'Error loading data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchData]);

  // Reference callback for the last item
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      
      if (observer.current) {
        observer.current.disconnect();
      }
      
      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore) {
            setPage(prevPage => prevPage + 1);
          }
        },
        { threshold, rootMargin }
      );
      
      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, hasMore, threshold, rootMargin]
  );

  // Fetch more data when page changes
  useEffect(() => {
    if (page === 1) return;
    
    setLoading(true);
    setError(null);
    
    fetchData(page)
      .then(newData => {
        setData(prev => [...prev, ...newData]);
        setHasMore(newData.length > 0);
      })
      .catch(err => {
        setError(err.message || 'Error loading more data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, fetchData]);

  return {
    data,
    loading,
    error,
    hasMore,
    lastElementRef,
    reset
  };
}

export default useInfiniteScroll;
