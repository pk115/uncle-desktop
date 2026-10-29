# Uncle Desktop

**ภาษาไทย** · [English](README.md) · [Français](README.fr.md) · [คู่มือต้นฉบับ Capri](README.upstream.md)

> [!NOTE]
> **เครดิตผู้สร้างต้นฉบับ:** โปรเจกต์นี้พัฒนาและปรับแต่งต่อยอดมาจาก [Capri Desktop](https://github.com/mochiiwuff/capri-desktop) ของคุณ [mochiiwuff](https://github.com/mochiiwuff) โดยนำมาปรับปรุงให้รองรับภาษาไทย ปรับเปลี่ยนตัวละคร และเพิ่มฟีเจอร์สำหรับผู้ใช้งานชาวไทย

---

**Uncle Desktop** คือตัวละครคู่หู AI บนหน้าจอคอมพิวเตอร์ (AI Desktop Companion) ที่จะคอยติดตามและแสดงสถานะการทำงานของ Coding AI Agent ต่างๆ เช่น **Claude Code**, **Codex** และ **Antigravity (AGY)** พร้อมทั้งมีฟิสิกส์แอนิเมชันน่ารักๆ บนหน้าจอ รองรับภาษาไทยเต็มรูปแบบ และสามารถเปลี่ยนตัวละครได้

![Uncle Desktop / Capri](docs/done.png)

---

## ฟีเจอร์เด่นใน Uncle Desktop

- **รองรับภาษาไทยเต็มรูปแบบ:**
  - เมนูคลิกขวา, ถาดระบบ (System Tray), หน้าต่างการตั้งค่า และหน้าต่างแนะนำรองรับภาษาไทย
  - มาพร้อมฟอนต์ภาษาไทย Chakra Petch สวยงามโดยไม่ต้องดาวน์โหลดเพิ่ม
  - รองรับการสั่งงานด้วยเสียง/แชตภาษาไทย การแปลงเวลาและตัวเลขไทย (ดูรายละเอียดเพิ่มเติมที่ [docs/THAI_SUPPORT.md](docs/THAI_SUPPORT.md))
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

---

## สิทธิ์การใช้งานและเครดิต (License & Credits)

- ต่อยอดมาจาก [mochiiwuff/capri-desktop](https://github.com/mochiiwuff/capri-desktop) (ผู้พัฒนาต้นฉบับ: mochiiwuff)
- พัฒนาและดูแลต่อโดย **TheUncleDev** ([pk115/uncle-desktop](https://github.com/pk115/uncle-desktop))
- ใช้งานภายใต้สัญญาอนุญาต [PolyForm Noncommercial 1.0.0](LICENSE)

