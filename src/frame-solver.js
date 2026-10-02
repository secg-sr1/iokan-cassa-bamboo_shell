import cholesky from 'cholesky-solve';
// Linear 3D Euler–Bernoulli frame, six DOFs per rigid joint.
// Pinned intersections share translations and keep each continuous culm's rotations independent.
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a),unit=a=>a.map(v=>v/norm(a));
export function frameElement(a,b,E,G,A,I){
 const delta=sub(b,a),L=norm(delta),x=unit(delta),z=unit(cross(x,Math.abs(x[1])<.9?[0,1,0]:[0,0,1])),y=cross(z,x),R=[x,y,z],k=new Float64Array(144);
 const set=(i,j,v)=>{k[i*12+j]+=v;if(i!==j)k[j*12+i]+=v;};
 for(const [i,j,s] of [[0,6,E*A/L],[3,9,G*2*I/L]]){set(i,i,s);set(j,j,s);set(i,j,-s);}
 for(const [ids,sign] of [[[1,5,7,11],1],[[2,4,8,10],-1]]){
 const q=E*I/L**3,ls=L*sign,mat=[[12,6*ls,-12,6*ls],[6*ls,4*L*L,-6*ls,2*L*L],[-12,-6*ls,12,-6*ls],[6*ls,2*L*L,-6*ls,4*L*L]];
 for(let i=0;i<4;i++)for(let j=i;j<4;j++)set(ids[i],ids[j],q*mat[i][j]);}
 const global=new Float64Array(144);for(let i=0;i<12;i++)for(let j=0;j<12;j++)for(let u=0;u<3;u++)for(let v=0;v<3;v++)global[i*12+j]+=R[u][i%3]*k[(Math.floor(i/3)*3+u)*12+Math.floor(j/3)*3+v]*R[v][j%3];
 return {k,global,R,L,A,I};
}
function hullArea(points){const ps=points.map(p=>[p[0],p[2]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const half=a=>{const h=[];for(const p of a){while(h.length>1&&turn(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h.slice(0,-1);};const h=[...half(ps),...half([...ps].reverse())];return Math.abs(h.reduce((s,p,i)=>s+p[0]*h[(i+1)%h.length][1]-p[1]*h[(i+1)%h.length][0],0))/2;}

function sparseSolve(rows,f){
 const n=f.length,scale=Float64Array.from(rows,(r,i)=>1/Math.sqrt(r.get(i)||1)),visited=new Uint8Array(n),order=[];
 const starts=Array.from({length:n},(_,i)=>i).sort((a,b)=>rows[a].size-rows[b].size);
 for(const start of starts){if(visited[start])continue;const queue=[start];visited[start]=1;for(let h=0;h<queue.length;h++){const i=queue[h];order.push(i);const next=[...rows[i].keys()].filter(j=>!visited[j]).sort((a,b)=>rows[a].size-rows[b].size);for(const j of next)if(!visited[j]){visited[j]=1;queue.push(j);}}}
 order.reverse();const inverse=new Int32Array(n);order.forEach((i,j)=>inverse[i]=j);const entries=[];
 rows.forEach((r,i)=>{for(const [j,v] of r)if(j>=i){let a=inverse[i],b=inverse[j];entries.push([Math.min(a,b),Math.max(a,b),v*scale[i]*scale[j]]);}});
 const solve=cholesky.prepare(entries,n);if(!solve)return {x:new Float64Array(n),residual:Infinity,iterations:0};
 const rhs=order.map(i=>f[i]*scale[i]),solution=solve(rhs),x=new Float64Array(n);order.forEach((i,j)=>x[i]=solution[j]*scale[i]);
 let residual=0,fn=0;rows.forEach((r,i)=>{let ax=0;for(const [j,v] of r)ax+=v*x[j];residual+=(ax-f[i])**2;fn+=f[i]**2;});
 return {x,residual:Math.sqrt(residual/Math.max(fn,1)),iterations:1};
}

export function solveFrame(network,p){
 const fail=error=>({error,members:[],elements:[],displacements:[]});
 if(network.disconnected)return fail(`${network.disconnectedMembers.length} members have no path to a support. Review the layout or connection tolerance.`);
 if(!network.supports.length)return fail('No supports defined.');
 if(![p.unitScale,p.modulus,p.shearModulus,p.density,p.roofLoad,p.wind].every(Number.isFinite)||p.unitScale<=0||p.modulus<=0||p.shearModulus<=0||p.density<0||p.roofLoad<0)return fail('Enter valid positive units and material stiffness, and nonnegative gravity loads.');
 for(const [D,t] of Object.values(p.sections))if(!Number.isFinite(D)||!Number.isFinite(t)||D<=0||t<=0||2*t>=D)return fail('Every layer needs a positive diameter and a wall thinner than its radius.');
 const nodes=network.nodes.map(a=>a.map(v=>v*p.unitScale)),fixed=new Set(network.supports),dofs=new Map();let count=0;
 function ids(n,member){return Array.from({length:6},(_,i)=>{if(fixed.has(n))return -1;const key=n+':'+i+(i>=3&&p.joint==='pinned'?':'+member:'');if(!dofs.has(key))dofs.set(key,count++);return dofs.get(key);});}
 const elements=network.elements.map(e=>{const [diameter,wall]=p.sections[e.layer],D=diameter/1000,d=D-2*wall/1000,A=Math.PI*(D*D-d*d)/4,I=Math.PI*(D**4-d**4)/64;return {...e,...frameElement(nodes[e.a],nodes[e.b],p.modulus*1e9,p.shearModulus*1e9,A,I),diameter:D,ids:[...ids(e.a,e.member),...ids(e.b,e.member)]};});
 const rows=Array.from({length:count},()=>new Map()),f=new Float64Array(count),loads=nodes.map(()=>[0,0,0]),weights=new Float64Array(nodes.length);let mass=0;
 for(const e of elements){for(let i=0;i<12;i++){const a=e.ids[i];if(a<0)continue;for(let j=0;j<12;j++){const b=e.ids[j],v=e.global[i*12+j];if(b<0||Math.abs(v)<1e-12)continue;rows[a].set(b,(rows[a].get(b)||0)+v);}}
 const kg=e.A*e.L*p.density;mass+=kg;if(p.selfWeight){loads[e.a][1]-=kg*9.80665/2;loads[e.b][1]-=kg*9.80665/2;}if(+e.layer>=5){const length=Math.hypot(nodes[e.a][0]-nodes[e.b][0],nodes[e.a][2]-nodes[e.b][2]);weights[e.a]+=length/2;weights[e.b]+=length/2;}}
 const roofNodes=nodes.filter((_,i)=>weights[i]>0),area=hullArea(roofNodes),sum=weights.reduce((s,v)=>s+v,0);if(!sum && (p.roofLoad!==0 || p.wind!==0))return fail('No shell members to carry roof loading.');
 loads.forEach((load,n)=>{load[1]-=p.roofLoad*1000*area*weights[n]/(sum||1);load[0]+=p.wind*1000*weights[n]/(sum||1);for(let k=0;k<3;k++){const i=dofs.get(n+':'+k);if(i!==undefined)f[i]+=load[k];}});
 if(p.nodalLoads)for(const [node,load] of Object.entries(p.nodalLoads)){load.forEach((v,k)=>{loads[node][k]+=v;const i=dofs.get(node+':'+k);if(i!==undefined)f[i]+=v;});}
 const solved=sparseSolve(rows,f);if(!Number.isFinite(solved.residual)||solved.residual>1e-5)return {...fail('No converged equilibrium: this joint/layout case may be a mechanism or too ill-conditioned. No result colors are shown.'),residual:solved.residual,iterations:solved.iterations};
 const displacements=nodes.map((_,n)=>[0,1,2].map(k=>{const i=dofs.get(n+':'+k);return i===undefined?0:solved.x[i];})),reactions=new Map(network.supports.map(n=>[n,[...loads[n].map(v=>-v),0,0,0]])),byMember=new Map();
 const results=elements.map(e=>{const ug=e.ids.map(i=>i<0?0:solved.x[i]),ul=Array(12).fill(0);for(let i=0;i<12;i++)for(let j=0;j<3;j++)ul[i]+=e.R[i%3][j]*ug[Math.floor(i/3)*3+j];const q=Array.from({length:12},(_,i)=>ul.reduce((s,v,j)=>s+e.k[i*12+j]*v,0));
 for(const [end,n] of [[0,e.a],[1,e.b]])if(reactions.has(n)){const r=reactions.get(n);for(let i=0;i<6;i++)for(let j=0;j<12;j++)r[i]+=e.global[(end*6+i)*12+j]*ug[j];}
 const axial=q[6],moment=Math.max(Math.hypot(q[4],q[5]),Math.hypot(q[10],q[11])),stress=Math.abs(axial)/e.A+moment*e.diameter/(2*e.I),magnitude=Math.max(norm(displacements[e.a]),norm(displacements[e.b]));
 const r={a:e.a,b:e.b,member:e.member,layer:e.layer,L:e.L,axial,moment,stress,magnitude};if(!byMember.has(e.member))byMember.set(e.member,{id:e.member,layer:e.layer,L:0,stress:0,magnitude:0,moment:0,axial:0});const m=byMember.get(e.member);m.L+=e.L;m.stress=Math.max(m.stress,stress);m.magnitude=Math.max(m.magnitude,magnitude);m.moment=Math.max(m.moment,moment);if(Math.abs(axial)>Math.abs(m.axial))m.axial=axial;return r;});
 const totalLoad=loads.reduce((s,l)=>s.map((v,i)=>v+l[i]),[0,0,0]),totalReaction=[...reactions.values()].reduce((s,r)=>s.map((v,i)=>v+r[i]),[0,0,0]);
 const balance=norm(totalLoad.map((v,i)=>v+totalReaction[i]))/Math.max(1,norm(totalLoad));
 const loadMoment=loads.reduce((sum,load,n)=>sum.map((v,i)=>v+cross(nodes[n],load)[i]),[0,0,0]);
 const reactionMoment=[...reactions].reduce((sum,[n,r])=>sum.map((v,i)=>v+cross(nodes[n],r)[i]+r[i+3]),[0,0,0]);
 const momentBalance=norm(loadMoment.map((v,i)=>v+reactionMoment[i]))/Math.max(1,norm(loadMoment));
 if(balance>1e-3||momentBalance>1e-3)return {...fail('Force equilibrium verification failed. Results withheld.'),balance};
 const members=[...byMember.values()],maxDisplacement=Math.max(...members.map(m=>m.magnitude));
 return {members,elements:results,displacements,reactions:[...reactions].map(([node,force])=>({node,force})),loads,totalLoad,totalReaction,balance,momentBalance,area,mass,maxDisplacement,maxStress:Math.max(...members.map(m=>m.stress)),maxMoment:Math.max(...members.map(m=>m.moment)),maxAxial:Math.max(...members.map(m=>Math.abs(m.axial))),iterations:solved.iterations,residual:solved.residual,joint:p.joint,outOfDomain:maxDisplacement>.05};
}
