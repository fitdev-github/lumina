# Lumina Finance

แอปจัดการเงินส่วนตัวแบบ Progressive Web App (PWA) รองรับการใช้งานบนมือถือและเดสก์ท็อป สร้างด้วย React + Firebase

## Features

- **Dashboard** — ภาพรวมการเงิน รายรับ-รายจ่ายเดือนนี้ งบประมาณคงเหลือ
- **ธุรกรรม** — บันทึกรายรับ-รายจ่าย จัดหมวดหมู่ กรองตามช่วงเวลา
- **นำเข้าจาก Gmail** — ดึงอีเมลแจ้งเตือนจาก SCB Easy อัตโนมัติ parse ยอดเงิน/วันที่/ประเภทรายการ
- **บัญชีธนาคาร** — จัดการหลายบัญชี แยก savings / emergency / general
- **งบประมาณ** — ตั้งวงเงินรายหมวด ติดตามสัดส่วนค่าใช้จ่าย
- **ค่าใช้จ่ายประจำ** — รายการ fixed expenses รายเดือน
- **Checklist รายเดือน** — ติดตามการจ่ายบิลและออมเงินประจำเดือน
- **เป้าหมายการออม** — ตั้งเป้า ติดตาม progress
- **หนี้สิน** — บันทึกหนี้ คำนวณ DTI และ minimum payment
- **Crypto Portfolio** — บันทึก holdings ดึงราคาปัจจุบัน
- **เงินให้ยืม** — ติดตามเงินที่ให้เพื่อนยืม
- **AI Assistant** — วิเคราะห์การเงินและให้คำแนะนำ (ใช้ Groq API)
- **สถานะการเงิน** — แสดงสัดส่วน savings / emergency fund / spending tier

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 19, React Router 7 |
| Styling | Tailwind CSS 3 |
| Build | Vite 8 |
| PWA | vite-plugin-pwa |
| Auth & Database | Firebase (Auth + Firestore) |
| AI | Groq SDK (LLaMA) |
| Icons | Lucide React |

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Firebase

สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com) จากนั้น:

- เปิดใช้งาน **Authentication** → เพิ่ม Google Sign-in provider
- เปิดใช้งาน **Firestore Database**

### 3. สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

แล้วใส่ค่าจาก Firebase Console → Project Settings → Your apps:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. รัน dev server

```bash
npm run dev
```

## ฟีเจอร์นำเข้าจาก Gmail (ตั้งค่าเพิ่มเติม)

ระบบดึงอีเมลแจ้งเตือนจาก `scbeasynet@scb.co.th` โดยอัตโนมัติ ต้องตั้งค่าก่อน:

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com) → เลือกโปรเจกต์เดียวกับ Firebase
2. **APIs & Services** → **Library** → ค้นหา "Gmail API" → **Enable**
3. **APIs & Services** → **OAuth consent screen** → **Add or remove scopes** → เพิ่ม `https://www.googleapis.com/auth/gmail.readonly`
4. หากแอปยังอยู่ในโหมด Testing → เพิ่ม Gmail ของผู้ใช้ใน **Test users**

## Firestore Data Structure

```
users/{uid}/
  transactions/{id}          — รายการธุรกรรม
  accounts/{id}              — บัญชีธนาคาร
  goals/{id}                 — เป้าหมายการออม
  debts/{id}                 — หนี้สิน
  budgets/{month}            — งบประมาณรายเดือน
  fixed_expenses/{id}        — ค่าใช้จ่ายประจำ
  monthly_checklists/{month} — checklist รายเดือน
  crypto_holdings/{id}       — crypto portfolio
  lent_money/{id}            — เงินให้ยืม
  gmail_imports/{messageId}  — tracking อีเมลที่นำเข้าแล้ว
```

## Scripts

```bash
npm run dev      # dev server (localhost:5173)
npm run build    # build สำหรับ production
npm run preview  # preview build
npm run lint     # ESLint
```
