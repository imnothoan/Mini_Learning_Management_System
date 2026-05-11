import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import { Plus, BookOpen, Clock, Award, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCount: 0,
    completionRate: 0,
    certificates: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses (all courses for now, could be filtered for students)
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:profiles(full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);

        // Fetch stats if student
        if (profile?.role === 'student') {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('progress, completed')
            .eq('student_id', profile.id);
          
          if (enrollments) {
            const completed = enrollments.filter(e => e.completed).length;
            const avgProgress = enrollments.length > 0 
              ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length)
              : 0;
            
            setStats({
              enrolledCount: enrollments.length,
              completionRate: avgProgress,
              certificates: completed
            });
          }
        } else if (profile?.role === 'instructor') {
          // Instructor stats
          const { count } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', profile.id);
          
          setStats({
            enrolledCount: count || 0,
            completionRate: 100, // Placeholder
            certificates: 0
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Chào {profile?.role === 'instructor' ? 'giảng viên' : 'bạn'}, {profile?.full_name?.split(' ').pop()}!
          </h1>
          <p className="text-gray-500 mt-1">Hôm nay bạn muốn học gì mới không?</p>
        </div>
        {profile?.role === 'instructor' && (
          <Link
            to="/manage-courses"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-blue-200"
          >
            <Plus size={20} className="mr-2" /> Tạo khóa học mới
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
              {profile?.role === 'instructor' ? 'Khóa học của tôi' : 'Khóa học đang học'}
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.enrolledCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tiến độ trung bình</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Chứng chỉ</p>
            <p className="text-2xl font-bold text-gray-900">{stats.certificates}</p>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Khóa học tiêu biểu</h2>
          <Link to="/courses" className="text-blue-600 text-sm font-semibold hover:underline">
            Xem tất cả
          </Link>
        </div>
        
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <p className="text-gray-500">Chưa có khóa học nào được đăng tải.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
