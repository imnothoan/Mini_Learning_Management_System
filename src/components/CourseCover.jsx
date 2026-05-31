const CourseCover = ({ src, title, className = '' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={title}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-slate-500 ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-2 h-8 w-12 rounded border border-slate-300 bg-white" />
        <p className="text-xs font-medium">Course image</p>
      </div>
    </div>
  );
};

export default CourseCover;
