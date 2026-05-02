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
import PdfViewer from './pages/PdfViewer';
import SemesterCourses from './pages/SemesterCourses';
import CoursesPage from './pages/CoursesPage';
import SavedItems from './pages/SavedItems';
import ResultViewer from './pages/ResultViewer';
import About from './pages/info/About';
import Privacy from './pages/info/Privacy';
import Terms from './pages/info/Terms';
import Refund from './pages/info/Refund';
import Sidebar from './components/ui/Sidebar';
import { Loader2 } from 'lucide-react';

import { ThemeProvider, useTheme } from './components/ThemeProvider';
import Logo from './components/ui/Logo';
import { cn } from './lib/utils';

import { Menu, X } from 'lucide-react';

import Messages from './pages/Messages';

import { Link, useLocation } from 'react-router-dom';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Layout for authenticated pages
function AppLayout({ isAdmin }: { isAdmin: boolean }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center px-4 border-b border-[var(--glass-border)]">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
        >
          <Menu size={24} />
        </button>
        <div className={cn(
          "ml-1 flex flex-1 items-center h-full justify-start overflow-hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <Link to="/home">
            <Logo theme={theme} showText={true} className="scale-[0.8] origin-left -ml-2" />
          </Link>
        </div>
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

// Simple layout for info pages without sidebar
function InfoLayout() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="w-full h-16 border-b border-black/5 dark:border-white/5 flex items-center px-4 sm:px-8 bg-white dark:bg-[#0a0a0a]">
        <Link to="/home" className="flex items-center gap-2 group">
          <Logo theme={theme} showText={true} className="scale-[0.8] sm:scale-100 origin-left" />
        </Link>
      </header>
      <main className="w-full p-4 lg:p-12 overflow-x-hidden">
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
    let isMounted = true;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session) {
        setSession(session);
        checkAdminStatus(session.user.id, session.user.email).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id, session.user.email).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
      <ScrollToTop />
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/home" replace />} 
        />
        
        <Route element={session ? <AppLayout isAdmin={isAdmin} /> : <Navigate to="/login" replace />}>
          <Route path="/home" element={<Home />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/semester/:semesterName" element={<SemesterCourses />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/play/:contentId" element={<VideoPlayer />} />
          <Route path="/pdf/:contentId" element={<PdfViewer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/saved-items" element={<SavedItems />} />
          <Route path="/results" element={<ResultViewer />} />
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Layer Routes (Standalone Pages) */}
          <Route path="/marketplace" element={<div className="p-8 max-w-4xl mx-auto"><h1 className="text-3xl font-bold font-sans"><span className="text-[#32CD32]">P</span>oly<span className="text-[#00BFFF]">G</span>uid Marketplace</h1><p className="text-gray-500 mt-4 leading-relaxed">শীঘ্রই আসছে: এখান থেকে আপনি আপনার প্রয়োজনীয় ইঞ্জিনিয়ারিং বই কেনা-বেচা করতে পারবেন।</p></div>} />
          <Route path="/books-pdf" element={<CoursesPage />} />
          <Route path="/book-list" element={<CoursesPage />} />
          <Route path="/my-courses" element={<Dashboard />} />
          <Route path="/exams" element={<div className="p-8 max-w-4xl mx-auto"><h1 className="text-3xl font-bold font-sans"><span className="text-[#32CD32]">P</span>oly<span className="text-[#00BFFF]">G</span>uid Exams</h1><p className="text-gray-500 mt-4 leading-relaxed">শীঘ্রই আসছে: অনলাইনে পরীক্ষা দিন এবং আপনার মেধা যাচাই করুন।</p></div>} />
          
          <Route path="/messages" element={<Messages />} />
          
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Route>

        {/* Info Pages (Public/Standalone) */}
        <Route element={<InfoLayout />}>
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
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
