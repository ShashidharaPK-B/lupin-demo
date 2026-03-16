import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, ChevronDown } from 'lucide-react'
import type { ParametricAssumptions } from '../types'

interface SidebarProps {
  onCalculate: (file: File, assumptions: ParametricAssumptions) => void
  isLoading: boolean
}

const YIELD_OPTIONS = ['70', '80', '90', '95']
const SOLVENT_RECOVERY_OPTIONS = ['50', '60', '70', '80', '90']

const Sidebar: React.FC<SidebarProps> = ({ onCalculate, isLoading }) => {
  const [file, setFile] = useState<File | null>(null)
  const [yieldPct, setYieldPct] = useState<string>('')
  const [solventRecovery, setSolventRecovery] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [profitMargin, setProfitMargin] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    multiple: false,
  })

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
  }

  const isFormValid =
    file !== null &&
    yieldPct !== '' &&
    solventRecovery !== '' &&
    city.trim() !== '' &&
    profitMargin.trim() !== ''

  const handleCalculate = () => {
    if (!isFormValid || isLoading) return
    onCalculate(file!, {
      yield_pct: parseFloat(yieldPct),
      solvent_recovery_pct: parseFloat(solventRecovery),
      city: city.trim(),
      profit_margin_pct: parseFloat(profitMargin),
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: '30px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  }

  return (
    <aside
      style={{
        width: '280px',
        minWidth: '280px',
        backgroundColor: '#1a2980',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '20px 16px',
        gap: '20px',
      }}
    >
      {/* Title */}
      <div>
        <h1
          style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.2px',
          }}
        >
          AI Should Cost Engine
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '4px' }}>
          Pharmaceutical Manufacturing
        </p>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Upload ROS Section */}
      <section>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: '10px',
          }}
        >
          Upload ROS for APIs
        </p>

        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'rgba(38,208,206,0.8)' : 'rgba(255,255,255,0.25)'}`,
            borderRadius: '8px',
            padding: '16px 12px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive
              ? 'rgba(38,208,206,0.08)'
              : 'rgba(255,255,255,0.04)',
            transition: 'all 0.2s',
            minHeight: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <input {...getInputProps()} />

          {file ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px 10px',
                width: '100%',
              }}
            >
              <FileText size={16} color="#26d0ce" style={{ flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: '12px',
                  color: '#ffffff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                }}
                title={file.name}
              >
                {file.name}
              </span>
              <button
                onClick={removeFile}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={24} color="rgba(255,255,255,0.4)" />
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                  {isDragActive ? 'Drop file here' : 'Click or drag file'}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                  PDF, Excel, Word
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Parametric Assumptions Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Set Parametric Assumptions for APIs
        </p>

        {/* Yield */}
        <div>
          <label style={labelStyle}>Yield (%)</label>
          <select
            value={yieldPct}
            onChange={(e) => setYieldPct(e.target.value)}
            style={selectStyle}
          >
            <option value="" style={{ backgroundColor: '#1a2980' }}>
              Select yield...
            </option>
            {YIELD_OPTIONS.map((opt) => (
              <option key={opt} value={opt} style={{ backgroundColor: '#1a2980' }}>
                {opt}%
              </option>
            ))}
          </select>
        </div>

        {/* Solvent Recovery */}
        <div>
          <label style={labelStyle}>Solvent Recovery (%)</label>
          <select
            value={solventRecovery}
            onChange={(e) => setSolventRecovery(e.target.value)}
            style={selectStyle}
          >
            <option value="" style={{ backgroundColor: '#1a2980' }}>
              Select recovery...
            </option>
            {SOLVENT_RECOVERY_OPTIONS.map((opt) => (
              <option key={opt} value={opt} style={{ backgroundColor: '#1a2980' }}>
                {opt}%
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label style={labelStyle}>City / Location</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai, Hyderabad"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(38,208,206,0.6)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          />
        </div>

        {/* Profit Margin */}
        <div>
          <label style={labelStyle}>Profit Margin (%)</label>
          <input
            type="number"
            value={profitMargin}
            onChange={(e) => setProfitMargin(e.target.value)}
            placeholder="e.g. 15"
            min="0"
            max="100"
            step="0.5"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(38,208,206,0.6)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          />
        </div>
      </section>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={!isFormValid || isLoading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          border: 'none',
          cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          backgroundColor:
            isFormValid && !isLoading ? '#26d0ce' : 'rgba(255,255,255,0.1)',
          color: isFormValid && !isLoading ? '#111d5e' : 'rgba(255,255,255,0.3)',
          boxShadow:
            isFormValid && !isLoading
              ? '0 4px 12px rgba(38,208,206,0.35)'
              : 'none',
        }}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(17,29,94,0.3)',
                borderTopColor: '#111d5e',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Calculating...
          </span>
        ) : (
          'Calculate'
        )}
      </button>
    </aside>
  )
}

export default Sidebar
