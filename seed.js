import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('--- Starting Seed ---');

  let instructorId;
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'instructor@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'Giảng viên Mẫu', role: 'instructor' }
  });

  if (userError) {
    console.log('User creation notice:', userError.message);
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData.users.find(u => u.email === 'instructor@example.com');
    if (existingUser) {
        instructorId = existingUser.id;
        console.log('Using existing instructor:', instructorId);
    } else {
        console.error('Could not find or create instructor user.');
        return;
    }
  } else {
    instructorId = userData.user.id;
    console.log('Created instructor:', instructorId);
  }

  // Upsert profile
  const { error: profError } = await supabase
    .from('profiles')
    .upsert({ id: instructorId, full_name: 'Giảng viên Mẫu', role: 'instructor' });
  
  if (profError) console.error('Profile upsert error:', profError.message);

  // Courses
  const courses = [
    { title: 'Lập trình React cơ bản', description: 'Học React từ A-Z', instructor_id: instructorId, thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800' },
    { title: 'Làm chủ Tailwind CSS', description: 'Giao diện hiện đại', instructor_id: instructorId, thumbnail_url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800' }
  ];

  for (const c of courses) {
    const { data: existing } = await supabase.from('courses').select('id').eq('title', c.title).maybeSingle();
    if (!existing) {
        const { data: newC, error } = await supabase.from('courses').insert(c).select().single();
        if (error) console.error('Course insert error:', error.message);
        else console.log('Inserted course:', newC.title);
    } else {
        console.log('Course exists:', c.title);
    }
  }

  // Lessons
  const { data: courseList } = await supabase.from('courses').select('id, title');
  for (const course of courseList) {
    const lessons = [
        { course_id: course.id, title: `Bài 1 của ${course.title}`, description: 'Mô tả bài 1', video_url: 'https://youtube.com/watch?v=Ke90Tje7VS0', order_index: 1 },
        { course_id: course.id, title: `Bài 2 của ${course.title}`, description: 'Mô tả bài 2', video_url: 'https://youtube.com/watch?v=SqcY0GlETPk', order_index: 2 }
    ];
    for (const l of lessons) {
        const { data: existing } = await supabase.from('lessons').select('id').eq('course_id', l.course_id).eq('title', l.title).maybeSingle();
        if (!existing) {
            const { error } = await supabase.from('lessons').insert(l);
            if (error) console.error('Lesson insert error:', error.message);
            else console.log('Inserted lesson:', l.title);
        }
    }
  }

  console.log('--- Seed Done ---');
}

seed();
