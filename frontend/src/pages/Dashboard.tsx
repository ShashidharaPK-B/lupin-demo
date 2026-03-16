import React, { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import MainContent from '../components/MainContent'
import { useCalculate, useAnalysisJob } from '../hooks/useAnalysis'
import type { ParametricAssumptions } from '../types'

const Dashboard: React.FC = () => {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const calculateMutation = useCalculate()
  const { data: job } = useAnalysisJob(activeJobId)

  const handleCalculate = (file: File, assumptions: ParametricAssumptions) => {
    calculateMutation.mutate(
      { file, assumptions },
      {
        onSuccess: (newJob) => {
          setActiveJobId(newJob.id)
        },
        onError: () => {
          setActiveJobId(null)
        },
      },
    )
  }

  const isLoading =
    calculateMutation.isPending ||
    job?.status === 'pending' ||
    job?.status === 'processing'

  const error = calculateMutation.error?.message || null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
      }}
    >
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar onCalculate={handleCalculate} isLoading={isLoading} />
        <MainContent job={job} isLoading={calculateMutation.isPending} error={error} />
      </div>
    </div>
  )
}

export default Dashboard
