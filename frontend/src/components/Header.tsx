import React from 'react'
import { ChevronLeft, Circle } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Go Back + API indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: '#1a2980',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#243296'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a2980'
          }}
        >
          <ChevronLeft size={14} />
          Go Back
        </button>

        {/* API name with green status dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)',
            }}
          />
          Lupin_ShouldCost_API1
        </div>
      </div>

      {/* Right: User avatar + name + role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            Admin User
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Analyst</div>
        </div>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          AU
        </div>
      </div>
    </header>
  )
}

export default Header
