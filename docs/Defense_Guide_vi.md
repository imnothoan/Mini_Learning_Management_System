# Hướng dẫn demo và bảo vệ MiniLMS

Tài liệu này dùng để luyện trình bày cho buổi bảo vệ ngày 03/06/2026. Mục tiêu là làm demo có thứ tự, giải thích được kiến trúc, database, phân quyền và tiến độ học tập. Không nên cố nói quá nhiều. Khi bị hỏi khó, trả lời theo cấu trúc: khái niệm -> cách hệ thống làm -> chỉ vào code/database thật.

## 1. Câu mở đầu 45-60 giây

Em có thể nói như sau:

> Đề tài của em là Mini Learning Management System, một hệ thống quản lý học tập quy mô nhỏ. Hệ thống có ba nhóm người dùng chính: student, instructor và administrator. Student có thể tìm khóa học, đăng ký học, xem bài học và theo dõi tiến độ. Instructor có thể tạo khóa học, quản lý bài học và xem số lượng học viên. Administrator có thể theo dõi toàn hệ thống và quản lý vai trò người dùng. Về kỹ thuật, frontend được xây dựng bằng React, backend dùng Supabase với PostgreSQL, Authentication, Storage và các quy tắc phân quyền dữ liệu theo vai trò.

Sau câu này, vào demo ngay. Đừng mở đầu dài.

## 2. Kịch bản demo chuẩn 10-12 phút

Mục tiêu của demo là chứng minh ba điều: hệ thống có đủ ba vai trò, dữ liệu được lưu thật trong Supabase, và tiến độ học tập được cập nhật theo bài học đã hoàn thành. Không nên demo quá nhiều chức năng phụ. Đi đúng flow dưới đây.

### 2.1 Chuẩn bị trước khi vào phòng

Mở sẵn các tab sau:

1. App MiniLMS ở trang đăng nhập.
2. Supabase Table Editor.
3. Supabase Storage bucket `course-covers`.
4. Báo cáo phần ERD hoặc database design.
5. Một ảnh nhỏ dưới 5 MB để demo upload cover nếu thầy yêu cầu.

Tài khoản demo:

- Admin: `admin@example.com / password123`
- Instructor: `instructor@example.com / password123`
- Student: `student@example.com / password123`

### 2.2 Mở đầu trước khi bấm

Miệng nói:

> Em xin phép demo theo ba vai trò chính của hệ thống: administrator, instructor và student. Em sẽ bắt đầu từ vai trò admin để xem tổng quan hệ thống, sau đó chuyển sang instructor để quản lý khóa học, cuối cùng là student để đăng ký học và cập nhật progress. Sau phần giao diện, em sẽ mở database để chứng minh dữ liệu được lưu thật.

### 2.3 Flow 1 - Administrator

Tay bấm:

1. Nhập `admin@example.com`.
2. Nhập `password123`.
3. Bấm `Sign in`.
4. Ở `Dashboard`, chỉ vào các số thống kê.

Miệng nói:

> Đây là dashboard theo vai trò administrator. Dashboard không chỉ hiển thị giao diện chung, mà dữ liệu được lấy từ các bảng trong Supabase như users, courses và enrollments.

Tay bấm:

5. Bấm menu `Admin`.
6. Chỉ vào hàng thống kê: users, courses, enrollments, completed.
7. Chỉ vào bảng role distribution.
8. Chỉ vào bảng users và cột role dropdown. Nếu thầy yêu cầu thao tác, đổi role của một user phụ rồi đổi lại ngay. Không đổi role của chính admin đang đăng nhập.

Miệng nói:

> Trang Administration dùng cho quản trị hệ thống. Admin có thể xem tổng số user, course, enrollment và course completed. Phần user table cho phép quản lý role. Hệ thống có kiểm tra để tránh admin tự đổi role của chính mình, vì nếu tự hạ quyền thì có thể mất quyền quản trị.

Nếu thầy hỏi “quyền admin nằm ở đâu?”, nói:

> Ở frontend, route `/admin` được bảo vệ bằng role. Ở database, các thao tác quan trọng cũng được kiểm tra bằng policy, nên không chỉ ẩn nút trên giao diện.

### 2.4 Flow 2 - Instructor

Tay bấm:

1. Bấm `Sign out`.
2. Đăng nhập `instructor@example.com / password123`.
3. Bấm menu `Manage`.
4. Chỉ vào bảng course management: course, category, level, lessons, students, updated, actions.

Miệng nói:

> Đây là màn hình quản lý khóa học cho instructor. Em chọn dạng bảng thay vì dashboard card vì instructor cần so sánh nhiều khóa học theo category, level, số lesson, số student và thời điểm cập nhật.

