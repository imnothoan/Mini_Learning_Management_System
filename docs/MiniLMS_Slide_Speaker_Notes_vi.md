# MiniLMS Slide Speaker Notes

File này dùng để luyện nói theo slide `MiniLMS_Defense_Slides.pptx`. Slide trong PowerPoint là tiếng Anh. Ghi chú dưới đây là tiếng Việt để dễ luyện trước khi vào phòng.

## Slide 1 - Mini Learning Management System

Nói:

> Em xin trình bày đề tài Mini Learning Management System, gọi tắt là MiniLMS. Đây là một hệ thống quản lý học tập quy mô nhỏ, tập trung vào ba luồng chính: instructor quản lý khóa học, student đăng ký và học bài, admin quản lý hệ thống. Project sử dụng React ở frontend và Supabase ở backend.

## Slide 2 - Presentation Agenda

Nói:

> Phần trình bày của em gồm sáu phần: vấn đề và mục tiêu, phân tích vai trò, kiến trúc và database, kết quả triển khai, demo trực tiếp, cuối cùng là kết luận và hướng phát triển.

## Slide 3 - Problem and Objectives

Nói:

> Vấn đề của một LMS là không chỉ hiển thị danh sách khóa học. Hệ thống cần có user, phân quyền, quản lý nội dung, đăng ký học và theo dõi tiến độ. Vì vậy mục tiêu của project là xây dựng một web app nhỏ nhưng đầy đủ luồng frontend, backend, database và storage.

## Slide 4 - Scope and User Roles

Nói:

> Hệ thống có ba vai trò chính. Student dùng để học, enroll và mark complete. Instructor dùng để tạo course, lesson, outcome và upload cover image. Administrator dùng để xem thống kê và quản lý role. Một số chức năng lớn như quiz, assignment, certificate được để ở future work.

## Slide 5 - Use Case Overview

Nói:

> Use case diagram cho thấy ranh giới chức năng của hệ thống. Guest chỉ sign in hoặc sign up. Student tập trung vào learning workflow. Instructor tập trung vào course authoring. Administrator quản lý role và dữ liệu tổng quan. Cách tách này giúp project rõ scope và dễ bảo vệ.

## Slide 6 - System Architecture

Nói:

> Kiến trúc gồm ba lớp. React là frontend, xử lý giao diện, route và form. Supabase cung cấp Authentication, REST API và Storage. PostgreSQL lưu dữ liệu chính như users, courses, lessons, enrollments và lesson completions. Frontend không lưu dữ liệu chính mà gọi Supabase API.

## Slide 7 - Database Design

Nói:

> Database có năm bảng chính. `profiles` lưu user và role. `courses` lưu khóa học và instructor owner. `lessons` lưu bài học theo course. `enrollments` lưu quan hệ student-course và progress. `lesson_completions` lưu từng lesson đã hoàn thành. Em tách completion chi tiết khỏi progress tổng hợp để hệ thống biết chính xác student đã học bài nào.

## Slide 8 - Instructor Workflow

Nói:

> Với instructor, luồng chính là mở Manage, tạo hoặc sửa course, nhập metadata, outcomes, skills, thêm lessons, nhập YouTube video URL và upload cover image. Ảnh được upload lên Supabase Storage bucket `course-covers`, sau đó public URL được lưu vào `courses.thumbnail_url`.

## Slide 9 - Student Learning and Progress Tracking

Nói:

> Với student, luồng chính là mở catalog, tìm course, enroll, vào lesson player và mark complete. Khi student hoàn thành một lesson, hệ thống thêm record vào `lesson_completions`. Progress được tính bằng số lesson hoàn thành chia cho tổng số lesson, nhân 100.

## Slide 10 - Administration and Role-Based Access

Nói:

> Với admin, hệ thống hiển thị thống kê tổng quan, phân bố role và bảng user. Admin có thể đổi role của user khác. Hệ thống có protected route ở frontend và access policy ở database, nên quyền không chỉ được ẩn ở giao diện mà còn được kiểm tra ở tầng dữ liệu.

## Slide 11 - Implementation Results

Nói:

> Các module chính đã hoàn thành: authentication, catalog, course management, learning workflow, administration và storage upload. Project cũng có seed data để demo ổn định với ba account admin, instructor và student. Dữ liệu được lưu thật trong Supabase, không phải mock data.

## Slide 12 - Recommended Live Demo Flow

Nói:

> Khi demo, em sẽ đi theo bốn bước. Đầu tiên admin để xem thống kê và role. Thứ hai instructor để quản lý course và upload ảnh. Thứ ba student để enroll và mark complete. Cuối cùng em mở Supabase để chứng minh dữ liệu được lưu trong các bảng chính.

## Slide 13 - Conclusion and Future Work

Nói:

> Kết luận, MiniLMS đã hoàn thành các chức năng lõi của một LMS nhỏ: authentication, role-based workflow, course management, lesson player, enrollment, progress tracking và admin management. Hướng phát triển tiếp theo là quiz, assignment, grading, certificate, discussion, analytics và automated tests.

Nếu thầy không hỏi thêm, dừng ở slide này và chuyển sang demo hoặc Q&A.

## Slide 14 - Appendix: Database Triggers

Chỉ mở khi thầy hỏi trigger.

Nói:

> Project dùng trigger cho những logic nên đặt ở database. `touch_updated_at` tự cập nhật thời gian sửa. `on_auth_user_created` tự tạo profile khi user mới đăng ký. `auto_confirm_auth_email` giúp demo không bị chặn email confirmation. `prevent_self_role_change` chặn admin tự đổi role của chính mình. Quan trọng nhất là `recalculate_progress_after_completion`, dùng để tính lại progress khi lesson completion thay đổi.

## Slide 15 - Appendix: YouTube Video Embedding

Chỉ mở khi thầy hỏi nhúng video.

Nói:

> Instructor nhập YouTube URL ở Course Editor. URL được lưu trong `lessons.video_url`. Khi mở Lesson Player, frontend tách video id rồi tạo iframe embed dạng `https://www.youtube.com/embed/{videoId}`. Project không upload video vì video storage, encoding và streaming vượt phạm vi đồ án. Logic chính là lesson workflow và progress tracking.

## Slide 16 - Appendix: Course Cover Upload

Chỉ mở khi thầy hỏi upload ảnh.

Nói:

> Instructor chọn hoặc kéo thả ảnh. Frontend kiểm tra file phải là image và nhỏ hơn 5 MB. File được upload vào bucket `course-covers`. Supabase trả về public URL và hệ thống lưu URL đó vào `courses.thumbnail_url`. Database lưu dữ liệu có cấu trúc, Storage lưu file ảnh thật.

## Câu dự phòng nếu bị hỏi ngoài slide

Nói:

> Phần này em xin mở code hoặc schema để trả lời chính xác hơn.

Sau đó mở `supabase/schema.sql`, component liên quan, hoặc Supabase Table Editor.
