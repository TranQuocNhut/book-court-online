# Hệ Thống Đặt Sân Thể Thao Online

Dự án này là một nền tảng quản lý và đặt sân thể thao trực tuyến, giúp kết nối chủ sân và người chơi một cách thuận tiện.

## 🚀 Công Nghệ Sử Dụng

### Frontend
- **Framework**: [React 19](https://react.dev/) (Vite)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Styled Components](https://styled-components.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **UI Components**: Radix UI, Lucide Icons, Heroicons
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Context API
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Real-time**: [Socket.io Client](https://socket.io/docs/v4/client-api/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (với Mongoose ODM)
- **Authentication**: JWT, bcryptjs, Passport.js (Google OAuth 2.0)
- **AI Integration**: [Google Gemini AI](https://ai.google.dev/)
- **Payment Gateways**: PayOS, MoMo (Sandbox), VNPay (Sandbox)
- **Cloud Media**: [Cloudinary](https://cloudinary.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Utilities**: Nodemailer, ExcelJS, QRCode, Google Sheets API

## 📁 Cấu Trúc Dự Án
```text
dat-san-online/
├── backend/          # Node.js Express server
│   ├── config/       # Cấu hình (DB, Cloudinary, Payment...)
│   ├── controllers/  # Logic xử lý API
│   ├── models/       # Mongoose Schemas
│   ├── routes/       # API Endpoints
│   └── server.js     # Entry point của backend
└── frontend/         # React application
    ├── src/
    │   ├── api/      # Các hàm gọi API
    │   ├── components/
    │   ├── contexts/ # React Contexts (Auth, Socket...)
    │   └── pages/    # Các trang của ứng dụng
    └── public/       # Tài sản tĩnh (ảnh, icon...)
```

## 🛠️ Hướng Dẫn Cài Đặt

### 1. Yêu Cầu Hệ Thống
- Node.js (phiên bản 18 trở lên)
- MongoDB (Local hoặc Atlas)
- Git

### 2. Cài Đặt Backend
```bash
cd backend
npm install
```
Tạo file `.env` trong thư mục `backend/` và cấu hình các biến sau:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI & Khác
GEMINI_API_KEY=your_gemini_api_key
GOONG_API_KEY=your_goong_api_key
```

### 3. Cài Đặt Frontend
```bash
cd frontend
npm install
```
Tạo file `.env` trong thư mục `frontend/` (nếu cần config API URL):
```env
VITE_API_URL=http://localhost:3000/api
```

## 🏃 Hướng Dẫn Chạy Dự Án

### Chạy Backend
```bash
cd backend
npm run dev
```
Server sẽ chạy tại: `http://localhost:3000`

### Chạy Frontend
```bash
cd frontend
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:5173`

## ✨ Các Tính Năng Chính
- Đặt sân theo giờ, quản lý lịch trình.
- Tích hợp thanh toán trực tuyến (MoMo, VNPay, PayOS).
- Đăng nhập bằng Google.
- Tích hợp AI hỗ trợ người dùng.
- Quản lý cơ sở sân, giải đấu và hệ thống thành viên thân thiết.
