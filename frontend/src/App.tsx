import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Upload, FileText, X, DollarSign, FlaskConical, Users,
  Settings, TrendingUp, Package, Info, CheckCircle, AlertCircle, ChevronLeft,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParametricAssumptions {
  yield_pct: number
  solvent_recovery_pct: number
  city: string
  profit_margin_pct: number
}

interface CostLineItem {
  name: string
  quantity: number | null
  unit: string | null
  unit_cost: number | null
  total_cost: number
  category: string | null
  notes: string | null
}

interface AnalysisResult {
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

interface AnalysisJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  yield_pct: number
  solvent_recovery_pct: number
  city: string
  profit_margin_pct: number
  document_filename: string
  result_json: AnalysisResult | null
  error_message: string | null
}

// ─── API ─────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 300_000,
})

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(new Error(
    err.response?.data?.detail || err.message || 'Unexpected error'
  )),
)

async function submitJob(file: File, assumptions: ParametricAssumptions): Promise<AnalysisJob> {
  const form = new FormData()
  form.append('file', file)
  form.append('yield_pct', String(assumptions.yield_pct))
  form.append('solvent_recovery_pct', String(assumptions.solvent_recovery_pct))
  form.append('city', assumptions.city)
  form.append('profit_margin_pct', String(assumptions.profit_margin_pct))
  const res = await api.post<AnalysisJob>('/api/v1/analysis/calculate', form)
  return res.data
}

async function fetchJob(id: string): Promise<AnalysisJob> {
  const res = await api.get<AnalysisJob>(`/api/v1/analysis/${id}`)
  return res.data
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v)

const YIELD_OPTIONS = ['70', '80', '90', '95']
const SOLVENT_OPTIONS = ['50', '60', '70', '80', '90']

