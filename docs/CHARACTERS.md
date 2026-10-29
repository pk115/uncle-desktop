# เลือกตัวละคร

เพิ่มภาพตัวละครของคุณเองได้จากปุ่ม **＋ เพิ่มตัวละครของฉัน** ในหน้าเลือกตัวละคร มี PNG ตัวอย่างให้บันทึกและพรอมป์ต์ AI พร้อมคัดลอก ดู [คู่มือเพิ่มตัวละคร](ADD_YOUR_CHARACTER.md)

คลิกขวาที่ตัวละครหรือไอคอนถาดระบบ → **เลือกตัวละคร…** เพื่อเปิดหน้าภาพตัวอย่างเต็มตัว กดการ์ดเพื่อดูตัวที่เลือก แล้วกด **ใช้ตัวละครนี้** จึงจะเปลี่ยนจริง เลื่อนดูรายชื่อได้ โดยหัวข้อและปุ่มยืนยันยังอยู่ให้กด ปิดได้ด้วยปุ่ม ✕, Esc หรือคลิกพื้นหลัง เมนูเปลี่ยนด่วนยังมีให้ใช้งานด้วย

มีให้เลือก 13 ตัว: Capri, UncleDev, Blacky, Bald Man, Lazy Boy, Angry Guy, Drunk Uncle, Vulture, Chubby Girl, Cute Girl, Fatty Girl, **Pinky** (Blacky เวอร์ชันเสือชมพู) และ **Mira** (ตัวละคร AI สมจริงครึ่งตัว ผมบ๊อบ เสื้อขาว)

Mira สร้างจากภาพอ้างอิง AI ของผู้ใช้ มี 24 เฟรม / 6 สถานะ ใช้ 2 fps และท่าทางเบา ๆ แทนท่าทางการ์ตูน มีภาพตัวอย่างและบุคลิกแชตของตัวเอง เป็น sprite ภาพนิ่งสลับเฟรม ยังไม่ใช่วิดีโอหรือลิปซิงก์ ดูพรอมป์ต์ใน `docs/mira-generation.json`

Pinky ปรับเป็นชมพูพาสเทลอ่อนตามภาพสีอ้างอิง ไม่มีน้ำตาหรือจุดฟ้าใต้ตาในทั้ง 24 เฟรม รวมภาพตัวอย่างและภาพแชต ดูพรอมป์ต์แก้ไขใน `docs/pinky-pastel-edit.json`

Capri ใช้ตัววาดภาพ WebGL และท่าทางต้นฉบับ โดยแสดงร่วมกับตัวละครใหม่ผ่าน Canvas เดียวกัน แอปจำตัวที่เลือกเมื่อเปิดใหม่ การเปลี่ยนตัวไม่รีโหลดหน้า ไม่ย้ายตำแหน่ง ไม่เปลี่ยนขนาด และไม่ล้างเซสชันงานของ Coding Agent

ภาพในกล่องข้อความ ไอคอนถาดระบบ ชื่อที่แสดง และคำสั่งบุคลิกแชตเปลี่ยนตามตัวละคร ประวัติแชตแยกเป็น `memory-<character-id>.json` ในโฟลเดอร์ข้อมูลแอป Capri กลับมาใช้ `memory.json` เดิมของตัวเอง เมื่อเปลี่ยนตัวระหว่างตอบแชต แอปหยุดคำตอบเดิม

## ภาพและสถานะ

ใช้ sprite 2D สร้างจากภาพอ้างอิงที่ผู้ใช้แนบด้วย built-in ImageGen ไม่ได้แก้ไขไฟล์หรือโมเดลในเกม Godot ภาพยังควรให้เจ้าของตัวละครตรวจรายละเอียดและจังหวะการเคลื่อนไหวก่อนเผยแพร่

| สถานะ | เมื่อแสดง |
|---|---|
| พัก | ไม่มีงาน |
| คิด | agent ทำงานหรือท่าครุ่นคิด |
| เรียกความสนใจ | agent รอผู้ใช้ อันดับความสำคัญสูงกว่าปฏิกิริยาอื่น |
| ฉลอง | งานสำเร็จ |
| ผิดพลาด | งานล้มเหลว |
| นอน | พักเมื่อไม่ได้ใช้งาน |

