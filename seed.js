import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '').replace(/\/$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = 'password123';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoUsers = [
  {
    email: 'admin@example.com',
    full_name: 'Demo Administrator',
    role: 'admin',
  },
  {
    email: 'instructor@example.com',
    full_name: 'Demo Instructor',
    role: 'instructor',
  },
  {
    email: 'student@example.com',
    full_name: 'Demo Student',
    role: 'student',
  },
];

const demoCourses = [
  {
    title: 'React Fundamentals',
    description: 'A beginner-friendly course covering components, props, state, hooks, and practical React interface development.',
    thumbnail_url: '',
    category: 'Frontend Engineering',
    level: 'Beginner',
    duration: '4 weeks',
    skills: ['React', 'Components', 'Hooks', 'Routing'],
    learning_outcomes: [
      'Build reusable React components for a learning product.',
      'Manage state and events in interactive pages.',
      'Fetch data from Supabase and handle loading states.',
      'Protect routes based on authenticated user roles.'
    ],
    lessons: [
      ['React and component thinking', 'Understand single-page applications, component trees, and reusable UI structure.', 'https://www.youtube.com/watch?v=SqcY0GlETPk'],
      ['Props, state, and events', 'Practice passing data, handling events, and updating the interface through state.', 'https://www.youtube.com/watch?v=O6P86uwfdR0'],
      ['useEffect and asynchronous data', 'Use hooks to fetch data and handle loading and error states.', 'https://www.youtube.com/watch?v=0ZJgIjIuY7U'],
      ['Routing and protected pages', 'Organize routes, navigation, and authenticated access in a React application.', 'https://www.youtube.com/watch?v=Ul3y1LXxzdU'],
    ],
  },
  {
    title: 'Practical Tailwind CSS',
    description: 'Build responsive interfaces quickly with utility-first CSS for dashboards and learning products.',
    thumbnail_url: '',
    category: 'UI Implementation',
    level: 'Beginner',
    duration: '3 weeks',
    skills: ['Tailwind CSS', 'Responsive layout', 'Forms', 'Cards'],
    learning_outcomes: [
      'Create consistent forms, cards, and dashboard sections.',
      'Use responsive utility classes for mobile and desktop layouts.',
      'Design simple interface states without excessive decoration.'
    ],
    lessons: [
      ['What is utility-first CSS?', 'Learn how to read Tailwind classes and design interfaces with minimal custom CSS.', 'https://www.youtube.com/watch?v=dFgzHOX84xQ'],
      ['Responsive layouts with Flex and Grid', 'Create layouts that work well on mobile, tablet, and desktop screens.', 'https://www.youtube.com/watch?v=UBOj6rqRUME'],
      ['Cards, forms, and hover states', 'Build common UI components used in learning management systems.', 'https://www.youtube.com/watch?v=ft30zcMlFao'],
    ],
  },
  {
    title: 'JavaScript for Web Development',
    description: 'Review variables, functions, arrays, objects, DOM basics, async/await, and essential frontend JavaScript.',
    thumbnail_url: '',
    category: 'Programming Basics',
    level: 'Beginner',
    duration: '4 weeks',
    skills: ['JavaScript', 'Arrays', 'Objects', 'Async/Await'],
    learning_outcomes: [
      'Write JavaScript functions for practical frontend tasks.',
      'Transform array and object data for UI rendering.',
      'Use async/await to call APIs reliably.'
    ],
    lessons: [
      ['Variables, data types, and functions', 'Understand modern JavaScript syntax and basic logic organization.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk'],
      ['Arrays, objects, and destructuring', 'Work with list and object data in practical application features.', 'https://www.youtube.com/watch?v=hdI2bqOjy3c'],
      ['Promises, async, and await', 'Understand asynchronous programming for API calls and stable UI updates.', 'https://www.youtube.com/watch?v=PoRJizFvM7s'],
    ],
  },
  {
    title: 'Supabase Database Basics',
    description: 'Design tables, relationships, Row Level Security policies, and connect Supabase to a React application.',
    thumbnail_url: '',
    category: 'Backend & Database',
    level: 'Intermediate',
    duration: '5 weeks',
    skills: ['PostgreSQL', 'Supabase Auth', 'RLS', 'REST API'],
    learning_outcomes: [
      'Design relational tables with primary keys and foreign keys.',
      'Explain Row Level Security policies for role-based access.',
      'Connect React pages to Supabase queries and mutations.',
      'Use triggers to keep learning progress consistent.'
    ],
    lessons: [
      ['Tables and foreign keys', 'Analyze entities, relationships, and relational data representation in PostgreSQL.', 'https://www.youtube.com/watch?v=HXV3zeQKqGY'],
      ['Supabase Auth and Row Level Security', 'Create role-based access control and protect user data with RLS.', 'https://www.youtube.com/watch?v=7uKQBl9uZ00'],
      ['React and Supabase Client', 'Perform CRUD operations, relational queries, and error handling from React.', 'https://www.youtube.com/watch?v=4yVSwHO5QHU'],
    ],
  },
];

async function getUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw error;
  return data.users.find(user => user.email === email);
}

