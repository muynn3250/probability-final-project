import React, { useMemo } from "react";
import SimulationChart from "./SimulationChart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

function makeHistogram(finals, bins = 30) {
  if (!finals || finals.length === 0) return [];
  const minv = Math.min(...finals);
  const maxv = Math.max(...finals);
  const step = (maxv - minv) / bins || 1;
  const counts = new Array(bins).fill(0);
  finals.forEach(v => {
    let idx = Math.floor((v - minv) / step);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    counts[idx] += 1;
  });
  return counts.map((c, i) => ({ x: Number((minv + i*step + step/2).toFixed(2)), y: c }));
}

export default function Results({ res }) {
  if (!res) return null;

  const { labels, historyPlusFuture, paths, final_prices, expected_final, lower95, upper95, prob_greater, S0 } = res;

  const hist = useMemo(() => makeHistogram(final_prices || [] , 30), [final_prices]);

  return (
    <div className="results">
      {/* Card chính: Expected price & S0 */}
      <div className="card cute" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h3>Expected final price: <span className="value">{Number(expected_final || 0).toFixed(2)}</span></h3>
          <div>95% CI: {Number(lower95 || 0).toFixed(2)} — {Number(upper95 || 0).toFixed(2)}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:12,color:'#666'}}>S₀</div>
          <div style={{fontSize:20, color:'#ff4d94', fontWeight:700}}>{Number(S0 || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Card riêng cho Prob(S_T > K) */}
      {typeof prob_greater === 'number' && (
        <div className="card cute" style={{marginTop:10, display:'flex', alignItems:'center'}}>
          <h3>
            Prob(S_T &gt; K): <span style={{color:'#ff4d94'}}>{(prob_greater*100).toFixed(2)}%</span>
          </h3>
        </div>
      )}

      {/* Plot simulated paths */}
      <div className="plot-block">
        <h4>Simulated Price Paths (with Actual Price)</h4>
        <SimulationChart
          labels={labels}
          historyPlusFuture={historyPlusFuture}
          simulated={paths}
        />
        <div className="small-note" style={{marginTop:10}}>
          Chart shows actual historical & actual future (red) and simulated continuations (blue semi-transparent).
        </div>
      </div>

      {/* Histogram final prices */}
      <div className="plot-block">
        <h4>Distribution of final prices</h4>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={hist}>
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="y" fill="#ffb3d9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{marginTop:8}}>
          <span style={{color:'red'}}>Expected: {Number(expected_final || 0).toFixed(2)}</span>
          <span style={{marginLeft:20, color:'blue'}}>95% CI: {Number(lower95 || 0).toFixed(2)} — {Number(upper95 || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

