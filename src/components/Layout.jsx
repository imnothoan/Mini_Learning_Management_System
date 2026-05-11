import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  PlusCircle,
  GraduationCap,
  Search,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const menuItems = [
    { name: 'Bảng điều khiển', icon: LayoutDashboard, path: '/' },
    { name: 'Tất cả khóa học', icon: BookOpen, path: '/courses' },
  ];

  if (profile?.role === 'instructor' || profile?.role === 'admin') {
    menuItems.push({ name: 'Quản lý đào tạo', icon: PlusCircle, path: '/manage-courses' });
  }

  if (profile?.role === 'admin') {
    menuItems.push({ name: 'Quản trị hệ thống', icon: ShieldAlert, path: '/admin' });
  }

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const roleLabel = {
    admin: 'Quản trị viên',
    instructor: 'Giảng viên',
    student: 'Học viên',
  }[profile?.role] || 'Người dùng';

  const roleColor = {
    admin: 'text-red-600',
    instructor: 'text-purple-600',
    student: 'text-blue-600',
  }[profile?.role] || 'text-blue-600';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-8 border-b border-slate-100">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                <GraduationCap size={24} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                MiniLMS
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu chính</p>
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group
                  ${isActive(item.path) 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 mr-3.5 ${isActive(item.path) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="font-semibold">{item.name}</span>
                {isActive(item.path) && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </Link>
            ))}
          </nav>

          {/* User Profile Area */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || 'Người dùng'}</p>
                <p className={`text-[11px] font-bold uppercase tracking-tighter opacity-80 ${roleColor}`}>{roleLabel}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border border-red-100"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 gap-4">
          <div className="lg:hidden flex-shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm khóa học..." 
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
              />
            </div>
          </form>

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-800 leading-tight">{profile?.full_name?.split(' ').pop()}</p>
                <p className={`text-[11px] font-bold uppercase leading-tight ${roleColor}`}>{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
