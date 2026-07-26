import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import AdminCourseUsers from './pages/admin/AdminCourseUsers';
import Profile from './pages/Profile';
import Home from './pages/Home';
import CourseDetails from './pages/CourseDetails';
import VideoPlayer from './pages/VideoPlayer';
import PdfViewer from './pages/PdfViewer';
import SemesterCourses from './pages/SemesterCourses';
import CoursesPage from './pages/CoursesPage';
import PdfBooksPage from './pages/PdfBooksPage';
import SavedItems from './pages/SavedItems';
import ResultViewer from './pages/ResultViewer';
import BookList from './pages/BookList';
import OrderHistory from './pages/OrderHistory';
import About from './pages/info/About';
import Privacy from './pages/info/Privacy';
import Terms from './pages/info/Terms';
import Refund from './pages/info/Refund';
import Sidebar from './components/ui/Sidebar';
import { Loader2, Menu, X, Bell } from 'lucide-react';

import { ThemeProvider, useTheme } from './components/ThemeProvider';
import Logo from './components/ui/Logo';
import { cn } from './lib/utils';

import Messages from './pages/Messages';
import NoticeBoard from './pages/NoticeBoard';
import Notifications from './pages/Notifications';
import More from './pages/More';
import BottomNav from './components/ui/BottomNav';

import MarketplaceHome from './pages/marketplace/MarketplaceHome';
import MarketplacePost from './pages/marketplace/MarketplacePost';
import MarketplaceMyPosts from './pages/marketplace/MarketplaceMyPosts';
import MarketplaceBookDetails from './pages/marketplace/MarketplaceBookDetails';
import VerificationApply from './pages/VerificationApply';

