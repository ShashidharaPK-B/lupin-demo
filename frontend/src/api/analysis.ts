import apiClient from './client'
import type { AnalysisJob, ParametricAssumptions } from '../types'

/**
 * Submit a ROS document with parametric assumptions for cost analysis.
 * Returns the created job (status: pending) immediately.
 */
export async function calculateShouldCost(
  file: File,
  assumptions: ParametricAssumptions,
): Promise<AnalysisJob> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('yield_pct', String(assumptions.yield_pct))
  formData.append('solvent_recovery_pct', String(assumptions.solvent_recovery_pct))
  formData.append('city', assumptions.city)
  formData.append('profit_margin_pct', String(assumptions.profit_margin_pct))

  const response = await apiClient.post<AnalysisJob>(
    '/api/v1/analysis/calculate',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return response.data
}

/**
 * Get the current status and result of an analysis job by ID.
 */
export async function getAnalysisJob(jobId: string): Promise<AnalysisJob> {
  const response = await apiClient.get<AnalysisJob>(`/api/v1/analysis/${jobId}`)
  return response.data
}

/**
 * List all analysis jobs, most recent first.
 */
export async function listAnalysisJobs(
  skip = 0,
  limit = 50,
): Promise<AnalysisJob[]> {
  const response = await apiClient.get<AnalysisJob[]>('/api/v1/analysis/', {
    params: { skip, limit },
  })
  return response.data
}