Tay bấm:

5. Bấm `Edit` ở course `React Fundamentals` hoặc một course có sẵn.
6. Chỉ vào phần `Course information`: title, description, category, level, duration.
7. Chỉ vào `Skills` và `Learning outcomes`.
8. Kéo xuống `Curriculum`, chỉ vào lesson title, YouTube video URL, lesson note.

Miệng nói:

> Course Editor chia dữ liệu thành hai nhóm. Nhóm thứ nhất là metadata của course như title, category, level, duration, skills và outcomes. Nhóm thứ hai là curriculum, mỗi lesson có title, video URL, note và thứ tự hiển thị. Khi lưu, course được lưu vào bảng `courses`, còn lesson được lưu vào bảng `lessons` với `course_id` và `order_index`.

Tay bấm nếu demo upload:

9. Ở phần `Cover image`, bấm `Choose image`.
10. Chọn một ảnh nhỏ dưới 5 MB.
11. Đợi preview đổi ảnh.
12. Không cần bấm `Remove cover image`.
13. Bấm `Save course` nếu em đã chỉnh ảnh hoặc chỉnh nhẹ metadata.

Miệng nói:

> Cover image được upload lên Supabase Storage bucket `course-covers`. Frontend kiểm tra file phải là image và nhỏ hơn 5 MB. Sau khi upload thành công, Supabase trả về public URL và hệ thống lưu URL đó vào cột `thumbnail_url` của bảng `courses`.

Tay bấm:

14. Quay lại `Manage`.
15. Bấm `Preview` ở course vừa mở.

Miệng nói:

> Instructor có thể preview course để kiểm tra nội dung trước khi student học. Preview mode không tạo enrollment và không làm tăng progress, vì progress chỉ áp dụng cho student.

### 2.5 Flow 3 - Student

Tay bấm:

1. Bấm `Sign out`.
2. Đăng nhập `student@example.com / password123`.
3. Bấm menu `Courses`.
4. Search `React` hoặc `Supabase`.
5. Chỉ vào filter category và level nếu có thời gian.

Miệng nói:

> Đây là course catalog cho student. Student có thể tìm khóa học theo title, description, instructor, category, level và skills. Course card hiển thị thông tin vừa đủ để student quyết định mở chi tiết.

Tay bấm:

6. Mở course `React Fundamentals`.
7. Chỉ vào metadata table, outcomes, skills, lesson outline.
8. Nếu course chưa enroll, bấm `Enroll now`.
9. Bấm `Start learning` hoặc `Continue learning`.

Miệng nói:

> Course detail là trang thông tin trước khi học. Khi student bấm enroll, hệ thống tạo một record trong bảng `enrollments` gồm `student_id`, `course_id`, `progress` và `completed`.

Tay bấm:

10. Trong Lesson Player, chỉ vào video area, course outline, progress box.
11. Bấm `Mark complete and continue`.
12. Chỉ vào progress tăng và lesson tiếp theo được chọn.

Miệng nói:

> Khi student hoàn thành lesson, hệ thống ghi một record vào bảng `lesson_completions`. Sau đó progress được tính bằng số lesson đã hoàn thành chia cho tổng số lesson của course. Vì vậy hệ thống biết chính xác student đã học bài nào, không chỉ lưu một con số phần trăm.

### 2.6 Flow 4 - Mở Supabase để chốt kỹ thuật

Tay bấm:

1. Mở Supabase Table Editor.
2. Mở `profiles`.
3. Mở `courses`.
4. Mở `lessons`.
5. Mở `enrollments`.
6. Mở `lesson_completions`.
7. Nếu vừa upload ảnh, mở Storage bucket `course-covers`.

Miệng nói:

> Em xin chốt phần kỹ thuật bằng database. `profiles` lưu thông tin user và role. `courses` lưu khóa học và instructor owner. `lessons` lưu danh sách bài học theo `course_id`. `enrollments` lưu quan hệ student-course và progress tổng hợp. `lesson_completions` lưu từng lesson đã hoàn thành. Với ảnh course, file nằm trong Storage bucket `course-covers`, còn database chỉ lưu public URL.

Kết thúc bằng câu:

> Như vậy, demo đã đi qua đủ ba vai trò: admin quản trị, instructor tạo và quản lý course, student đăng ký học và cập nhật tiến độ. Dữ liệu không phải mock data mà được lưu thật trong Supabase.

## 3. Câu kết thúc demo 30 giây

