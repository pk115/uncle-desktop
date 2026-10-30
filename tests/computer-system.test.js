'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createSystemTools,POWER}=require('../src/main/computer-system');
test('power tools use fixed argument arrays, never a shell or arbitrary user code',async()=>{
 const calls=[];const tools=createSystemTools({native:{request:async a=>calls.push(a)},runner:async(...a)=>calls.push(a)}),signal=new AbortController().signal;
 for(const action of Object.keys(POWER))await tools({tool:'power',action},{},signal);
 if(process.platform==='darwin'){assert.deepEqual(calls[0].slice(0,2),['osascript',['-e','tell application "System Events" to shut down']]);assert.deepEqual(calls[1].slice(0,2),['osascript',['-e','tell application "System Events" to restart']]);}
 else{assert.deepEqual(calls[0].slice(0,2),['shutdown.exe',['/s','/t','30']]);assert.deepEqual(calls[1].slice(0,2),['shutdown.exe',['/r','/t','30']]);}assert.ok(calls.every(c=>!c[2].shell&&c[2].windowsHide));
});
test('media tools report actual native volume and use current media session metadata',async()=>{
 const tools=createSystemTools({native:{request:async a=>a.action==='audio'?{level:42,muted:false}:{title:'Test track',artist:'Test artist',status:'Playing'}}}),signal=new AbortController().signal;
 assert.match(await tools({tool:'media',action:'volume_set',level:42},{},signal),/42%/);assert.match(await tools({tool:'media',action:'now_playing'},{},signal),/Test track/);
});
test('native system request is not sent after cancellation',async()=>{
 const abort=new AbortController();abort.abort();const tools=createSystemTools({native:{request:()=>assert.fail('stale action')}});await assert.rejects(tools({tool:'media',action:'mute'},{},abort.signal),/หยุด/);
});
