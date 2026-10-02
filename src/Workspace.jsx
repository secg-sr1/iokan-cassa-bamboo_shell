import {useState} from 'react';
import App from './App';
import ShellSandbox from './ShellSandbox';
export default function Workspace(){const [imported,setImported]=useState(false);return imported?<><App/><button className="return-shell" onClick={()=>setImported(false)}>Whole structure sandbox ↗</button></>:<ShellSandbox onImported={()=>setImported(true)}/>;}
