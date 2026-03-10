# Resident Voice (กระดานรับฟังความคิดเห็นลูกบ้าน)

ระบบกระดานรับฟังความคิดเห็นและข้อเสนอแนะสำหรับลูกบ้านในโครงการ/หมู่บ้าน/คอนโด ออกแบบมาเพื่อให้ลูกบ้านสามารถเสนอไอเดีย แจ้งปัญหา และลงคะแนนโหวต (Vote) ให้กับข้อเสนอที่เห็นด้วยได้อย่างโปร่งใสและเป็นระเบียบ โดยมีระบบจัดการสำหรับผู้ดูแล (Admin) เพื่อจัดหมวดหมู่และสรุปผล

## ✨ ฟีเจอร์หลัก (Features)

### สำหรับลูกบ้าน (Residents)
- 📝 **เสนอไอเดีย/แจ้งปัญหา:** พิมพ์ข้อความเสนอแนะ พร้อมระบุชื่อหรือบ้านเลขที่ได้
- 👍 **ระบบโหวต (Voting):** โหวตสนับสนุนข้อเสนอที่เห็นด้วย (จำกัด 1 โหวตต่อ 1 คน/อุปกรณ์ สำหรับแต่ละหัวข้อ)
- 📱 **ใช้งานง่าย (Responsive):** รองรับการใช้งานทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์
- 🔗 **แชร์ลิงก์ (Share):** คัดลอกลิงก์ของหมวดหมู่ปัจจุบันไปแชร์ในไลน์กลุ่มหมู่บ้านได้ทันที

### สำหรับผู้ดูแลระบบ (Admin)
- 🔐 **ระบบป้องกัน (Admin PIN):** เข้าสู่โหมดผู้ดูแลระบบผ่านรหัสผ่าน (PIN) เพื่อป้องกันการเข้าถึงจากบุคคลทั่วไป
- 📁 **จัดการกระดาน (Multiple Boards):** สร้างกระดาน/หัวข้อการประชุมได้ไม่จำกัด (เช่น "ประชุมใหญ่สามัญ ปี 67")
- 🎛️ **กำหนดสิทธิ์การโหวต:** ตั้งค่าจำนวนโหวตสูงสุดที่แต่ละการ์ดสามารถรับได้ (Max Votes)
- 🚦 **เปิด/ปิด รับความเห็น:** สามารถเปิดหรือปิดรับข้อเสนอและการโหวตของแต่ละกระดานได้เมื่อหมดเวลา
- 🗂️ **จัดหมวดหมู่ (Drag & Drop):** ลากการ์ดข้อเสนอไปใส่ในกลุ่มที่จัดเตรียมไว้ เช่น งานซ่อมบำรุง, ความปลอดภัย
- 🔗 **รวมข้อเสนอที่ซ้ำกัน (Merge):** ลากการ์ดที่มีเนื้อหาเหมือนกันไปซ้อนทับกัน เพื่อรวมคะแนนโหวตและยุบรวมเป็นข้อเดียว
- 🖨️ **พิมพ์รายงาน (Print/Export):** แสดงผลตารางสรุปข้อเสนอทั้งหมด แบ่งตามหมวดหมู่ พร้อมคะแนนโหวต เพื่อนำไปปรินต์หรือเซฟเป็น PDF สำหรับใช้ในที่ประชุม

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React, Vite, Tailwind CSS
- **Icons:** Lucide React
- **Backend/Database:** Firebase (Firestore)
- **Authentication:** Firebase Anonymous Auth

---

## 🚀 การติดตั้งและใช้งาน (Installation)

### 1. การตั้งค่า Firebase (Prerequisites)
ก่อนเริ่มรันโปรเจกต์ จำเป็นต้องมีโปรเจกต์บน Firebase:
1. สร้างโปรเจกต์ใหม่ที่ [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน **Firestore Database** (ตั้งค่า Rules เบื้องต้นให้อนุญาตการอ่าน/เขียน สำหรับโหมด Development)
3. เปิดใช้งาน **Authentication** และเปิดระบบ **Anonymous**
4. ไปที่ Project Settings > General เพื่อสร้าง Web App และคัดลอกค่า Firebase Config

### 2. การตั้งค่าโปรเจกต์ (Setup)
1. โคลน (Clone) Repository นี้
2. คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`
3. นำค่า Firebase Config และตั้งรหัสผ่าน Admin มาใส่ในไฟล์ `.env`

```env
# ตั้งรหัสผ่านสำหรับเข้าโหมดผู้ดูแลระบบ (Admin PIN)
VITE_ADMIN_PIN=123456

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. รันโปรเจกต์บนเครื่อง (Development)

```bash
# ติดตั้งแพ็กเกจ
npm install

# รันเซิร์ฟเวอร์จำลอง
npm run dev
```

ระบบจะรันขึ้นมาที่ `http://localhost:5173`

---

## 📦 การนำไปใช้จริง (Deployment)

โปรเจกต์นี้ใช้ Vite สามารถ Build เป็นสแตติกไฟล์นำไปครอบได้กับโฮสติ้งทุกประเภท เช่น Firebase Hosting, Vercel, หรือ Netlify

```bash
# สร้างไฟล์ Build สำหรับใช้งานจริง
npm run build
```

โฟลเดอร์ `dist` จะถูกสร้างขึ้น สามารถนำโฟลเดอร์นี้ไปอัปโหลดขึ้น Web Hosting ได้เลย

### คำเตือนเรื่องความปลอดภัย (Security Warning)
สำหรับการนำไปใช้งานจริง (Production) **ต้องเขียน [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)** เพื่อป้องกันไม่ให้ผู้ใช้ทั่วไป (ที่ไม่ใช่ Admin) สามารถแก้ไขหรือลบข้อมูลใน Database ได้โดยตรงผ่านการยิง API เนื่องจากฝั่ง Frontend มีการใช้ Anonymous Auth การเช็คสิทธิ์ `isAdmin` ในตรรกะของ React เพียงอย่างเดียวไม่เพียงพอต่อการป้องกัน Database.
