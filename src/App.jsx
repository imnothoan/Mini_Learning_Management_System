import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import ManageCourses from './pages/ManageCourses';
import CourseEditor from './pages/CourseEditor';

const ProtectedRoute = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Distraction-free learning view */}
          <Route 
            path="/learn/:courseId" 
            element={
              <ProtectedRoute>
                <LessonView />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<CourseList />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            
            {/* Instructor Routes */}
            <Route path="manage-courses" element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <ManageCourses />
              </ProtectedRoute>
            } />
            <Route path="manage-courses/new" element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <CourseEditor />
              </ProtectedRoute>
            } />
            <Route path="manage-courses/edit/:id" element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <CourseEditor />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
