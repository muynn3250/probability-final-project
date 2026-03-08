import React, { useState } from 'react'
import SimulationForm from './components/SimulationForm'
import SimulationChart from "./components/SimulationChart";
import Results from './components/Results'
import './index.css'


export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('live') // 'live' or 'demo' (mock)

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1 className="title">Jump-Diffusion Simulator 🐰✨</h1>
          <p className="subtitle">Mai Anh Mai Uyên Mai stock jump thì thành tỷ Phú</p>
        </div>
        <div className="mode-switch">
          <label>
            <input type="radio" checked={mode==='live'} onChange={()=>setMode('live')} /> Live
          </label>
          <label style={{marginLeft:8}}>
            <input type="radio" checked={mode==='demo'} onChange={()=>setMode('demo')} /> Demo
          </label>
        </div>
      </header>

      <main className="main">
        <aside className="sim-form">
          <SimulationForm
            mode={mode}
            onStart={() => { setLoading(true); setResult(null) }}
            onComplete={(res) => { setResult(res); setLoading(false) }}
            onError={(err) => { setLoading(false); alert('Error: ' + err) }}
          />
        </aside>

        <section className="results-area">
          {loading && <div className="loading">Running simulations... please wait 🐣</div>}
          {!loading && !result && <div className="placeholder">Chọn mã và bấm Run để bắt đầu — hoặc chuyển sang Demo mode nếu chưa có backend.</div>}
          {result && <Results res={result} />}
        </section>
      </main>

      <footer className="footer">For educational purposes only. Your money, your risk.💸</footer>
    </div>
  )
}
