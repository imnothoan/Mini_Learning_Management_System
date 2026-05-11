import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  PlayCircle, 
  Menu, 
  X,
  Loader2,
  Home
} from 'lucide-react';

const LessonView = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchLessonData();
  }, [courseId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
      
      if (lessonsData && lessonsData.length > 0) {
        setCurrentLesson(lessonsData[0]);
      }

      // Fetch enrollment progress
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single();

      if (enrollError) throw enrollError;
      setProgress(enrollment?.progress || 0);

    } catch (err) {
      console.error('Error fetching lesson data:', err.message);
      // If not enrolled or other error, redirect
      navigate(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;

    try {
      // Find index of current lesson
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      const newProgress = Math.round(((currentIndex + 1) / lessons.length) * 100);
      
      const { error } = await supabase
        .from('enrollments')
        .update({ 
          progress: Math.max(progress, newProgress),
          completed: newProgress === 100
        })
        .eq('course_id', courseId)
        .eq('student_id', user.id);

      if (error) throw error;
      setProgress(Math.max(progress, newProgress));

      // Move to next lesson if available
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } catch (err) {
      console.error('Error updating progress:', err.message);
    }
  };

  const getVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-0' : ''}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="font-bold text-gray-900 truncate max-w-md">{course?.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500">{progress}%</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Video Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-gray-200">
              {currentLesson?.video_url ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${getVideoId(currentLesson.video_url)}?rel=0&showinfo=0`}
                  title={currentLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <PlayCircle size={64} />
                  <p>Không có video cho bài học này</p>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{currentLesson?.title}</h2>
                <p className="text-gray-500">Cập nhật ngày {new Date(currentLesson?.updated_at || Date.now()).toLocaleDateString('vi-VN')}</p>
              </div>
              <button 
                onClick={handleMarkComplete}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
              >
                Hoàn thành bài học
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Mô tả bài học</h3>
              <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                {currentLesson?.description || 'Chưa có mô tả cho bài học này.'}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-20 w-80 bg-white border-l border-gray-100 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full hidden lg:block'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Nội dung khóa học</h3>
            <p className="text-xs text-gray-500 mt-1">{lessons.length} bài học • {Math.round(progress)}% hoàn thành</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {lessons.map((lesson, index) => {
              const isActive = currentLesson?.id === lesson.id;
              const isCompleted = ((index + 1) / lessons.length) * 100 <= progress;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`
                    w-full flex items-start gap-4 p-5 transition-all text-left border-b border-gray-50
                    ${isActive ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className={`
                    mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                    ${isCompleted ? 'bg-green-100 text-green-600' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle size={14} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <PlayCircle size={12} className="text-gray-400" />
                      <span className="text-[11px] text-gray-400">10:00</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default LessonView;
