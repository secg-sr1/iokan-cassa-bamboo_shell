import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import Scene from './Scene';
import AnalysisPanel from './AnalysisPanel';
import VariationPanel from './VariationPanel';
import { baseVariation, varyColumns, metricValue, metrics } from './variations';
import columns from './generated/columns.json';
import { defaults, solveColumns } from './solver';
import logo from './assets/iokan-logo.png';
import { layers, objectId } from './layers';

const STORAGE_KEY = 'iokan-notes-models-2026-10-v2';
function loadNotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(n => typeof n.id === 'string' && typeof n.text === 'string' && layers.some(l => l.id === n.layer) && typeof n.objectId === 'string' && Array.isArray(n.point) && n.point.length === 3 && n.point.every(Number.isFinite) && Number.isInteger(n.number)) : [];
  } catch { return []; }
}
function Icon({ name, ...props }) {
  const paths = { cube: 'm12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v9', top: 'M4 4h16v16H4zM4 9h16M9 4v16', explode: 'm3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5', eye: 'M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6', reset: 'M4 10a8 8 0 1 1 1 7M4 4v6h6', note: 'M4 3h16v14l-5 4H4V3Zm4 5h8M8 12h5', close: 'm6 6 12 12M6 18 18 6', chevron: 'm9 5 7 7-7 7', download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5' };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <div className="scene-error"><h2>Unable to load the structure</h2><p>Please reload to try the model files again.</p><button onClick={() => location.reload()}>Reload viewer</button></div> : this.props.children; }
}

export default function App() {
  const noteElements = useRef(new Map());
  const { progress } = useProgress();
  const [view, setView] = useState('3d');
  const [parameters, setParameters] = useState({ ...defaults, materialId: 'custom' });
  const [variation, setVariation] = useState(baseVariation);
  const [metric, setMetric] = useState('displacement');
  const [snapshots, setSnapshots] = useState(() => { try { const value = JSON.parse(localStorage.getItem('iokan-variations-v1') || '[]'); return Array.isArray(value) ? value.filter(s => s && typeof s.id === 'string' && typeof s.name === 'string' && ['width','depth','height'].every(k => Number.isFinite(s.variation?.[k]) && s.variation[k] >= 0.6 && s.variation[k] <= 1.5) && !solveColumns(columns, s.parameters || {}).error && Number.isFinite(s.displacement) && Number.isFinite(s.stress)).slice(-8) : []; } catch { return []; } });
  const [snapshotError, setSnapshotError] = useState(false);
  useEffect(() => { try { localStorage.setItem('iokan-variations-v1', JSON.stringify(snapshots)); setSnapshotError(false); } catch { setSnapshotError(true); } }, [snapshots]);
  const variedColumns = useMemo(() => varyColumns(columns, variation), [variation]);
  const [display, setDisplay] = useState('overlay');
  const [confirmed, setConfirmed] = useState(false);
  const result = useMemo(() => solveColumns(variedColumns, parameters), [variedColumns, parameters]);
  const [exploded, setExploded] = useState(false);
  const [visibility, setVisibility] = useState(Object.fromEntries(layers.map(l => [l.id, true])));
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState(loadNotes);
  const [draft, setDraft] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [tab, setTab] = useState('analysis');
  const [expanded, setExpanded] = useState(null);
  const [reset, setReset] = useState(0);
  const [mobilePanel, setMobilePanel] = useState(() => window.matchMedia("(min-width: 641px)").matches);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); setStorageError(false); } catch { setStorageError(true); }
  }, [notes]);
  useEffect(() => {
    const close = e => { if (e.key === 'Escape') { setSelected(null); setDraft(''); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  function selectObject(item) { setSelected(item); setDraft(''); }
  function saveNote(event) {
    event.preventDefault();
    if (!draft.trim() || !selected) return;
    setNotes(current => [...current, { ...selected, id: crypto.randomUUID(), text: draft.trim(), number: Math.max(0, ...current.map(n => n.number)) + 1 }]);
    setDraft('');
  }
  function exportNotes() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ project: 'Iokan / Bamboo shell', notes }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'iokan-notes.json'; a.click(); URL.revokeObjectURL(url);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const currentLayer = layers.find(l => l.id === selected?.layer);
  return <main className="app-shell">
    <header className="flex items-center justify-between border-b border-white/10 px-5 md:px-8">
      <div className="flex items-center gap-5"><a href="./" className="wordmark" aria-label="Iokan home"><img src={logo} alt="Iokan" className="brand-logo"/></a><span className="header-divider"/><span className="header-label">STRUCTURE STUDIES</span></div>
      <div className="flex items-center gap-3"><span className="status-dot"/><span className="header-label">SANDBOX / LOCAL</span></div>
    </header>
    <section className="workspace">
      <aside id="structure-sidebar" className={`sidebar ${mobilePanel ? 'panel-open' : ''}`} aria-label="Structure layers and notes">
        <button className="collapse-sidebar" aria-label="Collapse layers sidebar" aria-controls="structure-sidebar" onClick={() => setMobilePanel(false)}><Icon name="chevron" className="rotate-180"/><span>Collapse</span></button>
        <div className="project-intro"><p className="eyebrow">IOKAN × CASSA</p><h1>Bamboo shell<span>Structural exploration</span></h1><p className="project-description">A study in lightness.<br/>Six layers. An evolving structural study.</p></div>
        <div className="panel-tabs" role="tablist" aria-label="Inspector"><button role="tab" aria-selected={tab === 'layers'} aria-controls="layers-panel" id="layers-tab" onClick={() => setTab('layers')}>Layers <span>06</span></button><button role="tab" aria-selected={tab === 'analysis'} aria-controls="analysis-panel" id="analysis-tab" onClick={() => setTab('analysis')}>Study</button><button role="tab" id="variation-tab" aria-controls="variation-panel" aria-selected={tab === "variation"} onClick={() => setTab("variation")}>Form</button><button role="tab" aria-selected={tab === 'notes'} aria-controls="notes-panel" id="notes-tab" onClick={() => setTab('notes')}>Notes <span>{String(notes.length).padStart(2, '0')}</span></button></div>
        {tab === 'variation' ? <VariationPanel variation={variation} setVariation={setVariation} parameters={parameters} result={result} snapshots={snapshots} setSnapshots={setSnapshots} storageError={snapshotError} restore={snapshot => { setVariation(snapshot.variation); setParameters(snapshot.parameters); }}/> : tab === 'analysis' ? <AnalysisPanel parameters={parameters} setParameters={setParameters} result={result} display={display} setDisplay={setDisplay} confirmed={confirmed} setConfirmed={setConfirmed} metric={metric} setMetric={setMetric} variation={variation} columns={variedColumns}/> : tab === 'layers' ? <div className="layer-list" id="layers-panel" role="tabpanel" aria-labelledby="layers-tab">
          <div className="list-caption"><span>ASSEMBLY INDEX</span><span>{total || '—'} ELEMENTS</span></div>
          {[...layers].reverse().map(layer => <div className={`layer ${!visibility[layer.id] ? 'is-hidden' : ''}`} key={layer.id}>
            <div className="layer-row"><button className="layer-title" aria-expanded={expanded === layer.id} onClick={() => setExpanded(expanded === layer.id ? null : layer.id)}><span className="layer-index">{layer.id}</span><span>{layer.name}<small>{counts[layer.id] ?? '—'} elements</small></span><Icon name="chevron" className={expanded === layer.id ? 'rotate-90' : ''}/></button><button className="visibility-button" aria-label={`${visibility[layer.id] ? 'Hide' : 'Show'} ${layer.name}`} aria-pressed={visibility[layer.id]} onClick={() => setVisibility(v => ({ ...v, [layer.id]: !v[layer.id] }))}><Icon name="eye"/>{!visibility[layer.id] && <span className="eye-slash"/>}</button></div>
            {expanded === layer.id && <div className="element-list">{Array.from({ length: counts[layer.id] || 0 }, (_, i) => <div key={i}><span>{objectId(layer.id, i)}</span><span>{layer.original} {String(i + 1).padStart(3, '0')}</span></div>)}<p>Select an element in the scene to annotate it.</p></div>}
          </div>)}
          <p className="layer-hint">Toggle visibility to look inside.<br/>Select a structure element to leave a note.</p>
        </div> : <div className="notes-list" id="notes-panel" role="tabpanel" aria-labelledby="notes-tab">{notes.length ? <><div className="list-caption"><span>FIELD NOTES</span><button onClick={exportNotes} aria-label="Export notes"><Icon name="download"/></button></div>{notes.map(note => <button className="saved-note" key={note.id} onClick={() => { setVisibility(v => ({ ...v, [note.layer]: true })); selectObject(note); setMobilePanel(false); }}><span className="eyebrow">{String(note.number).padStart(2, '0')} / ELEMENT {note.objectId}</span><p>{note.text}</p></button>)}</> : <div className="empty-notes"><Icon name="note"/><h3>Observations start here.</h3><p>Click any bamboo element in the scene to attach your first note.</p></div>}<p className="layer-hint">{storageError ? 'Browser storage is unavailable. Export your notes to keep a copy.' : 'Saved on this browser. Export a copy to share.'}</p></div>}
        <div className="sidebar-bottom"><span className="material-swatch"/><div>Bamboo<small>NATURAL MATERIAL / DIGITAL STUDY</small></div><span className="tiny-cross">+</span></div>
      </aside>
      <section className="viewport" aria-label="Model viewer">
        <div className="scene-label"><span className="eyebrow">{view === 'top' ? '02 / PLAN' : '01 / PERSPECTIVE'}</span><span>{exploded ? 'Exploded assembly' : 'Complete assembly'}</span></div>
        <button className="results-launch" onClick={() => { setConfirmed(true); setDisplay("results"); }}>Show results on model</button>
        <button className="study-launch" onClick={() => { setTab("analysis"); setMobilePanel(true); }}>Column study ↗</button>
        <div className="view-switch" role="group" aria-label="Camera view"><button aria-pressed={view === '3d'} onClick={() => setView('3d')}><Icon name="cube"/>3D view</button><button aria-pressed={view === 'top'} onClick={() => setView('top')}><Icon name="top"/>Top view</button></div>
        <SceneBoundary><Scene view={view} exploded={exploded} reset={reset} visibility={visibility} selected={selected} onSelect={selectObject} notes={notes} noteElements={noteElements} display={display} result={result} parameters={parameters} confirmed={confirmed} variation={variation} columns={variedColumns} metric={metric} onReady={setCounts}/></SceneBoundary>
        {!total && <div className="loading-overlay"><div className="loading"><span className="loading-line"/>LOADING STRUCTURE <span>{Math.round(progress)}%</span></div></div>}
        {notes.map(note => <button key={note.id} ref={element => { if (element) noteElements.current.set(note.id, element); else noteElements.current.delete(note.id); }} className="note-pin" aria-label={`Open note on ${note.objectId}`} onClick={() => selectObject(note)}>{note.number}</button>)}
        {display !== 'solids' && <div className="study-legend">{(display === 'results' || display === 'deformed') && confirmed && !result.error ? <><span>{metrics[metric].label} · trial columns only</span><div className="heat-scale"/><div className="heat-range"><span>0 {metrics[metric].unit}</span><span>{Math.max(0, ...result.members.map(m => metricValue(m, metric))).toFixed(2)} {metrics[metric].unit}</span></div><small>Scale resets per variation · Blue → amber = lower → higher</small><small>{display === 'deformed' ? 'Deformation ×' + Math.max(0, Math.min(1000, parameters.amplification || 0)) : 'Column color shows member maximum; shell not analyzed'}</small>{result.outOfDomain && <small className="invalid-study">Outside linear screening range — not a valid prediction</small>}</> : <><span className="axis-swatch"/>Inferred bamboo column axes<small>Gold dots: assumed fixed bases · Shell not analyzed</small></>}</div>}
        {Object.values(visibility).every(v => !v) && <div className="all-hidden">All layers are hidden.<button onClick={() => setVisibility(Object.fromEntries(layers.map(l => [l.id, true])))}>Show all layers</button></div>}
        <div className="viewport-bottom"><div className="orientation"><span>N</span><svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true"><path d="M24 4v40M4 24h40M24 4l-3 8h6z" fill="none" stroke="currentColor" strokeWidth="1"/></svg></div><div className="scene-actions"><button className={`explode-button ${exploded ? 'active' : ''}`} aria-pressed={exploded} onClick={() => setExploded(e => !e)}><Icon name="explode"/>{exploded ? 'Assemble view' : 'Explode view'}<span>{exploded ? '−' : '+'}</span></button><button className="reset-button" aria-label="Reset camera" onClick={() => setReset(r => r + 1)}><Icon name="reset"/></button></div><span className="scale-caption">{view === 'top' ? 'ORTHOGRAPHIC' : 'SPATIAL STUDY'}<span className="scale-line"/></span></div>
        {selected && <section className="note-editor" aria-label="Object notes"><div className="flex items-center justify-between"><span className="eyebrow">ELEMENT {selected.objectId}</span><button aria-label="Close note editor" onClick={() => { setSelected(null); setDraft(''); }}><Icon name="close"/></button></div><h2>{currentLayer?.name}</h2><div className="object-notes">{confirmed && !result.error && result.members.find(m => m.id === selected.objectId) && (() => { const m = result.members.find(m => m.id === selected.objectId); return <div className="selected-result"><strong>Bamboo · {m.L.toFixed(2)} m</strong><p>Tip δ {(m.magnitude * 1000).toFixed(2)} mm<br/>Peak stress {(m.stress / 1e6).toFixed(2)} MPa<br/>Compression / Euler {m.bucklingRatio.toFixed(3)}</p></div>; })()}{notes.filter(n => n.objectId === selected.objectId).map(note => <div key={note.id}><p>{note.text}</p><button aria-label={`Delete note ${note.number}`} onClick={() => setNotes(all => all.filter(n => n.id !== note.id))}>Delete</button></div>)}</div><form onSubmit={saveNote}><label htmlFor="note-text">Add an observation</label><textarea id="note-text" rows="3" maxLength="2000" placeholder="A connection, a detail, a question…" value={draft} onChange={e => setDraft(e.target.value)}/><div className="flex items-center justify-between gap-3"><span className="note-local">{storageError ? 'Not saved locally' : 'Stored in this browser'}</span><button type="submit" disabled={!draft.trim()} className="save-note">Save note <span>↗</span></button></div></form></section>}
      </section>
    </section>
    <footer><span><span className="status-dot"/>{total ? 'MODEL READY' : 'LOADING MODEL'}<span className="footer-detail"> / {String(total).padStart(3, '0')} ELEMENTS</span></span><span className="desktop-instructions">{view === 'top' ? 'DRAG TO PAN' : 'DRAG TO ORBIT'}<i/>SCROLL TO ZOOM<i/>CLICK TO ANNOTATE</span><button className="mobile-panel-toggle" aria-controls="structure-sidebar" aria-expanded={mobilePanel} onClick={() => setMobilePanel(v => !v)}>{mobilePanel ? 'Close panel' : 'Layers & notes'} <span>{mobilePanel ? '−' : '+'}</span></button><span className="footer-detail">IOKAN — CASSA</span></footer>
  </main>;
}
