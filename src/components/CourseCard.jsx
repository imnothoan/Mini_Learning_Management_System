import { Link } from 'react-router-dom';
import CourseCover from './CourseCover';

const CourseCard = ({ course, isEnrolled = false }) => {
  const lessonCount = course.lessons?.[0]?.count || 0;
  const skills = Array.isArray(course.skills) ? course.skills.slice(0, 4) : [];

  return (
    <article className="border-b border-slate-200 bg-white px-4 py-5 last:border-b-0 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-32 w-full overflow-hidden rounded-md bg-slate-100 sm:w-48">
          <CourseCover src={course.thumbnail_url} title={course.title} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{course.category || 'Course'}</span>
            <span>{course.level || 'Beginner'}</span>
            <span>{course.duration || 'Self-paced'}</span>
            <span>{lessonCount} lessons</span>
            {isEnrolled && <span className="font-semibold text-emerald-700">Enrolled</span>}
          </div>

          <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-950">
            <Link to={`/courses/${course.id}`} className="hover:text-blue-700">
              {course.title}
            </Link>
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {course.instructor?.full_name || 'Instructor'}
          </p>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {course.description}
          </p>

          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill} className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-start sm:justify-end">
          <Link
            to={`/courses/${course.id}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            {isEnrolled ? 'Continue' : 'Details'}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
