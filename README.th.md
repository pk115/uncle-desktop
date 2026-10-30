# Uncle Desktop

**รุ่น 0.7.0:** โหมดเสียงส่งคำสั่งเอง ถามยืนยันก่อนปิดโปรแกรม/เปิดรายการเสี่ยง รับคำตอบใช่–ไม่ใช่โดยไม่เรียกซ้ำ และยกเลิกเมื่อหมดเวลา 20 วินาที คำสั่งพื้นฐานใช้เครื่องมือจริงโดยตรง ดู [คู่มือเสียง](docs/VOICE_COMMANDS_TH.md)

เพิ่มเสียงไทย Edge ชาย/หญิงพร้อมเลือกในโปรแกรม ไม่ต้องติดตั้งเสียง Windows หรือใส่คีย์ (ต้องใช้อินเทอร์เน็ต) พร้อมเก็บ Windows และ OpenAI ไว้ครบ ดู [บริการเสียงทั้งสามแบบ](docs/SPEECH_TH.md)

**รุ่น 0.6.0:** เพิ่มกดพูด/รอคำเรียกที่ตั้งเอง เลือกไมค์ คุยต่อหลังปลุก ถอดเสียงไทยในเครื่องหรือ OpenAI ตรวจข้อความก่อนส่ง และคีย์ลัดปิดไมค์ ดู [วิธีใช้และข้อจำกัด](docs/VOICE_COMMANDS_TH.md) ไมค์ปิดเมื่อเริ่มโปรแกรมทุกครั้ง

ดู [สถานะโค้ดปัจจุบันและแผนเพิ่มฟีเจอร์จาก lachydotmcg](docs/FEATURE_ROADMAP_TH.md): มีแชตและคำสั่งเปิดแอป/เพลง ตัวละคร และ TTS แล้ว; รุ่น 0.6.0 รับเสียงจากไมค์และตั้งคำเรียกได้แล้ว; งานค้างคือหน้าตั้งค่ารวม Screen Vision ที่มี preview ขยับปาก และ OpenCode Hub

**รุ่น 0.5.0:** มีตัวติดตั้ง Windows และหน้า **เสียงพูดภาษาไทย…** ในเมนูคลิกขวา เลือกเสียง Windows หรือ OpenAI TTS พร้อมทดสอบ/หยุดเสียง ปรับความเร็วและระดับเสียง และอ่านแชตอัตโนมัติได้ เสียงไทย Windows ต้องติดตั้งเพิ่มหากยังไม่มี ส่วน OpenAI ต้องใช้คีย์และยินยอมส่งข้อความ โดยอาจมีค่าบริการ ดู [คู่มือและข้อจำกัดการทดสอบเสียง](docs/SPEECH_TH.md)

**ภาษาไทย** · [English](README.md) · [Français](README.fr.md) · [คู่มือต้นฉบับ Capri](README.upstream.md)

