export function weatherMetrics(speed,rain,density=1.225){return {pressure:.5*density*speed*speed,rainFlux:rain/3600};}
export function windVector(degrees){const a=degrees*Math.PI/180;return [Math.cos(a),0,Math.sin(a)];}
