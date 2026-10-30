# ติดตั้งบน Mac (beta)

Uncle Desktop บน Mac ยังเป็นรุ่นทดลอง และไม่ได้เซ็นกับ Apple ครั้งแรกที่เปิด macOS จะเตือน ทำตามนี้ครั้งเดียวต่อเครื่อง

1. ดาวน์โหลดจาก [หน้า Releases](https://github.com/pk115/uncle-desktop/releases/latest)
   - Mac ชิป M1/M2/M3/M4: `Uncle-Desktop-x.y.z-arm64.dmg`
   - Mac Intel: `Uncle-Desktop-x.y.z-x64.dmg`
   - ไม่แน่ใจ: เมนู  › About This Mac ดูบรรทัด Chip หรือ Processor
2. เปิดไฟล์ `.dmg` แล้วลาก **Uncle Desktop** ไปใส่ **Applications**
3. เปิด Uncle Desktop จาก Applications จะขึ้นว่าเปิดไม่ได้ กด **Done** (หรือ OK)
4. ไปที่ **System Settings › Privacy & Security** เลื่อนลงจะเห็น "Uncle Desktop was blocked" กด **Open Anyway** แล้วใส่รหัสเครื่อง
5. เปิดอีกครั้ง กด **Open** ตัวละครจะขึ้นบนจอ และมีไอคอนที่ menu bar ด้านบนขวา

ถ้าขึ้นว่า "damaged and can't be opened" ให้เปิด Terminal แล้วพิมพ์

```bash
xattr -cr "/Applications/Uncle Desktop.app"
```

## สิทธิ์ที่ macOS จะถาม

- **ไมโครโฟน**: ตอนเปิดไมค์สั่งงานด้วยเสียงครั้งแรก
- **Screen Recording**: ตอนให้ดูหน้าจอ
- **ควบคุม System Events**: ตอนสั่งปิดแอป

ถ้าเคยกดไม่อนุญาต เปิดใหม่ได้ที่ System Settings › Privacy & Security หลังลงเวอร์ชันใหม่ macOS อาจถามสิทธิ์ซ้ำ กดอนุญาตอีกครั้ง

## อัปเดต

รุ่น Mac อัปเดตตัวเองไม่ได้ (ต้องเซ็นกับ Apple) ตัวละครจะบอกเมื่อมีเวอร์ชันใหม่ กด **ดาวน์โหลดเวอร์ชันใหม่** แล้วติดตั้งทับตามขั้นตอนข้อ 2

## ฟีเจอร์ที่ต้องเตรียมเพิ่มบน Mac

- **ควบคุมเครื่อง**: ต้องอนุญาต **Accessibility** ให้ Uncle Desktop (macOS จะเปิดหน้าตั้งค่าให้ครั้งแรก) ถ้าให้ดูภาพหน้าจอด้วย ต้องอนุญาต **Screen Recording** ด้วย บน Mac ปุ่ม CTRL ในคำสั่งคือปุ่ม ⌘
- **โมเดลรับเสียงในเครื่อง**: ต้องมี [Homebrew](https://brew.sh) กดดาวน์โหลดโมเดลแล้วแอปจะติดตั้ง whisper-cpp ให้เอง ทำงานบนชิปกราฟิกของ Mac
- **ตัวละครอ่านชื่อหน้าต่าง** (เช่น รู้ว่าคุณเปิด ChatGPT ในเบราว์เซอร์): ต้องอนุญาต Screen Recording ถ้าไม่อนุญาต ยังนั่งบนหน้าต่างได้ตามปกติ
- **เล่น/หยุดเพลง**: สั่ง Spotify หรือ Music ที่เปิดอยู่ macOS จะถามสิทธิ์ควบคุมแอปนั้นครั้งแรก

ยังไม่มีบน Mac: แจ้งเตือนตอนเสียบ USB และอุปกรณ์

เจอปัญหา ส่งไฟล์ `errors.txt` จาก `~/Library/Application Support/capri-desktop/` มาที่ [Issues](https://github.com/pk115/uncle-desktop/issues)
