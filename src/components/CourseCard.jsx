import { BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course, isEnrolled = false }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-600 shadow-sm">
          {course.instructor?.full_name || 'Giảng viên'}
        </div>
        {isEnrolled && (
          <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle size={11} /> Đã đăng ký
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {course.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
          {course.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center text-gray-400 text-xs font-medium gap-1">
            <BookOpen size={14} />
            <span>Miễn phí</span>
          </div>
          <Link 
            to={`/courses/${course.id}`}
            className="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm hover:gap-2 transition-all"
          >
            {isEnrolled ? 'Tiếp tục học' : 'Xem chi tiết'} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
