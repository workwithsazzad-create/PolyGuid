import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Home from './pages/Home';
import CourseDetails from './pages/CourseDetails';
import VideoPlayer from './pages/VideoPlayer';
import Sidebar from './components/ui/Sidebar';
import { Loader2 } from 'lucide-react';

import { ThemeProvider } from './components/ThemeProvider';

import { Menu, X } from 'lucide-react';

import Messages from './pages/Messages';

// Layout for authenticated pages
function AppLayout({ isAdmin }: { isAdmin: boolean }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center px-4 border-b border-[var(--glass-border)]">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg text-[var(--text)] hover:bg-white/10"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-bold text-lg text-[var(--text)]">PolyGuid</span>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isAdmin={isAdmin} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 lg:ml-64 p-4 pt-20 lg:p-8 lg:pt-8 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id, session.user.email);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id, session.user.email);
      else setIsAdmin(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string, email?: string) => {
    // Hardcoded admin for the owner
    if (email === 'workwithsazzad@gmail.com') {
      setIsAdmin(true);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (data?.role === 'admin') {
      setIsAdmin(true);
    } else if (!data && !error) {
      // If profile doesn't exist, create it. 
      // First user or the owner email is admin.
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      const isFirstUser = !profiles || profiles.length === 0;
      const role = (isFirstUser || email === 'workwithsazzad@gmail.com') ? 'admin' : 'student';
      
      await supabase.from('profiles').insert({
        id: userId,
        email: email,
        role: role
      });
      
      if (role === 'admin') setIsAdmin(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="text-[var(--primary)] animate-spin" size={48} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/home" replace />} 
        />
        
        <Route element={session ? <AppLayout isAdmin={isAdmin} /> : <Navigate to="/login" replace />}>
          <Route path="/home" element={<Home />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/play/:contentId" element={<VideoPlayer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Placeholder routes */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/my-courses" element={<div className="text-2xl font-bold text-[var(--text)]">My Courses Page (Coming Soon)</div>} />
          <Route path="/exams" element={<div className="text-2xl font-bold text-[var(--text)]">Exams Page (Coming Soon)</div>} />
          
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
