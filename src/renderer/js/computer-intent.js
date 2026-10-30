// Route explicit requests, not descriptions or questions about the assistant's abilities.
export function computerTask(text) {
 const raw=String(text||'').trim();
 if(/^(?:อย่า|ห้าม|ไม่ต้อง|อยากรู้|อธิบาย|วิธี|ตัวอย่าง|สามารถ|ทำไม)/.test(raw))return null;
 const explicit=/^(?:ควบคุมเครื่อง|ทำงานบนเครื่อง|ใช้คอม(?:พิวเตอร์)?|computer)\s*[:：]?\s*(.+)$/i.exec(raw);
 if(explicit)return explicit[1];
 if(/^(?:ตอนนี้)?(?:กำลังเล่นเพลงอะไร|เพลงอะไร|ชื่อเพลงที่กำลังเล่น|what song|what is playing)/i.test(raw))return raw;
 const task=raw.replace(/^(?:ช่วย|กรุณา)\s*/,'');
 if(/^(?:คลิก|ดับเบิลคลิก|ลาก|เลื่อน|พิมพ์|กรอก|กด(?:ปุ่ม|คีย์|คีย์ลัด)?|ย่อหน้าต่าง|สลับ(?:ไป|หน้าต่าง)|ล็อก(?:เครื่อง|หน้าจอ)|ปิดเครื่อง|รีสตาร์ต(?:เครื่อง)?|พักเครื่อง|ออกจากระบบ|ยกเลิก(?:การ)?ปิดเครื่อง|ตั้ง(?:ค่า)?(?:ระดับ)?เสียง|ปรับ(?:ระดับ)?เสียง|เปิดบลูทูธ|ปิดบลูทูธ|เปิดไวไฟ|ปิดไวไฟ|ปิดแท็บ)/.test(task))return raw;
 if(/^(?:เปิด|ค้นหา|ค้น|หา|เล่นเพลง|เข้า|ไปที่|ส่งข้อความ|ส่งเมล|ส่งอีเมล|โพสต์)/.test(task)&&/(?:แล้ว|จากนั้น|ต่อด้วย|และ(?:พิมพ์|ค้น|เปิด|คลิก|กด)|ส่งข้อความ|ส่งเมล|ส่งอีเมล|โพสต์)/.test(task))return raw;
 if(/^(?:open|click|drag|type|scroll|press|switch|minimize|shutdown|restart|lock|send|post)\b/i.test(task)&&(/\b(?:then|and|click|drag|type|scroll|press|switch|minimize|shutdown|restart|lock|send|post)\b/i.test(task)))return raw;
 return null;
}
