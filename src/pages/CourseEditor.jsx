import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  Save, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronLeft,
  Image as ImageIcon,
  Type,
  AlignLeft,
  Video,
  Layout
} from 'lucide-react';

const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [course, setCourse] = useState({
    title: '',
    description: '',
    thumbnail_url: ''
  });
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
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
      console.error('Error fetching course data:', err.message);
      navigate('/manage-courses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = () => {
    setLessons([
      ...lessons,
      {
        id: `temp-${Date.now()}`,
        title: '',
        description: '',
        video_url: '',
        order_index: lessons.length
      }
    ]);
  };

  const handleUpdateLesson = (id, field, value) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleRemoveLesson = (id) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let courseId = id;

      // 1. Save Course
      if (isEditing) {
        const { error } = await supabase
          .from('courses')
          .update({
            title: course.title,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            updated_at: new Date()
          })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert({
            title: course.title,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            instructor_id: user.id
          })
          .select()
          .single();
        if (error) throw error;
        courseId = data.id;
      }

      // 2. Save Lessons
      // This is simplified: delete old and insert new
      // In production, you'd want a more robust sync or upsert
      if (isEditing) {
        await supabase.from('lessons').delete().eq('course_id', courseId);
      }

      const lessonsToInsert = lessons.map((l, index) => ({
        course_id: courseId,
        title: l.title,
        description: l.description,
        video_url: l.video_url,
        order_index: index
      }));

      if (lessonsToInsert.length > 0) {
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);
        if (lessonError) throw lessonError;
      }

      navigate('/manage-courses');
    } catch (err) {
      console.error('Error saving course:', err.message);
      alert('Có lỗi xảy ra khi lưu khóa học.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between sticky top-24 bg-slate-50/80 backdrop-blur-md py-4 z-20">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/manage-courses')}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Lưu thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Type size={18} className="text-blue-500" /> Thông tin cơ bản
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề khóa học</label>
                <input 
                  type="text" 
                  required
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  placeholder="VD: Lập trình ReactJS căn bản"
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả ngắn</label>
                <textarea 
                  rows={4}
                  required
                  value={course.description}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  placeholder="Mô tả về mục tiêu và nội dung của khóa học..."
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layout size={18} className="text-blue-500" /> Nội dung bài học
              </h2>
              <button 
                type="button"
                onClick={handleAddLesson}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
              >
                <Plus size={16} /> Thêm bài mới
              </button>
            </div>

            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 group relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bài {index + 1}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveLesson(lesson.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <input 
                    type="text" 
                    value={lesson.title}
                    onChange={(e) => handleUpdateLesson(lesson.id, 'title', e.target.value)}
                    placeholder="Tiêu đề bài học"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 transition-all text-sm font-semibold"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Video size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      <input 
                        type="url" 
                        value={lesson.video_url}
                        onChange={(e) => handleUpdateLesson(lesson.id, 'video_url', e.target.value)}
                        placeholder="Link video (YouTube)"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 transition-all text-sm"
                      />
                    </div>
                    <div className="relative">
                      <AlignLeft size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        value={lesson.description}
                        onChange={(e) => handleUpdateLesson(lesson.id, 'description', e.target.value)}
                        placeholder="Mô tả ngắn gọn"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-600 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {lessons.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 text-sm">Chưa có bài học nào. Hãy thêm bài mới.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visuals */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-blue-500" /> Ảnh bìa
            </h2>
            
            <div className="space-y-4">
              <div className="aspect-video bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center group relative">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <ImageIcon size={40} className="text-gray-200 mx-auto" />
                    <p className="text-xs text-gray-400 font-medium">Chưa có ảnh bìa</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Link ảnh bìa (URL)</label>
                <input 
                  type="url" 
                  value={course.thumbnail_url}
                  onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-600 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl p-8 text-white space-y-4 shadow-lg shadow-blue-200">
            <h3 className="font-bold flex items-center gap-2">
              <Save size={18} /> Lưu ý quan trọng
            </h3>
            <ul className="text-sm space-y-3 opacity-90 leading-relaxed">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Cung cấp tiêu đề hấp dẫn để thu hút học viên.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Sử dụng ảnh bìa chất lượng cao (16:9).</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Link video phải từ YouTube để đảm bảo tương thích.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CourseEditor;
