import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ProgressBar = ({ value }) => (
  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
    <div className="h-full bg-blue-600" style={{ width: `${value}%` }} />
  </div>
);

const getVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const LessonView = () => {
  const { courseId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [progress, setProgress] = useState(0);

  const fetchLessonData = useCallback(async () => {
    if (!user?.id || !profile?.role) return;

    try {
      setLoading(true);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      const lessonList = lessonsData || [];
      setCourse(courseData);
      setLessons(lessonList);

      const canPreviewAsStaff =
        profile.role === 'admin' ||
        (profile.role === 'instructor' && courseData.instructor_id === user.id);

      if (profile.role !== 'student') {
        if (!canPreviewAsStaff) {
          navigate(`/courses/${courseId}`);
          return;
        }

        setProgress(0);
        setCompletedLessonIds(new Set());
        setCurrentLesson(lessonList[0] || null);
        return;
      }

      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (enrollError || !enrollment) {
        navigate(`/courses/${courseId}`);
        return;
      }

      const { data: completions, error: completionsError } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('course_id', courseId)
        .eq('student_id', user.id);

      if (completionsError) throw completionsError;

      const completedIds = new Set((completions || []).map((item) => item.lesson_id));
      const calculatedProgress = lessonList.length > 0
        ? Math.round((completedIds.size / lessonList.length) * 100)
        : 0;

      setProgress(Math.max(enrollment.progress || 0, calculatedProgress));
      setCompletedLessonIds(completedIds);

      const firstUncompleted = lessonList.find((lesson) => !completedIds.has(lesson.id));
      setCurrentLesson(firstUncompleted || lessonList[0] || null);
    } catch (err) {
      console.error('Error fetching lesson data:', err.message);
      navigate(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate, profile?.role, user?.id]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  const handleMarkComplete = useCallback(async () => {
    if (!currentLesson || marking || profile?.role !== 'student') return;

    try {
      setMarking(true);
      const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLesson.id);
      const nextCompletedIds = new Set(completedLessonIds);
      nextCompletedIds.add(currentLesson.id);

      const updatedProgress = lessons.length > 0
        ? Math.round((nextCompletedIds.size / lessons.length) * 100)
        : 0;
      const isNowCompleted = updatedProgress === 100;

      const { error: completionError } = await supabase
        .from('lesson_completions')
        .upsert({
          course_id: courseId,
          lesson_id: currentLesson.id,
          student_id: user.id,
        }, {
          onConflict: 'student_id,lesson_id',
          ignoreDuplicates: true,
        });

      if (completionError) throw completionError;

      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .update({
          progress: updatedProgress,
          completed: isNowCompleted,
        })
        .eq('course_id', courseId)
        .eq('student_id', user.id);

      if (enrollmentError) throw enrollmentError;

      setProgress(updatedProgress);
      setCompletedLessonIds(nextCompletedIds);

      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } catch (err) {
      console.error('Error updating progress:', err.message);
    } finally {
      setMarking(false);
    }
  }, [completedLessonIds, courseId, currentLesson, lessons, marking, profile?.role, user?.id]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading lesson player...</div>;
  }

  const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLesson?.id);
  const canTrackProgress = profile?.role === 'student';
  const isCurrentCompleted = canTrackProgress && completedLessonIds.has(currentLesson?.id);
  const isAllCompleted = canTrackProgress && progress === 100;
  const videoId = getVideoId(currentLesson?.video_url);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Link to={`/courses/${courseId}`} className="text-sm font-semibold text-slate-600 hover:text-blue-700">
              Back to course details
            </Link>
            <p className="mt-3 text-sm text-slate-500">{course?.title}</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-slate-950">
              {currentLesson?.title || 'Lesson'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canTrackProgress ? (
              <div className="w-52 rounded-md border border-slate-200 bg-white p-3">
                <div className="mb-2 flex justify-between text-xs text-slate-500">
                  <span>{isAllCompleted ? 'Completed' : 'Progress'}</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>
            ) : (
              <span className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
                Preview mode
              </span>
            )}
            <button
              type="button"
              onClick={() => setOutlineOpen((current) => !current)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {outlineOpen ? 'Hide outline' : 'Show outline'}
            </button>
          </div>
        </div>
      </header>

      {isAllCompleted && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Course completed. All lessons in this course have been marked complete.
        </div>
      )}

      <div className={`grid gap-6 ${outlineOpen ? 'lg:grid-cols-[1fr_340px]' : 'lg:grid-cols-1'}`}>
        <main className="space-y-6">
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="aspect-video bg-slate-950">
              {videoId ? (
                <iframe
                  key={currentLesson?.id}
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`}
                  title={currentLesson?.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-300">
                  No playable video URL is available for this lesson.
                </div>
              )}
            </div>
            <div className="space-y-5 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Lesson {currentIndex + 1 > 0 ? currentIndex + 1 : 0} of {lessons.length}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">{currentLesson?.title}</h2>
                  {isCurrentCompleted && (
                    <p className="mt-2 text-sm font-semibold text-emerald-700">Completed</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentLesson(lessons[currentIndex - 1])}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Previous
                    </button>
                  )}

                  {canTrackProgress && !isCurrentCompleted && (
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {marking ? 'Saving...' : 'Mark complete and continue'}
                    </button>
                  )}

                  {(!canTrackProgress || isCurrentCompleted) && currentIndex < lessons.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentLesson(lessons[currentIndex + 1])}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Next lesson
                    </button>
                  )}

                  {currentIndex === lessons.length - 1 && (
                    <Link
                      to={`/courses/${courseId}`}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      View course details
                    </Link>
                  )}
                </div>
              </div>

              {currentLesson?.description && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-950">Lesson notes</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{currentLesson.description}</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {outlineOpen && (
          <aside className="rounded-md border border-slate-200 bg-white lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-950">Course outline</h2>
              <p className="mt-1 text-sm text-slate-500">
                {lessons.length} lessons - {canTrackProgress ? `${progress}% complete` : 'preview mode'}
              </p>
            </div>
            <div className="divide-y divide-slate-100 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto">
              {lessons.map((lesson, index) => {
                const isActive = currentLesson?.id === lesson.id;
                const isCompleted = canTrackProgress && completedLessonIds.has(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full px-5 py-4 text-left hover:bg-slate-50 ${
                      isActive ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-semibold ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : isActive
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${isActive ? 'text-blue-800' : 'text-slate-900'}`}>
                          {lesson.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {isCompleted ? 'Completed' : 'Video lesson'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default LessonView;