แต่ละตัวมี 24 เฟรม แบ่ง 6 สถานะ สถานะละ 4 เฟรม ภาพพื้นหลังโปร่งใส จัดเท้าไว้บน anchor เดียวกัน ใช้ Canvas 2D แทน shader ที่ผูกกับรูปร่าง Capri และตรวจการคลิกจาก alpha ของเฟรมที่กำลังแสดง โหมดลดการเคลื่อนไหวใช้ภาพแรกของแต่ละสถานะ

ชุดนี้ยังไม่มีท่าเดินและท่านั่งเฉพาะตัว ใช้ท่าตามสถานะร่วมกับระบบย้ายตำแหน่ง/เกาะหน้าต่างเดิม รุ่น 0.5.0 มีเสียงพูด Windows/OpenAI แยกจากเสียงเอฟเฟกต์แล้ว ดู [คู่มือเสียง](SPEECH_TH.md) แต่ยังไม่มีการขยับปากตามคำพูด

## ไฟล์

- `assets/characters/catalog.json` — รายชื่อและข้อมูลตัวละครที่เลือกได้ทั้งหมด
- `assets/characters/angry-boy/atlas.webp` และ `assets/characters/blacky/atlas.webp` — ภาพที่แอปใช้งาน
- `portrait.png`, `thinking.png`, `attention.png`, `success.png`, `error.png`, `sleep.png` — ภาพกล่องข้อความ
- `preview.jpg` ในแต่ละโฟลเดอร์ — ดูชุดเฟรมทั้งหมด
- `tools/normalize-characters.py --character ID RAW.png` — แยกภาพ สเกลร่วม และจัด anchor; ต้องมี Pillow, NumPy และ SciPy
- `docs/character-generation.json` — ภาพอ้างอิงและพรอมป์ต์ของชุดเพิ่ม 9 ตัว สร้างด้วย built-in ImageGen

## Prompt set / provenance

ใช้ built-in ImageGen (ไม่ได้ใช้ fallback CLI) โดยอ้างอิง:

- UncleDev: `ChatGPT Image 6 ก.ย. 2569 10_54_20.png`
- Blacky: `ChatGPT Image 6 ก.ย. 2569 19_53_51.png`

Production prompt: create a 4-column × 6-row transparent RGBA animation atlas, 24 complete isolated full-body figures, consistent camera/light/scale, shared bottom-center feet anchor, no scenery, labels, grid lines or ground shadows. Preserve the reference silhouette, outfit, facial features and colors. Rows: idle blink/breathing; thinking with hand at chin; attention with one raised hand; success cheer; frustrated error; drowsy standing sleep. Four small sequential pose changes per row.

UncleDev identity: oversized inverted triangular peach head, black bowl-cut bangs, thick angry eyebrows, red bloodshot eyes, cyan sleeveless ragged tunic, thin peach limbs, spherical hands and rounded black shoes.

Blacky identity: black inverted triangular cat head, two triangular ears, black bangs, golden eyes, two blue cheek spots, white nose, pink tongue, ragged black tunic, thin black limbs, black shoes and a curved tail. Final corrective edit: remove extra spherical nodules mistaken for head anatomy; exactly two arms and two paws, attached continuously to the shoulders, in all 24 figures.

## ตรวจสอบ

- `npm test` — ผ่าน 13/13 ข้อ รวมคำแปล ตัวแปร ชื่อไทย สถานะ animation และบุคลิกของตัวละคร
- เปิดแอปด้วย `npm run dev` แล้วรัน `npm run test:characters:live` — ตรวจภาพตัวอย่างครบทุกตัว ภาพไม่ล้น การเลือกก่อนยืนยัน ปิดด้วย Esc การสลับโดยไม่เปลี่ยน instance/เซสชัน/ตำแหน่ง ตรวจการลาก ส่วนโปร่งใส และการแสดงผลทั้ง 6 สถานะของทุกตัว
- ภาพทดสอบอยู่ใน `captures/angry-boy-*.png` และ `captures/blacky-*.png` (ไม่รวมใน Git)
- ไม่ได้ทดสอบแพ็ก installer หรือ benchmark CPU/RAM ในงานนี้
