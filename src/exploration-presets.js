export const explorationPresets={
 inverse:{name:'Floor to shell · inverse relaxation',mode:'inverse',seed:'floor',anchors:'supports',lengthFactor:1,fit:1,smooth:0,load:0,tensionOnly:false},
 reconstruct:{name:'Fit current shell',seed:'planar',anchors:'all',lengthFactor:1,fit:.15,smooth:.02,load:0,tensionOnly:false},
 hanging:{name:'Hanging net · Gaudí-inspired',seed:'planar',anchors:'rings',lengthFactor:1.05,fit:0,smooth:0,load:.01,tensionOnly:true},
 tension:{name:'Tension net · Frei Otto-inspired',seed:'planar',anchors:'rings',lengthFactor:.85,fit:0,smooth:.08,load:0,tensionOnly:true}
};
export function explorationVariants(options){return [.8,1,1.2].flatMap(factor=>[.5,1.5].map(level=>({...options,lengthFactor:Math.max(.7,Math.min(1.3,options.lengthFactor*factor)),...(options.load>0?{load:options.load*level}:{smooth:Math.min(.3,Math.max(.02,options.smooth)*level)})})));}
