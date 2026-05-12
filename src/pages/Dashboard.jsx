import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, Award, Loader2, Users, TrendingUp, PlayCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProgressBar = ({ value }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
      style={{ width: `${value}%` }}
    />
  </div>
);

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
        // Fetch enrolled courses with progress
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            progress,
            completed,
            enrolled_at,
            course:courses(
              id, title, description, thumbnail_url,
              instructor:profiles(full_name)
            )
          `)
          .eq('student_id', profile.id)
          .order('enrolled_at', { ascending: false });

        if (enrollError) throw enrollError;

        const valid = (enrollments || []).filter(e => e.course);
        setEnrolledCourses(valid);

        const completed = valid.filter(e => e.completed).length;
        const avgProgress = valid.length > 0
          ? Math.round(valid.reduce((acc, e) => acc + e.progress, 0) / valid.length)
          : 0;

        setStats({ primary: valid.length, avgProgress, completed, totalStudents: 0 });

        // Fetch featured courses not yet enrolled
        const enrolledIds = valid.map(e => e.course.id);
        const { data: featured } = await supabase
          .from('courses')
          .select('*, instructor:profiles(full_name)')
          .not('id', 'in', `(${enrolledIds.length > 0 ? enrolledIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
          .order('created_at', { ascending: false })
          .limit(3);

        setFeaturedCourses(featured || []);

      } else if (profile.role === 'instructor') {
        // Fetch instructor's courses with enrollment count
        const { data: courses, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            enrollments:enrollments(count)
          `)
          .eq('instructor_id', profile.id)
          .order('created_at', { ascending: false });

        if (courseError) throw courseError;
        setInstructorCourses(courses || []);

        const totalStudents = (courses || []).reduce(
          (acc, c) => acc + (c.enrollments?.[0]?.count || 0), 0
        );

        setStats({
          primary: courses?.length || 0,
          avgProgress: 0,
          completed: 0,
          totalStudents
        });

      } else if (profile.role === 'admin') {
        // Admin: fetch all stats
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
          .select('*, instructor:profiles(full_name), enrollments:enrollments(count)')
          .order('created_at', { ascending: false })
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  const greeting = profile?.role === 'instructor' ? 'giảng viên' : profile?.role === 'admin' ? 'quản trị viên' : 'bạn';
  const firstName = profile?.full_name?.split(' ').pop() || 'bạn';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Chào {greeting}, {firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {profile?.role === 'student' ? 'Hôm nay bạn muốn học gì mới không?' :
             profile?.role === 'instructor' ? 'Quản lý các khóa học và theo dõi tiến độ học viên.' :
             'Tổng quan hệ thống học tập.'}
          </p>
        </div>
        {(profile?.role === 'instructor' || profile?.role === 'admin') && (
          <Link
            to="/manage-courses"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-blue-200"
          >
            <Plus size={20} className="mr-2" />
            {profile?.role === 'admin' ? 'Quản lý hệ thống' : 'Tạo khóa học mới'}
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {profile?.role === 'instructor' ? 'Khóa học của tôi' :
               profile?.role === 'admin' ? 'Tổng người dùng' :
               'Khóa học đang học'}
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.primary}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {profile?.role === 'instructor' ? 'Tổng học viên' :
               profile?.role === 'admin' ? 'Tổng khóa học' :
               'Tiến độ trung bình'}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.role === 'instructor' ? stats.totalStudents :
               profile?.role === 'admin' ? stats.avgProgress :
               `${stats.avgProgress}%`}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {profile?.role === 'admin' ? 'Lượt đăng ký' : 'Khóa học hoàn thành'}
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Student: Enrolled Courses */}
      {profile?.role === 'student' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h2>
            <Link to="/courses" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Khám phá thêm <ArrowRight size={14} />
            </Link>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map(({ course, progress, completed }) => (
                <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {completed && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Award size={12} /> Hoàn thành
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{course.instructor?.full_name || 'Giảng viên'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span>Tiến độ học tập</span>
                        <span className="text-blue-600">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>
                    <Link
                      to={`/learn/${course.id}`}
                      className="flex items-center justify-center gap-2 w-full bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
                    >
                      <PlayCircle size={16} />
                      {progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn chưa đăng ký khóa học nào</h3>
              <p className="text-gray-500 mb-6 text-sm">Khám phá các khóa học và bắt đầu hành trình học tập của bạn!</p>
              <Link to="/courses" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200">
                <BookOpen size={18} /> Khám phá khóa học
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Student: Suggested Courses */}
      {profile?.role === 'student' && featuredCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gợi ý cho bạn</h2>
            <Link to="/courses" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map(course => (
              <div key={course.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-blue-600">
                    {course.instructor?.full_name || 'Giảng viên'}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-2 flex-1 mb-3">{course.title}</h3>
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                  >
                    Xem chi tiết <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructor: My Courses */}
      {profile?.role === 'instructor' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h2>
            <Link to="/manage-courses" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Quản lý <ArrowRight size={14} />
            </Link>
          </div>
          {instructorCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructorCourses.map(course => (
                <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-all group">
                  <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{course.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-blue-500" />
                        {course.enrollments?.[0]?.count || 0} học viên
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/manage-courses/edit/${course.id}`}
                    className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
              <p className="text-gray-500 mb-4">Bạn chưa có khóa học nào.</p>
              <Link to="/manage-courses/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200">
                <Plus size={18} /> Tạo khóa học đầu tiên
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Admin: All Courses */}
      {profile?.role === 'admin' && featuredCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Khóa học gần đây</h2>
            <Link to="/manage-courses" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{course.instructor?.full_name || 'Giảng viên'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users size={12} className="text-blue-500" />
                  <span>{course.enrollments?.[0]?.count || 0} học viên đã đăng ký</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
