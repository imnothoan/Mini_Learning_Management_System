import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';

const CourseList = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedLevel, setSelectedLevel] = useState('All levels');
  const [filteredCourses, setFilteredCourses] = useState([]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*, instructor:profiles(full_name), lessons:lessons(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnrolledIds = useCallback(async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', profile.id);
    setEnrolledCourseIds(new Set((data || []).map(e => e.course_id)));
  }, [profile?.id]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchEnrolledIds();
    } else {
      setEnrolledCourseIds(new Set());
    }
  }, [profile?.role, fetchEnrolledIds]);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = courses.filter(course => {
      const text = [
        course.title,
        course.description,
        course.instructor?.full_name,
        course.category,
        course.level,
        ...(Array.isArray(course.skills) ? course.skills : [])
      ].join(' ').toLowerCase();
      const matchesSearch = text.includes(term);
      const matchesCategory = selectedCategory === 'All categories' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All levels' || course.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
    setFilteredCourses(filtered);

    // Update URL param
    if (searchTerm) {
      setSearchParams({ q: searchTerm }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [searchTerm, courses, selectedCategory, selectedLevel, setSearchParams]);

  const categories = useMemo(() => [
    'All categories',
    ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort()
  ], [courses]);

  const levels = useMemo(() => [
    'All levels',
    ...Array.from(new Set(courses.map((course) => course.level).filter(Boolean))).sort()
  ], [courses]);

  const hasActiveFilters = Boolean(searchTerm || selectedCategory !== 'All categories' || selectedLevel !== 'All levels');

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading course catalog...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Course Catalog</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {filteredCourses.length} courses available 
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search courses or instructors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 md:flex-row md:items-center">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={selectedLevel}
            onChange={(event) => setSelectedLevel(event.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            {levels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All categories');
              setSelectedLevel('All levels');
            }}
            className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredCourses.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourseIds.has(course.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm ? `No results for "${searchTerm}". Try another keyword.` : 'No courses have been published yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseList;
