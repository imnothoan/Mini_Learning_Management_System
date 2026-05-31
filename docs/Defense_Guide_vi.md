# Hướng dẫn demo và bảo vệ MiniLMS

Tài liệu này dùng để luyện trình bày cho buổi bảo vệ ngày 03/06/2026. Mục tiêu là làm demo có thứ tự, giải thích được kiến trúc, database, phân quyền và tiến độ học tập. Không nên cố nói quá nhiều. Khi bị hỏi khó, trả lời theo cấu trúc: khái niệm -> cách hệ thống làm -> chỉ vào code/database thật.

## 1. Câu mở đầu 45-60 giây

Em có thể nói như sau:

> Đề tài của em là Mini Learning Management System, một hệ thống quản lý học tập quy mô nhỏ. Hệ thống có ba nhóm người dùng chính: student, instructor và administrator. Student có thể tìm khóa học, đăng ký học, xem bài học và theo dõi tiến độ. Instructor có thể tạo khóa học, quản lý bài học và xem số lượng học viên. Administrator có thể theo dõi toàn hệ thống và quản lý vai trò người dùng. Về kỹ thuật, frontend được xây dựng bằng React, backend dùng Supabase với PostgreSQL, Authentication và Row Level Security để bảo vệ dữ liệu theo vai trò.

Sau câu này, vào demo ngay. Đừng mở đầu dài.

## 2. Demo 7 phút an toàn

1. Đăng nhập admin: `admin@example.com / password123`.
2. Mở Dashboard, nói nhanh: đây là thống kê tổng quan theo vai trò admin.
3. Mở Administration, chỉ vào 4 số liệu: users, courses, enrollments, completed.
4. Mở tab Users, giải thích role: administrator, instructor, student. Nếu cần, đổi role của một user phụ và nói admin không được tự hạ role của chính mình.
5. Đăng xuất, đăng nhập instructor: `instructor@example.com / password123`.
6. Mở Course Management, chỉ vào bảng course, category, level, lessons, students và các action Preview/Edit/Delete.
7. Bấm edit một course, sửa metadata hoặc upload thử cover image nhỏ, thêm/sửa nhẹ một lesson rồi lưu. Không tạo quá nhiều vì dễ mất thời gian.
8. Preview course để chứng minh instructor xem được nội dung nhưng không tạo progress học tập.
9. Đăng xuất, đăng nhập student: `student@example.com / password123`.
10. Mở Course Catalog, search `React` hoặc `Supabase`.
11. Mở Course Detail, chỉ vào instructor, lesson count, lesson list, enroll/progress.
12. Nếu chưa enroll thì bấm Enroll. Nếu đã enroll thì bấm Continue learning.
13. Trong Lesson Player, bấm Mark complete & continue, chỉ vào progress tăng.
14. Kết thúc demo bằng database: mở Supabase và chỉ 5 bảng chính `profiles`, `courses`, `lessons`, `enrollments`, `lesson_completions`.

## 3. Câu kết thúc demo 30 giây

> Tóm lại, hệ thống đã hoàn thiện các chức năng lõi của một LMS nhỏ: đăng nhập, phân quyền theo vai trò, quản lý khóa học, quản lý bài học, đăng ký học và theo dõi tiến độ. Điểm quan trọng là quyền không chỉ được ẩn ở frontend mà còn được kiểm soát bằng Row Level Security trong PostgreSQL. Vì vậy student, instructor và admin có phạm vi thao tác khác nhau rõ ràng.

## 4. Cách giải thích kiến trúc

Nếu thầy hỏi hệ thống chạy như thế nào, trả lời theo 3 lớp:

1. Frontend: React hiển thị giao diện, route, form, dashboard, catalog, lesson player.
2. Backend service: Supabase xử lý Auth, session, REST API.
3. Database: PostgreSQL lưu dữ liệu, foreign key giữ quan hệ, RLS kiểm soát quyền, trigger tính progress.

Câu trả lời ngắn:

> React không lưu dữ liệu chính. React gọi Supabase API. Supabase xác thực user và gửi request tới PostgreSQL. PostgreSQL kiểm tra RLS policy trước khi cho đọc hoặc ghi dữ liệu.

## 5. Cách giải thích database

Nói theo thứ tự 5 bảng:

- `profiles`: thông tin người dùng sau khi đăng ký, gồm full name và role.
- `courses`: thông tin khóa học, mỗi course có instructor_id.
- `lessons`: danh sách bài học thuộc một course, có order_index để sắp thứ tự.
- `enrollments`: quan hệ student-course, lưu progress và completed.
- `lesson_completions`: từng lesson mà student đã hoàn thành.

Câu chốt:

> `lesson_completions` là dữ liệu chi tiết, còn `enrollments.progress` là dữ liệu tổng hợp để hiển thị nhanh. Trigger sẽ tính lại progress từ dữ liệu chi tiết để tránh sai lệch.

## 6. Câu hỏi khó và câu trả lời mẫu

### Vì sao dùng Supabase thay vì tự viết backend?

Vì đồ án tập trung xây dựng một web application hoàn chỉnh. Supabase cung cấp Auth, PostgreSQL, REST API và RLS. Em vẫn phải tự thiết kế database, quan hệ bảng, trigger và policy. Vì vậy đây không chỉ là frontend, mà vẫn có backend thật và database thật.

### Nếu user tự gọi API thì có vượt quyền được không?

Không. Frontend chỉ là lớp hiển thị. Quyền chính được kiểm tra ở database bằng Row Level Security. Ví dụ student chỉ update enrollment của chính mình vì policy kiểm tra `student_id = auth.uid()`.

