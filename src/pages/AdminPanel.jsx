import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const roleLabel = {
  admin: 'Administrator',
  instructor: 'Instructor',
  student: 'Student',
};

const AdminPanel = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, completed: 0 });
  const [users, setUsers] = useState([]);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [
        { count: usersCount },
        { count: coursesCount },
        { count: enrollmentCount },
        { count: completedCount },
        { data: usersData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase
          .from('profiles')
          .select('id, full_name, role, created_at, updated_at')
          .order('updated_at', { ascending: false })
      ]);

      setStats({
        users: usersCount || 0,
        courses: coursesCount || 0,
        enrollments: enrollmentCount || 0,
        completed: completedCount || 0,
      });
      setUsers(usersData || []);
    } catch (err) {
      setError(err.message || 'Unable to load administration data.');
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

  const roleDistribution = useMemo(() => (
    ['admin', 'instructor', 'student'].map((role) => ({
      role,
      count: users.filter((user) => user.role === role).length,
      percent: users.length > 0
        ? Math.round((users.filter((user) => user.role === role).length / users.length) * 100)
        : 0,
    }))
  ), [users]);

  const handleUpdateRole = async (userId, nextRole) => {
    setMessage('');
    setError('');

    if (userId === profile.id) {
      setError('The current administrator account cannot change its own role.');
      return;
    }

    const currentUser = users.find((user) => user.id === userId);
    if (!currentUser || currentUser.role === nextRole) return;

    const previousUsers = users;
    setUpdatingUserId(userId);
    setUsers(users.map((user) => (
      user.id === userId ? { ...user, role: nextRole } : user
    )));

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: nextRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      setMessage(`Role updated for ${currentUser.full_name || 'selected user'}.`);
    } catch (err) {
      setUsers(previousUsers);
      setError(err.message || 'Unable to update role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading administration data...</div>;
  }

  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-sm text-slate-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">System Administration</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review platform activity and manage user roles.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 bg-white md:grid-cols-4">
        {[
          ['Users', stats.users],
          ['Courses', stats.courses],
          ['Enrollments', stats.enrollments],
          ['Completed', stats.completed],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-r border-slate-200 p-4 even:border-r-0 md:border-b-0 md:even:border-r md:last:border-r-0">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-950">Role distribution</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Users</th>
                <th className="px-4 py-3 font-semibold">Percent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roleDistribution.map((item) => (
                <tr key={item.role}>
                  <td className="px-4 py-3 font-medium text-slate-800">{roleLabel[item.role]}</td>
                  <td className="px-4 py-3 text-slate-600">{item.count}</td>
                  <td className="px-4 py-3 text-slate-600">{item.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-950">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Current role</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{user.full_name || 'Unnamed user'}</p>
                      <p className="text-xs text-slate-500">ID {user.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{roleLabel[user.role] || user.role}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {user.id === profile.id ? (
                        <span className="text-xs text-slate-500">Current account</span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={updatingUserId === user.id}
                          onChange={(event) => handleUpdateRole(user.id, event.target.value)}
                          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 disabled:opacity-60"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Administrator</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
