'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('Thai multi-step and desktop commands route to jobs without a magic prefix',async()=>{
 const {computerTask}=await import('../src/renderer/js/computer-intent.js');
 for(const phrase of ['เปิด Notepad แล้วพิมพ์ สวัสดี','ช่วยลากไฟล์ไปที่โฟลเดอร์','กด Ctrl+A','ปรับเสียงเป็น 40 เปอร์เซ็นต์','ล็อกหน้าจอ','กำลังเล่นเพลงอะไร','ควบคุมเครื่อง: เปิดเว็บแล้วค้นหาแมว'])assert.ok(computerTask(phrase),phrase);
 for(const phrase of ['อย่าเปิดโปรแกรม','วิธีลากไฟล์ทำยังไง','อธิบายการควบคุมเครื่อง','วันนี้เป็นอย่างไร','เตือนฉันอีกห้านาที'])assert.equal(computerTask(phrase),null,phrase);
});
test('voice executes a multi-step request through the computer bridge',async()=>{
 const {Listening}=await import('../src/renderer/js/listening.js');const v=Object.create(Listening.prototype);let received;
 v.chat={onComputer:async(...args)=>received=args};await v.execute('เปิด Notepad แล้วพิมพ์ สวัสดี');assert.equal(received[1].voice,true);assert.match(received[0],/Notepad/);
});
test('a spoken no cancels the pending job callback once',async()=>{
 const {Listening}=await import('../src/renderer/js/listening.js');const v=Object.create(Listening.prototype);let canceled=0;
 Object.assign(v,{serial:1,settings:{mode:'push',followSeconds:10},speech:{stop(){}},respond:async()=>{},hide(){},releaseMic(){},confirmation:{until:Date.now()+1000,cancel:()=>canceled++}});
 await v.answerConfirmation('ไม่ใช่');assert.equal(canceled,1);assert.equal(v.confirmation,null);
});

test('voice approval closes its overlay before releasing the native action',async()=>{
 const {Listening}=await import('../src/renderer/js/listening.js');const v=Object.create(Listening.prototype);let hidden=false,executed=false;
 Object.assign(v,{serial:1,settings:{mode:'push',followSeconds:10},speech:{stop(){}},hide(){hidden=true},releaseMic(){},confirmation:{until:Date.now()+1000,execute:async()=>{assert.equal(hidden,true);executed=true;}}});
 await v.answerConfirmation('ใช่');assert.equal(executed,true);
});