> Tóm lại, hệ thống đã hoàn thiện các chức năng lõi của một LMS nhỏ: đăng nhập, phân quyền theo vai trò, quản lý khóa học, quản lý bài học, đăng ký học và theo dõi tiến độ. Điểm quan trọng là quyền không chỉ được ẩn ở frontend mà còn có quy tắc kiểm soát ở tầng database. Vì vậy student, instructor và admin có phạm vi thao tác khác nhau rõ ràng.

## 4. Cách giải thích kiến trúc

Nếu thầy hỏi hệ thống chạy như thế nào, trả lời theo 3 lớp:

1. Frontend: React hiển thị giao diện, route, form, dashboard, catalog, lesson player.
2. Backend service: Supabase xử lý Auth, session, REST API.
3. Database: PostgreSQL lưu dữ liệu, foreign key giữ quan hệ, access policies kiểm soát quyền, trigger tính progress.

Câu trả lời ngắn:

> React không lưu dữ liệu chính. React gọi Supabase API. Supabase xác thực user và gửi request tới PostgreSQL. PostgreSQL kiểm tra quy tắc phân quyền trước khi cho đọc hoặc ghi dữ liệu.

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

Vì đồ án tập trung xây dựng một web application hoàn chỉnh. Supabase cung cấp Auth, PostgreSQL, REST API, Storage và cơ chế phân quyền dữ liệu. Em vẫn phải tự thiết kế database, quan hệ bảng, trigger và policy. Vì vậy đây không chỉ là frontend, mà vẫn có backend thật và database thật.

### Nếu user tự gọi API thì có vượt quyền được không?

Không. Frontend chỉ là lớp hiển thị. Quyền chính được kiểm tra ở database bằng access policy. Ví dụ student chỉ update enrollment của chính mình vì policy kiểm tra `student_id = auth.uid()`.

### Nếu thầy hỏi sâu: vì sao cần database access policy khi đã có ProtectedRoute?

ProtectedRoute chỉ chặn trên giao diện. Nếu user mở DevTools hoặc gọi API trực tiếp thì ProtectedRoute không còn ý nghĩa. Access policy nằm ở tầng database nên request quan trọng vẫn bị kiểm tra theo user hiện tại.

### Progress tính thế nào?

Progress bằng số lesson đã hoàn thành chia cho tổng số lesson của course, nhân 100. Khi student hoàn thành một lesson, hệ thống insert vào `lesson_completions`, sau đó trigger tính lại progress trong `enrollments`.

### Nếu thầy hỏi: trigger là gì và project dùng trigger nào?

Trả lời ngắn:

> Trigger là một cơ chế trong PostgreSQL cho phép database tự chạy một function khi có sự kiện xảy ra trên bảng, ví dụ `INSERT`, `UPDATE` hoặc `DELETE`. Trong project này, em dùng trigger cho các việc nên đặt ở database: tự cập nhật thời gian sửa đổi, tự tạo profile khi user đăng ký, hỗ trợ demo không bị chặn email confirmation, chặn admin tự đổi role của chính mình, và tính lại progress khi student hoàn thành lesson.

Các trigger chính trong project:

1. `touch_profiles_updated_at`, `touch_courses_updated_at`, `touch_lessons_updated_at`, `touch_enrollments_updated_at`
   - Chạy `BEFORE UPDATE`.
   - Gọi function `touch_updated_at()`.
   - Mục đích: tự cập nhật `updated_at = NOW()` khi record bị sửa.

2. `on_auth_user_created`
   - Chạy `AFTER INSERT` trên `auth.users`.
   - Gọi function `handle_new_user()`.
   - Mục đích: khi user đăng ký, tự tạo hoặc cập nhật record tương ứng trong bảng `profiles`.

3. `auto_confirm_auth_email`
   - Chạy `BEFORE INSERT` trên `auth.users`.
   - Gọi function `auto_confirm_auth_email()`.
   - Mục đích: tự xác nhận email cho môi trường demo học tập, tránh bị chặn bởi bước xác thực email khi bảo vệ.

4. `prevent_self_role_change`
   - Chạy `BEFORE UPDATE` trên `profiles`.
   - Gọi function `prevent_self_role_change()`.
   - Mục đích: nếu admin đang đăng nhập tự đổi role của chính mình thì database chặn lại, tránh mất quyền admin.

5. `recalculate_progress_after_completion`
   - Chạy `AFTER INSERT OR DELETE` trên `lesson_completions`.
   - Gọi function `recalculate_course_progress()`.
   - Mục đích: khi lesson completion thay đổi, database đếm lại tổng số lesson và số lesson đã hoàn thành, rồi cập nhật `enrollments.progress` và `enrollments.completed`.

