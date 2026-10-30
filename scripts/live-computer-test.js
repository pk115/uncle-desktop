const {app}=require('electron'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const llm=require('../src/main/llm'),setup=require('../src/main/setup'),{createNative,createComputer}=require('../src/main/computer');
app.setPath('userData',path.join(process.env.APPDATA,'capri-desktop'));
app.whenReady().then(async()=>{
 const cfg=JSON.parse(require('node:fs').readFileSync(path.join(process.env.APPDATA,'capri-desktop/config.json'),'utf8'));cfg.apiKeys=setup.openKeys(cfg.apiKeys);
 const model=(await llm.models('gemini',cfg)).find(n=>/flash/.test(n));assert.ok(model);
 const fixture=await require('../tests/fixtures/computer-qa')(),native=createNative(),wait=ms=>new Promise(r=>setTimeout(r,ms));let computer;
 try{
  let target;for(let i=0;i<30;i++){target=(await native.request({action:'windows'})).find(w=>w.title==='Uncle Computer QA');if(target)break;await wait(200);}assert.ok(target);
  const guarded={stop:()=>native.stop(),request:async(a,signal)=>{if(a.action==='read'){const v=await native.request({...a,window:target.window},signal);assert.equal(v.app.window,target.window);return v;}if(a.action==='windows')return [target];if(a.window&&a.window!==target.window)throw Error('QA window only');return native.request(a,signal);}};
  let final;computer=createComputer({native:guarded,openApp:async()=>{throw Error('QA forbids apps');},openSite:async()=>{throw Error('QA forbids websites');},decide:async({prompt,task,view,windows,history},signal)=>llm.chat('gemini',cfg,{model,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify({task,screen:view,windows,steps:history})}]},()=>{},signal),notify:state=>{final=state;console.log(JSON.stringify({status:state.status,message:state.message,steps:state.steps.length}));if(state.status==='confirm')computer.answer(false);}});
  computer.start({task:'ในหน้าต่าง Uncle Computer QA เท่านั้น พิมพ์คำว่า สวัสดีจาก Uncle ลงช่อง Uncle QA editor จากนั้นคลิกปุ่ม ทดสอบ แล้วตรวจว่าป้ายแสดง คลิกสำเร็จ ห้ามเปิดแอปอื่น ห้ามแตะช่องรหัสผ่าน',consent:true});
  const deadline=Date.now()+120000;while(computer.busy&&Date.now()<deadline)await wait(100);if(computer.busy)computer.stop();assert.equal(final.status,'done',final.message);console.log('PASS Gemini + native typing/click/evidence; model '+model);
 }finally{computer?.stop();native.stop();await fixture.close();}
}).then(()=>app.exit(0)).catch(e=>{console.error(e.message);app.exit(1)});
