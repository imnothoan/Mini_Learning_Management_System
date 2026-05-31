import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ProgressBar = ({ value }) => (
  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
    <div className="h-full bg-blue-600" style={{ width: `${value}%` }} />
  </div>
);

const StatRow = ({ stats, profile }) => {
  const rows = [
    {
      label: profile?.role === 'instructor' ? 'My courses' : profile?.role === 'admin' ? 'Total users' : 'Active courses',
      value: stats.primary
    },
    {
      label: profile?.role === 'instructor' ? 'Total students' : profile?.role === 'admin' ? 'Total courses' : 'Average progress',
      value: profile?.role === 'student' ? `${stats.avgProgress}%` : profile?.role === 'admin' ? stats.avgProgress : stats.totalStudents
    },
    {
      label: profile?.role === 'admin' ? 'Enrollments' : 'Completed courses',
      value: stats.completed
    }
  ];

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-md border border-slate-200 bg-white sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="border-b border-slate-200 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
          <p className="text-sm text-slate-500">{row.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{row.value}</p>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    primary: 0,
    avgProgress: 0,
    completed: 0,
    totalStudents: 0
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (profile.role === 'student') {
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            progress,
            completed,
            enrolled_at,
            course:courses(
              id, title, description, category, level, duration,
              instructor:profiles(full_name)
            )
          `)
          .eq('student_id', profile.id)
          .order('enrolled_at', { ascending: false });

        if (enrollError) throw enrollError;

        const valid = (enrollments || []).filter((item) => item.course);
        setEnrolledCourses(valid);

        const completed = valid.filter((item) => item.completed).length;
        const avgProgress = valid.length > 0
          ? Math.round(valid.reduce((acc, item) => acc + item.progress, 0) / valid.length)
          : 0;

        setStats({ primary: valid.length, avgProgress, completed, totalStudents: 0 });

        const enrolledIds = new Set(valid.map((item) => item.course.id));
        const { data: featured } = await supabase
          .from('courses')
          .select('id, title, category, level, duration, instructor:profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(6);

        setFeaturedCourses((featured || []).filter((course) => !enrolledIds.has(course.id)).slice(0, 4));
      } else if (profile.role === 'instructor') {
        const { data: courses, error: courseError } = await supabase
          .from('courses')
          .select(`
            id, title, category, level, duration, updated_at,
            enrollments:enrollments(count)
          `)
          .eq('instructor_id', profile.id)
          .order('updated_at', { ascending: false });

        if (courseError) throw courseError;
        setInstructorCourses(courses || []);

        const totalStudents = (courses || []).reduce(
          (acc, course) => acc + (course.enrollments?.[0]?.count || 0),
          0
        );

        setStats({
          primary: courses?.length || 0,
          avgProgress: 0,
          completed: 0,
          totalStudents
        });
      } else if (profile.role === 'admin') {
        const [{ count: usersCount }, { count: coursesCount }, { count: enrollCount }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('enrollments').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          primary: usersCount || 0,
          avgProgress: coursesCount || 0,
          completed: enrollCount || 0,
          totalStudents: 0
        });

        const { data: allCourses } = await supabase
          .from('courses')
          .select('id, title, category, level, duration, instructor:profiles(full_name), enrollments:enrollments(count)')
          .order('updated_at', { ascending: false })
          .limit(6);

        setFeaturedCourses(allCourses || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ').pop() || 'there';

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Hello, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {profile?.role === 'student' ? 'Continue enrolled courses or open the course catalog.' :
             profile?.role === 'instructor' ? 'Review your courses and update learning content.' :
             'Review platform activity and user management.'}
          </p>
        </div>
        {(profile?.role === 'instructor' || profile?.role === 'admin') && (
          <Link
            to={profile?.role === 'admin' ? '/admin' : '/manage-courses'}
            className="inline-flex w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {profile?.role === 'admin' ? 'Open administration' : 'Manage courses'}
          </Link>
        )}
      </div>

      <StatRow stats={stats} profile={profile} />

      {profile?.role === 'student' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">My courses</h2>
            <Link to="/courses" className="text-sm font-semibold text-blue-700 hover:underline">Course catalog</Link>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map(({ course, progress, completed }) => (
                <div key={course.id} className="border-b border-slate-200 p-4 last:border-b-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {course.category || 'Course'} · {course.level || 'Beginner'} · {course.duration || 'Self-paced'}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-950">{course.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{course.instructor?.full_name || 'Instructor'}</p>
                    </div>
                    <div className="w-full md:w-56">
                      <div className="mb-2 flex justify-between text-xs text-slate-500">
                        <span>{completed ? 'Completed' : 'In progress'}</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>
                    <Link
                      to={`/learn/${course.id}`}
                      className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="font-semibold text-slate-900">No enrolled courses yet</p>
                <p className="mt-1 text-sm text-slate-500">Open the catalog and enroll in a course to start tracking progress.</p>
                <Link to="/courses" className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                  Browse courses
                </Link>
              </div>
            )}
          </div>

          {featuredCourses.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Available next</h2>
              <div className="mt-4 divide-y divide-slate-100">
                {featuredCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <Link to={`/courses/${course.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                        {course.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {course.category || 'Course'} · {course.level || 'Beginner'} · {course.instructor?.full_name || 'Instructor'}
                      </p>
                    </div>
                    <Link to={`/courses/${course.id}`} className="text-sm font-semibold text-blue-700 hover:underline">Details</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {profile?.role === 'instructor' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">My courses</h2>
            <Link to="/manage-courses/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Create course
            </Link>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {instructorCourses.length > 0 ? (
              instructorCourses.map((course) => (
                <div key={course.id} className="flex flex-col gap-3 border-b border-slate-200 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">{course.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {course.category || 'Course'} · {course.level || 'Beginner'} · {course.duration || 'Self-paced'} · {course.enrollments?.[0]?.count || 0} students
                    </p>
                  </div>
                  <Link to={`/manage-courses/edit/${course.id}`} className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                    Edit
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="font-semibold text-slate-900">No courses yet</p>
                <p className="mt-1 text-sm text-slate-500">Create the first course and add lessons for learners.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {profile?.role === 'admin' && featuredCourses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Recent courses</h2>
            <Link to="/manage-courses" className="text-sm font-semibold text-blue-700 hover:underline">View all</Link>
          </div>
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {featuredCourses.map((course) => (
              <div key={course.id} className="flex flex-col gap-3 border-b border-slate-200 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{course.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {course.category || 'Course'} · {course.level || 'Beginner'} · {course.instructor?.full_name || 'Instructor'}
                  </p>
                </div>
                <p className="text-sm text-slate-600">{course.enrollments?.[0]?.count || 0} enrollments</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
