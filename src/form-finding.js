import {editPreviewRings} from './preview-rings.js';
import {deformEdges} from './floor-edge-controls.js';
// Original goal-relaxation implementation; does not embed Kangaroo or MeshMachine.
export function createFormStudy(network,options={}){
 const original=options.mode==='inverse'?deformEdges(editPreviewRings(network.nodes,network.elements,options),network.elements,options.edgePulls):network.nodes, floorY=Math.min(...original.map(p=>p[1]));
 const cx=(Math.min(...original.map(p=>p[0]))+Math.max(...original.map(p=>p[0])))/2,cz=(Math.min(...original.map(p=>p[2]))+Math.max(...original.map(p=>p[2])))/2;
 // Affine shape controls preserve straight column axes and transform the support footprint with the shell.
 const target=original.map(p=>options.mode==='inverse'?[cx+(p[0]-cx)*(options.width??1)+(p[2]-cz)*(options.skew??0),floorY+(p[1]-floorY)*(options.height??1),cz+(p[2]-cz)*(options.depth??1)]:p.slice()),fixed=new Set(network.supports),edges=network.elements.map(e=>({...e,rest:Math.hypot(...target[e.a].map((v,k)=>v-target[e.b][k]))}));
 for(const e of edges)if(options.mode!=='inverse'&&(options.anchors==='rings'?Number(e.layer)<=2||e.layer==='04':Number(e.layer)<=4)){fixed.add(e.a);fixed.add(e.b);}
 const floor=Math.min(...target.map(p=>p[1]));
 const mean=target.reduce((s,p)=>s+p[1],0)/target.length,positions=target.map((p,i)=>fixed.has(i)||options.seed==='target'?p.slice():[p[0],options.mode==='inverse'?floor:mean,p[2]]),neighbors=target.map(()=>new Set());
 edges.forEach(e=>{neighbors[e.a].add(e.b);neighbors[e.b].add(e.a);});
 return {target,seed:positions.map(p=>p.slice()),positions,edges,fixed:[...fixed],neighbors:neighbors.map(s=>[...s]),iteration:0};
}
export function relaxFormStudy(state,options={},steps=1){
 const fixed=new Set(state.fixed),factor=Math.max(.7,Math.min(1.3,options.lengthFactor??1)),fit=Math.max(0,Math.min(1,options.fit??.15)),smooth=Math.max(0,Math.min(.3,options.smooth??.02));let movement=0;
 for(let step=0;step<steps;step++){
 if(options.mode==='inverse'){
 const progress=Math.min(1,(state.iteration+1)/600),rise=progress*progress*(3-2*progress);movement=0;
 state.positions=state.positions.map((p,i)=>{const q=fixed.has(i)?state.target[i].slice():p.map((v,k)=>v+.2*(state.seed[i][k]+rise*(state.target[i][k]-state.seed[i][k])-v));movement+=q.reduce((s,v,k)=>s+(v-p[k])**2,0);return q;});state.iteration++;continue;
 }
 const old=state.positions,delta=old.map(()=>[0,0,0]),weight=old.map(()=>0);
 for(const e of state.edges){const d=old[e.b].map((v,k)=>v-old[e.a][k]),length=Math.hypot(...d);if(length<1e-10)continue;const error=(options.tensionOnly?Math.max(0,length-e.rest*factor):length-e.rest*factor)/length,mult=fixed.has(e.a)||fixed.has(e.b)?1:.5;for(let k=0;k<3;k++){delta[e.a][k]+=d[k]*error*mult;delta[e.b][k]-=d[k]*error*mult;}weight[e.a]++;weight[e.b]++;}
 movement=0;state.positions=old.map((p,i)=>{if(fixed.has(i))return state.target[i].slice();const ns=state.neighbors[i],q=p.map((v,k)=>{const mean=ns.length?ns.reduce((s,n)=>s+old[n][k],0)/ns.length:v;return v+.65*((weight[i]?delta[i][k]/weight[i]:0)+fit*(state.target[i][k]-v)+smooth*(mean-v)+(k===1?-Math.max(0,Math.min(.05,options.load??0)):0));});movement+=q.reduce((s,v,k)=>s+(v-p[k])**2,0);return q;});state.iteration++;
 }
 const free=state.positions.length-fixed.size,fitError=Math.sqrt(state.positions.reduce((sum,p,i)=>sum+p.reduce((s,v,k)=>s+(v-state.target[i][k])**2,0),0)/Math.max(1,state.positions.length));
 const activeEdges=state.edges.filter(e=>!fixed.has(e.a)||!fixed.has(e.b));const lengthError=Math.sqrt(activeEdges.reduce((sum,e)=>{const l=Math.hypot(...state.positions[e.a].map((v,k)=>v-state.positions[e.b][k]));return sum+((l-e.rest*factor)/(e.rest*factor||1))**2;},0)/Math.max(1,activeEdges.length));
 return {progress:options.mode==='inverse'?Math.min(1,state.iteration/600):undefined,positions:state.positions,iteration:state.iteration,movement:Math.sqrt(movement/Math.max(1,free)),fitError,lengthError,fixed:state.fixed,free};
}


// Rebuild an edited preview at the displayed inflation stage, without replaying the worker.
export function editFormPreview(network,options,progress=0){
 const state=createFormStudy(network,options),t=Math.max(0,Math.min(1,progress)),rise=t*t*(3-2*t),fixed=new Set(state.fixed);
 state.positions=state.seed.map((p,i)=>fixed.has(i)?state.target[i].slice():p.map((v,k)=>v+rise*(state.target[i][k]-v)));
 state.iteration=Math.round(t*600);
 return {...relaxFormStudy(state,options,0),progress:t};
}
