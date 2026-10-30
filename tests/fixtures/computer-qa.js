const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn,execFile}=require('node:child_process'),{promisify}=require('node:util');
module.exports=async(args=[])=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'uncle-computer-qa-'));
 const executable=path.join(directory,'UncleQa.exe');
 try {await promisify(execFile)('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'computer-qa-compile.ps1'),'-Output',executable],{windowsHide:true});}
 catch(e){await fs.rm(directory,{recursive:true,force:true});throw e;}
 const child=spawn(executable,args,{windowsHide:true,stdio:'ignore'});
 return {async close(){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;await fs.rm(directory,{recursive:true,force:true});}};
};