const CAT_COLORS: Record<string, string> = {
  raw_material: '#3b82f6', solvent: '#8b5cf6', labor: '#f59e0b',
  overhead: '#6366f1', utilities: '#14b8a6', other: '#94a3b8',
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sidebarInputStyle = {
  width: '100%', padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '6px', color: '#ffffff', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box' as const,
}

const sidebarLabelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as const,
  letterSpacing: '0.5px', marginBottom: '6px',
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [yieldPct, setYieldPct] = useState('')
  const [solventRecovery, setSolventRecovery] = useState('')
  const [city, setCity] = useState('')
  const [profitMargin, setProfitMargin] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  // Submit mutation
  const mutation = useMutation<AnalysisJob, Error, { file: File; assumptions: ParametricAssumptions }>({
    mutationFn: ({ file, assumptions }) => submitJob(file, assumptions),
    onSuccess: (job) => {
      queryClient.setQueryData(['job', job.id], job)
      setJobId(job.id)
    },
    onError: () => setJobId(null),
  })

  // Poll job status
  const { data: job } = useQuery<AnalysisJob, Error>({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return s === 'pending' || s === 'processing' ? 2000 : false
    },
  })

  const isLoading = mutation.isPending || job?.status === 'pending' || job?.status === 'processing'
  const isValid = !!file && !!yieldPct && !!solventRecovery && city.trim() !== '' && profitMargin.trim() !== ''

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((files: File[]) => files[0] && setFile(files[0]), []),
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  })

  function handleCalculate() {
    if (!isValid || isLoading) return
    mutation.mutate({ file: file!, assumptions: {
      yield_pct: parseFloat(yieldPct),
      solvent_recovery_pct: parseFloat(solventRecovery),
      city: city.trim(),
      profit_margin_pct: parseFloat(profitMargin),
    }})
  }

  // ── Main area content ──
  let mainContent: React.ReactNode

  if (isLoading) {
    mainContent = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 56, height: 56, border: '4px solid #e2e8f0', borderTopColor: '#1a2980', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ fontWeight: 600, color: '#1e293b' }}>
          {job?.status === 'processing' ? 'Analyzing Document…' : 'Queuing Analysis…'}
        </p>
        <p style={{ fontSize: 13, color: '#64748b' }}>AI is extracting costs — up to 30 seconds.</p>
      </div>
    )
  } else if (mutation.error || job?.status === 'failed') {
    const msg = mutation.error?.message || job?.error_message || 'Analysis failed. Please try again.'
    mainContent = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} color="#ef4444" />
        </div>
        <p style={{ fontWeight: 600, color: '#1e293b' }}>Analysis Failed</p>
        <p style={{ fontSize: 13, color: '#64748b', backgroundColor: '#fee2e2', padding: '10px 14px', borderRadius: 8 }}>{msg}</p>
      </div>
    )
  } else if (job?.status === 'completed' && job.result_json) {
    const r = job.result_json
    const total = r.total_cost

    mainContent = (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={20} color="#22c55e" />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Should-Cost Analysis Complete</h2>
            <p style={{ fontSize: 12, color: '#64748b' }}>{job.document_filename} · {job.city} · Yield {job.yield_pct}%</p>
          </div>
        </div>

        {/* Per-unit banner */}
        <div style={{ background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)', borderRadius: 12, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>Per Unit Should-Cost</p>
            <p style={{ fontSize: 32, fontWeight: 800 }}>{fmt(r.per_unit_cost, r.currency)}</p>
            <p style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>Total batch: {fmt(r.total_cost, r.currency)}</p>
          </div>
          <DollarSign size={48} style={{ opacity: 0.2 }} />
        </div>

        {/* Cost cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Material Cost', value: r.material_cost, color: '#3b82f6', icon: <FlaskConical size={18} color="#3b82f6" /> },
            { label: 'Labor Cost', value: r.labor_cost, color: '#f59e0b', icon: <Users size={18} color="#f59e0b" /> },
            { label: 'Overhead Cost', value: r.overhead_cost, color: '#6366f1', icon: <Settings size={18} color="#6366f1" /> },
            { label: 'Profit', value: r.profit, color: '#22c55e', icon: <TrendingUp size={18} color="#22c55e" /> },
          ].map(({ label, value, color, icon }) => {
            const pct = total > 0 ? (value / total) * 100 : 0
            return (
              <div key={label} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{fmt(value, r.currency)}</p>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Assumptions */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Info size={14} color="#64748b" />
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Assumptions Applied</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {[
              { label: 'Yield', value: `${job.yield_pct}%` },
              { label: 'Solvent Recovery', value: `${job.solvent_recovery_pct}%` },
              { label: 'Location', value: job.city },
              { label: 'Profit Margin', value: `${job.profit_margin_pct}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
                <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {r.summary && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
            <strong>Summary: </strong>{r.summary}
          </div>
        )}

        {/* Line items table */}
        {r.line_items.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} /> Detailed Line Items ({r.line_items.length})
            </h3>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    {['Item', 'Category', 'Qty', 'Unit', 'Unit Cost', 'Total'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.line_items.map((item, idx) => {
                    const c = CAT_COLORS[item.category || 'other'] || '#94a3b8'
                    return (
                      <tr key={idx} style={{ borderBottom: idx < r.line_items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#334155' }}>
                          {item.name}
                          {item.notes && <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{item.notes}</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ display: 'inline-flex', padding: '2px 8px', backgroundColor: c + '18', color: c, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {item.category || 'other'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.quantity?.toFixed(2) ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.unit ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.unit_cost != null ? fmt(item.unit_cost, r.currency) : '—'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{fmt(item.total_cost, r.currency)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={5} style={{ padding: '10px 14px', fontWeight: 700, color: '#334155' }}>Total Cost</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 14, color: '#1a2980', whiteSpace: 'nowrap' }}>{fmt(r.total_cost, r.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  } else {
    mainContent = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Upload size={32} color="#94a3b8" />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#334155' }}>Upload Inputs</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, maxWidth: 340, lineHeight: 1.6 }}>
            Upload your Recipe of Synthesis (ROS) document, set assumptions in the left panel, then click <strong style={{ color: '#1a2980' }}>Calculate</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['Supported Formats', 'PDF · Excel · Word'], ['AI Powered', 'Azure OpenAI GPT-4o'], ['Output', 'Cost Breakdown']].map(([label, val]) => (
            <div key={label} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', textAlign: 'center', minWidth: 130 }}>
              <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{val}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: '#1a2980', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none' }}>
            <ChevronLeft size={14} /> Go Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 13, color: '#334155' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            Lupin_ShouldCost_API1
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Admin User</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Analyst</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2980, #26d0ce)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>AU</div>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{ width: 280, minWidth: 280, backgroundColor: '#1a2980', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '20px 16px', gap: 20 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>AI Should Cost Engine</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 }}>Pharmaceutical Manufacturing</p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          {/* File upload */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Upload ROS for APIs</p>
            <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'rgba(38,208,206,0.8)' : 'rgba(255,255,255,0.25)'}`, borderRadius: 8, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', backgroundColor: isDragActive ? 'rgba(38,208,206,0.08)' : 'rgba(255,255,255,0.04)', minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <input {...getInputProps()} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 10px', width: '100%' }}>
                  <FileText size={16} color="#26d0ce" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null) }} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={24} color="rgba(255,255,255,0.4)" />
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{isDragActive ? 'Drop file here' : 'Click or drag file'}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>PDF, Excel, Word</p>
                </>
              )}
            </div>
          </section>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          {/* Assumptions */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Set Parametric Assumptions</p>

            <div>
              <label style={sidebarLabelStyle}>Yield (%)</label>
              <select value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} style={{ ...sidebarInputStyle, cursor: 'pointer' }}>
                <option value="" style={{ backgroundColor: '#1a2980' }}>Select yield…</option>
                {YIELD_OPTIONS.map((o) => <option key={o} value={o} style={{ backgroundColor: '#1a2980' }}>{o}%</option>)}
              </select>
            </div>

            <div>
              <label style={sidebarLabelStyle}>Solvent Recovery (%)</label>
              <select value={solventRecovery} onChange={(e) => setSolventRecovery(e.target.value)} style={{ ...sidebarInputStyle, cursor: 'pointer' }}>
                <option value="" style={{ backgroundColor: '#1a2980' }}>Select recovery…</option>
                {SOLVENT_OPTIONS.map((o) => <option key={o} value={o} style={{ backgroundColor: '#1a2980' }}>{o}%</option>)}
              </select>
            </div>

            <div>
              <label style={sidebarLabelStyle}>City / Location</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai, Hyderabad" style={sidebarInputStyle} />
            </div>

            <div>
              <label style={sidebarLabelStyle}>Profit Margin (%)</label>
              <input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} placeholder="e.g. 15" min="0" max="100" step="0.5" style={sidebarInputStyle} />
            </div>
          </section>

          <div style={{ flex: 1 }} />

          {/* Calculate button */}
          <button onClick={handleCalculate} disabled={!isValid || isLoading} style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', border: 'none', cursor: isValid && !isLoading ? 'pointer' : 'not-allowed', backgroundColor: isValid && !isLoading ? '#26d0ce' : 'rgba(255,255,255,0.1)', color: isValid && !isLoading ? '#111d5e' : 'rgba(255,255,255,0.3)' }}>
            {isLoading ? 'Calculating…' : 'Calculate'}
          </button>
        </aside>

        {/* Main area */}
        <main style={{ flex: 1, backgroundColor: '#f5f6fa', overflowY: 'auto', display: job?.status === 'completed' ? 'block' : 'flex', alignItems: 'center', justifyContent: 'center', padding: job?.status === 'completed' ? 0 : 24 }}>
          {mainContent}
        </main>
      </div>
    </div>
  )
}
