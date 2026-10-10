export const edgeHandles=[[-1,0],[1,0],[0,-1],[0,1]];
export function editEdgePull(values,index,value,mirror){const next=[...(values||[0,0,0,0])];next[index]=value;if(mirror)next[index^1]=value;return next;}
export function deformEdges(nodes,elements,pulls=[0,0,0,0]){
 const lo=[0,2].map(k=>Math.min(...nodes.map(p=>p[k]))),hi=[0,2].map(k=>Math.max(...nodes.map(p=>p[k]))),mid=lo.map((v,i)=>(v+hi[i])/2),span=lo.map((v,i)=>Math.max((hi[i]-v)/2,1e-6));
 const result=nodes.map(p=>{const uv=[(p[0]-mid[0])/span[0],(p[2]-mid[1])/span[1]],q=p.slice();edgeHandles.forEach(([u,v],i)=>{const w=Math.exp(-((uv[0]-u)**2+(uv[1]-v)**2)/.32);q[0]-=u*span[0]*(pulls[i]||0)*w;q[2]-=v*span[1]*(pulls[i]||0)*w;});return q;});
 const columns=new Map();elements.filter(e=>Number(e.layer)<=2).forEach(e=>{if(!columns.has(e.member))columns.set(e.member,new Set());columns.get(e.member).add(e.a).add(e.b);});
 for(const ids of columns.values()){const sorted=[...ids].sort((a,b)=>nodes[a][1]-nodes[b][1]),a=sorted[0],b=sorted.at(-1),dy=nodes[b][1]-nodes[a][1];if(dy<1e-9)continue;for(const i of sorted){const t=(nodes[i][1]-nodes[a][1])/dy;result[i]=result[a].map((v,k)=>v+(result[b][k]-v)*t);}}
 return result;
}
