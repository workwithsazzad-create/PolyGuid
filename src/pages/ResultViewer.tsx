import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { 
  Search, 
  ChevronLeft, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap, 
  MapPin, 
  Calendar,
  Calculator,
  Building2,
  BookOpen,
  XCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { logoDarkB64, logoLightB64 } from '@/src/components/ui/logo-data';
import ResultCertificate from '@/src/components/ResultCertificate';

interface SemesterResult {
  index: number;
  status: 'Passed' | 'Referred';
  gpa?: number | string;
  referred_subjects?: string[];
  published_date?: string;
}

interface StudentResult {
  id: string;
  roll_no: string;
  student_name?: string;
  polytechnic_name: string;
  regulation: string;
  department: string;
  published_date?: string;
  semesters: SemesterResult[];
}

const DEPARTMENTS = [
  'Any',
  'Diploma in Engineering'
];

const REGULATIONS = ['Any', '2022'];

export default function ResultViewer() {
  const navigate = useNavigate();
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('Diploma in Engineering');
  const [regulation, setRegulation] = useState('2022');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadImage, setDownloadImage] = useState<string | null>(null);
  const [isProcessingCanvas, setIsProcessingCanvas] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rollNo.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let query = supabase
        .from('student_results')
        .select('*')
        .eq('roll_no', rollNo.trim());

      if (department !== 'Any') {
        // Find exact or similar department. Case insensitive if possible.
        query = query.ilike('department', `%${department}%`);
      }
      
      if (regulation !== 'Any') {
        query = query.eq('regulation', regulation);
      }

      // Execute query
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setError('আপনার রেজাল্ট খুঁজে পাওয়া যায়নি। রোল নম্বর এবং ডিপার্টমেন্ট সঠিক কিনা যাচাই করুন।');
      } else {
        // If multiple rows matched, take the first one
        const resultData = data[0]; 
        
        // Ensure semesters are sorted
        const sortedResult = {
          ...resultData,
          semesters: (resultData.semesters || []).sort((a: any, b: any) => a.index - b.index)
        };
        setResult(sortedResult);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('সার্ভারে সমস্যা হচ্ছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCGPA = (semesters: SemesterResult[]) => {
    const passedSemesters = semesters.filter(s => s.status === 'Passed' && s.gpa);
    if (passedSemesters.length === 0) return 0;
    
    const sum = passedSemesters.reduce((acc, curr) => acc + Number(curr.gpa), 0);
    return (sum / passedSemesters.length).toFixed(2);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Result for Roll #${result.roll_no}\nProgram: ${result.department}\nPolytechnic: ${result.polytechnic_name}\nCGPA: ${calculateCGPA(result.semesters)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!certificateRef.current || !result) return;
    setIsProcessingCanvas(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const image = await htmlToImage.toJpeg(certificateRef.current, {
        quality: 1.0,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement("a");
      link.href = image;
      link.download = `PolyGuid_Result_${result.roll_no}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error generating image", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsProcessingCanvas(false);
    }
  };

  const handleShare = async () => {
    if (!certificateRef.current || !result) return;
    setIsProcessingCanvas(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const image = await htmlToImage.toJpeg(certificateRef.current, {
        quality: 1.0,
        backgroundColor: '#ffffff',
      });
      
      // Fallback to Image Modal
      setDownloadImage(image);
      setIsProcessingCanvas(false);
    } catch (err) {
      console.error("Error sharing image", err);
      setIsProcessingCanvas(false);
    }
  };

  const allReferredSubjects = Array.from(new Set(result?.semesters.flatMap(sem => sem.referred_subjects || [])));
  const totalReferred = allReferredSubjects.length;

  return (
    <div className="max-w-4xl mx-auto pb-12 print:p-0 print:m-0">
      <div className="flex items-center gap-4 mb-8 print:hidden">
        <button 
          onClick={() => navigate('/home')}
          className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-gray-500 hover:text-[var(--text)] transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Check Result</h1>
      </div>

      <section className="mb-8 print:hidden">
        <div className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Curriculum / Exam</label>
              <div className="relative">
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full appearance-none bg-black/5 dark:bg-white/5 border border-transparent rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#32CD32] transition-all cursor-pointer"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept} className="bg-white dark:bg-[#1a1a1a] text-black dark:text-white">{dept}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Regulation</label>
              <div className="relative">
                <select 
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  className="w-full appearance-none bg-black/5 dark:bg-white/5 border border-transparent rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#32CD32] transition-all cursor-pointer"
                >
                  {REGULATIONS.map(reg => (
                    <option key={reg} value={reg} className="bg-white dark:bg-[#1a1a1a] text-black dark:text-white">{reg}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Roll Number *</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="Enter Roll Number" 
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full bg-white dark:bg-black/20 border-2 border-black/10 dark:border-white/10 rounded-xl py-4 pl-12 pr-4 text-base font-bold text-[var(--text)] focus:outline-none focus:border-[#32CD32] focus:shadow-[0_0_10px_rgba(50,205,50,0.3)] transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !rollNo}
              className="w-full bg-[#32CD32] hover:bg-[#2eaa2e] text-white py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(50,205,50,0.4)]"
            >
              {isLoading ? 'Searching...' : 'View Result'}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" /> 
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/5 shadow-xl p-4 relative overflow-hidden"
            ref={resultRef}
          >
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="relative z-10 p-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight">
                    <span className="text-[#32CD32]">P</span>
                    <span className="text-[var(--text)]">oly</span>
                    <span className="text-[#32CD32]">G</span>
                    <span className="text-[var(--text)]">uid</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] mb-2">Roll No: {result.roll_no}</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-[#32CD32]/10 text-[#32CD32] rounded-full"><BookOpen size={12} /> {result.department || 'Diploma in Engineering'}</span>
                  <span className="flex items-center gap-1 bg-black/5 dark:bg-white/5 py-0.5 px-2 rounded-full"><Calendar size={12} /> Regulation {result.regulation}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[var(--text)] font-semibold opacity-80">
                  <Building2 size={14} className="text-gray-400" /> {result.polytechnic_name}
                </div>
              </div>
              
              {/* Certificate for Image Generation */}
              <div className="fixed -top-[9999px] left-0">
                 <ResultCertificate result={result} ref={certificateRef} />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 print:hidden" data-html2canvas-ignore="true">
                <button onClick={handleCopy} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm">
                  {copied ? <Check size={16} className="text-[#32CD32]" /> : <Copy size={16} className="text-gray-500" />} Copy
                </button>
                <button onClick={handleDownload} disabled={isProcessingCanvas} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm disabled:opacity-50">
                  {isProcessingCanvas ? <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" /> : <Download size={16} className="text-gray-500" />} {isProcessingCanvas ? 'Processing...' : 'Download'}
                </button>
                <button onClick={handleShare} disabled={isProcessingCanvas} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm disabled:opacity-50">
                  <Share2 size={16} className="text-gray-500" /> Share
                </button>
              </div>

              <div className={`mb-4 p-3 rounded-xl text-center font-bold tracking-wide relative overflow-hidden transition-all transform hover:scale-[1.01] ${totalReferred > 0 ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2]' : 'bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]'}`}>
                {totalReferred > 0 ? (
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <span className="text-base flex items-center justify-center gap-1.5 animate-pulse">
                      <AlertCircle size={18} /> {totalReferred} {totalReferred === 1 ? 'Subject' : 'Subjects'} yet to pass
                    </span>
                    <span className="text-[11px] font-bold text-red-500">Subject Codes: {allReferredSubjects.join(', ')}</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <span className="text-base flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={18} /> Status: All Passed!
                    </span>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-[var(--text)] mb-4 border-b border-black/5 dark:border-white/5 pb-3">Academic History</h3>

              <div className="space-y-4">
                {result.semesters.map((sem, idx) => {
                  return (
                    <div key={idx} className="bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-200 dark:border-white/10 rounded-lg p-3 transition hover:shadow-md">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                           <div className="relative flex items-center justify-center bg-amber-400 w-6 h-6 rounded-md shadow-sm">
                             <BookOpen className="text-white" size={12} />
                           </div>
                           <h3 className="text-sm font-bold text-[var(--text)]">
                             {sem.index === 1 ? '1st' : sem.index === 2 ? '2nd' : sem.index === 3 ? '3rd' : `${sem.index}th`} Semester
                           </h3>
                        </div>
                        <div className={`flex items-center gap-1 text-[11px] font-semibold ${sem.status === 'Passed' ? 'text-green-600' : 'text-red-500'}`}>
                          {sem.status === 'Passed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {sem.status === 'Passed' ? 'Passed' : `${sem.referred_subjects?.length || 0} Referred`}
                        </div>
                      </div>

                      {sem.status === 'Passed' ? (
                        <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-6 flex flex-col items-center justify-center">
                          {sem.gpa ? (
                            <div className="flex items-end gap-2">
                              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1.5">GPA</span>
                              <span className="text-4xl font-black text-[#32CD32] drop-shadow-[0_0_12px_rgba(50,205,50,0.6)]">{Number(sem.gpa).toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 opacity-60">
                               <Clock size={20} className="text-gray-400" />
                               <span className="text-sm font-semibold text-gray-500">Missing Result</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {!sem.referred_subjects || sem.referred_subjects.length === 0 ? (
                            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-6 flex flex-col items-center justify-center">
                              <AlertCircle size={24} className="text-red-500 opacity-80 mb-2" />
                              <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Referred</span>
                            </div>
                          ) : (
                            <div className="w-full">
                              {sem.referred_subjects.map((sub, i) => (
                                <div key={i} className={`flex flex-wrap items-center gap-3 p-3.5 ${i !== sem.referred_subjects!.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}>
                                   <span className="text-base font-medium text-purple-700 dark:text-purple-400 font-mono tracking-wide">{sub.replace(/\D/g, '')}</span>
                                   <span className="text-base font-medium text-red-600 dark:text-red-400 tracking-tight">Unknown Subject</span>
                                   <div className="flex gap-2 ml-auto">
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
                                        {sem.index === 1 ? '1st' : sem.index === 2 ? '2nd' : sem.index === 3 ? '3rd' : `${sem.index}th`}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
                                        {sub.toUpperCase().includes('T') ? 'Theory' : sub.toUpperCase().includes('P') ? 'Practical' : 'Unknown'}
                                      </span>
                                   </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5 text-center px-4">
                 <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-lg mx-auto">
                  Powered by PolyGuid. This result is formatted for easier viewing. For official purposes, refer to transcipts issued by BTEB.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center opacity-60 select-none print:hidden"
            >
              <Search size={64} className="text-gray-300 dark:text-gray-600 mb-6" strokeWidth={1} />
              <h2 className="text-xl font-bold text-gray-500 tracking-tight">Search for student results</h2>
              <p className="text-sm font-medium text-gray-400 mt-2 max-w-sm">Select Curriculum, Regulation and enter Roll Number to view complete academic history.</p>
            </motion.div>
          )
        )}
      </AnimatePresence>

      <AnimatePresence>
        {downloadImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setDownloadImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full max-h-[90vh] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-lg text-[var(--text)]">Save or Share Result</h3>
                <button 
                  onClick={() => setDownloadImage(null)}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
              <div className="p-2 sm:p-4 overflow-y-auto flex-1 flex flex-col items-center">
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Long press or right-click the image below to save it to your device.
                </p>
                <div className="w-full bg-gray-50 dark:bg-black/50 p-2 sm:p-4 rounded-xl border border-gray-200 dark:border-white/5 overflow-y-auto flex justify-center max-h-[50vh]">
                  <img src={downloadImage} alt="Result" className="max-w-full h-auto rounded-lg shadow-md" style={{ maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-center gap-3">
                <a
                  href={downloadImage}
                  download={`PolyGuid_Result_${result?.roll_no || 'info'}.jpg`}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#32CD32] hover:bg-[#2eaa2e] text-white rounded-xl font-bold transition-colors"
                >
                  <Download size={18} /> Download Image
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
