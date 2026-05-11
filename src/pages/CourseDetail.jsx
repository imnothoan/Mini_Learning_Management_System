import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  User, 
  ChevronRight, 
  Loader2, 
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    if (user) {
      checkEnrollment();
    }
  }, [id, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*, instructor:profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (err) {
      console.error('Error fetching course details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('student_id', user.id)
        .maybeSingle();

      if (data) {
        setEnrolled(true);
      }
    } catch (err) {
      console.error('Error checking enrollment:', err.message);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setEnrolling(true);
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: id,
          student_id: user.id,
          progress: 0
        });

      if (error) throw error;
      setEnrolled(true);
      // Optional: Show success message
    } catch (err) {
      console.error('Error enrolling:', err.message);
      alert('Có lỗi xảy ra khi đăng ký khóa học.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-20">Khóa học không tồn tại.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <nav className="flex items-center text-sm text-gray-500 gap-2">
            <Link to="/courses" className="hover:text-blue-600 transition-colors">Khóa học</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate">{course.title}</span>
          </nav>

          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            {course.title}
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={16} />
              </div>
              <span className="font-semibold">{course.instructor?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-500" />
              <span>{lessons.length} bài học</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              <span>Cập nhật {new Date(course.updated_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50">
                  <PlayCircle size={32} />
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">Miễn phí</span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">TRỌN ĐỜI</span>
              </div>

              {enrolled ? (
                <Link 
                  to={`/learn/${id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
                >
                  Tiếp tục học
                </Link>
              ) : (
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {enrolling && <Loader2 className="animate-spin" size={20} />}
                  Đăng ký học ngay
                </button>
              )}

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Khóa học này bao gồm:</p>
                <div className="space-y-3">
                  {[
                    { icon: BookOpen, text: 'Truy cập đầy đủ nội dung' },
                    { icon: Clock, text: 'Học mọi lúc, mọi nơi' },
                    { icon: ShieldCheck, text: 'Chứng nhận hoàn thành' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <item.icon size={18} className="text-blue-500" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 lg:p-12 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <BookOpen size={20} />
          </div>
          Nội dung khóa học
        </h2>

        <div className="space-y-4">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => (
              <div 
                key={lesson.id}
                className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors shadow-sm border border-gray-100">
                    <PlayCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Bài giảng video</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  Xem trước
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              Nội dung đang được cập nhật...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
