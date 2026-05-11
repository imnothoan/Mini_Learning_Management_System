import { useEffect, useState, useCallback } from 'react';
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
  BookOpen,
  Award
} from 'lucide-react';

const LessonView = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [progress, setProgress] = useState(0);

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
      const lessonList = lessonsData || [];
      setLessons(lessonList);
      
      // Fetch enrollment progress
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (enrollError || !enrollment) {
        // Not enrolled – redirect back to course detail
        navigate(`/courses/${courseId}`);
        return;
      }

      const currentProgress = enrollment?.progress || 0;
      setProgress(currentProgress);

      // Determine which lessons are completed based on progress
      const completedCount = Math.round((currentProgress / 100) * lessonList.length);
      const completedIds = new Set(lessonList.slice(0, completedCount).map(l => l.id));
      setCompletedLessonIds(completedIds);

      // Set current lesson to first uncompleted, or first lesson
      const firstUncompleted = lessonList.find(l => !completedIds.has(l.id));
      setCurrentLesson(firstUncompleted || lessonList[0] || null);

    } catch (err) {
      console.error('Error fetching lesson data:', err.message);
      navigate(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleMarkComplete = useCallback(async () => {
    if (!currentLesson || marking) return;

    try {
      setMarking(true);
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      const newCompletedCount = currentIndex + 1;
      const newProgress = Math.round((newCompletedCount / lessons.length) * 100);
      const updatedProgress = Math.max(progress, newProgress);
      const isNowCompleted = updatedProgress === 100;

      const { error } = await supabase
        .from('enrollments')
        .update({ 
          progress: updatedProgress,
          completed: isNowCompleted
        })
        .eq('course_id', courseId)
        .eq('student_id', user.id);

      if (error) throw error;
      
      setProgress(updatedProgress);
      
      // Update completed lessons set
      const newCompletedIds = new Set(lessons.slice(0, newCompletedCount).map(l => l.id));
      setCompletedLessonIds(newCompletedIds);

      // Auto-advance to next lesson
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } catch (err) {
      console.error('Error updating progress:', err.message);
    } finally {
      setMarking(false);
    }
  }, [currentLesson, lessons, progress, marking, courseId, user?.id]);

  const getVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
  const isCurrentCompleted = completedLessonIds.has(currentLesson?.id);
  const isAllCompleted = progress === 100;

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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Link to={`/courses/${courseId}`} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 flex-shrink-0">
              <ChevronLeft size={20} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">{course?.title}</p>
              <h1 className="font-bold text-gray-900 truncate text-sm">{currentLesson?.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-700" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500">{progress}%</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              title={isSidebarOpen ? 'Ẩn danh sách bài' : 'Hiện danh sách bài'}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Video Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
            
            {/* Completion Banner */}
            {isAllCompleted && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-6 text-white flex items-center gap-4 shadow-lg shadow-green-200">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Award size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">🎉 Chúc mừng! Bạn đã hoàn thành khóa học!</h3>
                  <p className="text-green-100 text-sm mt-0.5">Bạn đã học xong toàn bộ {lessons.length} bài học của khóa học này.</p>
                </div>
              </div>
            )}

            {/* Video player */}
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-gray-200">
              {currentLesson?.video_url ? (
                <iframe
                  key={currentLesson.id}
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

            {/* Lesson info + actions */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                    Bài {currentIndex + 1} / {lessons.length}
                  </span>
                  {isCurrentCompleted && (
                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle size={12} /> Đã hoàn thành
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{currentLesson?.title}</h2>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                {currentIndex > 0 && (
                  <button
                    onClick={() => setCurrentLesson(lessons[currentIndex - 1])}
                    className="inline-flex items-center gap-2 text-gray-600 bg-white hover:bg-gray-50 font-semibold px-5 py-3 rounded-2xl transition-all border border-gray-200 shadow-sm"
                  >
                    <ChevronLeft size={18} /> Bài trước
                  </button>
                )}
                {!isCurrentCompleted ? (
                  <button 
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200"
                  >
                    {marking ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                    Hoàn thành & Tiếp tục
                  </button>
                ) : currentIndex < lessons.length - 1 ? (
                  <button
                    onClick={() => setCurrentLesson(lessons[currentIndex + 1])}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200"
                  >
                    Bài tiếp theo <ChevronRight size={18} />
                  </button>
                ) : (
                  <Link
                    to={`/courses/${courseId}`}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-green-200"
                  >
                    <Award size={18} /> Xem tổng kết
                  </Link>
                )}
              </div>
            </div>

            {/* Lesson description */}
            {currentLesson?.description && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-500" /> Mô tả bài học
                </h3>
                <div className="text-gray-600 leading-relaxed">
                  {currentLesson.description}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="w-80 bg-white border-l border-gray-100 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Nội dung khóa học</h3>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">{lessons.length} bài học • {progress}% hoàn thành</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {lessons.map((lesson, index) => {
              const isActive = currentLesson?.id === lesson.id;
              const isCompleted = completedLessonIds.has(lesson.id);
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`
                    w-full flex items-start gap-4 p-4 transition-all text-left border-b border-gray-50
                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className={`
                    mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                    ${isCompleted ? 'bg-green-100 text-green-600' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}
                  `}>
                    {isCompleted 
                      ? <CheckCircle size={15} /> 
                      : <span className="text-[10px] font-bold">{index + 1}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : isCompleted ? 'text-gray-500' : 'text-gray-700'}`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlayCircle size={11} className="text-gray-300" />
                      <span className="text-[11px] text-gray-400">Video bài giảng</span>
                    </div>
                  </div>
                  {isActive && <div className="w-1 h-full bg-blue-600 rounded-full self-stretch flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
};

export default LessonView;
