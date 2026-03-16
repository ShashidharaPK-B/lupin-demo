import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calculateShouldCost, getAnalysisJob, listAnalysisJobs } from '../api/analysis'
import type { AnalysisJob, ParametricAssumptions } from '../types'

const POLL_INTERVAL_MS = 2000 // 2 seconds

/**
 * Mutation hook to submit a new analysis job.
 */
export function useCalculate() {
  const queryClient = useQueryClient()

  return useMutation<
    AnalysisJob,
    Error,
    { file: File; assumptions: ParametricAssumptions }
  >({
    mutationFn: ({ file, assumptions }) => calculateShouldCost(file, assumptions),
    onSuccess: (data) => {
      // Seed the cache with the new job so polling can start
      queryClient.setQueryData(['analysisJob', data.id], data)
      // Invalidate the job list
      queryClient.invalidateQueries({ queryKey: ['analysisJobs'] })
    },
  })
}

/**
 * Query hook to fetch a single analysis job.
 * Polls every 2 seconds while the job is pending or processing.
 */
export function useAnalysisJob(jobId: string | null) {
  return useQuery<AnalysisJob, Error>({
    queryKey: ['analysisJob', jobId],
    queryFn: () => getAnalysisJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'pending' || status === 'processing') {
        return POLL_INTERVAL_MS
      }
      return false
    },
  })
}

/**
 * Query hook to list all analysis jobs.
 */
export function useAnalysisJobs() {
  return useQuery<AnalysisJob[], Error>({
    queryKey: ['analysisJobs'],
    queryFn: () => listAnalysisJobs(),
  })
}
