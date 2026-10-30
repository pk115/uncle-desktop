'use strict';
const {spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const {createNative}=require('../src/main/computer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const fixture=await require('../tests/fixtures/computer-qa')();const native=createNative();
 try {
  let app;for(let i=0;i<30;i++){app=(await native.request({action:'windows'})).find(w=>w.title==='Uncle Computer QA');if(app)break;await wait(200);}assert.ok(app,'QA fixture must open');
  await native.request({action:'focus',window:app.window});let view=await native.request({action:'read',window:app.window});
  const field=view.targets.find(t=>t.name==='Uncle QA editor'),secret=view.targets.find(t=>t.secret);assert.ok(field&&secret);assert.equal(secret.value,'');assert.ok(!JSON.stringify(view).includes('DO_NOT_EXPOSE'));
  await assert.rejects(native.request({action:'type',window:app.window,target:secret.id,text:'bad'}),/รหัสผ่าน/);
  await native.request({action:'type',window:app.window,target:field.id,text:'สวัสดีจาก Uncle 123'});
  view=await native.request({action:'read',window:app.window});assert.equal(view.targets.find(t=>t.name==='Uncle QA editor').value,'สวัสดีจาก Uncle 123');
  assert.equal(view.targets.find(t=>t.name==='Uncle QA editor').multiline,true);
  const button=view.targets.find(t=>t.name==='ทดสอบ');assert.ok(button);await native.request({action:'click',window:app.window,target:button.id});await wait(200);
  view=await native.request({action:'read',window:app.window});assert.ok(view.targets.some(t=>t.name==='คลิกสำเร็จ'));
  await assert.rejects(native.request({action:'click',window:app.window,x:-10000,y:-10000}),/นอกหน้าต่าง/);
  const picture=await native.request({action:'picture',window:app.window});assert.ok(picture.width>0&&picture.data.length>100);
  const slider=view.targets.find(t=>t.name==='Uncle QA slider');assert.ok(slider);
  await native.request({action:'drag',window:app.window,x:slider.x+15,y:slider.y+slider.height/2,endX:slider.x+slider.width-30,endY:slider.y+slider.height/2,duration:500});
  view=await native.request({action:'read',window:app.window});assert.ok(view.targets.some(t=>/^Slider:[1-9]/.test(t.name)),'drag changed slider');
  await native.request({action:'hold_key',window:app.window,text:'CTRL',duration:100});assert.equal((await native.request({action:'cursor'})).controlDown,false);
  const holding=native.request({action:'hold_key',window:app.window,text:'SHIFT',duration:3000});await wait(300);native.stop();await assert.rejects(holding);await wait(350);assert.equal((await native.request({action:'cursor'})).shiftDown,false,'cancel releases held shift');
  const audio=await native.request({action:'audio',text:'status'});assert.ok(audio.level>=0&&audio.level<=100);
  console.log('PASS drag slider, hold/cancel release, audio status, real Windows UIA read, Thai Unicode typing, click/result verification, password redaction/refusal, coordinate bounds and screenshot. No user apps modified.');
 }finally{native.stop();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
