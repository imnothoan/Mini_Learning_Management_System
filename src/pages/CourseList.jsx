import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import { Search, Loader2, BookOpen } from 'lucide-react';

const CourseList = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchEnrolledIds();
    }
  }, [profile]);

  // Sync URL search param to searchTerm state on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchTerm(q);
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*, instructor:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledIds = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', profile.id);
    setEnrolledCourseIds(new Set((data || []).map(e => e.course_id)));
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(term) ||
      course.description?.toLowerCase().includes(term) ||
      course.instructor?.full_name?.toLowerCase().includes(term)
    );
    setFilteredCourses(filtered);

    // Update URL param
    if (searchTerm) {
      setSearchParams({ q: searchTerm });
    } else {
      setSearchParams({});
    }
  }, [searchTerm, courses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tất cả khóa học</h1>
          <p className="text-gray-500 mt-1">
            {filteredCourses.length} khóa học • Khám phá kiến thức từ đội ngũ giảng viên chuyên nghiệp
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm khóa học, giảng viên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourseIds.has(course.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khóa học nào</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm ? `Không có kết quả cho "${searchTerm}". Thử từ khóa khác.` : 'Chưa có khóa học nào được đăng tải.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseList;