import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { prefetchHomeData } from './services/dataService';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotificationService } from './services/pushNotificationService';

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isMessageConversation = location.pathname === '/messages' && searchParams.has('userId');
  const hasOwnHeader = [
    '/home',
    '/marketplace',
    '/marketplace/post',
    '/marketplace/my-posts',
    '/marketplace/book',
    '/course/',
    '/play/',
    '/pdf/',
    '/notifications',
    '/notices',
    '/messages'
  ].some(path => location.pathname.startsWith(path));

  return (
    <div className={cn("flex min-h-screen lg:pb-0", isMessageConversation ? "pb-0" : "pb-16")}>
      <div className={cn("lg:hidden fixed top-0 left-0 right-0 h-14 z-40 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md flex flex-row items-center px-2 border-b border-black/5 dark:border-white/5")}>
        {location.pathname !== '/home' && (
          <button onClick={() => navigate(-1)} className="p-2 mr-1 text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div className={cn("flex items-center gap-1 group", location.pathname === '/home' ? 'ml-2' : '')}>
          <span className="text-xl font-bold tracking-tight font-sans">
            <span className="text-[#32CD32]">P</span>
            <span className="text-gray-900 dark:text-white">oly</span>
            <span className="text-[#32CD32]">G</span>
            <span className="text-gray-900 dark:text-white">uide</span>
          </span>
        </div>
      </div>

      {/* Overlay for mobile sidebar (if still used somewhere) */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar is hidden on mobile entirely by the utility classes if we wanted, 
          but currently it has translate classes. We will modify Sidebar to be hidden on mobile later 
          or just let it remain and never open it. */}
      <div className="hidden lg:block">
        <Sidebar 
          isAdmin={isAdmin} 
          isOpen={true} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>
      
      <main className={cn("flex-1 lg:ml-64 p-0 lg:p-8 lg:pt-8 w-full overflow-x-hidden relative pt-14 lg:pt-8")}>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}

// Simple layout for info pages without sidebar
function InfoLayout() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="w-full h-14 lg:h-16 border-b border-black/5 dark:border-white/5 flex items-center px-4 sm:px-8 bg-white dark:bg-[#0a0a0a]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 text-gray-700 dark:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <Link to="/home" className="flex items-center gap-2 group">
          <span className="text-xl sm:text-2xl font-bold tracking-tight font-sans">
            <span className="text-[#32CD32]">P</span>
            <span className="text-[var(--text)]">oly</span>
            <span className="text-[#32CD32]">G</span>
            <span className="text-[var(--text)]">uide</span>
          </span>
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
  const [showPermissionGate, setShowPermissionGate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Capacitor Hardware Back Button Support
    try {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        const path = window.location.pathname;
        if (path === '/home' || path === '/' || path === '/login') {
          CapacitorApp.exitApp();
        } else if (canGoBack) {
          window.history.back();
        } else {
          // If no history but not on home, go to home
          window.location.href = '/home';
        }
      });
    } catch(e) {
      console.log('Capacitor App plugin not available/initialized');
    }

    // Check current session
    const authTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000); // 5s absolute fallback

    const initPush = async (session: any) => {
      if (Capacitor.getPlatform() === 'web') return; // Completely skip for web/PC

      const { PushNotifications } = await import('@capacitor/push-notifications');
      const status = await PushNotifications.checkPermissions();
      
      if (status.receive !== 'granted') {
        setShowPermissionGate(true);
      } else {
        PushNotificationService.init();
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session) {
        setSession(session);
        prefetchHomeData();
        initPush(session);
        checkAdminStatus(session.user.id, session.user.email).finally(() => {
          clearTimeout(authTimeout);
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) setLoading(false);
            }, 500);
          }
        });
      } else {
        clearTimeout(authTimeout);
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 500);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      setSession(session);
      if (session) {
        initPush(session);
        checkAdminStatus(session.user.id, session.user.email).finally(() => {
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) setLoading(false);
            }, 500);
          }
        });
      } else {
        setIsAdmin(false);
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 500);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string, email?: string) => {
    // Check if it's the primary admin phone number
    const isPrimaryAdmin = email?.startsWith('01993879904');

    const { data, error } = await supabase
      .from('profiles')
      .select('role, phone')
      .eq('id', userId)
      .maybeSingle();

    if (isPrimaryAdmin || data?.role === 'admin' || data?.phone === '01993879904') {
      setIsAdmin(true);
    } else if (!data && !error && isPrimaryAdmin) {
      // If profile doesn't exist but it is the primary admin phone, create it.
      await supabase.from('profiles').insert({
        id: userId,
        phone: '01993879904',
        role: 'admin'
      });
      setIsAdmin(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4 select-none">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <Logo imgClassName="h-14 sm:h-16" />
          <div className="w-8 h-8 border-3 border-[#32CD32] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (showPermissionGate && session) {
    return (
      <div className="fixed inset-0 z-[200] bg-[var(--background)] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mx-auto mb-8">
            <Bell size={40} className="animate-bounce" />
          </div>
          <h2 className="text-xl font-black text-[var(--text)] mb-3">নোটিফিকেশন পারমিশন</h2>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
            আপনার কোর্সের গুরুত্বপূর্ণ আপডেট ও পরীক্ষার রুটিন সাথে সাথে পেতে নোটিফিকেশন এলাও করা প্রয়োজন।
          </p>
          
          <div className="space-y-3">
            <button
              onClick={async () => {
                await PushNotificationService.init();
                // Check status again after init
                setTimeout(async () => {
                  if (Capacitor.getPlatform() !== 'web') {
                    const { PushNotifications } = await import('@capacitor/push-notifications');
                    const { LocalNotifications } = await import('@capacitor/local-notifications');
                    const status = await PushNotifications.checkPermissions();
                    const lStatus = await LocalNotifications.checkPermissions();
                    
                    if (status.receive === 'granted' || lStatus.display === 'granted') {
                      setShowPermissionGate(false);
                    }
                  }
                }, 1500);
              }}
              className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-xl shadow-lg shadow-[var(--primary)]/20 active:scale-95"
            >
              এগিয়ে যান (এলাও করুন)
            </button>
            
            <button
              onClick={async () => {
                await PushNotificationService.sendTestNotification();
              }}
              className="w-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl active:scale-95"
            >
              সিস্টেম চেক করুন
            </button>

            <button 
              onClick={() => setShowPermissionGate(false)}
              className="mt-4 text-xs text-gray-400 font-bold w-full py-2"
            >
              পরে করবো (অ্যাপে প্রবেশ করুন)
            </button>
          </div>
          
          <p className="mt-8 text-[10px] text-gray-400 px-6">
            যদি পারমিশন না আসে, তবে ফোনের Settings {'>'} Apps {'>'} PolyGuide {'>'} Notifications-এ গিয়ে ম্যানুয়ালি অন করুন।
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={<Login session={session} />} 
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
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/dashboard" replace />} />
          <Route path="/admin/course/:id/users" element={isAdmin ? <AdminCourseUsers /> : <Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Layer Routes (Standalone Pages) */}
          <Route path="/marketplace" element={<MarketplaceHome />} />
          <Route path="/marketplace/post" element={<MarketplacePost />} />
          <Route path="/marketplace/my-posts" element={<MarketplaceMyPosts />} />
          <Route path="/marketplace/book/:id" element={<MarketplaceBookDetails />} />
          <Route path="/verify-account" element={<VerificationApply />} />
          <Route path="/books-pdf" element={<PdfBooksPage />} />
          <Route path="/book-list" element={<BookList />} />
          <Route path="/notices" element={<NoticeBoard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/more" element={<More />} />
          <Route path="/messages" element={<Messages />} />
        </Route>

        {/* Info Pages (Public/Standalone) */}
        <Route element={<InfoLayout />}>
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
        </Route>

        <Route path="*" element={session ? <Navigate to="/home" replace /> : <Navigate to="/" replace />} />
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
