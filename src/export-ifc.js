import {detailExportMembers} from './ring-detail.js';
const quote=s=>`'${String(s).replaceAll("'","''")}'`;
const number=n=>{if(!Number.isFinite(n))throw new Error('Invalid geometry or units');return Number(n.toFixed(9)).toString().replace(/^(-?\d+)$/,'$1.');};
function guid(){const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';let n=BigInt('0x'+crypto.randomUUID().replaceAll('-','')),s='';for(let i=0;i<22;i++){s=alphabet[Number(n%64n)]+s;n/=64n;}return quote(s);}
export function exportIFC(members,parameters,covering={panels:[]}){
 const scale=parameters.unitScale;if(!(scale>0))throw new Error('Set valid metres per model unit before exporting.');
 const rows=[];const add=s=>{rows.push(`#${rows.length+1}=${s};`);return `#${rows.length}`;},list=a=>`(${a.join(',')})`,point=p=>add(`IFCCARTESIANPOINT(${list(p.map(number))})`),direction=p=>add(`IFCDIRECTION(${list(p.map(number))})`);
 const org=add("IFCORGANIZATION($,'IOKAN',$,$,$)"),person=add("IFCPERSON($,$,'Designer',$,$,$,$,$)"),user=add(`IFCPERSONANDORGANIZATION(${person},${org},$)`),app=add(`IFCAPPLICATION(${org},'1.0','IOKAN bamboo sandbox','IOKAN')`),owner=add(`IFCOWNERHISTORY(${user},${app},$,.ADDED.,$,$,$,${Math.floor(Date.now()/1000)})`);
 const origin=point([0,0,0]),up=direction([0,0,1]),x=direction([1,0,0]),axis=add(`IFCAXIS2PLACEMENT3D(${origin},${up},${x})`),placement=add(`IFCLOCALPLACEMENT($,${axis})`),context=add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,0.000001,${axis},$)`),metre=add('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)'),units=add(`IFCUNITASSIGNMENT((${metre}))`);
 const project=add(`IFCPROJECT(${guid()},${owner},'IOKAN bamboo shell',$,$,$,$,(${context}),${units})`),site=add(`IFCSITE(${guid()},${owner},'Site',$,$,${placement},$,$,.ELEMENT.,$,$,$,$,$)`),building=add(`IFCBUILDING(${guid()},${owner},'Bamboo shell',$,$,${placement},$,$,.ELEMENT.,$,$,$)`),storey=add(`IFCBUILDINGSTOREY(${guid()},${owner},'Structure',$,$,${placement},$,$,.ELEMENT.,0.)`);
 for(const [parent,child] of [[project,site],[site,building],[building,storey]])add(`IFCRELAGGREGATES(${guid()},${owner},$,$,${parent},(${child}))`);
 const elements=[],layers=new Map(),profiles=new Map(),materials=new Map();const xy=add(`IFCAXIS2PLACEMENT2D(${point([0,0])},$)`);
 for(const m of detailExportMembers(members,parameters)){
  const [diameter,wall]=m.exportSection||parameters.sections[m.layer]||[];if(!(diameter>0&&wall>=0&&wall<diameter/2))throw new Error(`Invalid bamboo section for layer ${m.layer}`);
  const key=[diameter,wall].join(':');if(!profiles.has(key))profiles.set(key,add(wall===0?`IFCCIRCLEPROFILEDEF(.AREA.,'Bundle envelope',${xy},${number(diameter/2000)})`:`IFCCIRCLEHOLLOWPROFILEDEF(.AREA.,'Tube',${xy},${number(diameter/2000)},${number(wall/1000)})`));
  const solids=[],ps=m.points.map(p=>[p[0]*scale,-p[2]*scale,p[1]*scale]);
  for(let i=1;i<ps.length;i++){const a=ps[i-1],d=ps[i].map((v,k)=>v-a[k]),length=Math.hypot(...d);if(length<1e-6)continue;const z=d.map(v=>v/length),ref=Math.abs(z[2])<.9?[-z[1],z[0],0]:[z[2],0,-z[0]],norm=Math.hypot(...ref);const pos=add(`IFCAXIS2PLACEMENT3D(${point(a)},${direction(z)},${direction(ref.map(v=>v/norm))})`);solids.push(add(`IFCEXTRUDEDAREASOLID(${profiles.get(key)},${pos},${up},${number(length)})`));}
  if(!solids.length)continue;
  const rep=add(`IFCSHAPEREPRESENTATION(${context},'Body','SweptSolid',${list(solids)})`),shape=add(`IFCPRODUCTDEFINITIONSHAPE($,$,(${rep}))`),entity=+m.layer<=2?'IFCCOLUMN':'IFCMEMBER';elements.push(add(`${entity}(${guid()},${owner},${quote(m.id)},${quote(m.exportDescription||'Segmented hollow bamboo geometry')},${quote(m.exportMaterial||'Bamboo')},${placement},${shape},${quote(m.id)})`));
  const materialName=m.exportMaterial||'Bamboo';if(!materials.has(materialName))materials.set(materialName,[]);materials.get(materialName).push(elements.at(-1));
  if(!layers.has(m.layer))layers.set(m.layer,[]);layers.get(m.layer).push(rep);
 }
 if(covering.error)throw new Error('Covering export blocked: '+covering.error);
 for(const panel of covering.panels){
  const pts=panel.vertices.map(p=>point([p[0]*scale,-p[2]*scale,p[1]*scale])),faces=[];
  for(let i=0;i<panel.indices.length;i+=3){const loop=add(`IFCPOLYLOOP(${list(panel.indices.slice(i,i+3).map(n=>pts[n]))})`),bound=add(`IFCFACEOUTERBOUND(${loop},.T.)`);faces.push(add(`IFCFACE((${bound}))`));}
  const set=add(`IFCCONNECTEDFACESET(${list(faces)})`),surface=add(`IFCFACEBASEDSURFACEMODEL((${set}))`),rep=add(`IFCSHAPEREPRESENTATION(${context},'Body','SurfaceModel',(${surface}))`),shape=add(`IFCPRODUCTDEFINITIONSHAPE($,$,(${rep}))`),element=add(`IFCBUILDINGELEMENTPROXY(${guid()},${owner},${quote(panel.id)},'Roof strip surface; zero thickness','Roof covering',${placement},${shape},${quote(panel.id)},.ELEMENT.)`);
  elements.push(element);if(!materials.has('Roof covering (unspecified)'))materials.set('Roof covering (unspecified)',[]);materials.get('Roof covering (unspecified)').push(element);if(!layers.has('Roof covering'))layers.set('Roof covering',[]);layers.get('Roof covering').push(rep);
 }
 if(!elements.length)throw new Error('No geometry to export.');
 add(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${guid()},${owner},$,$,${list(elements)},${storey})`);
 for(const [name,items] of materials){const material=add(`IFCMATERIAL(${quote(name)})`);add(`IFCRELASSOCIATESMATERIAL(${guid()},${owner},$,$,${list(items)},${material})`);} for(const [layer,reps] of layers)add(`IFCPRESENTATIONLAYERASSIGNMENT(${quote('Layer '+layer)},$,${list(reps)},${quote(layer)})`);
 return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('IOKAN segmented bamboo geometry'),'2;1');\nFILE_NAME('iokan-geometry.ifc',${quote(new Date().toISOString())},('Designer'),('IOKAN'),'IOKAN','IOKAN','');\nFILE_SCHEMA(('IFC2X3'));\nENDSEC;\nDATA;\n${rows.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}

