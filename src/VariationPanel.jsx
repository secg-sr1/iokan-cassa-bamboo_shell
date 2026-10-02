import { baseVariation, variationPresets } from './variations';
export default function VariationPanel({ variation, setVariation, parameters, result, snapshots, setSnapshots, restore, storageError }) {
  function save() {
    setSnapshots(all => [...all.slice(-7), { id: crypto.randomUUID(), name: `Study ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, variation: { ...variation }, parameters: { ...parameters }, displacement: result.maxDisplacement, stress: result.maxStress }]);
  }
  return <section className="variation-panel" role="tabpanel" id="variation-panel" aria-labelledby="variation-tab">
    <p className="eyebrow">FORM EXPLORATION</p><h2>Shape variations</h2><p>Change the proportions of all six layers together. Column axes and calculations update with the same geometry.</p>
    <div className="preset-grid">{variationPresets.map(({ name, ...values }) => <button key={name} onClick={() => setVariation(values)}>{name}</button>)}</div>
    {[['width', 'Width · X'], ['depth', 'Depth · Z'], ['height', 'Height · Y']].map(([key, label]) => <label className="field" key={key}><span>{label}<strong>{variation[key].toFixed(2)}×</strong></span><input aria-label={label} type="range" min="0.6" max="1.5" step="0.01" value={variation[key]} onChange={e => setVariation(v => ({ ...v, [key]: Number(e.target.value) }))}/></label>)}
    <p>Column culm diameter stays circular and is controlled in Study. Shell meshes are scaled as an envelope study; their section sizes and joints are not redesigned or checked.</p>
    <button className="export-study" onClick={() => setVariation(baseVariation)}>Reset proportions</button>
    <h3>Compare variations</h3><p>Save up to eight local snapshots. Each includes its geometry, bamboo assumptions and loads.</p>
    <button className="export-study" disabled={!!result.error} onClick={save}>Save current variation +</button>
    {storageError && <p role="status">Browser storage is unavailable. Snapshots will last only for this session; export studies from the Study tab to keep them.</p>}
    <div className="snapshots">{snapshots.map(snapshot => <article key={snapshot.id}><strong>{snapshot.name}</strong><p>W {snapshot.variation.width} · D {snapshot.variation.depth} · H {snapshot.variation.height}</p><p>{(snapshot.displacement * 1000).toFixed(2)} mm max δ · {(snapshot.stress / 1e6).toFixed(2)} MPa<br/>Trial independent-column results</p><div><button onClick={() => restore(snapshot)}>Restore</button><button aria-label={`Delete ${snapshot.name}`} onClick={() => setSnapshots(all => all.filter(s => s.id !== snapshot.id))}>Delete</button></div></article>)}</div>
  </section>;
}
