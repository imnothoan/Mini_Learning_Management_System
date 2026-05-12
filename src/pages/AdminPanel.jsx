import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Loader2,
  GraduationCap,
  ShieldCheck,
  User,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const roleLabel = { admin: 'Quản trị viên', instructor: 'Giảng viên', student: 'Học viên' };
const roleBadgeClass = {
  admin: 'bg-red-50 text-red-700 border-red-100',
  instructor: 'bg-purple-50 text-purple-700 border-purple-100',
  student: 'bg-blue-50 text-blue-700 border-blue-100',
};
const statsColorClass = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
};

const AdminPanel = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, completed: 0 });
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        { count: usersCount },
        { count: coursesCount },
        { count: enrollCount },
        { count: completedCount },
        { data: usersData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('profiles').select('id, full_name, role, updated_at').order('updated_at', { ascending: false })
      ]);

      setStats({
        users: usersCount || 0,
        courses: coursesCount || 0,
        enrollments: enrollCount || 0,
        completed: completedCount || 0
      });
      setUsers(usersData || []);
    } catch (err) {
      console.error('Admin fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDeleteUser = async (userId) => {
    if (userId === profile.id) {
      alert('Không thể xóa tài khoản của chính bạn.');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác.')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      setStats(s => ({ ...s, users: s.users - 1 }));
    } catch (err) {
      alert('Lỗi khi xóa người dùng: ' + err.message);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản trị hệ thống</h1>
          <p className="text-gray-500 mt-0.5">Tổng quan và quản lý toàn bộ Mini LMS</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Tổng người dùng', value: stats.users, icon: Users, color: 'blue' },
          { label: 'Tổng khóa học', value: stats.courses, icon: BookOpen, color: 'indigo' },
          { label: 'Lượt đăng ký', value: stats.enrollments, icon: TrendingUp, color: 'green' },
          { label: 'Khóa học hoàn thành', value: stats.completed, icon: Award, color: 'yellow' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statsColorClass[color] || statsColorClass.blue}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Tổng quan' },
          { id: 'users', label: `Người dùng (${stats.users})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-blue-500" /> Phân bố người dùng
            </h3>
            {(['admin', 'instructor', 'student'] ).map(role => {
              const count = users.filter(u => u.role === role).length;
              const pct = stats.users > 0 ? Math.round((count / stats.users) * 100) : 0;
              return (
                <div key={role} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{roleLabel[role]}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${role === 'admin' ? 'bg-red-400' : role === 'instructor' ? 'bg-purple-400' : 'bg-blue-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" /> Thống kê học tập
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-600">Tỷ lệ đăng ký / khóa học</span>
                <span className="font-bold text-gray-900">
                  {stats.courses > 0 ? (stats.enrollments / stats.courses).toFixed(1) : 0} học viên/khóa
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-600">Tỷ lệ hoàn thành khóa học</span>
                <span className="font-bold text-green-600">
                  {stats.enrollments > 0 ? Math.round((stats.completed / stats.enrollments) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-600">Giảng viên đang hoạt động</span>
                <span className="font-bold text-purple-600">
                  {users.filter(u => u.role === 'instructor').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white md:col-span-2 shadow-lg shadow-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Mini Learning Management System</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Hệ thống đang hoạt động bình thường. Tổng cộng có <strong>{stats.users}</strong> người dùng 
                  với <strong>{stats.courses}</strong> khóa học và <strong>{stats.enrollments}</strong> lượt đăng ký.
                  Tỷ lệ hoàn thành đạt <strong>{stats.enrollments > 0 ? Math.round((stats.completed / stats.enrollments) * 100) : 0}%</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Danh sách người dùng</h3>
            <span className="text-sm text-gray-500">{users.length} người dùng</span>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.full_name?.charAt(0)?.toUpperCase() || <User size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{u.full_name || 'Không có tên'}</p>
                    <p className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadgeClass[u.role] || roleBadgeClass.student}`}>
                    {roleLabel[u.role] || u.role}
                  </span>
                  {u.id !== profile.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa người dùng"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {users.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <AlertTriangle size={32} className="mx-auto mb-3 text-gray-300" />
              Chưa có người dùng nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
