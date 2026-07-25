import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  ArrowLeft,
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminCourseUsers() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTab = searchParams.get('tab') || 'courses';
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add User Modal State
  const [userSearchText, setUserSearchText] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchCourseAndUsers();
  }, [courseId]);

  const fetchCourseAndUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch Course Details
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();
      
      setCourse(courseData);

      // Auto-migrate legacy approved donations into enrollments for this course
      const { data: legacyApproved } = await supabase
        .from('donations')
        .select('user_id')
        .eq('course_id', courseId)
        .eq('status', 'approved')
        .not('user_id', 'is', null);
      
      if (legacyApproved && legacyApproved.length > 0) {
        // Find existing to avoid bulk upsert failure if no unique conflict index exists
        const { data: existingE } = await supabase.from('enrollments').select('user_id').eq('course_id', courseId);
        const existingIds = new Set(existingE?.map(e => e.user_id) || []);
        
        const enrollmentsToInsert = legacyApproved
          .filter((d: any) => !existingIds.has(d.user_id))
          .map((d: any) => ({
            user_id: d.user_id,
            course_id: courseId
          }));
        if (enrollmentsToInsert.length > 0) {
          try {
            await supabase.from('enrollments').insert(enrollmentsToInsert);
          } catch(e) {}
        }
      }

      // Fetch Enrolled Users from enrollments table
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('user_id, created_at')
        .eq('course_id', courseId);

      // Fetch users who have approved payments for this course
      const { data: approvedPayments } = await supabase
        .from('payments')
        .select('id, user_id, phone, created_at')
        .eq('course_id', courseId)
        .eq('status', 'approved');

      // Fetch users who have approved donations for this course
      const { data: approvedDonations } = await supabase
        .from('donations')
        .select('id, user_id, phone, created_at')
        .eq('course_id', courseId)
        .eq('status', 'approved');

      // Combine user IDs and unique them
      const userMap = new Map<string, string>(); // user_id -> created_at
      const unauthUsers: any[] = [];
      
      enrollmentData?.forEach(e => {
        if (e.user_id) userMap.set(e.user_id, e.created_at);
      });
      
      approvedPayments?.forEach(p => {
        if (p.user_id && !userMap.has(p.user_id)) {
          userMap.set(p.user_id, p.created_at);
        } else if (!p.user_id) {
          unauthUsers.push({
            user_id: p.id,
            created_at: p.created_at,
            profiles: {
              full_name: 'Guest User (Payment)',
              phone: p.phone || 'N/A',
              polytechnic_name: 'N/A'
            }
          });
        }
      });

      approvedDonations?.forEach(d => {
        if (d.user_id && !userMap.has(d.user_id)) {
          userMap.set(d.user_id, d.created_at);
        } else if (!d.user_id) {
          unauthUsers.push({
            user_id: d.id,
            created_at: d.created_at,
            profiles: {
              full_name: 'Guest User (Donation)',
              phone: d.phone || 'N/A',
              polytechnic_name: 'N/A'
            }
          });
        }
      });

      const userIds = Array.from(userMap.keys());
      let combined = [...unauthUsers];

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, phone, polytechnic_name')
          .in('id', userIds);

        const authCombined = userIds.map(uid => ({
          user_id: uid,
          created_at: userMap.get(uid),
          profiles: profileData?.find(p => p.id === uid) || null
        }));
        
        combined = [...authCombined, ...combined];
      }
      
      setEnrolledUsers(combined);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async (val: string) => {
    setUserSearchText(val);
    if (val.length < 3) {
      setFoundUsers([]);
      return;
    }

    setSearchingUser(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, polytechnic_name')
        .or(`phone.ilike.%${val}%,full_name.ilike.%${val}%`)
        .limit(5);

      if (error) throw error;
      setFoundUsers(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddUserToCourse = async () => {
    if (!selectedUserId || !courseId) return;

    setAddingUser(true);
    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', selectedUserId)
        .maybeSingle();

      if (existing) {
        alert('This user is already enrolled in this course.');
        return;
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          user_id: selectedUserId
        });

      if (error) throw error;

      // Log manual transaction record in payments
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .eq('id', selectedUserId)
          .maybeSingle();

        const manualTrxId = `MANUAL-${Date.now().toString(36).toUpperCase()}`;
        await supabase.from('payments').insert([{
          phone: userProfile?.phone || userProfile?.full_name || 'Admin Manual',
          method: 'admin_manual',
          transaction_id: manualTrxId,
          amount: 0,
          type: 'course',
          course_id: courseId,
          user_id: selectedUserId,
          status: 'approved'
        }]);
      } catch (logErr) {
        console.error('Error logging manual payment:', logErr);
      }

      setShowAddModal(false);
      setSelectedUserId(null);
      setUserSearchText('');
      setFoundUsers([]);
      fetchCourseAndUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      alert('Failed to add user to course.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!userToDelete || !courseId) return;

    try {
      // Remove enrollment record so access is revoked
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .match({ 
          course_id: courseId, 
          user_id: userToDelete.id 
        });

      if (error) throw error;
      
      // Also update any payments/donations to rejected so they don't retain access
      await supabase.from('payments').update({ status: 'rejected' }).match({ course_id: courseId, user_id: userToDelete.id });
      await supabase.from('donations').update({ status: 'rejected' }).match({ course_id: courseId, user_id: userToDelete.id });

      // Update local state to reflect deletion immediately
      setEnrolledUsers(prev => prev.filter(item => item.user_id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      alert('Failed to remove user from course.');
    }
  };

  const filteredUsers = enrolledUsers.filter(item => {
    const profile = item.profiles;
    
    return (
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.phone?.includes(searchQuery)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/admin?tab=${returnTab}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-[var(--primary)]" />
              {returnTab === 'pdf' ? 'Book Users' : 'Student List'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {returnTab === 'pdf' ? 'Book' : 'Course'}: <span className="text-[var(--primary)] font-medium">{course?.title}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl hover:bg-opacity-90 transition-all font-medium"
        >
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats and Search */}
      <div className="glass rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Total Users: <span className="text-[var(--primary)]">{enrolledUsers.length}</span>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
            />
          </div>
        </div>
      </div>

      {/* User Table/List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--glass-border)]">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Polytechnic</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Date Joined</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {filteredUsers.length > 0 ? filteredUsers.map((item) => (
                <tr key={item.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.profiles?.full_name || 'No Name'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {item.profiles?.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {item.profiles?.polytechnic_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setUserToDelete({ 
                        id: item.user_id, 
                        name: item.profiles?.full_name || 'this user' 
                      })}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove User"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found for this {returnTab === 'pdf' ? 'book' : 'course'}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enroll New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search User (Name/Phone)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    value={userSearchText}
                    onChange={(e) => handleSearchUser(e.target.value)}
                    placeholder="Enter phone or name..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)] border-none"
                  />
                  {searchingUser && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {foundUsers.length > 0 && !selectedUserId && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
                    {foundUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setUserSearchText(`${u.full_name} -- ${u.phone}`);
                          setFoundUsers([]);
                        }}
                        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-none border-gray-100 dark:border-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{u.full_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.phone} • {u.polytechnic_name || 'N/A'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedUserId && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">User selected successfully</span>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                Close
              </button>
              <button 
                onClick={handleAddUserToCourse}
                disabled={!selectedUserId || addingUser}
                className={cn(
                  "px-8 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold shadow-lg transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:scale-100",
                  addingUser && "flex items-center gap-2"
                )}
              >
                {addingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remove User?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Are you sure you want to remove <span className="text-gray-900 dark:text-white font-semibold">"{userToDelete.name}"</span> from this course? This action cannot be undone.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                No, Keep
              </button>
              <button 
                onClick={handleDeleteEnrollment}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