### Vì sao cần RLS khi đã có ProtectedRoute?

ProtectedRoute chỉ chặn trên giao diện. Nếu user mở DevTools hoặc gọi API trực tiếp thì ProtectedRoute không còn ý nghĩa. RLS nằm trong PostgreSQL nên mọi request đều bị kiểm tra.

### Progress tính thế nào?

Progress bằng số lesson đã hoàn thành chia cho tổng số lesson của course, nhân 100. Khi student hoàn thành một lesson, hệ thống insert vào `lesson_completions`, sau đó trigger tính lại progress trong `enrollments`.

### Vì sao không chỉ lưu progress phần trăm?

Nếu chỉ lưu phần trăm thì không biết student đã hoàn thành bài nào. Bảng `lesson_completions` lưu chi tiết từng lesson, giúp hiển thị check mark, tính lại progress và mở rộng báo cáo sau này.

### Instructor khác có sửa course của người khác được không?

Không. Policy kiểm tra course owner bằng `instructor_id = auth.uid()`. Instructor chỉ sửa khóa học của chính họ. Admin có quyền rộng hơn để quản trị hệ thống.

### Admin có tự đổi role của chính mình không?

Không. Hệ thống có trigger `prevent_self_role_change()` để tránh admin tự hạ quyền và mất quyền quản trị trong lúc demo hoặc vận hành.

### Nếu course bị xóa thì lesson và enrollment còn không?

Không. Các bảng liên quan dùng foreign key với `ON DELETE CASCADE`, nên khi xóa course thì lessons, enrollments và lesson completions liên quan sẽ bị xóa theo để tránh dữ liệu mồ côi.

### Tại sao lessons có `order_index`?

Vì lesson trong course cần thứ tự học. `order_index` giúp hiển thị lesson theo đúng trình tự và hỗ trợ lesson player chuyển Previous/Next.

### Hạn chế lớn nhất hiện tại là gì?

Hệ thống chưa có quiz, assignment, certificate, upload file và discussion. Đây là future work. Phiên bản hiện tại tập trung vào nền tảng lõi: auth, role, course, lesson, enrollment, progress.

### Nếu thầy hỏi project có gì nổi bật?

Nói 3 điểm:

1. Có đủ 3 role và demo flow rõ ràng.
2. Có database design đúng quan hệ, có trigger tính progress.
3. Có RLS policy để bảo vệ dữ liệu ở tầng database.

## 7. Nếu demo lỗi thì xử lý thế nào

### Không đăng nhập được

- Kiểm tra email/password demo.
- Thử tài khoản khác: admin, instructor, student.
- Nếu là tài khoản mới, giải thích đã có auto-confirm email trigger và dùng demo account để tiếp tục.

### Video không load

Nói bình tĩnh:

> Video URL là dữ liệu minh họa từ YouTube. Nếu mạng hoặc embed không load, phần logic chính vẫn nằm ở lesson player, lesson list và mark complete.

Sau đó demo Mark complete.

### Supabase chậm

Nói:

> Backend dùng cloud Supabase nên tốc độ phụ thuộc mạng. Em sẽ thao tác lại hoặc chuyển sang phần database/schema để trình bày thiết kế.

### Lỡ bấm nhầm

Quay lại bằng thanh top navigation, nút Back trong trang, hoặc browser back. Không xin lỗi dài. Nói ngắn: "Em quay lại flow chính".

## 8. Thứ tự nói khi mở Supabase

1. Mở `profiles`: đây là bảng mở rộng auth user và lưu role.
2. Mở `courses`: mỗi course có `instructor_id`.
3. Mở `lessons`: mỗi lesson có `course_id` và `order_index`.
4. Mở `enrollments`: mỗi row là một student đăng ký một course, có progress.
5. Mở `lesson_completions`: mỗi row là một lesson đã hoàn thành.
6. Mở SQL/schema nếu cần: chỉ vào RLS policy và trigger.

Câu cần nhớ:

> Em tách completion chi tiết khỏi enrollment summary để dữ liệu vừa giải thích được, vừa tính lại được khi cần.

## 9. Checklist trước khi vào phòng

- Chạy app trước ít nhất 15 phút.
- Đăng nhập thử cả 3 account.
- Mở sẵn tab Supabase Table Editor hoặc SQL Editor.
- Mở sẵn report phần ERD và RLS.
- Chuẩn bị mạng dự phòng nếu có.
- Không demo tạo quá nhiều dữ liệu mới. Chỉ sửa nhẹ hoặc tạo một course nhỏ nếu thầy yêu cầu.
- Khi trình bày, nói chậm hơn bình thường khoảng 20%.
- Nếu bị hỏi dồn, trả lời một ý trước, rồi mở code/database để chứng minh.

## 10. Câu trả lời khi không chắc

Không nên đoán. Dùng câu này:

> Phần này em xin mở schema/code để trả lời chính xác hơn.

Câu này tốt hơn trả lời sai. Sau đó mở `supabase/schema.sql` hoặc component liên quan.

## 11. Bản tóm tắt 20 giây để nhớ

> MiniLMS là LMS nhỏ với 3 role. React làm frontend, Supabase làm Auth/API, PostgreSQL lưu dữ liệu. Database gồm profiles, courses, lessons, enrollments, lesson_completions. RLS bảo vệ quyền. Trigger tính progress từ lesson completions. Demo chính là admin quản trị, instructor tạo course, student học và tăng progress.
