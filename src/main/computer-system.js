'use strict';
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
const {SHORTCUTS}=require('./computer');
const MAC=process.platform==='darwin';
const osa=script=>['osascript',['-e',script]];
const POWER=MAC?{shutdown:osa('tell application "System Events" to shut down'),restart:osa('tell application "System Events" to restart'),signout:osa('tell application "System Events" to log out'),lock:['pmset',['displaysleepnow']]}:{shutdown:['shutdown.exe',['/s','/t','30']],restart:['shutdown.exe',['/r','/t','30']],signout:['shutdown.exe',['/l']],cancel_shutdown:['shutdown.exe',['/a']],lock:['rundll32.exe',['user32.dll,LockWorkStation']]};
function createSystemTools({native,media,music,youtube,remember,companion,runner=run}) {
 return async(a,view,signal)=>{
  if(signal.aborted)throw new Error('หยุดแล้ว');
  if(a.tool==='power'){
   if(a.action==='sleep'){await native.request({action:'sleep'},signal);return 'ส่งคำขอพักเครื่องแล้ว';}
   const command=POWER[a.action];if(!command)throw new Error(MAC&&a.action==='cancel_shutdown'?'บน Mac ไม่มีการตั้งเวลาปิดเครื่องให้ยกเลิก':'คำสั่งพลังงานไม่ถูกต้อง');
   await runner(command[0],command[1],{windowsHide:true,signal,timeout:10000});return a.action==='cancel_shutdown'?'ยกเลิกการปิดหรือรีสตาร์ตที่ตั้งเวลาไว้แล้ว':['shutdown','restart'].includes(a.action)?`ตั้งเวลา${a.action==='shutdown'?'ปิด':'รีสตาร์ต'}เครื่องอีก 30 วินาทีแล้ว`:'ส่งคำขอ '+a.action+' แล้ว';
  }
  if(a.tool==='shortcut'){await native.request({action:'key',window:view.app.window,text:SHORTCUTS[a.name]},signal);return 'ส่งคีย์ลัด '+a.name+' แล้ว';}
  if(a.tool==='media'){
   if(a.action==='now_playing'){const info=await native.request({action:'now_playing'},signal);return info.title?`กำลังเล่น ${info.title} · ${info.artist||''} · ${info.status}`:'ไม่พบเพลงที่กำลังเล่น';}
   if(['volume_set','volume_up','volume_down','mute','unmute'].includes(a.action)){const info=await native.request({action:'audio',text:a.action,level:a.level||0},signal);return `ระดับเสียง ${info.level}% · ${info.muted?'ปิดเสียง':'เปิดเสียง'}`;}
   if(!await media({play_pause:'pause',next:'next',previous:'previous'}[a.action]))throw new Error('ส่งคำสั่งสื่อไม่สำเร็จ');return 'ส่งคำสั่งสื่อ '+a.action+' แล้ว';
  }
  if(a.tool==='play_music'){const result=await(a.app==='spotify'?music(a.text):youtube(a.text));if(!result)throw new Error('เปิดเพลงไม่สำเร็จ');return 'เปิดคำขอเพลง '+a.text+' บน '+a.app+' แล้ว';}
  if(a.tool==='remember'){await remember(a.action,a.text);return a.action==='add'?'จำข้อมูลนี้แล้ว':'ลืมข้อมูลนี้แล้ว';}
  if(a.tool==='companion'){await companion(a.action);return 'ส่งคำสั่งตัวละคร '+a.action+' แล้ว';}
  throw new Error('ไม่รู้จักเครื่องมือระบบ');
 };
}
module.exports={createSystemTools,POWER};
