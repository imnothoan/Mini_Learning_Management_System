import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CourseCover from '../components/CourseCover';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const COURSE_CATEGORIES = [
  'Web Development',
  'Frontend Engineering',
  'Backend & Database',
  'Programming Basics',
  'UI Implementation',
];

const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const DEFAULT_COURSE = {
  title: '',
  description: '',
  thumbnail_url: '',
  category: 'Web Development',
  level: 'Beginner',
  duration: '',
  skills: [],
  learning_outcomes: [],
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const listToText = (value, separator = ', ') => normalizeList(value).join(separator);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const isEditing = Boolean(id);

  const [course, setCourse] = useState(DEFAULT_COURSE);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      setCourse({
        ...DEFAULT_COURSE,
        ...courseData,
        skills: normalizeList(courseData.skills),
        learning_outcomes: normalizeList(courseData.learning_outcomes),
      });

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (err) {
      console.error('Error fetching course data:', err.message);
      navigate('/manage-courses');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchCourseData();
    }
  }, [fetchCourseData, isEditing]);

  const handleAddLesson = () => {
    setLessons((current) => [
      ...current,
      {
        id: `temp-${Date.now()}`,
        title: '',
        description: '',
        video_url: '',
        order_index: current.length,
      },
    ]);
  };

  const handleUpdateLesson = (lessonId, field, value) => {
    setLessons((current) => current.map((lesson) => (
      lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
    )));
  };

  const handleRemoveLesson = (lessonId) => {
    setLessons((current) => current.filter((lesson) => lesson.id !== lessonId));
  };

  const uploadCoverFile = async (file) => {
    if (!file) return;

    setImageError('');

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be under 5 MB.');
      return;
    }

    if (!user?.id) {
      setImageError('You need to sign in before uploading an image.');
      return;
    }

    try {
      setUploadingImage(true);
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const baseName = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'course-cover';
      const filePath = `${user.id}/${Date.now()}-${baseName}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('course-covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('course-covers')
        .getPublicUrl(filePath);

      setCourse((current) => ({
        ...current,
        thumbnail_url: data.publicUrl,
      }));
    } catch (err) {
      setImageError(err.message || 'Unable to upload the image.');
    } finally {
      setUploadingImage(false);
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    uploadCoverFile(event.dataTransfer.files?.[0]);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');

    const cleanedLessons = lessons
      .map((lesson) => ({
        ...lesson,
        title: lesson.title.trim(),
        description: lesson.description.trim(),
        video_url: lesson.video_url.trim(),
      }))
      .filter((lesson) => lesson.title);

    if (!course.title.trim()) {
      setFormError('Course title is required.');
      return;
    }

    if (!course.description.trim()) {
      setFormError('Course description is required.');
      return;
    }

    try {
      setSaving(true);
      let courseId = id;
      const coursePayload = {
        title: course.title.trim(),
        description: course.description.trim(),
        thumbnail_url: (course.thumbnail_url || '').trim() || null,
        category: course.category || 'Web Development',
        level: course.level || 'Beginner',
        duration: (course.duration || '').trim(),
        skills: normalizeList(course.skills),
        learning_outcomes: normalizeList(course.learning_outcomes),
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert({
            ...coursePayload,
            instructor_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        courseId = data.id;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('course_id', courseId);

        if (error) throw error;
      }

      const lessonsToInsert = cleanedLessons.map((lesson, index) => ({
        course_id: courseId,
        title: lesson.title,
        description: lesson.description,
        video_url: lesson.video_url,
        order_index: index,
      }));

      if (lessonsToInsert.length > 0) {
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);

        if (lessonError) throw lessonError;
      }

      navigate('/manage-courses');
    } catch (err) {
      console.error('Error saving course:', err.message);
      setFormError(err.message || 'Unable to save the course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading course editor...</div>;
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-6xl space-y-7 pb-16">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/manage-courses')}
            className="mb-3 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            Back to course management
          </button>
          <p className="text-sm text-slate-500">Course Editor</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {isEditing ? 'Edit course' : 'Create course'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Maintain the course metadata, learning outcomes, cover image, and lesson outline.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || uploadingImage}
          className="inline-flex w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {saving ? 'Saving...' : 'Save course'}
        </button>
      </div>

      {formError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Course information</h2>
              <p className="mt-1 text-sm text-slate-500">
                Use clear so learners can understand the course before enrolling.
              </p>
            </div>
            <div className="space-y-5 p-5">
              <Field label="Course title">
                <input
                  type="text"
                  required
                  value={course.title}
                  onChange={(event) => setCourse({ ...course, title: event.target.value })}
                  placeholder="Example: React Fundamentals"
                  className={inputClass}
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={5}
                  required
                  value={course.description}
                  onChange={(event) => setCourse({ ...course, description: event.target.value })}
                  placeholder="Describe the target learners, course objectives, and main topics."
                  className={`${inputClass} resize-none leading-6`}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Category">
                  <select
                    value={course.category}
                    onChange={(event) => setCourse({ ...course, category: event.target.value })}
                    className={inputClass}
                  >
                    {COURSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Level">
                  <select
                    value={course.level}
                    onChange={(event) => setCourse({ ...course, level: event.target.value })}
                    className={inputClass}
                  >
                    {COURSE_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Duration">
                  <input
                    type="text"
                    value={course.duration}
                    onChange={(event) => setCourse({ ...course, duration: event.target.value })}
                    placeholder="4 weeks"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Skills, separated by commas">
                <input
                  type="text"
                  value={listToText(course.skills)}
                  onChange={(event) => setCourse({ ...course, skills: normalizeList(event.target.value) })}
                  placeholder="React, Hooks, Routing, API integration"
                  className={inputClass}
                />
              </Field>

              <Field label="Learning outcomes, one per line">
                <textarea
                  rows={5}
                  value={listToText(course.learning_outcomes, '\n')}
                  onChange={(event) => setCourse({ ...course, learning_outcomes: normalizeList(event.target.value) })}
                  placeholder={'Build reusable components\nFetch data from Supabase\nProtect pages by role'}
                  className={`${inputClass} resize-none leading-6`}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950">Curriculum</h2>
                <p className="mt-1 text-sm text-slate-500">Each lesson should have a clear title, video URL, and short note.</p>
              </div>
              <button
                type="button"
                onClick={handleAddLesson}
                className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Add lesson
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {lessons.length > 0 ? lessons.map((lesson, index) => (
                <div key={lesson.id} className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">Lesson {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveLesson(lesson.id)}
                      className="text-sm font-semibold text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                    <Field label="Lesson title">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(event) => handleUpdateLesson(lesson.id, 'title', event.target.value)}
                        placeholder="Lesson title"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="YouTube video URL">
                      <input
                        type="url"
                        value={lesson.video_url}
                        onChange={(event) => handleUpdateLesson(lesson.id, 'video_url', event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={inputClass}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Lesson note">
                        <input
                          type="text"
                          value={lesson.description}
                          onChange={(event) => handleUpdateLesson(lesson.id, 'description', event.target.value)}
                          placeholder="Short description for the lesson outline"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  No lessons yet. Add at least one lesson for the demo flow.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Cover image</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload a relevant image, or leave the neutral placeholder.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="aspect-video overflow-hidden rounded border border-slate-200">
                <CourseCover src={course.thumbnail_url} title={course.title || 'Course cover preview'} />
              </div>

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                className={`rounded-md border border-dashed px-4 py-5 text-center text-sm ${
                  dragActive ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-300 bg-slate-50 text-slate-600'
                }`}
              >
                <p className="font-medium">Drag and drop an image here</p>
                <p className="mt-1 text-xs text-slate-500">Accepted image files, maximum 5 MB.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    uploadCoverFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  {uploadingImage ? 'Uploading...' : 'Choose image'}
                </button>
              </div>

              {imageError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {imageError}
                </div>
              )}

              <Field label="Public image URL">
                <input
                  type="url"
                  value={course.thumbnail_url || ''}
                  onChange={(event) => setCourse({ ...course, thumbnail_url: event.target.value })}
                  placeholder="Optional public image URL"
                  className={inputClass}
                />
              </Field>

              {course.thumbnail_url && (
                <button
                  type="button"
                  onClick={() => setCourse({ ...course, thumbnail_url: '' })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Remove cover image
                </button>
              )}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Quality checklist</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Title, level, category, and duration are clear.</li>
              <li>Outcomes explain what the learner can do after the course.</li>
              <li>Lessons are ordered from basic to advanced content.</li>
              <li>The image is relevant, simple, and not dependent on stock fallback.</li>
            </ol>
          </section>
        </aside>
      </div>
    </form>
  );
};

export default CourseEditor;
