'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {settings,TOOLS,toolAction,createAgentAPI}=require('../src/main/voice-agent');
const json=value=>({ok:true,json:async()=>value});
test('voice agent settings preserve classic by default and validate all remote identifiers',()=>{
 assert.equal(settings().engine,'classic');for(const value of [{engine:'other'},{consent:'yes'},{agentId:'https://evil'},{voiceId:'../key'},{language:'unknown'}])assert.throws(()=>settings(value));
});
test('all upstream Hands voice categories map to bounded native actions or read-only jobs',()=>{
 assert.equal(TOOLS.length,14);
 const samples={ask_assistant:{question:'พรุ่งนี้มีนัดไหม'},open_app:{name:'Notepad'},open_website:{site:'youtube.com',search:'ไทย'},media:{action:'volume_set',level:30},look_at_screen:{focus:'มีอะไร'},play_music:{song:'test',app:'youtube'},app_window:{name:'Notepad',action:'switch_to'},use_computer:{task:'พิมพ์ไทย'},shortcut:{name:'emoji'},remember:{text:'ชอบแมว'},power:{action:'shut_down'},nap:{action:'wake'},move_yourself:{action:'hop_off'},animate:{name:'stop_dancing'}};
 for(const tool of TOOLS){const plan=toolAction(tool.name,samples[tool.name]);assert.ok(plan.task||plan.action,tool.name);}
 assert.equal(toolAction('look_at_screen',{}).readOnly,true);assert.equal(toolAction('power',samples.power).action.action,'shutdown');assert.equal(toolAction('move_yourself',samples.move_yourself).action.action,'leave_cursor');
 for(const [name,args]of [['shell',{}],['open_app',{}],['media',{action:'volume_set',level:NaN}],['open_website',{site:'file:///C:/a'}],['shortcut',{name:'run'}],['animate',{name:'dance',extra:'x'}]])assert.throws(()=>toolAction(name,args));
});
test('ElevenLabs key stays in fixed-origin headers; session needs consent and accepts only signed WSS service URLs',async()=>{
 let config={engine:'elevenlabs',consent:true,agentId:'agent_test'},calls=[];
 const api=createAgentAPI({getSettings:()=>config,getKey:()=> 'private-test-key',save(){},request:async(url,options)=>{calls.push({url,options});return json({signed_url:'wss://api.elevenlabs.io/v1/convai/conversation?token=private'});}});
 const session=await api.session();assert.ok(session.sessionId);assert.equal(session.settings.engine,'elevenlabs');assert.equal(calls[0].options.headers['xi-api-key'],'private-test-key');assert.ok(!JSON.stringify(session).includes('private-test-key'));
 config={...config,consent:false};await assert.rejects(api.session(),/ยินยอม/);assert.equal(calls.length,1);
 const bad=createAgentAPI({getSettings:()=>({...config,consent:true}),getKey:()=> 'key',save(){},request:async()=>json({signed_url:'wss://attacker.test/socket'})});await assert.rejects(bad.session(),/ลิงก์/);
});
test('setup creates tool definitions and a private Thai voice agent, then reuses supplied tool IDs',async()=>{
 let config={engine:'elevenlabs',consent:true,voiceId:'voice_test'},calls=[];
 const api=createAgentAPI({getSettings:()=>config,getKey:()=> 'key',save:value=>config=value,request:async(url,options)=>{const body=options.body&&JSON.parse(options.body);calls.push({url,body,method:options.method});return json(url.endsWith('/tools')&&options.method==='GET'?{tools:[]}:url.endsWith('/tools')?{id:'tool_'+calls.length}:{agent_id:'agent_created'});}});
 assert.equal((await api.configure()).tools,14);const created=calls.at(-1).body;assert.equal(created.conversation_config.tts.model_id,'eleven_v3_conversational');for(const call of calls.filter(c=>c.method==='POST'&&c.url.endsWith('/tools')))assert.equal(call.body.tool_config.parameters.additionalProperties,undefined);assert.equal(created.platform_settings.auth.enable_auth,true);assert.equal(created.conversation_config.agent.language,'th');assert.equal(created.conversation_config.agent.prompt.tool_ids.length,14);assert.ok(created.conversation_config.conversation.client_events.includes('interruption'));assert.equal(config.agentId,'agent_created');
});
test('API errors never expose response bodies or keys and stopping rejects a late session',async()=>{
 let release;const config={engine:'elevenlabs',consent:true,agentId:'test'};
 const api=createAgentAPI({getSettings:()=>config,getKey:()=> 'secret',save(){},request:()=>new Promise(resolve=>release=resolve)});
 const pending=api.session();api.stop();release(json({signed_url:'wss://api.elevenlabs.io/conversation'}));await assert.rejects(pending,/ยกเลิก/);
 const denied=createAgentAPI({getSettings:()=>config,getKey:()=> 'secret',save(){},request:async()=>({ok:false,status:403,json:async()=>({error:'secret'})})});await assert.rejects(denied.session(),e=>!e.message.includes('secret')&&/สิทธิ์/.test(e.message));
});
test('restricted ElevenLabs keys report the missing permission instead of an invalid-key error',async()=>{
 const api=createAgentAPI({getSettings:()=>({engine:'elevenlabs',consent:true,agentId:'test'}),getKey:()=> 'secret',save(){},request:async()=>({ok:false,status:401,json:async()=>({detail:{status:'missing_permissions',message:'missing permission voices_read secret'}})})});
 await assert.rejects(api.session(),e=>/voices_read/.test(e.message)&&!e.message.includes('secret')&&!e.message.includes('คีย์ไม่ถูกต้อง'));
});
async function renderer(){const {VoiceAgent}=await import('../src/renderer/js/voice-agent.js');const v=Object.create(VoiceAgent.prototype);Object.assign(v,{serial:1,seenUserEvents:new Set(),ownedJobs:new Set(),settings:{engine:'elevenlabs'},session:{sendUserMessage(){},endSession:async()=>{},getOutputVolume:()=>0.2},mute:{},listening:{heard:{},confirmButtons:{},confirmYes:{},root:{},indicator:{},startButton:{},hide(){},onVisibility(){},setStatus(){}},host:{agentStop(){},computerStop(){}},computer:{answerState:async()=>{}}});return v;}
test('only an actual user transcript can answer the current job approval; agent speech cannot approve itself',async()=>{
 const v=await renderer();let answered=0;v.computer.answerState=async(state,yes)=>{answered++;assert.equal(state.approvalId,'approval2');assert.equal(yes,true);};
 v.ask({id:'job',voice:true,approvalId:'approval2',question:'ยืนยันไหม',answerNeeded:false});await v.message({role:'agent',message:'ใช่'});assert.equal(answered,0);await v.message({role:'user',message:'ใช่'});assert.equal(answered,1);await v.message({role:'user',message:'ใช่'});assert.equal(answered,1);
});
test('ending realtime session releases SDK audio and suppresses delayed local TTS results',async()=>{
 const v=await renderer();let ended=0,stopped=0,spoke=0;v.session.endSession=async()=>ended++;v.session.sendUserMessage=()=>spoke++;v.host.agentStop=()=>stopped++;
 v.state({id:'job',voice:true,status:'running'});v.stop();v.stop();assert.equal(ended,1);assert.equal(stopped,1);assert.equal(v.state({id:'job',voice:true,status:'stopped',message:'หยุดแล้ว'}),true);assert.equal(spoke,0);assert.equal(v.active,false);
});
test('stopping while SDK connects ends a late session instead of reopening the microphone',async()=>{
 const v=await renderer();v.session=null;let release,ended=0;
 Object.assign(v,{speech:{stop(){}},loadSDK:async()=>({startSession:()=>new Promise(resolve=>release=resolve)}),host:{agentStart:async()=>({sessionId:'pending',signedUrl:'wss://api.elevenlabs.io/qa',settings:{language:'th'},tools:[]}),agentStop(){}}});
 Object.assign(v.listening,{mic:{value:''},releaseMic(){}});
 const connecting=v.start();while(!release)await new Promise(r=>setTimeout(r,1));v.stop();release({endSession:async()=>ended++});await connecting;assert.equal(ended,1);assert.equal(v.active,false);
});
test('ElevenLabs wake mode keeps pre-wake audio local and starts the agent only on a matching name',async()=>{
 const {Listening}=await import('../src/renderer/js/listening.js');const v=Object.create(Listening.prototype);let text='วันนี้อากาศดี',started=0;
 Object.assign(v,{serial:1,settings:{mode:'wake',wakeWords:['เฮ้ อังเคิล']},stream:{},followUntil:0,host:{listeningTranscribe:async(bytes,wakeOnly)=>{assert.equal(wakeOnly,true);return {text}}},setStatus(){},idle(){},releaseMic(){},realtime:{selected:true,active:false,start:async command=>{started++;assert.equal(command,'เปิดเพลง')}}});
 await v.process([]);assert.equal(started,0);text='เฮ้ อังเคิล เปิดเพลง';await v.process([]);assert.equal(started,1);
});
test('a natural cloud conversation end rearms local wake capture, but manual Stop cancels the rearm',async()=>{
 const v=await renderer();let captures=0;v.engine={value:'elevenlabs'};Object.assign(v.listening,{serial:1,settings:{mode:'wake'},capture:async()=>captures++,error:e=>{throw e;}});
 v.disconnected({reason:'agent'},v.serial);await new Promise(r=>setTimeout(r,550));assert.equal(captures,1);
 v.session={endSession:async()=>{}};v.disconnected({reason:'agent'},v.serial);v.stop();await new Promise(r=>setTimeout(r,550));assert.equal(captures,1);
});

test('a replayed user transcript cannot approve a later question',async()=>{
 const v=await renderer();let answers=0;v.computer.answerState=async()=>answers++;
 v.ask({id:'job',approvalId:'first',question:'one'});await v.message({role:'user',event_id:5,message:'ใช่'});assert.equal(answers,1);
 v.ask({id:'job',approvalId:'second',question:'two'});await v.message({role:'user',event_id:5,message:'ใช่'});assert.equal(answers,1);await v.message({role:'user',event_id:6,message:'ใช่'});assert.equal(answers,2);
});