Nếu thầy hỏi trigger quan trọng nhất, nói:

> Trigger quan trọng nhất là `recalculate_progress_after_completion`, vì nó chứa business logic của LMS. Khi student hoàn thành một lesson, hệ thống không chỉ đổi giao diện mà còn lưu completion record, sau đó database tự tính lại progress dựa trên dữ liệu thật.

Nếu thầy hỏi vì sao không tính toàn bộ ở frontend, nói:

> Frontend có thể tính để hiển thị nhanh, nhưng database trigger giúp dữ liệu nhất quán hơn. Nếu completion record được thêm hoặc xóa từ một luồng khác, progress vẫn được tính lại ở database. Vì vậy logic quan trọng không phụ thuộc hoàn toàn vào giao diện.

### Vì sao không chỉ lưu progress phần trăm?

Nếu chỉ lưu phần trăm thì không biết student đã hoàn thành bài nào. Bảng `lesson_completions` lưu chi tiết từng lesson, giúp hiển thị check mark, tính lại progress và mở rộng báo cáo sau này.

### Instructor khác có sửa course của người khác được không?

Không. Policy kiểm tra course owner bằng `instructor_id = auth.uid()`. Instructor chỉ sửa khóa học của chính họ. Admin có quyền rộng hơn để quản trị hệ thống.

### Admin có tự đổi role của chính mình không?

Không. Hệ thống có trigger `prevent_self_role_change()` để tránh admin tự hạ quyền và mất quyền quản trị trong lúc demo hoặc vận hành.

### Nếu course bị xóa thì lesson và enrollment còn không?

Không. Các bảng liên quan dùng foreign key với `ON DELETE CASCADE`, nên khi xóa course thì lessons, enrollments và lesson completions liên quan sẽ bị xóa theo để tránh dữ liệu mồ côi.

### Nếu thầy hỏi: em lấy video YouTube rồi nhúng như thế nào?

Trả lời:

> Trong Course Editor, instructor nhập một YouTube URL bình thường, ví dụ dạng `https://www.youtube.com/watch?v=...`. Khi vào Lesson Player, frontend dùng hàm xử lý URL để lấy video id 11 ký tự của YouTube. Sau đó hệ thống tạo iframe embed theo dạng `https://www.youtube.com/embed/{videoId}`. Vì vậy database chỉ cần lưu URL gốc trong bảng `lessons.video_url`, còn việc hiển thị video được xử lý ở frontend.

Nếu thầy hỏi tiếp “vì sao không upload video lên hệ thống?”, nói:

> Vì phạm vi đồ án là Mini LMS, em tập trung vào course, lesson, enrollment và progress. Upload video cần storage lớn, encoding, streaming và kiểm soát bản quyền. Với bản demo học tập, dùng YouTube embed giúp giảm hạ tầng nhưng vẫn chứng minh được lesson player và learning workflow.

Nếu thầy hỏi “video không chạy thì sao?”, nói:

> Video phụ thuộc mạng và chính sách embed của YouTube. Nếu video không load, dữ liệu lesson, outline, enrollment và mark complete vẫn hoạt động. Logic chính của hệ thống là quản lý course, lesson và progress; video URL là nội dung minh họa cho lesson.

### Nếu thầy hỏi: YouTube URL lưu ở bảng nào?

Trả lời:

> URL được lưu ở bảng `lessons`, cột `video_url`. Mỗi lesson thuộc một course qua `course_id`, nên khi mở lesson player, frontend load danh sách lessons theo course hiện tại và hiển thị video tương ứng với lesson đang chọn.

### Nếu thầy hỏi: tại sao không lưu file ảnh trực tiếp trong database?

Trả lời:

> Database phù hợp để lưu dữ liệu có cấu trúc như title, description, category và URL. File ảnh là binary data nên lưu trong Storage sẽ hợp lý hơn. Bảng `courses` chỉ lưu `thumbnail_url`, còn file thật nằm trong bucket `course-covers`. Cách này tách structured data và file storage rõ ràng hơn.

### Nếu thầy hỏi: làm sao biết student đã enroll mới được học?

Trả lời:

> Khi student mở lesson player, hệ thống kiểm tra bảng `enrollments` theo `student_id` và `course_id`. Nếu không có enrollment thì chuyển về course detail. Vì vậy student phải enroll trước khi vào learning flow.

### Nếu thầy hỏi: vì sao progress vừa có trigger vừa có update ở frontend?

Trả lời:

