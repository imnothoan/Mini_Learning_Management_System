import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Loader2, 
  BookOpen, 
  Users, 
  TrendingUp,
  GraduationCap
} from 'lucide-react';

const ManageCourses = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchCourses();
    }
  }, [profile]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name),
          enrollments:enrollments(count)
        `)
        .order('created_at', { ascending: false });

      // Admins see all courses; instructors see only their own
      if (profile.role === 'instructor') {
        query = query.eq('instructor_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting course:', err.message);
      alert('Có lỗi xảy ra khi xóa khóa học.');
    }
  };

  const totalStudents = courses.reduce((acc, c) => acc + (c.enrollments?.[0]?.count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đào tạo</h1>
          <p className="text-gray-500 mt-1">
            {profile.role === 'admin' ? 'Quản lý tất cả khóa học trong hệ thống' : 'Quản lý các khóa học và theo dõi tiến độ của học viên'}
          </p>
        </div>
        <Link
          to="/manage-courses/new"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} className="mr-2" /> Tạo khóa học mới
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Khóa học</p>
            <p className="text-xl font-bold text-gray-900">{courses.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tổng học viên</p>
            <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Lượt đăng ký</p>
            <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Course list */}
      <div className="grid grid-cols-1 gap-5">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div 
              key={course.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
            >
              {/* Thumbnail */}
              <div className="w-full md:w-44 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img 
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-xl font-bold text-gray-900 truncate">{course.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium pt-1">
                  {profile.role === 'admin' && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-purple-500" />
                      <span>{course.instructor?.full_name || 'Chưa gán GV'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users size={15} className="text-blue-500" />
                    <span>{course.enrollments?.[0]?.count || 0} học viên</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={15} className="text-green-500" />
                    <span className="text-green-600 font-semibold">Đã xuất bản</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                <Link 
                  to={`/courses/${course.id}`}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-200 font-semibold"
                  title="Xem trước"
                >
                  <Eye size={16} />
                  <span className="md:hidden">Xem</span>
                </Link>
                <Link 
                  to={`/manage-courses/edit/${course.id}`}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-gray-200 font-semibold"
                  title="Chỉnh sửa"
                >
                  <Edit2 size={16} />
                  <span className="md:hidden">Sửa</span>
                </Link>
                <button 
                  onClick={() => handleDeleteCourse(course.id)}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-gray-200 font-semibold"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                  <span className="md:hidden">Xóa</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có khóa học nào</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Bắt đầu chia sẻ kiến thức của bạn bằng cách tạo khóa học đầu tiên ngay hôm nay.</p>
            <Link
              to="/manage-courses/new"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} className="mr-2" /> Tạo khóa học đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;
