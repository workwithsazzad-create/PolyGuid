import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Camera, UploadCloud, Loader2, BadgeCheck } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import departmentDataJson from '@/src/data/booklist_2022.json';

const ALL_DEPARTMENTS = departmentDataJson.map((d: any) => d.name);

const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

export default function MarketplacePost() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    semester: '',
    department: '',
    title: '',
    price: '',
    description: '',
    phone: '',
    whatsapp: '',
    district: '',
    upazila: '',
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState('');
  
  const [deptSearch, setDeptSearch] = useState('');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const deptInputRef = useRef<HTMLInputElement>(null);

  const [semSearch, setSemSearch] = useState('');
  const [showSemDropdown, setShowSemDropdown] = useState(false);
  const semInputRef = useRef<HTMLInputElement>(null);

  const [distSearch, setDistSearch] = useState('');
  const [showDistDropdown, setShowDistDropdown] = useState(false);
  const distInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Hide dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (deptInputRef.current && !deptInputRef.current.contains(event.target as Node)) {
        setShowDeptDropdown(false);
      }
      if (semInputRef.current && !semInputRef.current.contains(event.target as Node)) {
        setShowSemDropdown(false);
      }
      if (distInputRef.current && !distInputRef.current.contains(event.target as Node)) {
        setShowDistDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [deptInputRef, semInputRef, distInputRef]);

  const filteredDepartments = ALL_DEPARTMENTS.filter(d => 
    d.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const filteredSemesters = [1,2,3,4,5,6,7,8].map(s => s.toString()).filter(s => 
    s.includes(semSearch)
  );

  const filteredDistricts = DISTRICTS.filter(d => 
    d.toLowerCase().includes(distSearch.toLowerCase())
  );

  const handleNext = () => {
    if (step === 1 && (!formData.semester || !formData.department)) return alert('Please select semester and department from the suggestions');
    if (step === 2 && (!formData.title || !formData.price || !formData.description)) return alert('Please fill all details');
    if (step === 3 && (!formData.phone || !formData.district || !formData.upazila)) return alert('Please fill required contact info');
    setStep(prev => prev + 1);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.image) return alert('Please upload a photo of the book');
    
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // 1. Upload image
      const fileExt = formData.image.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('marketplace')
        .upload(filePath, formData.image);
        
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('marketplace')
        .getPublicUrl(filePath);

      // 2. Save book to DB
      const { error: insertError } = await supabase.from('marketplace_books').insert({
        user_id: session.user.id,
        title: formData.title,
        semester: formData.semester,
        department: formData.department,
        price: parseFloat(formData.price),
        description: formData.description,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        district: formData.district,
        upazila: formData.upazila,
        image_url: publicUrlData.publicUrl,
        status: 'active'
      });

      if (insertError) throw insertError;
      
      alert('Book posted successfully!');
      navigate('/marketplace');
      
    } catch (err: any) {
      console.error(err);
      alert('Error posting book: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <header className="bg-white dark:bg-[#121212] border-b border-black/5 dark:border-white/5 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-center">
          <h1 className="text-xl font-black text-[var(--text)]">Post a Book</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full p-4 py-8">
        {/* Stepper */}
        <div className="flex justify-between items-center mb-10 px-2 sm:px-8 relative">
           <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 dark:bg-white/10 -z-10" />
           {[ { n: 1, label: 'Category' }, { n: 2, label: 'Details' }, { n: 3, label: 'Contact' }, { n: 4, label: 'Photos' } ].map(s => (
             <div key={s.n} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${step > s.n ? 'bg-[#32CD32] text-white' : step === s.n ? 'bg-[#32CD32] text-white ring-4 ring-[#32CD32]/20' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                  {step > s.n ? <Check size={14} /> : s.n}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.n ? 'text-[#32CD32]' : 'text-gray-400'}`}>{s.label}</span>
             </div>
           ))}
        </div>

        {/* Forms */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 sm:p-8 border border-black/5 dark:border-white/10 shadow-sm">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2 relative" ref={semInputRef}>
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Select Semester</label>
                <input 
                  type="text"
                  placeholder="Type semester (1-8)..."
                  value={semSearch}
                  onChange={e => {
                    setSemSearch(e.target.value);
                    setFormData({...formData, semester: ''});
                    setShowSemDropdown(true);
                  }}
                  onFocus={() => setShowSemDropdown(true)}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32]"
                />
                {(showSemDropdown && semSearch) && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-40 overflow-y-auto bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20">
                    {filteredSemesters.length > 0 ? (
                      filteredSemesters.map((s, i) => (
                        <div 
                          key={i}
                          className="px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[#32CD32] hover:text-white cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData({...formData, semester: s});
                            setSemSearch(s + " Semester");
                            setShowSemDropdown(false);
                          }}
                        >
                          {s} Semester
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No semesters found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2 relative" ref={deptInputRef}>
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Select Department</label>
                <input 
                  type="text"
                  placeholder="Type department name..."
                  value={deptSearch}
                  onChange={e => {
                    setDeptSearch(e.target.value);
                    setFormData({...formData, department: ''});
                    setShowDeptDropdown(true);
                  }}
                  onFocus={() => setShowDeptDropdown(true)}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32]"
                />
                {(showDeptDropdown && deptSearch) && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20">
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map((dept, i) => (
                        <div 
                          key={i}
                          className="px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[#32CD32] hover:text-white cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData({...formData, department: dept});
                            setDeptSearch(dept);
                            setShowDeptDropdown(false);
                          }}
                        >
                          {dept}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No departments found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Book Name</label>
                <input 
                  type="text" placeholder="e.g. Engineering Mechanics"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Price (৳)</label>
                <input 
                  type="number" placeholder="250"
                  value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Description</label>
                <textarea 
                  rows={4} placeholder="Describe the book condition..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32] resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Phone Number</label>
                <input 
                  type="tel" placeholder="01XXXXXXXXX"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">WhatsApp Number</label>
                <input 
                  type="tel" placeholder="01XXXXXXXXX (Optional)"
                  value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32]"
                />
              </div>
              <div className="space-y-2 relative" ref={distInputRef}>
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">District</label>
                <input 
                  type="text"
                  placeholder="Type district name..."
                  value={distSearch}
                  onChange={e => {
                    setDistSearch(e.target.value);
                    setFormData({...formData, district: ''});
                    setShowDistDropdown(true);
                  }}
                  onFocus={() => setShowDistDropdown(true)}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32]"
                />
                {(showDistDropdown && distSearch) && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20">
                    {filteredDistricts.length > 0 ? (
                      filteredDistricts.map((d, i) => (
                        <div 
                          key={i}
                          className="px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[#32CD32] hover:text-white cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData({...formData, district: d});
                            setDistSearch(d);
                            setShowDistDropdown(false);
                          }}
                        >
                          {d}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No districts found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Upazila / Thana</label>
                <input 
                  type="text" placeholder="e.g. Mirpur"
                  value={formData.upazila} onChange={e => setFormData({...formData, upazila: e.target.value})}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-[#32CD32]"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Upload Book Photo</label>
                <div className="relative border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl overflow-hidden group hover:border-[#32CD32] transition-colors">
                  <input 
                    type="file" accept="image/*" onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imagePreview ? (
                    <div className="aspect-video relative">
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg">Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-gray-500 group-hover:text-[#32CD32] transition-colors">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#32CD32]/10">
                        <Camera size={32} />
                      </div>
                      <p className="font-bold text-sm">Click to upload photo</p>
                      <p className="text-[10px] uppercase tracking-widest mt-2 opacity-50">Max size: 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-black/5 dark:border-white/5">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-bold text-[var(--text)] transition-colors">
                Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNext} className="flex-[2] py-3.5 bg-[#32CD32] hover:bg-[#28a428] rounded-xl font-bold text-white shadow-[0_8px_20px_rgba(50,205,50,0.3)] transition-all active:scale-[0.98]">
                Next →
              </button>
            ) : (
              <button 
                onClick={handleSubmit} disabled={isSubmitting}
                className="flex-[2] py-3.5 bg-[#32CD32] hover:bg-[#28a428] disabled:opacity-70 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-[0_8px_20px_rgba(50,205,50,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Posting...</> : <><UploadCloud size={20} /> Post Book</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
