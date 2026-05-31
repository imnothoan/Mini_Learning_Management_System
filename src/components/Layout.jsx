import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleLabel = {
    admin: 'Administrator',
    instructor: 'Instructor',
    student: 'Student',
  }[profile?.role] || 'User';

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Courses', path: '/courses' },
  ];

  if (profile?.role === 'instructor' || profile?.role === 'admin') {
    navItems.push({ name: 'Manage', path: '/manage-courses' });
  }

  if (profile?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin' });
  }

  const isActive = (path) => (
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] font-sans text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0 text-lg font-semibold text-slate-950" onClick={() => setIsMenuOpen(false)}>
            MiniLMS
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-slate-100 text-slate-950'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="ml-auto hidden w-full max-w-sm md:block">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400 focus:bg-white"
            />
          </form>

          <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 md:flex">
            <div className="text-right text-sm">
              <p className="font-medium leading-tight text-slate-800">{profile?.full_name || 'User'}</p>
              <p className="text-xs leading-tight text-slate-500">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="ml-auto rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 md:hidden"
          >
            Menu
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />
            </form>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-slate-100 text-slate-950'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
              <p className="font-medium text-slate-800">{profile?.full_name || 'User'}</p>
              <p className="text-slate-500">{roleLabel}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
