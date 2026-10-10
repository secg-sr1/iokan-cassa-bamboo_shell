import {solveFlow} from './potential-flow';
self.onmessage=({data})=>{try{self.postMessage(solveFlow(data.vertices,data.indices,data.direction,[20,28,40].includes(data.resolution)?data.resolution:28,data));}catch(e){self.postMessage({error:e.message});}};
