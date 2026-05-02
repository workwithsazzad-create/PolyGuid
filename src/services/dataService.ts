import { supabase } from '../lib/supabase';

export interface HomeCache {
  bannerUrl: string;
  allCourses: any[];
  stats: { courses: number; students: number; polytechnics: number };
  enrollments: any[];
  donationNumber: string;
  approvedDonations: any[];
}

export let homeCache: HomeCache | null = null;

export const setHomeCache = (cache: HomeCache) => {
  homeCache = cache;
};

export const prefetchHomeData = async () => {
  try {
    const coursesPromise = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    const sessionRes = await supabase.auth.getSession();
    const session = sessionRes.data?.session;

    const bannerPromise = supabase
      .from('site_settings')
      .select('key, value')
      .eq('key', 'home_banner')
      .maybeSingle();

    const statsPromise = supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['stat_courses', 'stat_students', 'stat_polytechnics', 'donation_number', 'pinned_courses']);

    const donationsPromise = supabase
      .from('donations')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const [
      coursesRes,
      bannerRes,
      statsRes,
      donationsRes
    ] = await Promise.all([
      coursesPromise,
      bannerPromise,
      statsPromise,
      donationsPromise
    ]);

    const coursesData = coursesRes.data;
    const bannerData = bannerRes.data;
    const statsData = statsRes.data;
    const donationsData = donationsRes.data;

    let pinnedMap: Record<string, number> = {};
    if (statsData) {
      statsData.forEach((item: any) => {
         if (item.key === 'pinned_courses') {
            try { pinnedMap = JSON.parse(item.value); } catch(e) {}
         }
      });
    }

    const newCache: HomeCache = {
      bannerUrl: bannerData?.value || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
      allCourses: [],
      stats: { courses: 150, students: 20000, polytechnics: 49 },
      enrollments: [],
      donationNumber: '01993879904',
      approvedDonations: donationsData || []
    };

    if (coursesData) {
      newCache.allCourses = coursesData.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        price: c.price,
        originalPrice: c.original_price,
        thumbnail: c.thumbnail_url || "https://placehold.co/600x400/1a1a1a/32CD32?text=New+Course",
        classes: c.classes_count,
        categories: c.categories || [],
        pinned_position: pinnedMap[c.id] || null
      }));
    }

    if (session) {
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', session.user.id);
      
      if (enrollmentsData) {
        newCache.enrollments = enrollmentsData;
      }
    }

    if (statsData) {
      statsData.forEach((item: any) => {
         if (item.key === 'stat_courses' && item.value) newCache.stats.courses = parseInt(item.value, 10) || 150;
         if (item.key === 'stat_students' && item.value) newCache.stats.students = parseInt(item.value, 10) || 20000;
         if (item.key === 'stat_polytechnics' && item.value) newCache.stats.polytechnics = parseInt(item.value, 10) || 49;
         if (item.key === 'donation_number' && item.value) newCache.donationNumber = item.value;
      });
    }

    homeCache = newCache;
    return newCache;
  } catch (err) {
    console.error('Error prefetching home data:', err);
    return null;
  }
};
