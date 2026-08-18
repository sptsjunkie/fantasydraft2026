import { useState } from 'react'
import DraftTool from './DraftTool'
import PodcastTranscriber from './PodcastTranscriber'

function App() {
  const [view, setView] = useState('home')

  if (view === 'draft') return <DraftTool />
  if (view === 'transcriber') return <PodcastTranscriber onBack={() => setView('home')} />

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#e2e8f0',
      gap: '1.5rem',
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: '0.5rem',
        textAlign: 'center',
      }}>
        Fantasy Draft 2026
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '1rem', textAlign: 'center' }}>
        Choose a tool to get started
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => setView('draft')}
          style={{
            padding: '1.25rem 2rem',
            borderRadius: '12px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '220px',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#818cf8'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.transform = 'translateY(0)'; }}
        >
          Draft Tool
        </button>
        <button
          onClick={() => setView('transcriber')}
          style={{
            padding: '1.25rem 2rem',
            borderRadius: '12px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '220px',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.transform = 'translateY(0)'; }}
        >
          Podcast Transcriber
        </button>
      </div>
    </div>
  )
}

export default App
