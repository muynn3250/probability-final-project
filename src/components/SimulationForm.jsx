import React, { useState } from "react";
import { fakeSimulate } from "../utils/demoSim";

export default function SimulationForm({ mode='live', onStart, onComplete, onError }) {
  const [ticker, setTicker] = useState("AAPL");
  const [horizon, setHorizon] = useState(30);
  const [M, setM] = useState(500);
  const [targetK, setTargetK] = useState("");
  const [file, setFile] = useState(null);

  // fixed train_end per requirement
  const TRAIN_END = "2025-08-01";

  function parseCSV(text) {
    // simple CSV parser: expects header with Date,Close
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map(h => h.trim());
    const dateIdx = header.findIndex(h => /date/i.test(h));
    const closeIdx = header.findIndex(h => /close/i.test(h));
    if (dateIdx === -1 || closeIdx === -1) return [];
    const rows = lines.slice(1).map(l => {
      const cols = l.split(",").map(c => c.trim());
      return { date: cols[dateIdx], close: Number(cols[closeIdx]) };
    }).filter(r => !isNaN(r.close));
    // convert to ascending date order
    rows.sort((a,b)=> new Date(a.date) - new Date(b.date));
    return rows;
  }

  function prepareActualAndHistory(rows, horizonDays) {
    // rows: array of {date, close} sorted ascending
    const trainEndDate = new Date(TRAIN_END);
    // find index of last date <= trainEnd
    const idx = rows.map(r=>new Date(r.date)).reduce((acc, d, i) => (d <= trainEndDate ? i : acc), -1);
    // if idx === -1: no training data
    const trainLastIdx = idx;
    const historyStartIdx = Math.max(0, trainLastIdx - horizonDays + 1);
    const history = rows.slice(historyStartIdx, trainLastIdx + 1).map(r=>r.close);
    // actual future: dates > train_end
    const future = rows.filter(r => new Date(r.date) > trainEndDate).slice(0, horizonDays).map(r=>r.close);
    const labelsHistory = rows.slice(historyStartIdx, trainLastIdx + 1).map(r=>r.date);
    const labelsFuture = rows.filter(r => new Date(r.date) > trainEndDate).slice(0, horizonDays).map(r=>r.date);
    const labels = [...labelsHistory, ...labelsFuture];
    return { history, future, labels };
  }

  async function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f || null);
  }

  async function runDemoWithCSV(rows) {
    const { history, future, labels } = prepareActualAndHistory(rows, Number(horizon));
    const S0 = history.length > 0 ? history[history.length - 1] : (rows[rows.length-1]?.close || 100);
    const payload = {
      ticker,
      horizon_days: Number(horizon),
      M: Number(M),
      target_k: targetK ? Number(targetK) : null,
      train_start: "2023-08-01",
      train_end: "2025-08-01"
    };
    // call demo simulate but pass S0 and optionally actual future & history
    const res = await fakeSimulate({ ...payload, S0, history, future, labels });
    if (onComplete) onComplete(res);
  }

  async function submit() {
    try {
      if (onStart) onStart();
      if (file) {
        // read file
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length === 0) {
          throw new Error("CSV parse failed. Expect header Date,Close and numeric Close values.");
        }
        // run demo simulation using CSV actual
        await runDemoWithCSV(rows);
        return;
      }

      // if no file and mode is demo => use fake simulate with default S0
      if (mode === 'demo' || !file) {
        const res = await fakeSimulate({
          ticker,
          horizon_days: Number(horizon),
          M: Number(M),
          target_k: targetK ? Number(targetK) : null,
        });
        if (onComplete) onComplete(res);
        return;
      }

    } catch (err) {
      if (onError) onError(err.message || String(err));
      console.error(err);
    }
  }

  return (
    <div>
      <div className="form-row">
        <label>Chọn mã stock</label>
        <input value={ticker} onChange={e => setTicker(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Horizon (days) — số ngày muốn dự đoán</label>
        <input type="number" min={1} value={horizon} onChange={e => setHorizon(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Số simulations M</label>
        <input type="number" min={10} value={M} onChange={e => setM(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Giá mục tiêu K (tùy chọn)</label>
        <input value={targetK} onChange={e => setTargetK(e.target.value)} placeholder="ví dụ 200" />
      </div>

      <div className="form-row">
        <label>Upload CSV lịch sử (Date,Close) — optional (nếu muốn dùng dữ liệu thật)</label>
        <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        <div className="small-note">Nếu không upload, bật Demo để dùng dữ liệu giả lập.</div>
      </div>

      <div style={{display:'flex', gap:8}}>
        <button className="btn" onClick={submit}>Run Simulation</button>
        <button className="btn" style={{background:'#eee', color:'#333'}} onClick={() => {
          setTicker('AAPL'); setHorizon(30); setM(500); setTargetK(''); setFile(null)
        }}>Reset</button>
      </div>
    </div>
  );
}
