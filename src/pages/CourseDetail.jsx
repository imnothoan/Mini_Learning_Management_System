import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CourseCover from '../components/CourseCover';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US');
};

const ProgressBar = ({ value }) => (
  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
    <div className="h-full bg-blue-600" style={{ width: `${value}%` }} />
  </div>
);

const CourseDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*, instructor:profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      setCourse(courseData);
      setLessons(lessonsData || []);
    } catch (err) {
      console.error('Error fetching course details:', err.message);
      setError('Unable to load this course.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkEnrollment = useCallback(async () => {
    if (!user?.id) {
      setEnrolled(false);
      setEnrollment(null);
      return;
    }

    try {
      const { data, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('student_id', user.id)
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;

      setEnrolled(Boolean(data));
      setEnrollment(data || null);
    } catch (err) {
      console.error('Error checking enrollment:', err.message);
    }
  }, [id, user?.id]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setEnrolling(true);
      setActionError('');
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          course_id: id,
          student_id: user.id,
          progress: 0,
        });

      if (enrollError) throw enrollError;

      await checkEnrollment();
    } catch (err) {
      console.error('Error enrolling:', err.message);
      setActionError('Unable to enroll in this course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading course details...</div>;
  }

  if (error || !course) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold text-slate-900">Course not found</p>
        <p className="mt-1 text-sm text-slate-500">{error || 'The selected course is not available.'}</p>
        <Link to="/courses" className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Back to catalog
        </Link>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const isOwnCourse = course.instructor_id === user?.id;
  const canPreviewAsStaff = isAdmin || (profile?.role === 'instructor' && isOwnCourse);
  const canAccess = enrolled || canPreviewAsStaff;
  const progress = enrollment?.progress || 0;
  const skills = Array.isArray(course.skills) ? course.skills : [];
  const outcomes = Array.isArray(course.learning_outcomes) ? course.learning_outcomes : [];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="border-b border-slate-200 pb-5">
        <div className="mb-3 text-sm text-slate-500">
          <Link to="/courses" className="font-semibold text-slate-600 hover:text-blue-700">Courses</Link>
          <span className="px-2">/</span>
          <span>{course.title}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{course.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{course.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <main className="space-y-6">
          {actionError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {actionError}
            </div>
          )}

          <section className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Course information</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Instructor', course.instructor?.full_name || 'Instructor'],
                    ['Category', course.category || 'Course'],
                    ['Level', course.level || 'Beginner'],
                    ['Duration', course.duration || 'Self-paced'],
                    ['Lessons', `${lessons.length}`],
                    ['Updated', formatDate(course.updated_at)],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <th className="w-44 bg-slate-50 px-5 py-3 font-medium text-slate-600">{label}</th>
                      <td className="px-5 py-3 text-slate-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {outcomes.length > 0 && (
            <section className="rounded-md border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-950">Learning outcomes</h2>
              </div>
              <ul className="grid gap-0 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                {outcomes.map((outcome) => (
                  <li key={outcome} className="px-5 py-4 text-sm leading-6 text-slate-700">
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {skills.length > 0 && (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Skills covered</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Lesson outline</h2>
              <span className="text-sm text-slate-500">{lessons.length} lessons</span>
            </div>
            {lessons.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {lessons.map((lesson, index) => {
                  const lessonProgress = lessons.length > 0 ? Math.round(((index + 1) / lessons.length) * 100) : 0;
                  const isCompleted = enrolled && lessonProgress <= progress;

                  return (
                    <div key={lesson.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-slate-500">Lesson {index + 1}</p>
                        <h3 className="mt-1 font-medium text-slate-950">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="mt-1 text-sm text-slate-500">{lesson.description}</p>
                        )}
                      </div>
                      <span className={`w-fit rounded border px-2.5 py-1 text-xs font-semibold ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : canAccess
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                      >
                        {isCompleted ? 'Completed' : canAccess ? 'Available' : 'Enroll to view'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">Course content is being updated.</div>
            )}
          </section>
        </main>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="aspect-video border-b border-slate-200">
              <CourseCover src={course.thumbnail_url} title={course.title} />
            </div>
            <div className="space-y-5 p-5">
              <div>
                <p className="text-sm text-slate-500">Enrollment</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">Free</p>
              </div>

              {canAccess ? (
                <Link
                  to={`/learn/${id}`}
                  className="block w-full rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {canPreviewAsStaff ? 'Preview course' : progress > 0 ? 'Continue learning' : 'Start learning'}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll now'}
                </button>
              )}

              {enrolled && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>{enrollment?.completed ? 'Completed' : 'Progress'}</span>
                    <span>{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <h2 className="text-sm font-semibold text-slate-950">Included</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>{lessons.length} video lessons</li>
                  <li>{course.duration || 'Self-paced learning'}</li>
                  <li>{course.level || 'Beginner'} level</li>
                  <li>Progress tracking after enrollment</li>
                </ul>
              </div>
            </div>
          </section>

          {profile?.role === 'student' && !enrolled && lessons.length > 0 && (
            <section className="rounded-md border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold text-blue-950">Ready to start?</h2>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                Enroll to access the lesson player and progress tracking for this course.
              </p>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {enrolling ? 'Enrolling...' : 'Enroll now'}
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CourseDetail;
