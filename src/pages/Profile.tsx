import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building2, Camera, Loader2, Edit2, Check, X, BadgeCheck, ShieldCheck } from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  polytechnic_name: string | null;
  avatar_url: string | null;
  role?: string | null;
  is_verified?: boolean | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({
    full_name: '',
    phone: '',
    address: '',
    polytechnic_name: '',
    avatar_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setEmail(user.email || null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        let phoneNum = data.phone || '';
        
        // Auto-extract phone from placeholder email if needed
        if (!phoneNum && user.email?.endsWith('@polyguid.com')) {
          const extracted = user.email.split('@')[0];
          if (/^\d+$/.test(extracted)) {
            phoneNum = extracted;
          }
        }

        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          phone: phoneNum,
          address: data.address || '',
          polytechnic_name: data.polytechnic_name || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setStatusMsg(null);
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Only update the text fields, keep the existing avatar_url
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editForm.full_name,
          phone: editForm.phone,
          address: editForm.address,
          polytechnic_name: editForm.polytechnic_name,
          avatar_url: profile?.avatar_url || null // Preserve existing avatar
        });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMsg(null);
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');
      
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar, preserving other fields
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          avatar_url: publicUrl,
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          address: profile?.address || null,
          polytechnic_name: profile?.polytechnic_name || null
        });

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Failed to upload profile picture.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#32CD32]" size={40} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-4 sm:mb-8 flex justify-between items-center sm:items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">আমার প্রোফাইল</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">আপনার তথ্য এবং সেটিংস ম্যানেজ করুন।</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/verify-account')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg transition-all font-medium text-sm whitespace-nowrap border border-blue-500/20 shadow-sm"
          >
            <ShieldCheck size={16} /> ভেরিফিকেশন আবেদন
          </button>

          {/* Edit Button moved outside the card */}
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/5 dark:bg-white/10 hover:bg-[var(--primary)]/20 text-gray-600 dark:text-gray-300 hover:text-[var(--primary)] rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              <Edit2 size={14} /> এডিট
            </button>
          )}
        </div>
      </header>

      <GlassmorphicCard className="p-4 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 shrink-0">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 border-2 sm:border-4 border-white dark:border-[#333] shadow-md flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-gray-400 dark:text-gray-600" />
              )}
              
              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                {uploading ? (
                  <Loader2 className="animate-spin text-white" size={24} />
                ) : (
                  <>
                    <Camera className="text-white mb-1" size={24} />
                    <span className="text-white text-xs font-medium">পরিবর্তন</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </label>
            </div>
            
            {isEditing ? (
              <input
                type="text"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-[var(--text)] text-center w-full focus:outline-none focus:border-[var(--primary)] text-sm"
                placeholder="Full Name"
              />
            ) : (
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] text-center flex items-center justify-center gap-1">
                {profile?.full_name || 'Student'}
                {(profile?.is_verified || profile?.role === 'admin') && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-[1.125rem] h-[1.125rem] shrink-0" size={16} />}
              </h2>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 w-full grid grid-cols-1 gap-3 sm:gap-6">
            {statusMsg && statusMsg.type === 'error' && (
              <div className="p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium bg-red-500/10 text-red-500">
                {statusMsg.text}
              </div>
            )}

            {/* Phone Number - PRIMARY */}
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:bg-black/5 sm:dark:bg-white/5 sm:border sm:border-gray-200 sm:dark:border-white/10 sm:ring-2 sm:ring-[var(--primary)]/20 sm:shadow-lg sm:shadow-[var(--primary)]/5 border-b border-gray-100 dark:border-white/5 sm:border-b-0">
              <div className="p-2 sm:p-3 rounded-lg bg-[var(--primary)]/10 sm:bg-[var(--primary)]/20 text-[var(--primary)] shrink-0">
                <Phone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">ফোন নম্বর (প্রাথমিক আইডি)</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-[var(--text)] w-full focus:outline-none focus:border-[var(--primary)] mt-1 text-sm"
                    placeholder="01XXX XXXXXX"
                  />
                ) : (
                  <p className="text-[var(--text)] font-bold text-base sm:text-lg truncate">{editForm.phone || 'Not provided'}</p>
                )}
              </div>
            </div>


            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:bg-black/5 sm:dark:bg-white/5 sm:border sm:border-gray-200 sm:dark:border-white/10 border-b border-gray-100 dark:border-white/5 sm:border-b-0">
              <div className="p-2 sm:p-3 rounded-lg bg-[var(--primary)]/10 sm:bg-[var(--primary)]/20 text-[var(--primary)] shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">ঠিকানা</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-[var(--text)] w-full focus:outline-none focus:border-[var(--primary)] mt-1 text-sm"
                    placeholder="Your Address"
                  />
                ) : (
                  <p className="text-[var(--text)] font-medium text-sm sm:text-base truncate">{profile?.address || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:bg-black/5 sm:dark:bg-white/5 sm:border sm:border-gray-200 sm:dark:border-white/10 border-b border-gray-100 dark:border-white/5 sm:border-b-0">
              <div className="p-2 sm:p-3 rounded-lg bg-[var(--primary)]/10 sm:bg-[var(--primary)]/20 text-[var(--primary)] shrink-0">
                <Building2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">পলিটেকনিক ইনস্টিটিউট</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.polytechnic_name || ''}
                    onChange={(e) => setEditForm({...editForm, polytechnic_name: e.target.value})}
                    className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-[var(--text)] w-full focus:outline-none focus:border-[var(--primary)] mt-1 text-sm"
                    placeholder="Institute Name"
                  />
                ) : (
                  <p className="text-[var(--text)] font-medium text-sm sm:text-base truncate">{profile?.polytechnic_name || 'Not provided'}</p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 sm:gap-3 mt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to current profile
                    setEditForm({
                      full_name: profile?.full_name || '',
                      phone: profile?.phone || '',
                      address: profile?.address || '',
                      polytechnic_name: profile?.polytechnic_name || '',
                      avatar_url: profile?.avatar_url || ''
                    });
                  }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-[var(--text)] font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
                  disabled={saving}
                >
                  <X size={16} /> বাতিল
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[var(--primary)] hover:bg-[#28a428] text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/20"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  সেভ
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );
}
