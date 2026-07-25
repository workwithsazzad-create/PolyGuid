import React, { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";
import { Save, AlertCircle, CheckCircle2, Loader2, Pencil, X } from "lucide-react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminPages() {
  const [settings, setSettings] = useState({
    home_banner: "",
    page_about: "",
    page_privacy: "",
    page_terms: "",
    page_refund: "",
    contact_email: "workwithsazzad@gmail.com",
    contact_phone: "+8801828***664",
    contact_address: "৭৮ গ্রিন রোড, ঢাকা ১২১৫",
    social_fb: "",
    social_ig: "",
    social_yt: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingPage, setEditingPage] = useState<{ key: string; label: string } | null>(null);
  const [tempContent, setTempContent] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const newSettings = { ...settings };
      data.forEach((item) => {
        if (item.key in newSettings) {
          (newSettings as any)[item.key] = item.value;
        }
      });
      setSettings(newSettings);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        const { data: existing } = await supabase.from("site_settings").select("key").eq("key", key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("site_settings").insert({ key, value });
        }
      }
      setStatusMsg({ type: "success", text: "Settings saved successfully!" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPage = (key: string, label: string) => {
    setTempContent((settings as any)[key] || "");
    setEditingPage({ key, label });
  };

  const handleSavePageContent = () => {
    if (editingPage) {
      setSettings(prev => ({ ...prev, [editingPage.key]: tempContent }));
      setEditingPage(null);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6 relative">
      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
          statusMsg.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {statusMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMsg.text}
        </div>
      )}

      {/* Pages Content */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold">Pages Settings</h2>
          <p className="text-sm text-gray-500">Edit content for info pages</p>
        </div>
        
        <div className="space-y-4">
          {[
            { key: 'page_about', label: 'About Us (আমাদের সম্পর্কে)' },
            { key: 'page_privacy', label: 'Privacy Policy (প্রাইভেসি পলিসি)' },
            { key: 'page_terms', label: 'Terms & Conditions (ব্যবহারকারীর শর্তাবলি)' },
            { key: 'page_refund', label: 'Refund Policy (রিফান্ড পলিসি)' }
          ].map((page) => (
            <div key={page.key} className="flex items-center justify-between p-4 border border-black/10 rounded-xl bg-gray-50 dark:bg-white/5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{page.label}</span>
              <button
                onClick={() => handleEditPage(page.key, page.label)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm border border-black/5 hover:text-[var(--primary)] transition-colors"
                title={`Edit ${page.label}`}
              >
                <Pencil size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Global Banner */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold">Home Banner</h2>
          <p className="text-sm text-gray-500">Global banner image URL</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Banner Image URL</label>
            <input type="text" name="home_banner" value={settings.home_banner || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold">Contact Details</h2>
          <p className="text-sm text-gray-500">Edit contact email, address, and phone number</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Contact Email</label>
            <input type="email" name="contact_email" value={settings.contact_email || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Contact Phone (Call Now Option)</label>
            <input type="text" name="contact_phone" value={settings.contact_phone || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Contact Address</label>
            <input type="text" name="contact_address" value={settings.contact_address || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold">Social Links</h2>
          <p className="text-sm text-gray-500">URLs for social media icons</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Facebook URL</label>
            <input type="url" name="social_fb" value={settings.social_fb || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Instagram URL</label>
            <input type="url" name="social_ig" value={settings.social_ig || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">YouTube URL</label>
            <input type="url" name="social_yt" value={settings.social_yt || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--primary)]" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Quill Editor Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <h3 className="font-bold text-lg">Editing: {editingPage.label}</h3>
              <button onClick={() => setEditingPage(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-black/20">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-black/10 dark:border-white/10" style={{ minHeight: '400px' }}>
                <ReactQuill 
                  theme="snow" 
                  value={tempContent} 
                  onChange={setTempContent}
                  modules={quillModules}
                  className="h-[350px]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 bg-white dark:bg-[#1a1a1a]">
              <button 
                onClick={() => setEditingPage(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePageContent}
                className="px-5 py-2.5 rounded-xl font-bold bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 hover:opacity-90 transition-opacity"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
