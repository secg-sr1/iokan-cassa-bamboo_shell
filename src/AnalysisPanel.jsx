import report from './generated/import-report.json';
import { bambooReferences } from './materials';
import { metrics } from './variations';
import curveA from '../models/columnas-00-curves-generated.glb?url';
import curveB from '../models/columnas-01-curves-generated.glb?url';
const fields = [ ['unitScale', 'Metres / model unit', 0.001], ['diameter', 'Outer diameter · mm', 1], ['thickness', 'Wall thickness · mm', 1], ['modulus', 'Longitudinal E assumption · GPa', 0.1], ['vertical', 'Downward tip load / column · kN', 0.01], ['horizontal', '+X tip load / column · kN', 0.01], ['amplification', 'Deformation display ×', 1] ];
export default function AnalysisPanel({ parameters, setParameters, result, display, setDisplay, confirmed, setConfirmed, metric, setMetric, variation, columns }) {
  function exportResult() {
    const data = { scope: 'Independent fixed-free columns only; NOT a connected-shell analysis or design check', material: bambooReferences.find(m => m.id === parameters.materialId), variation, parameters, geometry: columns, results: result, importedFiles: report };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'iokan-column-study.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="analysis-panel" id="analysis-panel" role="tabpanel" aria-labelledby="analysis-tab">
    <p className="eyebrow">LOCAL SANDBOX / 01</p><h2>Bamboo column study</h2>
    <p>18 inferred axes. Independent fixed-base, free-tip columns. The shell is visual context only.</p>
    <div className="import-warning">The 4 supplied curve GLBs are empty. Shell connectivity and whole-structure analysis are unavailable.</div>
    <label className="field">Display<select value={display} onChange={e => setDisplay(e.target.value)}><option value="solids">Solids</option><option value="overlay">Solids + column axes</option><option value="curves">Column axes only</option><option value="results">Results on model</option><option value="deformed">Deformation + shell context</option></select></label>
    <label className="field">Result colors<select value={metric} onChange={e => setMetric(e.target.value)}>{Object.entries(metrics).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
    <h3>Bamboo material reference</h3>
    <label className="field">Species / reference<select value={parameters.materialId || 'custom'} onChange={e => { const reference = bambooReferences.find(m => m.id === e.target.value); setParameters(p => ({ ...p, materialId: reference.id, modulus: reference.modulus })); }}>{bambooReferences.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    {(() => { const reference = bambooReferences.find(m => m.id === parameters.materialId) || bambooReferences[0]; return <p>{reference.note} <a href={reference.url} target="_blank" rel="noreferrer">{reference.source} ↗</a></p>; })()}
    <p>Natural round bamboo culms, modeled as uniform hollow sections. Decorative node rings are visual only. Species presets change E only; they do not set dimensions or allowable strengths.</p>
    <h3>Editable assumptions</h3>
    <p>Uniform hollow circular section. Lower-Y end fixed in all six degrees of freedom; no bracing, self-weight, connection slip or load sharing. Values below are trial inputs, not measured bamboo properties.</p>
    {fields.map(([key, label, step]) => <label className="field" key={key}>{label}<input type="number" step={step} value={Number.isNaN(parameters[key]) ? '' : parameters[key]} onChange={e => { setParameters(p => ({ ...p, ...(key === 'modulus' ? { materialId: 'custom' } : {}), [key]: e.target.value === '' ? NaN : Number(e.target.value) })); }} /></label>)}
    <label className="confirm-assumptions"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>Show trial results using these assumptions</label>
    {result.error ? <p role="alert" className="import-warning">{result.error}</p> : confirmed ? <>
      <h3>Linear elastic results</h3><div className="result-grid"><div><strong>{(result.maxDisplacement * 1000).toFixed(2)}</strong><span>max tip displacement · mm</span></div><div><strong>{(result.maxStress / 1e6).toFixed(2)}</strong><span>max elastic stress · MPa</span></div><div><strong>{result.maxBucklingRatio.toFixed(3)}</strong><span>max compression / Euler load</span></div></div>
      {result.outOfDomain && <p className="import-warning">Outside linear screening range: displacement exceeds 5% of length or compression reaches Euler load. Displayed deformation is not a valid prediction of the structure.</p>}
      <p>Euler load uses K = 2 (fixed-free). This ratio is not a code utilization or safety factor. No bamboo strength check is performed.</p>
      <table className="member-results"><thead><tr><th>Index</th><th>L · m</th><th>δ · mm</th><th>N · kN</th></tr></thead><tbody>{result.members.map(m => <tr key={m.id}><td>{m.id}</td><td>{m.L.toFixed(2)}</td><td>{(m.magnitude * 1000).toFixed(2)}</td><td>{(m.axial / 1000).toFixed(2)}</td></tr>)}</tbody></table><p>N: tension positive; compression negative. Loads apply to every column, regardless of layer visibility.</p><button className="export-study" onClick={exportResult}>Export study JSON ↗</button>
    </> : <p>Confirm the trial assumptions to display results and deformation.</p>}
    <h3>Original centerline downloads</h3><p>Base geometry only. Export study JSON for the current transformed endpoints. PCA fit with end-ring centroids, in original source coordinates. Validate these inferred axes before analysis.</p><div className="curve-downloads"><a href={curveA} download="columnas-00-curves-generated.glb">Column set A · GLB ↓</a><a href={curveB} download="columnas-01-curves-generated.glb">Column set B · GLB ↓</a></div>
    <details><summary>Import report</summary>{report.map(r => <p key={r.file}><strong>{r.empty ? 'EMPTY' : `${r.primitives} meshes`}</strong> · {r.file}</p>)}</details>
  </div>;
}
