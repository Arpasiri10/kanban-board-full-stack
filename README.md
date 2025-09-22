# Kanban Board System

ระบบ Kanban Board ที่พัฒนาด้วย React + TypeScript + Vite พร้อมฟีเจอร์ครบถ้วนตามข้อกำหนด

## ฟีเจอร์หลัก

### ระบบ Authentication

- ระบบเข้าสู่ระบบ (Login) พร้อม Mock Users
- ระบบออกจากระบบ (Logout)
- ข้อมูลผู้ใช้ Mock สำหรับการทดสอบ

### ระบบจัดการ Board

- สร้าง Board ใหม่
- ลบ Board
- เปลี่ยนชื่อ Board
- ดูรายการ Board ทั้งหมด

### ระบบเชิญสมาชิก

- เชิญสมาชิกเข้าร่วม Board
- ระบบแจ้งเตือนเมื่อได้รับเชิญ
- จัดการสมาชิกใน Board

### ระบบจัดการ Columns

- สร้างคอลัมน์ใหม่
- ลบคอลัมน์
- เปลี่ยนชื่อคอลัมน์
- จัดเรียงคอลัมน์

### ระบบจัดการ Tasks

- สร้างงานใหม่
- แก้ไขงาน
- ลบงาน
- **Drag & Drop** เพื่อย้ายงานระหว่างคอลัมน์
- เพิ่ม Tags ให้กับงาน
- มอบหมายงานให้สมาชิก
- ระบบแจ้งเตือนเมื่อได้รับมอบหมายงาน

### ระบบแจ้งเตือน

- แจ้งเตือนเมื่อได้รับมอบหมายงาน
- แจ้งเตือนเมื่อได้รับเชิญเข้าร่วม Board
- แสดงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
- ทำเครื่องหมายว่าอ่านแล้ว

### ระบบจัดเก็บข้อมูล

- ใช้ Local Storage สำหรับเก็บข้อมูล
- ข้อมูลจะถูกบันทึกอัตโนมัติ
- รองรับการรีเฟรชหน้าเว็บ

## เทคโนโลยีที่ใช้

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **State Management**: React Context + useReducer

## การติดตั้งและรัน

1. ติดตั้ง dependencies:

```bash
npm install
```

2. รัน development server:

```bash
npm run dev
```

3. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

## การใช้งาน

### 1. เข้าสู่ระบบ

- ใช้บัญชี Mock ที่มีอยู่แล้ว หรือ
- คลิกปุ่มบัญชีตัวอย่างเพื่อเข้าสู่ระบบทันที

### 2. สร้าง Board

- คลิกปุ่ม "สร้าง Board ใหม่"
- กรอกชื่อและคำอธิบาย Board
- คลิก "สร้าง"

### 3. จัดการ Board

- คลิกที่ Board เพื่อเข้าไปดู
- เพิ่มคอลัมน์ใหม่
- สร้างงานในคอลัมน์
- ลากและวางงานระหว่างคอลัมน์

### 4. เชิญสมาชิก

- คลิกปุ่ม "สมาชิก" ใน Board
- ค้นหาและเลือกผู้ใช้ที่ต้องการเชิญ
- คลิก "เชิญสมาชิก"

### 5. จัดการงาน

- คลิกปุ่ม "+" ในคอลัมน์เพื่อสร้างงานใหม่
- เพิ่ม Tags, คำอธิบาย, และมอบหมายให้สมาชิก
- ลากและวางงานเพื่อย้ายระหว่างคอลัมน์

## ข้อมูล Mock Users

ระบบมีผู้ใช้ Mock 4 คนสำหรับการทดสอบ:

- John Doe (john@example.com)
- Jane Smith (jane@example.com)
- Bob Johnson (bob@example.com)
- Alice Brown (alice@example.com)

## ฟีเจอร์พิเศษ

- **Responsive Design**: รองรับการใช้งานบนอุปกรณ์ต่างๆ
- **Real-time Updates**: ข้อมูลอัปเดตแบบ Real-time
- **Keyboard Shortcuts**: รองรับการใช้งานด้วยคีย์บอร์ด
- **Smooth Animations**: เอฟเฟกต์การเคลื่อนไหวที่นุ่มนวล
- **Thai Language Support**: รองรับภาษาไทย

## การพัฒนาต่อ

ระบบนี้พร้อมสำหรับการพัฒนาต่อในส่วน:

- Backend API Integration
- Real-time Collaboration
- Advanced Permissions
- File Attachments
- Time Tracking
- Advanced Analytics

## License

MIT License