// Parametric assumptions passed by the user
export interface ParametricAssumptions {
  yield_pct: number
  solvent_recovery_pct: number
  city: string
  profit_margin_pct: number
}

// A single cost line item from the analysis
export interface CostLineItem {
  name: string
  quantity: number | null
  unit: string | null
  unit_cost: number | null
  total_cost: number
  category: string | null
  notes: string | null
}

// Full analysis result structure
export interface AnalysisResult {
  material_cost: number
  labor_cost: number
  overhead_cost: number
  profit: number
  total_cost: number
  per_unit_cost: number
  currency: string
  assumptions: Record<string, unknown>
  line_items: CostLineItem[]
  summary: string | null
}

// Analysis job status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Full analysis job response from API
export interface AnalysisJob {
  id: string
  project_id: string | null
  status: JobStatus
  yield_pct: number
  solvent_recovery_pct: number
  city: string
  profit_margin_pct: number
  document_filename: string
  document_path: string
  result_json: AnalysisResult | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// Project
export interface Project {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}