async function upsertDemoUser(user) {
  let authUser = await getUserByEmail(user.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
      },
    });

    if (error) throw error;
    authUser = data.user;
    console.log(`Created user: ${user.email}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: demoPassword,
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
      },
    });

    if (error) {
      console.log(`User update notice (${user.email}): ${error.message}`);
    } else {
      console.log(`Updated user: ${user.email}`);
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.id,
      full_name: user.full_name,
      role: user.role,
      updated_at: new Date().toISOString(),
    });

  if (profileError) throw profileError;
  return authUser.id;
}

async function upsertCourse(course, instructorId) {
  const payload = {
    title: course.title,
    description: course.description,
    thumbnail_url: course.thumbnail_url,
    category: course.category,
    level: course.level,
    duration: course.duration,
    skills: course.skills,
    learning_outcomes: course.learning_outcomes,
    instructor_id: instructorId,
    updated_at: new Date().toISOString(),
  };

  const { data: existingCourse, error: findError } = await supabase
    .from('courses')
    .select('id')
    .eq('title', course.title)
    .maybeSingle();

  if (findError) throw findError;

  if (existingCourse) {
    const { error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', existingCourse.id);

    if (error) throw error;
    return existingCourse.id;
  }

  const { data, error } = await supabase
    .from('courses')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function upsertLessons(courseId, lessons) {
  const lessonIds = [];

  for (const [index, lesson] of lessons.entries()) {
    const [title, description, video_url] = lesson;
    const payload = {
      course_id: courseId,
      title,
      description,
      video_url,
      order_index: index,
      updated_at: new Date().toISOString(),
    };

    const { data: existingLesson, error: findError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('order_index', index)
      .maybeSingle();

    if (findError) throw findError;

    if (existingLesson) {
      const { data, error } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', existingLesson.id)
        .select('id')
        .single();

      if (error) throw error;
      lessonIds.push(data.id);
    } else {
      const { data, error } = await supabase
        .from('lessons')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      lessonIds.push(data.id);
    }
  }

  await supabase
    .from('lessons')
    .delete()
    .eq('course_id', courseId)
    .gte('order_index', lessons.length);

  return lessonIds;
}

async function enrollStudent(studentId, courseId, completedLessonIds, totalLessons) {
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .upsert({
      student_id: studentId,
      course_id: courseId,
      progress: 0,
      completed: false,
    }, {
      onConflict: 'student_id,course_id',
    });

  if (enrollmentError) throw enrollmentError;

  if (completedLessonIds.length > 0) {
    const { error: completionError } = await supabase
      .from('lesson_completions')
      .upsert(completedLessonIds.map(lessonId => ({
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
      })), {
        onConflict: 'student_id,lesson_id',
        ignoreDuplicates: true,
      });

    if (completionError) throw completionError;
  }

  const progress = totalLessons > 0
    ? Math.round((completedLessonIds.length / totalLessons) * 100)
    : 0;

  await supabase
    .from('enrollments')
    .update({
      progress,
      completed: progress === 100,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('course_id', courseId);
}

async function seed() {
  console.log('--- Starting MiniLMS seed ---');

  const userIds = {};
  for (const user of demoUsers) {
    userIds[user.role] = await upsertDemoUser(user);
  }

  for (const course of demoCourses) {
    const courseId = await upsertCourse(course, userIds.instructor);
    const lessonIds = await upsertLessons(courseId, course.lessons);
    course.id = courseId;
    course.lessonIds = lessonIds;
    console.log(`Seeded course: ${course.title}`);
  }

  await enrollStudent(userIds.student, demoCourses[0].id, demoCourses[0].lessonIds.slice(0, 2), demoCourses[0].lessonIds.length);
  await enrollStudent(userIds.student, demoCourses[1].id, demoCourses[1].lessonIds, demoCourses[1].lessonIds.length);

  console.log('--- Seed completed ---');
  console.log('Demo accounts:');
  console.log(`- admin@example.com / ${demoPassword}`);
  console.log(`- instructor@example.com / ${demoPassword}`);
  console.log(`- student@example.com / ${demoPassword}`);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
