import { useCallback, useEffect, useRef, useState } from 'react'

export interface QueryState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface UseApiResult<T> extends QueryState<T> {
  refetch: () => void
}

/**
 * Fetch data on mount and whenever `deps` change. Uses AbortController so
 * React 19 StrictMode double-invokes don't race or set state after unmount.
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): UseApiResult<T> {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(() => {
    const controller = new AbortController()
    setState(s => ({ ...s, loading: true, error: null }))
    fetcherRef
      .current(controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null })
      })
      .catch(err => {
        if (controller.signal.aborted) return
        setState({ data: null, loading: false, error: err as Error })
      })
    return controller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const controller = run()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { ...state, refetch: run }
}

export interface MutationState<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult>
  loading: boolean
  error: Error | null
}

/** Wraps an async action, tracking loading/error and exposing a stable `mutate`. */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): MutationState<TArgs, TResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const mutate = useCallback(async (...args: TArgs) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current(...args)
      setLoading(false)
      return result
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { mutate, loading, error }
}
