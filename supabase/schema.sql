-- =================================================================
-- Mini Learning Management System - Supabase Database Schema
-- Run this file in Supabase SQL Editor before running seed.js.
-- =================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================================================================
-- Tables
-- =================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'Web Development',
  level TEXT NOT NULL DEFAULT 'Beginner',
  duration TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  learning_outcomes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Web Development',
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE public.courses
SET
  category = COALESCE(NULLIF(category, ''), 'Web Development'),
  level = COALESCE(NULLIF(level, ''), 'Beginner'),
  duration = COALESCE(duration, ''),
  skills = COALESCE(skills, '{}'),
  learning_outcomes = COALESCE(learning_outcomes, '{}');

ALTER TABLE public.courses
  ALTER COLUMN category SET DEFAULT 'Web Development',
  ALTER COLUMN level SET DEFAULT 'Beginner',
  ALTER COLUMN duration SET DEFAULT '',
  ALTER COLUMN skills SET DEFAULT '{}',
  ALTER COLUMN learning_outcomes SET DEFAULT '{}',
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN level SET NOT NULL,
  ALTER COLUMN duration SET NOT NULL,
  ALTER COLUMN skills SET NOT NULL,
  ALTER COLUMN learning_outcomes SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  content_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS content_url TEXT,
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_student_course
  ON public.enrollments(student_id, course_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_course_order
  ON public.lessons(course_id, order_index);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_completions_student_lesson
  ON public.lesson_completions(student_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_course_id ON public.lesson_completions(course_id);

-- =================================================================
-- Helper functions and triggers
-- =================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_profiles_updated_at ON public.profiles;
CREATE TRIGGER touch_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_courses_updated_at ON public.courses;
CREATE TRIGGER touch_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_lessons_updated_at ON public.lessons;
CREATE TRIGGER touch_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER touch_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() = NEW.id AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Users cannot change their own role';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_self_role_change ON public.profiles;
CREATE TRIGGER prevent_self_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_change();

CREATE OR REPLACE FUNCTION public.auto_confirm_auth_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;

  NEW.confirmation_token := '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS auto_confirm_auth_email ON auth.users;
CREATE TRIGGER auto_confirm_auth_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_auth_email();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN requested_role IN ('student', 'instructor') THEN requested_role
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.recalculate_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_student_id UUID;
  target_course_id UUID;
  total_lessons INTEGER;
  completed_lessons INTEGER;
  calculated_progress INTEGER;
BEGIN
  target_student_id := COALESCE(NEW.student_id, OLD.student_id);
  target_course_id := COALESCE(NEW.course_id, OLD.course_id);

  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons
  WHERE course_id = target_course_id;

  SELECT COUNT(*) INTO completed_lessons
  FROM public.lesson_completions
  WHERE student_id = target_student_id
    AND course_id = target_course_id;

  calculated_progress := CASE
    WHEN total_lessons = 0 THEN 0
    ELSE ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100)::INTEGER
  END;

  UPDATE public.enrollments
  SET
    progress = calculated_progress,
    completed = calculated_progress = 100
  WHERE student_id = target_student_id
    AND course_id = target_course_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS recalculate_progress_after_completion ON public.lesson_completions;
CREATE TRIGGER recalculate_progress_after_completion
  AFTER INSERT OR DELETE ON public.lesson_completions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_course_progress();

-- =================================================================
-- Row Level Security
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles." ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users." ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update profiles." ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Courses are viewable by everyone." ON public.courses;
DROP POLICY IF EXISTS "Instructors and admins can insert courses." ON public.courses;
DROP POLICY IF EXISTS "Only the instructor or admin can update courses." ON public.courses;
DROP POLICY IF EXISTS "Only the instructor or admin can delete courses." ON public.courses;

CREATE POLICY "Courses are viewable by everyone." ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can insert courses." ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'instructor' AND instructor_id = auth.uid())
  );

CREATE POLICY "Only the instructor or admin can update courses." ON public.courses
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR instructor_id = auth.uid()
  )
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR instructor_id = auth.uid()
  );

CREATE POLICY "Only the instructor or admin can delete courses." ON public.courses
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR instructor_id = auth.uid()
  );

DROP POLICY IF EXISTS "Lessons are viewable by everyone." ON public.lessons;
DROP POLICY IF EXISTS "Instructors can manage their course lessons." ON public.lessons;
DROP POLICY IF EXISTS "Instructors can update their course lessons." ON public.lessons;
DROP POLICY IF EXISTS "Instructors can delete their course lessons." ON public.lessons;

CREATE POLICY "Lessons are viewable by everyone." ON public.lessons
  FOR SELECT USING (true);

CREATE POLICY "Instructors can manage their course lessons." ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update their course lessons." ON public.lessons
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
        AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can delete their course lessons." ON public.lessons
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view their own enrollments." ON public.enrollments;
DROP POLICY IF EXISTS "Instructors can view enrollments for their courses." ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments." ON public.enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves." ON public.enrollments;
DROP POLICY IF EXISTS "Students can update their own progress." ON public.enrollments;

CREATE POLICY "Students can view their own enrollments." ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = enrollments.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll themselves." ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_user_role() = 'student'
  );

CREATE POLICY "Students can update their own progress." ON public.enrollments
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their own completions." ON public.lesson_completions;
DROP POLICY IF EXISTS "Instructors can view completions for their courses." ON public.lesson_completions;
DROP POLICY IF EXISTS "Students can insert their own completions." ON public.lesson_completions;

CREATE POLICY "Students can view their own completions." ON public.lesson_completions
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_completions.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own completions." ON public.lesson_completions
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_user_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.student_id = auth.uid()
        AND enrollments.course_id = lesson_completions.course_id
    )
  );

-- =================================================================
-- Storage
-- =================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-covers',
  'course-covers',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Course covers are publicly readable." ON storage.objects;
DROP POLICY IF EXISTS "Instructors and admins can upload course covers." ON storage.objects;
DROP POLICY IF EXISTS "Instructors and admins can update course covers." ON storage.objects;
DROP POLICY IF EXISTS "Instructors and admins can delete course covers." ON storage.objects;

CREATE POLICY "Course covers are publicly readable." ON storage.objects
  FOR SELECT USING (bucket_id = 'course-covers');

CREATE POLICY "Instructors and admins can upload course covers." ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-covers'
    AND public.current_user_role() IN ('instructor', 'admin')
  );

CREATE POLICY "Instructors and admins can update course covers." ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'course-covers'
    AND public.current_user_role() IN ('instructor', 'admin')
  )
  WITH CHECK (
    bucket_id = 'course-covers'
    AND public.current_user_role() IN ('instructor', 'admin')
  );

CREATE POLICY "Instructors and admins can delete course covers." ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'course-covers'
    AND public.current_user_role() IN ('instructor', 'admin')
  );