> Frontend update progress để giao diện phản hồi ngay sau khi bấm complete. Trigger ở database đóng vai trò bảo đảm tính nhất quán khi completion record thay đổi. Nếu cần kiểm tra nguồn dữ liệu đáng tin cậy, `lesson_completions` vẫn là bảng chi tiết, còn `enrollments.progress` là giá trị tổng hợp để hiển thị nhanh.

### Nếu thầy hỏi: điểm khác nhau giữa student, instructor và admin ở database?

Trả lời:

> Role được lưu ở bảng `profiles`. Student tạo enrollment và completion của chính mình. Instructor quản lý course mà họ sở hữu thông qua `instructor_id`. Admin có quyền quản trị rộng hơn như xem thống kê và cập nhật role. Như vậy mỗi role có trách nhiệm và phạm vi dữ liệu riêng.

### Nếu thầy hỏi: hệ thống có bảo mật tuyệt đối không?

Trả lời:

> Với phạm vi đồ án, hệ thống đã có các lớp bảo vệ cơ bản: authentication, protected route ở frontend, database access policy, foreign key và constraint. Tuy nhiên em không khẳng định đây là hệ thống production hoàn chỉnh. Nếu phát triển tiếp, em sẽ bổ sung audit log, test tự động, rate limiting và kiểm tra bảo mật sâu hơn.

### Nếu thầy hỏi: phần nào em thấy quan trọng nhất?

Trả lời:

> Em thấy quan trọng nhất là luồng progress tracking. Vì nó nối nhiều phần của hệ thống: student enroll course, lesson player load lessons, student complete lesson, database lưu completion, rồi progress được cập nhật trong enrollment. Luồng này chứng minh hệ thống không chỉ CRUD course mà còn có business logic của LMS.

### Tại sao lessons có `order_index`?

Vì lesson trong course cần thứ tự học. `order_index` giúp hiển thị lesson theo đúng trình tự và hỗ trợ lesson player chuyển Previous/Next.

### Hạn chế lớn nhất hiện tại là gì?

Hệ thống chưa có quiz, assignment, certificate, upload file và discussion. Đây là future work. Phiên bản hiện tại tập trung vào nền tảng lõi: auth, role, course, lesson, enrollment, progress.

### Nếu thầy hỏi project có gì nổi bật?

Nói 3 điểm:

1. Có đủ 3 role và demo flow rõ ràng.
2. Có database design đúng quan hệ, có trigger tính progress.
3. Có access policy để bảo vệ dữ liệu ở tầng database.

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
6. Mở SQL/schema nếu cần: chỉ vào access policy và trigger.

Câu cần nhớ:

> Em tách completion chi tiết khỏi enrollment summary để dữ liệu vừa giải thích được, vừa tính lại được khi cần.

## 9. Checklist trước khi vào phòng

- Chạy app trước ít nhất 15 phút.
- Đăng nhập thử cả 3 account.
- Mở sẵn tab Supabase Table Editor hoặc SQL Editor.
- Mở sẵn report phần ERD và progress trigger.
- Chuẩn bị mạng dự phòng nếu có.
- Không demo tạo quá nhiều dữ liệu mới. Chỉ sửa nhẹ hoặc tạo một course nhỏ nếu thầy yêu cầu.
- Khi trình bày, nói chậm hơn bình thường khoảng 20%.
- Nếu bị hỏi dồn, trả lời một ý trước, rồi mở code/database để chứng minh.

## 10. Câu trả lời khi không chắc

Không nên đoán. Dùng câu này:

> Phần này em xin mở schema/code để trả lời chính xác hơn.

Câu này tốt hơn trả lời sai. Sau đó mở `supabase/schema.sql` hoặc component liên quan.

## 11. Bản tóm tắt 20 giây để nhớ

> MiniLMS là LMS nhỏ với 3 role. React làm frontend, Supabase làm Auth/API/Storage, PostgreSQL lưu dữ liệu. Database gồm profiles, courses, lessons, enrollments, lesson_completions. Access policy bảo vệ quyền. Trigger tính progress từ lesson completions. Demo chính là admin quản trị, instructor tạo course, student học và tăng progress.

## 12. Bản nói cực ngắn khi bị run

Nếu bị run, chỉ cần bám theo bốn câu:

1. `Admin`: "Em dùng admin để xem tổng quan hệ thống và quản lý role."
2. `Instructor`: "Em dùng instructor để quản lý course, lesson, outcome, skill và cover image."
3. `Student`: "Em dùng student để browse course, enroll, học lesson và mark complete."
4. `Database`: "Em mở Supabase để chứng minh dữ liệu được lưu trong profiles, courses, lessons, enrollments và lesson_completions."

Không cố nói hết mọi thứ. Đi đúng bốn câu này là demo không bị vỡ.
