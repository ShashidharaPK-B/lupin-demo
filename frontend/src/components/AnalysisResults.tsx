import React from 'react'
import {
  DollarSign,
  FlaskConical,
  Users,
  Settings,
  TrendingUp,
  Package,
  Info,
  CheckCircle,
} from 'lucide-react'
import type { AnalysisJob, AnalysisResult } from '../types'

interface AnalysisResultsProps {
  job: AnalysisJob
}

const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatPct = (value: number): string => `${value.toFixed(1)}%`

interface CostCardProps {
  label: string
  value: number
  currency: string
  color: string
  icon: React.ReactNode
  percentage?: number
  totalCost?: number
}

const CostCard: React.FC<CostCardProps> = ({
  label,
  value,
  currency,
  color,
  icon,
  percentage,
  totalCost,
}) => {
  const pct =
    percentage !== undefined
      ? percentage
      : totalCost && totalCost > 0
        ? (value / totalCost) * 100
        : null

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: color + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>
          {label}
        </p>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
          {formatCurrency(value, currency)}
        </p>
        {pct !== null && (
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: '#f1f5f9',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: color,
                  borderRadius: '2px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ job }) => {
  const result = job.result_json as AnalysisResult | null
  if (!result) return null

  const categoryColors: Record<string, string> = {
    raw_material: '#3b82f6',
    solvent: '#8b5cf6',
    labor: '#f59e0b',
    overhead: '#6366f1',
    utilities: '#14b8a6',
    other: '#94a3b8',
  }

  const groupedItems = result.line_items.reduce<Record<string, typeof result.line_items>>(
    (acc, item) => {
      const cat = item.category || 'other'
      acc[cat] = acc[cat] || []
      acc[cat].push(item)
      return acc
    },
    {},
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckCircle size={20} color="#22c55e" />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
            Should-Cost Analysis Complete
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {job.document_filename} &bull; {job.city} &bull; Yield {job.yield_pct}%
          </p>
        </div>
      </div>

      {/* Per Unit Cost Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '4px' }}>
            Per Unit Should-Cost
          </p>
          <p style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {formatCurrency(result.per_unit_cost, result.currency)}
          </p>
          <p style={{ fontSize: '12px', opacity: 0.65, marginTop: '4px' }}>
            Total batch: {formatCurrency(result.total_cost, result.currency)}
          </p>
        </div>
        <DollarSign size={48} style={{ opacity: 0.2 }} />
      </div>

      {/* Cost Breakdown Cards */}
      <div>
        <h3
          style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}
        >
          Cost Breakdown
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <CostCard
            label="Material Cost"
            value={result.material_cost}
            currency={result.currency}
            color="#3b82f6"
            icon={<FlaskConical size={18} color="#3b82f6" />}
            totalCost={result.total_cost}
          />
          <CostCard
            label="Labor Cost"
            value={result.labor_cost}
            currency={result.currency}
            color="#f59e0b"
            icon={<Users size={18} color="#f59e0b" />}
            totalCost={result.total_cost}
          />
          <CostCard
            label="Overhead Cost"
            value={result.overhead_cost}
            currency={result.currency}
            color="#6366f1"
            icon={<Settings size={18} color="#6366f1" />}
            totalCost={result.total_cost}
          />
          <CostCard
            label="Profit"
            value={result.profit}
            currency={result.currency}
            color="#22c55e"
            icon={<TrendingUp size={18} color="#22c55e" />}
            totalCost={result.total_cost}
          />
        </div>
      </div>

      {/* Assumptions Used */}
      {result.assumptions && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Info size={14} color="#64748b" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Assumptions Applied
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '8px',
            }}
          >
            {[
              { label: 'Yield', value: `${job.yield_pct}%` },
              { label: 'Solvent Recovery', value: `${job.solvent_recovery_pct}%` },
              { label: 'Location', value: job.city },
              { label: 'Profit Margin', value: `${job.profit_margin_pct}%` },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                }}
              >
                <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{label}</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#1e40af',
            lineHeight: 1.6,
          }}
        >
          <strong>Analysis Summary: </strong>
          {result.summary}
        </div>
      )}

      {/* Line Items Table */}
      {result.line_items && result.line_items.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Package size={14} />
            Detailed Line Items ({result.line_items.length})
          </h3>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Item', 'Category', 'Qty', 'Unit', 'Unit Cost', 'Total'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        borderBottom: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.line_items.map((item, idx) => {
                  const catColor =
                    categoryColors[item.category || 'other'] || '#94a3b8'
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom:
                          idx < result.line_items.length - 1
                            ? '1px solid #f1f5f9'
                            : 'none',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 14px',
                          fontWeight: 500,
                          color: '#334155',
                        }}
                      >
                        {item.name}
                        {item.notes && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: '11px',
                              color: '#94a3b8',
                              marginTop: '1px',
                            }}
                          >
                            {item.notes}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            backgroundColor: catColor + '18',
                            color: catColor,
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {item.category || 'other'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {item.quantity?.toFixed(2) ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {item.unit ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {item.unit_cost != null
                          ? formatCurrency(item.unit_cost, result.currency)
                          : '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatCurrency(item.total_cost, result.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td
                    colSpan={5}
                    style={{
                      padding: '10px 14px',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#334155',
                    }}
                  >
                    Total Cost
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#1a2980',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCurrency(result.total_cost, result.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalysisResults
