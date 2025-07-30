"use client"

import { useSession, getSession } from "next-auth/react"
import { useState, useEffect } from "react"

export default function SessionDebugPage() {
  const { data: session, status, update } = useSession()
  const [serverSession, setServerSession] = useState<any>(null)
  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [cookies, setCookies] = useState<string>("")

  useEffect(() => {
    // เก็บประวัติการเปลี่ยนแปลง session
    const newEntry = {
      timestamp: new Date().toISOString(),
      status,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          role: session.user?.role,
          name: session.user?.name
        }
      } : null
    }
    
    setSessionHistory(prev => [newEntry, ...prev.slice(0, 9)]) // เก็บ 10 รายการล่าสุด
  }, [session, status])

  useEffect(() => {
    // ดึง cookies ที่เกี่ยวข้องกับ NextAuth
    if (typeof window !== 'undefined') {
      const allCookies = document.cookie
      setCookies(allCookies)
    }
  }, [])

  const fetchServerSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setServerSession(data)
    } catch (error) {
      console.error('Failed to fetch server session:', error)
      setServerSession({ error: 'Failed to fetch' })
    }
  }

  const forceRefreshSession = async () => {
    try {
      console.log("🔄 Force refreshing session...")
      await update()
      await fetchServerSession()
      console.log("✅ Session refresh completed")
    } catch (error) {
      console.error("❌ Session refresh failed:", error)
    }
  }

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'monospace', 
      fontSize: '12px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#333' }}>
        🔍 NextAuth Session Debug Panel
      </h1>

      {/* Control Panel */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>🎛️ Control Panel</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchServerSession}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📡 Fetch Server Session
          </button>
          <button 
            onClick={forceRefreshSession}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Force Refresh Session
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔃 Reload Page
          </button>
        </div>
      </div>

      {/* Current Session Status */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>📊 Current Session Status</h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: status === 'authenticated' ? '#d4edda' : 
                          status === 'loading' ? '#fff3cd' : '#f8d7da',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <strong>Status: </strong>
          <span style={{ 
            fontSize: '1.1em',
            color: status === 'authenticated' ? '#155724' : 
                   status === 'loading' ? '#856404' : '#721c24'
          }}>
            {status}
          </span>
        </div>
        
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '11px'
        }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      {/* Server Session Comparison */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>🖥️ Server Session (API)</h2>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '11px'
        }}>
          {serverSession ? JSON.stringify(serverSession, null, 2) : 'Click "Fetch Server Session" to load'}
        </pre>
      </div>

      {/* Cookies Information */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>🍪 Browser Cookies</h2>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          fontSize: '11px',
          wordBreak: 'break-all'
        }}>
          {cookies.split(';').map((cookie, index) => (
            <div key={index} style={{ 
              marginBottom: '0.5rem',
              padding: '0.25rem',
              backgroundColor: cookie.includes('next-auth') ? '#e7f3ff' : 'transparent',
              borderLeft: cookie.includes('next-auth') ? '3px solid #007bff' : 'none',
              paddingLeft: cookie.includes('next-auth') ? '0.5rem' : '0.25rem'
            }}>
              {cookie.trim()}
            </div>
          ))}
        </div>
      </div>

      {/* Session History */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>📈 Session History (Last 10 Changes)</h2>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {sessionHistory.map((entry, index) => (
            <div key={index} style={{ 
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              borderLeft: '3px solid ' + (
                entry.status === 'authenticated' ? '#28a745' :
                entry.status === 'loading' ? '#ffc107' : '#dc3545'
              )
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {entry.timestamp} - Status: {entry.status}
              </div>
              <pre style={{ 
                fontSize: '10px', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {JSON.stringify(entry.session, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>🧭 Navigation</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/auth/signin" style={{ color: '#007bff', textDecoration: 'none' }}>
            🔐 Sign In Page
          </a>
          <a href="/auth/role-redirect" style={{ color: '#007bff', textDecoration: 'none' }}>
            🎯 Role Redirect Page
          </a>
          <a href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
            👑 Admin Dashboard
          </a>
          <a href="/api/auth/session" style={{ color: '#007bff', textDecoration: 'none' }}>
            📡 Session API
          </a>
        </div>
      </div>
    </div>
  )
}