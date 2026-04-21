import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { User, Mail, Phone, MapPin, Building2, Camera, Loader2, Edit2, Check, X } from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';

interface UserProfile {
  full_name: string | null;
  phone_number: string | null;
  address: string | null;
  polytechnic_name: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({
    full_name: '',
    phone_number: '',
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
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
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
          phone_number: editForm.phone_number,
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
          phone_number: profile?.phone_number || null,
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
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your personal information and settings.</p>
        </div>
        
        {/* Edit Button moved outside the card */}
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-[var(--primary)]/20 text-gray-600 dark:text-gray-300 hover:text-[var(--primary)] rounded-lg transition-colors font-medium text-sm"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        )}
      </header>

      <GlassmorphicCard className="p-8 relative">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border-2 border-[var(--primary)]/50 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-gray-400 dark:text-gray-500" />
              )}
              
              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                {uploading ? (
                  <Loader2 className="animate-spin text-white" size={24} />
                ) : (
                  <>
                    <Camera className="text-white mb-1" size={24} />
                    <span className="text-white text-xs font-medium">Change</span>
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
                className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1 text-[var(--text)] text-center w-full focus:outline-none focus:border-[var(--primary)]"
                placeholder="Full Name"
              />
            ) : (
              <h2 className="text-xl font-bold text-[var(--text)] text-center">
                {profile?.full_name || 'Student'}
              </h2>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 w-full grid grid-cols-1 gap-6">
            {statusMsg && statusMsg.type === 'error' && (
              <div className="p-3 rounded-lg text-sm font-medium bg-red-500/10 text-red-500">
                {statusMsg.text}
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="p-3 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                <p className="text-[var(--text)] font-medium">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="p-3 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                <Phone size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone_number || ''}
                    onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                    className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1 text-[var(--text)] w-full focus:outline-none focus:border-[var(--primary)] mt-1"
                    placeholder="+880 1XXX XXXXXX"
                  />
                ) : (
                  <p className="text-[var(--text)] font-medium">{profile?.phone_number || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="p-3 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1 text-[var(--text)] w-full focus:outline-none focus:border-[var(--primary)] mt-1"
                    placeholder="Your Address"
                  />
                ) : (
                  <p className="text-[var(--text)] font-medium">{profile?.address || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="p-3 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                <Building2 size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Polytechnic Institute</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.polytechnic_name || ''}
                    onChange={(e) => setEditForm({...editForm, polytechnic_name: e.target.value})}
                    className="bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1 text-[var(--text)] w-full focus:outline-none focus:border-[var(--primary)] mt-1"
                    placeholder="Institute Name"
                  />
                ) : (
                  <p className="text-[var(--text)] font-medium">{profile?.polytechnic_name || 'Not provided'}</p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to current profile
                    setEditForm({
                      full_name: profile?.full_name || '',
                      phone_number: profile?.phone_number || '',
                      address: profile?.address || '',
                      polytechnic_name: profile?.polytechnic_name || '',
                      avatar_url: profile?.avatar_url || ''
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-[var(--text)] font-medium transition-colors flex items-center gap-2"
                  disabled={saving}
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[#28a428] text-white font-medium transition-colors flex items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );
}
