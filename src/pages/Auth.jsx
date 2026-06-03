import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student'
  });

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role
            }
          }
        });
        if (signUpError) throw signUpError;
        setSuccessMessage('Registration successful. You can sign in now.');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await signIn({
          email: formData.email,
          password: formData.password
        });
        if (signInError) throw signInError;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4 py-10 font-sans text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-slate-500">Mini Learning Management System</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isSignUp
              ? 'Register as a student or instructor'
              : 'Use a account to continue.'}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          {!isSignUp }

          {error && (
            <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label className="ml-0.5 text-xs font-semibold uppercase text-slate-500">Full name</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Alex Nguyen"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-0.5 text-xs font-semibold uppercase text-slate-500">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                        formData.role === 'student'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'instructor' })}
                      className={`rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                        formData.role === 'instructor'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Instructor
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="ml-0.5 text-xs font-semibold uppercase text-slate-500">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="ml-0.5 text-xs font-semibold uppercase text-slate-500">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="password123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMessage('');
                setIsSignUp(!isSignUp);
              }}
              className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
