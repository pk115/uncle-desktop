'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),source=path.join(root,'node_modules/@elevenlabs/client'),target=path.join(root,'src/renderer/vendor');
fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'elevenlabs-client.js'),fs.readFileSync(path.join(source,'dist/lib.iife.js'),'utf8').replace(/\/\/# sourceMappingURL=.*$/m,''));
for(const name of ['rawAudioProcessor.js','audioConcatProcessor.js'])fs.copyFileSync(path.join(source,'worklets',name),path.join(target,name));
fs.copyFileSync(path.join(source,'LICENSE'),path.join(target,'ELEVENLABS-LICENSE.txt'));
