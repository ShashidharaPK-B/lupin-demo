import React from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import type { AnalysisJob } from '../types'
import AnalysisResults from './AnalysisResults'

interface MainContentProps {
  job: AnalysisJob | null | undefined
  isLoading: boolean
  error: string | null
}

const MainContent: React.FC<MainContentProps> = ({ job, isLoading, error }) => {
  // Loading / Processing state
  if (isLoading || job?.status === 'pending' || job?.status === 'processing') {
    return (
      <main
        style={{
          flex: 1,
          backgroundColor: '#f5f6fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#1a2980',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            {job?.status === 'processing' ? 'Analyzing Document...' : 'Queuing Analysis...'}
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            AI is extracting costs from your ROS document. This may take up to 30 seconds.
          </p>
        </div>
        {job && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '12px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                animation: 'pulse 1.5s ease infinite',
                flexShrink: 0,
              }}
            />
            Job ID: {job.id.slice(0, 8)}... &bull; Status: {job.status}
          </div>
        )}
      </main>
    )
  }

  // Error state
  if (error || job?.status === 'failed') {
    const errorMsg = error || job?.error_message || 'Analysis failed. Please try again.'
    return (
      <main
        style={{
          flex: 1,
          backgroundColor: '#f5f6fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertCircle size={28} color="#ef4444" />
        </div>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
            Analysis Failed
          </p>
          <p
            style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: 1.6,
              backgroundColor: '#fee2e2',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
            }}
          >
            {errorMsg}
          </p>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
          Please check your document and try again.
        </p>
      </main>
    )
  }

  // Results state
  if (job?.status === 'completed' && job.result_json) {
    return (
      <main
        style={{
          flex: 1,
          backgroundColor: '#f5f6fa',
          overflowY: 'auto',
        }}
      >
        <AnalysisResults job={job} />
      </main>
    )
  }

  // Empty / initial state
  return (
    <main
      style={{
        flex: 1,
        backgroundColor: '#f5f6fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          backgroundColor: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Upload size={36} color="#94a3b8" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#334155' }}>Upload Inputs</p>
        <p
          style={{
            fontSize: '13px',
            color: '#94a3b8',
            marginTop: '8px',
            maxWidth: '360px',
            lineHeight: 1.6,
          }}
        >
          Upload your Recipe of Synthesis (ROS) document and set parametric assumptions in the
          left panel, then click{' '}
          <strong style={{ color: '#1a2980' }}>Calculate</strong> to generate a should-cost estimate.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginTop: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { label: 'Supported Formats', value: 'PDF · Excel · Word' },
          { label: 'AI Powered', value: 'Azure OpenAI GPT-4o' },
          { label: 'Output', value: 'Detailed Cost Breakdown' },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              textAlign: 'center',
              minWidth: '140px',
            }}
          >
            <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{value}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

export default MainContent
