# Resident Voice (กระดานรับฟังความคิดเห็นลูกบ้าน)

ระบบกระดานรับฟังความคิดเห็นและข้อเสนอแนะสำหรับลูกบ้านในโครงการ/หมู่บ้าน/คอนโด ออกแบบมาเพื่อให้ลูกบ้านสามารถเสนอไอเดีย แจ้งปัญหา และลงคะแนนโหวต (Vote) ให้กับข้อเสนอที่เห็นด้วยได้อย่างโปร่งใสและเป็นระเบียบ โดยมีระบบจัดการสำหรับผู้ดูแล (Admin) เพื่อจัดหมวดหมู่และสรุปผล

## ✨ ฟีเจอร์หลัก (Features)

### สำหรับลูกบ้าน (Residents)
- 📝 **เสนอไอเดีย/แจ้งปัญหา:** พิมพ์ข้อความเสนอแนะ พร้อมระบุชื่อหรือบ้านเลขที่ได้
- 👍 **ระบบโหวต (Voting):** โหวตสนับสนุนข้อเสนอที่เห็นด้วย (จำกัด 1 โหวตต่อ 1 คน/อุปกรณ์)
- 🔍 **ค้นหา (Search):** ค้นหาข้อเสนอตามข้อความหรือชื่อผู้เสนอ
- ⚠️ **แจ้งเตือนข้อเสนอซ้ำ:** ระบบจะแจ้งเตือนหากพบข้อเสนอที่คล้ายกับที่มีอยู่แล้ว
- 📱 **ใช้งานง่าย (Responsive):** รองรับการใช้งานทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์
- 🔗 **แชร์ลิงก์ (Share):** คัดลอกลิงก์ของหมวดหมู่ปัจจุบันไปแชร์ในไลน์กลุ่มหมู่บ้านได้ทันที

### สำหรับผู้ดูแลระบบ (Admin)
- 🔐 **เข้าระบบด้วย Google:** ผู้ดูแลระบบยืนยันตัวตนผ่าน Google Account (UID ของ Admin ถูกจัดเก็บใน Firestore Collection `admins`)
- 📁 **จัดการกระดาน (Multiple Boards):** สร้างกระดาน/หัวข้อการประชุมได้ไม่จำกัด (เช่น "ประชุมใหญ่สามัญ ปี 67")
- 🎛️ **กำหนดสิทธิ์การโหวต:** ตั้งค่าจำนวนโหวตสูงสุดที่แต่ละการ์ดสามารถรับได้ (Max Votes)
- 🚦 **เปิด/ปิด รับความเห็น:** สามารถเปิดหรือปิดรับข้อเสนอและการโหวตของแต่ละกระดานได้เมื่อหมดเวลา
- 🗂️ **จัดหมวดหมู่ (Drag & Drop):** ลากการ์ดข้อเสนอไปใส่ในกลุ่มที่จัดเตรียมไว้ เช่น งานซ่อมบำรุง, ความปลอดภัย
- 🔗 **รวมข้อเสนอที่ซ้ำกัน (Merge):** ลากการ์ดที่มีเนื้อหาเหมือนกันไปซ้อนทับกัน เพื่อรวมคะแนนโหวต
- 🖨️ **พิมพ์รายงาน (Print/Export):** แสดงผลตารางสรุปข้อเสนอทั้งหมด แบ่งตามหมวดหมู่ พร้อมคะแนนโหวต เพื่อนำไปปรินต์หรือเซฟเป็น PDF สำหรับใช้ในที่ประชุม
- 📋 **บันทึกประวัติ (Audit Logs):** ระบบบันทึกทุกการกระทำของ Admin (ลบ, รวม, ย้ายการ์ด, เปิด/ปิดกระดาน) ไว้ใน Firestore Collection `auditLogs`

---

## 🔒 ความปลอดภัย (Security)

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **Admin Auth** | ใช้ Google Sign-In ผ่าน Firebase Auth, ตรวจสอบ UID กับ Firestore `admins` collection |
| **Firestore Rules** | กฎระดับ Database ป้องกันไม่ให้ผู้ใช้ทั่วไปแก้ไข/ลบข้อมูล |
| **Anti-XSS** | ทำความสะอาดข้อมูล Input ด้วย DOMPurify ก่อนบันทึกทุกครั้ง |
| **Vote Fraud Prevention** | บันทึก Device Fingerprint (FingerprintJS) ในทุก Vote, จำกัด 1 โหวต/1 เครื่อง |
| **Card Spam Prevention** | จำกัดจำนวนการ์ดที่ผู้ใช้แต่ละคน/เครื่องสามารถสร้างได้ |
| **Duplicate Detection** | ตรวจจับข้อเสนอซ้ำด้วย Fuse.js (Fuzzy Search) |

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React, Vite, Tailwind CSS
- **Icons:** Lucide React
- **Backend/Database:** Firebase (Firestore)
- **Authentication:** Firebase Auth (Anonymous + Google Sign-In)
- **Security Libraries:** DOMPurify, FingerprintJS
- **Duplicate Detection:** Fuse.js

---

## 🚀 การติดตั้งและใช้งาน (Installation)

### 1. การตั้งค่า Firebase (Prerequisites)
ก่อนเริ่มรันโปรเจกต์ จำเป็นต้องมีโปรเจกต์บน Firebase:
1. สร้างโปรเจกต์ใหม่ที่ [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน **Firestore Database**
3. เปิดใช้งาน **Authentication** และเปิดระบบ **Anonymous** และ **Google**
4. ไปที่ Project Settings > General เพื่อสร้าง Web App และคัดลอกค่า Firebase Config

### 2. ตั้งค่า Admin
1. สร้าง Collection `admins` ใน Firestore
2. เพิ่ม Document โดยใช้ UID ของ Google Account ที่ต้องการเป็น Admin เป็น Document ID
3. เพิ่ม Field: `role: "admin"`

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```
หรือ Copy เนื้อหาจาก `firestore.rules` ไปวางใน Firebase Console > Firestore > Rules

### 4. การตั้งค่าโปรเจกต์ (Setup)
1. โคลน (Clone) Repository นี้
2. คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`
3. นำค่า Firebase Config มาใส่ในไฟล์ `.env`

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_APP_ID=resident-idea-board-free
```

### 5. รันโปรเจกต์บนเครื่อง (Development)

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
