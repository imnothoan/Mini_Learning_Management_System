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
  Layers,
  CheckCircle,
  Lock
} from 'lucide-react';

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

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, description, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      setLessons(lessonsData || []);
    } catch (err) {
      console.error('Error fetching course details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('student_id', user.id)
        .maybeSingle();

      if (data) {
        setEnrolled(true);
        setEnrollment(data);
      }
    } catch (err) {
      console.error('Error checking enrollment:', err.message);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user) {
      checkEnrollment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

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
      await checkEnrollment();
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

  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin';
  const isOwnCourse = course.instructor_id === user?.id;
  const canAccess = enrolled || isInstructor;
  const progress = enrollment?.progress || 0;

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
              <span className="font-semibold">{course.instructor?.full_name || 'Giảng viên'}</span>
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

          {/* Progress bar for enrolled students */}
          {enrolled && (
            <div className="bg-blue-50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-blue-800">
                <span>Tiến độ học tập của bạn</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {enrollment?.completed && (
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                  <CheckCircle size={16} /> Bạn đã hoàn thành khóa học này!
                </div>
              )}
            </div>
          )}
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

              {canAccess ? (
                <Link 
                  to={`/learn/${id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
                >
                  {isInstructor && isOwnCourse ? 'Xem trước khóa học' : progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học ngay'}
                </Link>
              ) : (
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {enrolling && <Loader2 className="animate-spin" size={20} />}
                  Đăng ký học ngay — Miễn phí
                </button>
              )}

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Khóa học này bao gồm:</p>
                <div className="space-y-3">
                  {[
                    { icon: BookOpen, text: `${lessons.length} bài giảng video` },
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
          <span className="ml-auto text-sm font-medium text-gray-400">{lessons.length} bài học</span>
        </h2>

        <div className="space-y-3">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => {
              const lessonProgress = ((index + 1) / lessons.length) * 100;
              const isCompleted = enrolled && lessonProgress <= progress;

              return (
                <div
                  key={lesson.id}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all group cursor-default
                    ${isCompleted ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-transparent hover:border-blue-100 hover:bg-white hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border
                      ${isCompleted ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-gray-100 text-gray-400 group-hover:text-blue-600'} transition-colors`}>
                      {isCompleted ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-lg
                    ${isCompleted ? 'bg-green-100 text-green-700' : 
                      canAccess ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isCompleted ? 'Hoàn thành' : canAccess ? 'Xem ngay' : <span className="flex items-center gap-1"><Lock size={10} /> Đăng ký để xem</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-500">
              Nội dung đang được cập nhật...
            </div>
          )}
        </div>

        {!enrolled && profile?.role === 'student' && lessons.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
            <p className="text-blue-800 font-semibold mb-4">Đăng ký miễn phí để truy cập toàn bộ {lessons.length} bài học</p>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200 disabled:bg-blue-400"
            >
              {enrolling && <Loader2 className="animate-spin" size={18} />}
              Đăng ký ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
