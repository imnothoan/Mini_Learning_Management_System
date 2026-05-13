# Mini Learning Management System

Ứng dụng web hỗ trợ dạy và học trực tuyến với 3 vai trò:
- **Admin**
- **Giảng viên (Instructor)**
- **Học viên (Student)**

## Chức năng chính

- Đăng ký / đăng nhập bằng Supabase Auth
- Phân quyền theo vai trò (admin, instructor, student)
- Quản lý khóa học (tạo, sửa, xóa) cho giảng viên/admin
- Quản lý bài học theo từng khóa
- Đăng ký khóa học cho học viên
- Học theo danh sách bài học + video YouTube
- Theo dõi tiến độ học tập theo phần trăm
- Dashboard thống kê theo từng vai trò
- Admin panel theo dõi người dùng, khóa học, lượt đăng ký

## Công nghệ sử dụng

- React + Vite
- React Router
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- ESLint

## Cấu hình môi trường

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Điền các biến môi trường:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Cài đặt và chạy dự án

```bash
npm ci
npm run dev
```

## Build và kiểm tra chất lượng

```bash
npm run lint
npm run build
```

> Hiện tại repository chưa có script `npm test`.

## Cơ sở dữ liệu Supabase

- Schema SQL: `supabase/schema.sql`
- Seed dữ liệu mẫu: `seed.js`

Chạy seed:

```bash
node seed.js
```

## Tài khoản mẫu

Khi chạy seed, hệ thống sẽ tạo (hoặc dùng lại) tài khoản giảng viên:

- Email: `instructor@example.com`
- Password: `password123`

## Cấu trúc thư mục chính

- `src/pages`: các trang chính (Auth, Dashboard, CourseList, CourseDetail, LessonView, ManageCourses, CourseEditor, AdminPanel)
- `src/components`: layout và component dùng lại
- `src/context`: AuthContext
- `src/lib`: Supabase client
- `supabase`: schema SQL

## Ghi chú

- Không commit secret/keys thật vào repository.
- Nếu lộ key, hãy rotate key trên Supabase ngay.