> [!NOTE]
> **เครดิตผู้สร้างต้นฉบับ:** โปรเจกต์นี้พัฒนาและปรับแต่งต่อยอดมาจาก [Capri Desktop](https://github.com/mochiiwuff/capri-desktop) ของคุณ [mochiiwuff](https://github.com/mochiiwuff) โดยนำมาปรับปรุงให้รองรับภาษาไทย ปรับเปลี่ยนตัวละคร และเพิ่มฟีเจอร์สำหรับผู้ใช้งานชาวไทย

---

**Uncle Desktop** คือตัวละครคู่หู AI บนหน้าจอคอมพิวเตอร์ (AI Desktop Companion) ที่จะคอยติดตามและแสดงสถานะการทำงานของ Coding AI Agent ต่างๆ เช่น **Claude Code**, **Codex** และ **Antigravity (AGY)** พร้อมทั้งมีฟิสิกส์แอนิเมชันน่ารักๆ บนหน้าจอ รองรับภาษาไทยเต็มรูปแบบ และสามารถเปลี่ยนตัวละครได้

![Uncle Desktop / Capri](docs/done.png)

---

## 🎭 ตัวละครที่มีให้เลือกใช้งาน (Selectable Characters)

สามารถคลิกขวาที่ตัวละครหรือถาดระบบ แล้วเลือก **"เลือกตัวละคร…"** ได้เลย มีให้เลือกถึง 13 คาแรคเตอร์ พร้อมรองรับการเพิ่มตัวละครของคุณเอง:

| UncleDev (หนุ่มหัวร้อน) | Blacky (แมวดำ) | Mira (สาว AI) | Pinky (เสือชมพู) |
| :---: | :---: | :---: | :---: |
| <img src="assets/characters/angry-boy/portrait.png" width="120" /> | <img src="assets/characters/blacky/portrait.png" width="120" /> | <img src="assets/characters/mira/portrait.png" width="120" /> | <img src="assets/characters/pinky/portrait.png" width="120" /> |

| Bald Man (ลุงผมบาง) | Cute Girl | Drunk Uncle (ลุงขี้เมา) | Lazy Boy (หนุ่มขี้เซา) |
| :---: | :---: | :---: | :---: |
| <img src="assets/characters/bald-man/portrait.png" width="120" /> | <img src="assets/characters/cute-girl/portrait.png" width="120" /> | <img src="assets/characters/drunk-uncle/portrait.png" width="120" /> | <img src="assets/characters/lazy-boy/portrait.png" width="120" /> |

| Chubby Girl | Fatty Girl | Angry Guy | Vulture |
| :---: | :---: | :---: | :---: |
| <img src="assets/characters/chubby-girl/portrait.png" width="120" /> | <img src="assets/characters/fatty-girl/portrait.png" width="120" /> | <img src="assets/characters/angry-guy/portrait.png" width="120" /> | <img src="assets/characters/vulture/portrait.png" width="120" /> |

*(และตัวละครดั้งเดิม **Capri** จาก Cyberpunk: Edgerunners)*  
ดูรายละเอียดเพิ่มเติมและวิธีสร้างตัวละครของตัวเองได้ที่ [docs/CHARACTERS.md](docs/CHARACTERS.md) และ [docs/ADD_YOUR_CHARACTER.md](docs/ADD_YOUR_CHARACTER.md)

---

## ฟีเจอร์เด่นใน Uncle Desktop

- **รองรับภาษาไทยเต็มรูปแบบ:**
  - เมนูคลิกขวา, ถาดระบบ (System Tray), หน้าต่างการตั้งค่า และหน้าต่างแนะนำรองรับภาษาไทย
  - มาพร้อมฟอนต์ภาษาไทย Chakra Petch สวยงามโดยไม่ต้องดาวน์โหลดเพิ่ม
  - รองรับคำสั่งผ่านแชตภาษาไทย การแปลงเวลาและตัวเลขไทย; รุ่น 0.6.0 รับเสียงไมค์แบบกดพูด/คำเรียกได้ พร้อมอ่านคำตอบออกเสียง (ดู [คู่มือภาษาไทย](docs/THAI_SUPPORT.md) และ [คู่มือเสียง](docs/SPEECH_TH.md))
- **เปลี่ยนและนำเข้าตัวละครได้ (Selectable Characters):**
  - สลับตัวละครได้หลากหลาย หรือนำเข้าตัวละครใหม่ๆ ด้วยตัวเอง (ดู [docs/CHARACTERS.md](docs/CHARACTERS.md) และ [docs/ADD_YOUR_CHARACTER.md](docs/ADD_YOUR_CHARACTER.md))
- **ติดตามสถานะของ Coding AI แบบเรียลไทม์:**
  - **Ticker:** แสดงสิ่งที่ AI กำลังทำอยู่ เช่น กำลังแก้โค้ด (`EDITS file.ts`), รันเทสต์ (`RUNS npm test`), ค้นหาไฟล์ (`GREPS`)
  - **แจ้งเตือนเมื่อ AI ติดปัญหา / รอการอนุมัติ:** ตัวละครจะวาปมาข้างเคอร์เซอร์เมาส์ของคุณ พร้อมชี้ไปที่หน้าต่างของ AI ตัวนั้น
  - **Thinking Indicator:** มีแอนิเมชันบอกสถานะเมื่อโมเดลกำลังใช้เวลาคิดนาน จะได้รู้ว่าไม่ได้ค้าง
  - **Error & Victory:** แสดงเอฟเฟกต์กระแทกเวลารันคำสั่งล้มเหลว และเต้นฉลองพร้อมแสดงสรุปจำนวนงานเมื่อ AI ทำงานเสร็จ
- **ฟิสิกส์และการโต้ตอบบนหน้าจอเดสก์ท็อป:**
  - นั่งห้อยขาบนขอบหน้าต่างโปรแกรม และเลื่อนตามหน้าต่างที่ใช้งาน
  - รองรับการคลิกลาก ขว้าง หรือปล่อยให้ตกตามแรงโน้มถ่วง
  - โต้ตอบกับเมาส์ หลบเมาส์ แอบตามขอบจอ และรองรับการทำงานหลายหน้าจอ (Multi-monitor)
- **แชตกับ AI & เครื่องมือช่วยเหลือ:**
  - คุยกับ LLM (ทั้ง Local และ Cloud), แคปภาพหน้าจอ, ควบคุมเสียงในเครื่อง และตั้งนาฬิกาเตือนความจำ

---

## การติดตั้งและเริ่มต้นใช้งาน

### สิ่งที่ต้องมีในเครื่อง

- [Node.js](https://nodejs.org/) เวอร์ชั่น 20 ขึ้นไป
- ระบบปฏิบัติการ Windows 10 หรือ 11
- macOS (รุ่นทดลอง): ดาวน์โหลด `.dmg` แล้วทำตาม [วิธีติดตั้งบน Mac](docs/INSTALL_MAC_TH.md)

### วิธีติดตั้ง

```bash
# Clone โปรเจกต์
git clone https://github.com/pk115/uncle-desktop.git
cd uncle-desktop

# ติดตั้งแพ็กเกจที่จำเป็น
npm install

# เริ่มเปิดใช้งานโปรแกรม
npm start
```

### คำสั่งสคริปต์ต่างๆ

- `npm run dev` — เปิดใช้งานพร้อมเปิด DevTools
- `npm run demo` — ทดสอบรันแอนิเมชันของตัวละคร
- `npm test` — รันชุดทดสอบความถูกต้องและภาษาไทย
- `npm run hooks:agy:install` — ติดตั้ง Hook สำหรับ Antigravity (AGY)
- `npm run hooks:codex:install` — ติดตั้ง Hook สำหรับ Codex
- `npm run hooks:install` — ติดตั้ง Hook สำหรับ Claude Code
- `npm run dist` — Build โปรแกรมสำหรับติดตั้งบน Windows (NSIS Installer)
- `npm run release` — Build แล้วอัปโหลดตัวติดตั้งขึ้น GitHub Release แบบ draft (ต้องตั้ง `GH_TOKEN`) กด Publish แล้วเครื่องที่ติดตั้งไว้จะอัปเดตเอง

---

## สิทธิ์การใช้งานและเครดิต (License & Credits)

- ต่อยอดมาจาก [mochiiwuff/capri-desktop](https://github.com/mochiiwuff/capri-desktop) (ผู้พัฒนาต้นฉบับ: mochiiwuff)
- พัฒนาและดูแลต่อโดย **TheUncleDev** ([pk115/uncle-desktop](https://github.com/pk115/uncle-desktop))
- ใช้งานภายใต้สัญญาอนุญาต [PolyForm Noncommercial 1.0.0](LICENSE)



### 0.8.0 — Thai speech recognition

Local Thai-tuned Thonburian medium, Gemini transcription, configurable pause duration and vocabulary, and a no-action voice test with model/timing diagnostics. See [Thai voice guide](docs/VOICE_COMMANDS_TH.md).

### 0.8.1 — อัปเดตตัวเอง และขยับตามเสียงพูด

โปรแกรมที่ติดตั้งแล้วจะเช็กรุ่นใหม่จาก GitHub Releases ตอนเปิดและทุก 6 ชั่วโมง ดาวน์โหลดเงียบๆ แล้วติดตั้งตอนปิดโปรแกรม และตัวละครจะขยับตามเสียงขณะอ่านคำตอบ ติดตั้ง 0.8.1 ด้วยมือครั้งเดียว รุ่นถัดไปจะมาเอง


### 0.9.0 — Computer control (Windows)

Read UI Automation targets, type Thai, click, scroll and run bounded multi-step jobs with the selected AI. Includes step status, confirmations, stop hotkey and observed-text completion checks. See [computer control guide](docs/COMPUTER_CONTROL_TH.md). Inspired by the [Capri project by Lachy](https://github.com/lachydotmcg/capri-desktop).


### 0.11.0 — Switchable ElevenLabs Voice Agent

Choose the original Local/Gemini/OpenAI voice pipeline or ElevenLabs continuous voice with interruption handling and 13 client-tool categories. Thai uses Eleven v3 Conversational. See [Thai setup and validation guide](docs/VOICE_AGENT_TH.md).


### 0.12.0 — Four new companions

Adds Mochi (pink gothic cat), Lili (anime floral elf), Luna (realistic floral elf), and Pudding (cheerful yellow casual outfit), with gallery previews, distinct personalities and six 2D pose states. Existing characters remain available.


### 0.15.0 — ฟีเจอร์ Windows บน Mac

บน macOS ตัวละครนั่งบนหน้าต่างได้, ควบคุมเครื่องได้ (Accessibility), ใช้โมเดลรับเสียงในเครื่อง (whisper-cpp ผ่าน Homebrew ใช้ชิปกราฟิก), เล่น/หยุดเพลงใน Spotify หรือ Music และเห็นเกม Steam ดูสิทธิ์ที่ต้องอนุญาตใน[วิธีติดตั้งบน Mac](docs/INSTALL_MAC_TH.md)

### 0.14.0 — macOS (รุ่นทดลอง)

ตัวแรกสำหรับ Mac (ชิป M และ Intel): ตัวละครอยู่ทุก Space, ไอคอนที่ menu bar, เสียงพูดของ macOS, Ollama, ค้นไฟล์ด้วย Spotlight, ปิดแอปและปรับเสียง ยังไม่ได้เซ็นกับ Apple ดู[วิธีติดตั้งบน Mac](docs/INSTALL_MAC_TH.md) ส่วนควบคุมเครื่อง โมเดลรับเสียงในเครื่อง และติดตามหน้าต่าง ยังใช้ได้เฉพาะ Windows

### 0.13.0 — ตั้งค่าทีละขั้นและหน้าตั้งค่าแบบแท็บ

หน้าตั้งค่าทีละขั้นตอนเปิดครั้งแรก, เมนูคลิกขวาสั้นลง ที่เหลือย้ายไปหน้าตั้งค่าแบบแท็บ (มีตัวอย่างตัวละคร), ปุ่มล้างการตั้งค่าทั้งหมด และตัวละครบอกเมื่อมีอัปเดตพร้อมปุ่มรีสตาร์ท กับปุ่มเช็คอัปเดตในหน้าตั้งค่า

### 0.12.2 — ตั้งค่ารวม ความจำ และแก้บั๊ก

หน้าตั้งค่ารวมพร้อมคีย์ลัดที่เปลี่ยนเองได้, personality.md ที่เขียนบุคลิกเอง และ me.md ที่จดสิ่งที่รู้เกี่ยวกับคุณระหว่างคุย, มุมมองครึ่งตัว, บันทึกข้อผิดพลาดลง errors.txt และแก้ปุ่มดาวน์โหลดโมเดลในเครื่องที่ใช้ไม่ได้ตั้งแต่ 0.8.0
