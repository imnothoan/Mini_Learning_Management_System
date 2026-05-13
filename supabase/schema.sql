-- =================================================================
-- Mini Learning Management System - Database Schema
-- Run this in your Supabase project's SQL Editor
-- =================================================================

-- Create a table for public profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  content_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table (to track overall progress)
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN DEFAULT FALSE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create lesson_completions table (to track per-lesson completion)
CREATE TABLE lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- =================================================================
-- Row Level Security (RLS)
-- =================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Courses are viewable by everyone." ON courses
  FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can insert courses." ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Only the instructor or admin can update courses." ON courses
  FOR UPDATE USING (
    auth.uid() = instructor_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only the instructor or admin can delete courses." ON courses
  FOR DELETE USING (
    auth.uid() = instructor_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Lessons policies (publicly readable so anyone can preview course content)
CREATE POLICY "Lessons are viewable by everyone." ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Instructors can manage their course lessons." ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses WHERE id = lessons.course_id AND instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Instructors can update their course lessons." ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses WHERE id = lessons.course_id AND instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Instructors can delete their course lessons." ON lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses WHERE id = lessons.course_id AND instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enrollments policies
CREATE POLICY "Students can view their own enrollments." ON enrollments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view enrollments for their courses." ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses WHERE id = enrollments.course_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all enrollments." ON enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can enroll themselves." ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own progress." ON enrollments
  FOR UPDATE USING (auth.uid() = student_id);

-- Lesson completions policies
CREATE POLICY "Students can view their own completions." ON lesson_completions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view completions for their courses." ON lesson_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses WHERE id = lesson_completions.course_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own completions." ON lesson_completions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- =================================================================
-- Trigger: auto-create profile on user registration
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- Migration: Update existing policies (run if upgrading from v1)
-- =================================================================
-- DROP POLICY IF EXISTS "Lessons are viewable by enrolled students or higher." ON lessons;
-- Then run the CREATE POLICY statements above for lessons.

