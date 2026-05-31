import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import CourseCover from '../components/CourseCover';

const ManageCourses = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError('');
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name),
          enrollments:enrollments(count),
          lessons:lessons(count)
        `)
        .order('updated_at', { ascending: false });

      if (profile.role === 'instructor') {
        query = query.eq('instructor_id', profile.id);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setCourses(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load courses.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const totals = useMemo(() => ({
    courses: courses.length,
    lessons: courses.reduce((acc, course) => acc + (course.lessons?.[0]?.count || 0), 0),
    students: courses.reduce((acc, course) => acc + (course.enrollments?.[0]?.count || 0), 0),
  }), [courses]);

  const handleDeleteCourse = async (id) => {
    setMessage('');
    setError('');

    if (!window.confirm('Delete this course and its lessons?')) {
      return;
    }

    const previousCourses = courses;
    setCourses(courses.filter((course) => course.id !== id));

    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setMessage('Course deleted.');
    } catch (err) {
      setCourses(previousCourses);
      setError(err.message || 'Unable to delete the course.');
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading course management...</div>;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Course Management</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {profile.role === 'admin' ? 'All courses' : 'My courses'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Edit course information, cover images, and lesson outlines.
          </p>
        </div>
        <Link
          to="/manage-courses/new"
          className="inline-flex w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create course
        </Link>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 overflow-hidden rounded-md border border-slate-200 bg-white sm:grid-cols-3">
        {[
          ['Courses', totals.courses],
          ['Lessons', totals.lessons],
          ['Students', totals.students],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-slate-200 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Lessons</th>
                  <th className="px-4 py-3 font-semibold">Students</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-20 overflow-hidden rounded border border-slate-200">
                          <CourseCover src={course.thumbnail_url} title={course.title} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">{course.title}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{course.description}</p>
                          {profile.role === 'admin' && (
                            <p className="mt-1 text-xs text-slate-500">
                              Instructor: {course.instructor?.full_name || 'Unassigned'}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{course.category || '-'}</td>
                    <td className="px-4 py-4 text-slate-600">{course.level || '-'}</td>
                    <td className="px-4 py-4 text-slate-600">{course.lessons?.[0]?.count || 0}</td>
                    <td className="px-4 py-4 text-slate-600">{course.enrollments?.[0]?.count || 0}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {course.updated_at ? new Date(course.updated_at).toLocaleDateString('en-US') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Link to={`/courses/${course.id}`} className="font-semibold text-slate-700 hover:text-blue-700">
                          Preview
                        </Link>
                        <Link to={`/manage-courses/edit/${course.id}`} className="font-semibold text-blue-700 hover:underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="font-semibold text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="font-semibold text-slate-900">No courses yet</p>
            <p className="mt-1 text-sm text-slate-500">Create a course and add lessons for the demo flow.</p>
            <Link
              to="/manage-courses/new"
              className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create first course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;
