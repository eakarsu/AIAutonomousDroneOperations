import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { missionService } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * AI Mission Stream — Server-Sent Events streaming AI mission analysis.
 * Uses fetch() + ReadableStream rather than EventSource so we can pass a Bearer header.
 */
function AIMissionStream() {
  const [missions, setMissions] = useState([]);
  const [missionId, setMissionId] = useState('');
  const [status, setStatus] = useState([]);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    missionService.getAll(1, 100)
      .then((res) => setMissions(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch((e) => setError(e.message));
  }, []);

  const start = async () => {
    if (!missionId) { setError('Select a mission'); return; }
    setError(null); setStatus([]); setOutput(''); setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/ai/analyze/stream?missionId=${missionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const blocks = buf.split('\n\n');
        buf = blocks.pop();
        for (const block of blocks) {
          const evMatch = block.match(/^event: (\w+)/m);
          const dataMatch = block.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          let data;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }
          const ev = evMatch ? evMatch[1] : 'message';
          if (ev === 'status') setStatus((s) => [...s, data]);
          else if (ev === 'chunk') setOutput((o) => o + data.text);
          else if (ev === 'error') setError(data.message);
          else if (ev === 'done') setStatus((s) => [...s, { step: 'done', message: 'Analysis complete' }]);
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const stop = () => {
    if (abortRef.current) abortRef.current.abort();
    setRunning(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><i className="fas fa-stream"></i> AI Mission Stream</h1>
          <p className="subtitle">Live streaming AI mission analysis via Server-Sent Events</p>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', padding: 12, background: 'rgba(248, 113, 113, 0.08)', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>Mission</label>
            <select value={missionId} onChange={(e) => setMissionId(e.target.value)}
              style={{ width: '100%', padding: 10, background: '#0a0e1a', color: '#e0e6ed', border: '1px solid #334155', borderRadius: 6 }}>
              <option value="">Select mission to analyze</option>
              {missions.map((m) => <option key={m.id} value={m.id}>#{m.id} {m.name} ({m.type})</option>)}
            </select>
          </div>
          {!running ? (
            <button onClick={start}
              style={{ padding: '10px 24px', background: '#38bdf8', color: '#0a0e1a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <i className="fas fa-play"></i> Stream Analysis
            </button>
          ) : (
            <button onClick={stop}
              style={{ padding: '10px 24px', background: '#f87171', color: '#0a0e1a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <i className="fas fa-stop"></i> Stop
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12 }}>
          <h3 style={{ marginBottom: 12, color: '#94a3b8' }}>Pipeline Status</h3>
          {status.length === 0 && <div style={{ color: '#64748b' }}>Waiting…</div>}
          {status.map((s, i) => (
            <div key={i} style={{ padding: 8, marginBottom: 6, background: '#0a0e1a', borderRadius: 6, fontSize: 13 }}>
              <span style={{ color: '#4ade80' }}>● Step {s.step}</span> · {s.message}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 24, background: '#161b2d', borderRadius: 12, minHeight: 400 }}>
          <h3 style={{ marginBottom: 12, color: '#94a3b8' }}><i className="fas fa-brain"></i> Live AI Output</h3>
          <div style={{ background: '#0a0e1a', padding: 16, borderRadius: 8, lineHeight: 1.7, minHeight: 320, fontSize: 14 }}>
            {output ? <ReactMarkdown>{output}</ReactMarkdown> : <div style={{ color: '#64748b' }}>AI tokens will stream here…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIMissionStream;
