# ผู้ช่วยส่วนตัว: Gmail และ Google Calendar

ให้ตัวละครอ่านและสรุปเมล จัดการนัด และเตือนเมื่อมีเมลสำคัญหรือใกล้ถึงเวลานัด ใช้ [MCP](https://modelcontextprotocol.io) server แบบเดียวกับ Claude Code

## สิ่งที่ต้องมี

- **Node.js** ติดตั้งในเครื่อง ([nodejs.org](https://nodejs.org)) เพราะ server ของ Gmail และปฏิทินรันด้วย `npx`
- **บัญชี Google** และไฟล์ **Google OAuth key** ที่สร้างเองครั้งเดียว ฟรี ใช้เวลาประมาณ 15 นาที

## สร้าง Google OAuth key (ครั้งเดียว)

1. เข้า [Google Cloud Console](https://console.cloud.google.com) แล้วสร้างโปรเจกต์ใหม่ ตั้งชื่ออะไรก็ได้ เช่น `uncle-desktop`
2. ไปที่ **APIs & Services › Library** แล้วเปิดใช้ 2 ตัว:
   - **Gmail API**
   - **Google Calendar API**
3. ไปที่ **Google Auth Platform** (หรือ OAuth consent screen)
   - **Branding:** ใส่ชื่อแอปและอีเมลของคุณ
   - **Audience:** เลือก **External** แล้วเพิ่มอีเมลของคุณใน **Test users**
4. ไปที่ **Clients › Create client**
   - Application type: **Desktop app**
   - กด Create แล้วกด **Download JSON**

> [!NOTE]
> แอปที่อยู่ในสถานะ **Testing** Google จะให้สิทธิ์อยู่ได้ 7 วัน ครบแล้วต้องกด "เชื่อมใหม่" ในแอป
> ถ้าไม่อยากกดทุกสัปดาห์ ไปที่ Audience แล้วกด **Publish app**
> ใช้เองหรือในกลุ่มไม่เกิน 100 คน ไม่ต้องรอ Google ตรวจ แต่ตอน login จะมีหน้าเตือน "Google hasn't verified this app"

## เชื่อมในแอป

1. คลิกขวาที่ตัวละคร › **ตั้งค่า…** › แท็บ **ผู้ช่วย**
2. กด **Gmail ▸ เชื่อม Gmail…** แล้วเลือกไฟล์ JSON ที่ดาวน์โหลดมา (เลือกครั้งเดียว ปฏิทินใช้ไฟล์เดียวกัน)
3. เบราว์เซอร์จะเปิดหน้า login ของ Google
   - เลือกบัญชี
   - ถ้าขึ้นหน้าเตือนว่า Google ยังไม่ได้ตรวจแอป ให้กด **Continue** (เป็นแอปของคุณเอง)
   - กดอนุญาต
4. กลับมาที่แอป ตัวละครจะบอกว่า "เชื่อม Gmail แล้ว"
5. ทำซ้ำกับ **Google Calendar ▸ เชื่อม Google Calendar…**

## ใช้งาน

**ถามในแชตได้เลย**
- "มีเมลใหม่จากลูกค้าไหม"
- "สรุปเมลที่ยังไม่อ่านวันนี้ให้หน่อย"
- "ร่างตอบเมลล่าสุดของคุณ A ว่าจะส่งงานวันศุกร์"
- "พรุ่งนี้มีนัดอะไรบ้าง"
- "นัดประชุมกับทีมวันพุธบ่ายสาม 1 ชั่วโมง"
- "หาช่วงว่าง 1 ชั่วโมงสัปดาห์นี้"

**ทุกอย่างที่เขียนหรือส่งออกไปจะถามก่อนเสมอ:** ส่งเมล ลบเมล สร้าง แก้ หรือลบนัด
- ตัวละครจะขึ้นปุ่ม **อนุญาต** พร้อมรายละเอียด กดไม่ต้อง = ไม่ทำ
- ส่วนการอ่าน ค้นหา และสรุป ทำได้เลย
- ถ้าเปิดสวิตช์ **"ส่ง โพสต์ บันทึก ยืนยัน"** ในหน้าควบคุมเครื่อง จะไม่ถาม

**แจ้งเตือน** (ตั้งได้ในแท็บผู้ช่วย)
- **เมลสำคัญ:** เช็คทุก 3 นาที เลือกได้ว่าเมลแบบไหนนับว่าสำคัญ
  - Gmail ติดป้ายสำคัญและยังไม่อ่าน (ค่าเริ่มต้น)
  - ติดดาวและยังไม่อ่าน
  - ทุกเมลในกล่องหลักที่ยังไม่อ่าน
- **นัด:** เตือนก่อนนัดเริ่ม 5, 10, 15 หรือ 30 นาที มีปุ่ม **เข้าประชุม** ถ้านัดมีลิงก์ Meet, Zoom หรือ Teams

## MCP server อื่น

แท็บผู้ช่วย › **แก้ไข mcp.json…** ใส่ server ได้แบบเดียวกับ Claude Code:

```json
{
  "mcpServers": {
    "notion": { "url": "https://mcp.notion.com/mcp" },
    "files": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/me/Documents"] }
  }
}
```

แก้เสร็จแล้วกด **โหลด MCP ใหม่** เครื่องมือของทุก server จะใช้ได้ในแชต เครื่องมือที่เขียนหรือลบข้อมูลจะถามก่อนเสมอ

## ความเป็นส่วนตัว

- **ไฟล์ key และ token:** อยู่ในเครื่องที่ `%APPDATA%\capri-desktop\mcp\` (Mac: `~/Library/Application Support/capri-desktop/mcp/`)
- **เนื้อหาเมลและนัด:** ส่งให้ AI ที่คุณเลือกในแท็บ AI แชต ถ้าไม่อยากให้ออกนอกเครื่อง ใช้ **Ollama**
- **ป้องกันเมลแปลก ๆ:** เนื้อหาเมลถือเป็นข้อมูล ไม่ใช่คำสั่ง AI จะไม่ทำตามที่เมลเขียนสั่ง
- **เลิกเชื่อม:** แท็บผู้ช่วย › Gmail ▸ **ยกเลิกการเชื่อม** แล้วเพิกถอนสิทธิ์ที่ [myaccount.google.com/permissions](https://myaccount.google.com/permissions) ด้วย

## server ที่ใช้

- Gmail: [`@gongrzhe/server-gmail-autoauth-mcp`](https://www.npmjs.com/package/@gongrzhe/server-gmail-autoauth-mcp) 1.1.11
- Calendar: [`@cocal/google-calendar-mcp`](https://www.npmjs.com/package/@cocal/google-calendar-mcp) 2.8.1

ล็อกเวอร์ชันไว้ ไม่อัปเดตเองโดยที่เรายังไม่ได้ตรวจ
