import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Loader2, 
  Phone, 
  User, 
  Shield, 
  Lock,
  MoreVertical,
  Check,
  AlertCircle
} from 'lucide-react';
import GlassmorphicCard from '../ui/GlassmorphicCard';

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  address?: string;
  polytechnic?: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setMessage({ type: 'success', text: 'User profile deleted from database.' });
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setMessage({ type: 'error', text: 'Failed to delete user.' });
    }
  };

  const handleEdit = (user: Profile) => {
    setCurrentUser(user);
    setPassword('');
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: currentUser.full_name,
            phone: currentUser.phone,
            role: currentUser.role,
            address: currentUser.address,
            polytechnic: currentUser.polytechnic
          })
          .eq('id', currentUser.id);

        if (error) throw error;
        
        // Note: Password can't be updated for other users from client-side without service role or Edge Functions
        if (password) {
          setMessage({ type: 'error', text: 'Name and Phone updated, but password can only be changed by the user themselves for security reasons.' });
        } else {
          setMessage({ type: 'success', text: 'User updated successfully.' });
        }
        
        fetchUsers();
        setIsEditing(false);
      } else if (isAdding) {
        // Adding a user usually involves Supabase Auth. 
        // We'll simulate creating the profile, but they'd need to sign up for auth.
        // For a real manual add, you'd need an admin Edge Function.
        
        const dummyEmail = `${currentUser.phone?.replace(/\+/g, '')}@polyguid.com`;
        
        // Try creating Auth user (might fail if already logged in as admin)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: dummyEmail,
          password: password || '12345678', // Default password if not provided
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: currentUser.full_name,
              phone: currentUser.phone,
              role: currentUser.role || 'student',
              address: currentUser.address,
              polytechnic: currentUser.polytechnic
            });

          if (profileError) throw profileError;
        }

        setMessage({ type: 'success', text: 'User added successfully.' });
        fetchUsers();
        setIsAdding(false);
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setMessage({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
            <Users className="text-[var(--primary)]" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Manage Users</h2>
            <p className="text-xs text-gray-500">Total Registered Users: {users.length}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setCurrentUser({});
            setPassword('');
            setIsAdding(true);
            setIsEditing(false);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      <GlassmorphicCard className="p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
          />
        </div>

        <div className="overflow-x-auto shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User Info</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin inline-block text-[var(--primary)]" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center text-[var(--primary)] font-bold">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text)] text-sm">{user.full_name || 'N/A'}</p>
                          <p className="text-[10px] text-gray-500">{user.polytechnic || 'No Polytechnic'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-[var(--text)]">{user.phone}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{user.address || 'No address'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' 
                          : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setUserToDelete({ id: user.id, name: user.full_name })}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassmorphicCard>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete User?</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <span className="text-gray-900 dark:text-white font-semibold">"{userToDelete.name}"</span>? This will remove them from the database.
                </p>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center gap-3">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center text-[var(--primary)]">
                    {isAdding ? <Plus size={22} /> : <Edit2 size={22} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text)]">
                      {isAdding ? 'Add New User' : 'Edit User Profile'}
                    </h3>
                  </div>
                </div>
                <button onClick={() => { setIsAdding(false); setIsEditing(false); setMessage(null); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        required
                        type="text"
                        value={currentUser.full_name || ''}
                        onChange={e => setCurrentUser({...currentUser, full_name: e.target.value})}
                        placeholder="e.g. Sazzad Hossein"
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        required
                        type="text"
                        value={currentUser.phone || ''}
                        onChange={e => setCurrentUser({...currentUser, phone: e.target.value})}
                        placeholder="019XXXXXXXX"
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Polytechnic</label>
                    <input 
                      type="text"
                      value={currentUser.polytechnic || ''}
                      onChange={e => setCurrentUser({...currentUser, polytechnic: e.target.value})}
                      placeholder="e.g. Dhaka Polytechnic"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">User Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <select 
                        value={currentUser.role || 'student'}
                        onChange={e => setCurrentUser({...currentUser, role: e.target.value})}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] appearance-none"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-span-full flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address</label>
                    <input 
                      type="text"
                      value={currentUser.address || ''}
                      onChange={e => setCurrentUser({...currentUser, address: e.target.value})}
                      placeholder="e.g. Dhaka, Bangladesh"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="col-span-full flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      {isAdding ? 'Set Password (Required)' : 'Reset Password (Leave blank to keep current)'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required={isAdding}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>
                    {isEditing && (
                      <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Password reset for others via client SDK is security-restricted by Supabase.
                      </p>
                    )}
                  </div>
                </div>

                {message && (
                  <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    {message.text}
                  </div>
                )}

                <div className="mt-8 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsAdding(false); setIsEditing(false); setMessage(null); }}
                    className="flex-1 px-6 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-[var(--primary)] text-white font-bold py-3 rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : isAdding ? 'Create User' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
