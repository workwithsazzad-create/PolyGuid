import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ChevronRight, Search, ChevronLeft, Download, ExternalLink, List } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface BookInfo {
  code: string;
  name: string;
}

interface SemesterBooks {
  [semester: string]: BookInfo[];
}

interface Department {
  id: string;
  name: string;
  regulation: string;
  semesters: SemesterBooks;
}

// Sample structure for data - This will be populated by user or fetched
const REGULATION_2022_DEPARTMENTS = [
  "Computer Science & Technology",
  "Civil Technology",
  "Electrical Technology",
  "Mechanical Technology",
  "Electronics Technology",
  "Architecture Technology",
  "Automobile Technology",
  "Chemical Technology",
  "Power Technology",
  "Telecommunication Technology",
  "Mechatronics Technology",
  "Graphic Design Technology",
  "Environmental Technology",
  "Food Technology",
  "Mining & Mine Survey Technology",
  "Marine Technology",
  "Shipbuilding Engineering",
  "Aircraft Maintenance Technology (Aerospace)",
  "Aircraft Maintenance Technology (Avionics)",
  "Apparel Manufacturing",
  "Ceramic Technology",
  "Civil (Wood) Technology",
  "Construction Technology",
  "Diploma In Agriculture",
  "Diploma In Fisheries",
  "Diploma In Forestry",
  "Diploma In Livestock",
  "Electromedical Technology",
  "Fabric Manufacturing",
  "Fashion Design",
  "Footwear Technology",
  "Glass Technology",
  "Jute Product Manufacturing",
  "Merchandising and Marketing",
  "Printing Technology",
  "RAC Technology",
  "Surveying Technology",
  "Textile Machine Design & Maintenance",
  "Wet Processing",
  "Yarn Manufacturing"
];

import departmentDataJson from '../data/booklist_2022.json';

interface DepartmentData {
  name: string;
  code: string;
  regulation: string;
  semesters: SemesterBooks;
}

const REGULATION_2022_DATA: DepartmentData[] = departmentDataJson;

const BookList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  
  const deptCode = searchParams.get('dept');
  const semesterStr = searchParams.get('sem');

  const selectedDept = deptCode ? REGULATION_2022_DATA.find(d => d.code === deptCode) || null : null;
  const selectedSemester = semesterStr ? parseInt(semesterStr) : null;

  const setSelectedDept = (dept: DepartmentData | null) => {
    if (dept) {
      setSearchParams({ dept: dept.code });
    } else {
      setSearchParams({});
    }
  };

  const setSelectedSemester = (sem: number | null) => {
    if (sem && selectedDept) {
      setSearchParams({ dept: selectedDept.code, sem: sem.toString() });
    } else if (selectedDept) {
      setSearchParams({ dept: selectedDept.code });
    }
  };

  const isNumericSearch = /^\d+$/.test(searchTerm.trim());

  // Search logic for subjects logic - only enabled for numeric searches
  const filteredSubjects = (isNumericSearch && searchTerm.trim().length >= 2) ? REGULATION_2022_DATA.flatMap(dept => 
    Object.entries(dept.semesters).flatMap(([sem, books]) => 
      books.map(book => ({ 
        ...book, 
        deptName: dept.name, 
        deptCode: dept.code,
        sem, 
        originalDept: dept 
      }))
    )
  ).filter(item => 
    item.code.includes(searchTerm.trim())
  ).slice(0, 8) : [];

  const filteredDepts = REGULATION_2022_DATA.filter(dept => {
    // If it's a numeric search, we don't filter technologies by name
    if (isNumericSearch) return false;
    
    return dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           dept.code.includes(searchTerm);
  });

  const handleBack = () => {
    if (selectedSemester) {
      setSelectedSemester(null);
    } else if (selectedDept) {
      setSelectedDept(null);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-0">
      <header className="flex items-center gap-3 py-4">
        {selectedDept && (
          <button 
            onClick={handleBack}
            className="hidden sm:flex p-1.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-black/5 dark:border-white/10 shadow-sm active:scale-95 transition-all text-gray-500 items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-base font-black text-[var(--text)]">Book List</h1>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Regulation 2022 Edition</p>
        </div>
      </header>

      {!selectedDept ? (
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Dept or Code (e.g. 25711)..."
              className="w-full bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <AnimatePresence>
            {filteredSubjects.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl p-4 mb-4 shadow-xl shadow-black/5"
              >
                <h4 className="text-[10px] font-black uppercase text-[var(--primary)] mb-3 tracking-widest">Matching Subjects</h4>
                <div className="space-y-2">
                  {filteredSubjects.map((item, idx) => (
                    <div 
                      key={`${item.code}-${idx}`}
                      onClick={() => {
                        setSelectedDept(item.originalDept);
                        setSelectedSemester(parseInt(item.sem));
                        setSearchTerm('');
                      }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border border-transparent hover:border-black/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">{item.name}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-tighter">Code: {item.code} • {item.deptName} ({item.sem}{item.sem === '1' ? 'st' : item.sem === '2' ? 'nd' : item.sem === '3' ? 'rd' : 'th'})</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredDepts.map((dept, i) => (
              <motion.div
                key={dept.code}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01 }}
                onClick={() => setSelectedDept(dept)}
                className="group flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:border-[var(--primary)] active:scale-[0.98] transition-all shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all font-bold text-[10px]">
                    {dept.code}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-tight">
                      {dept.name}
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 opacity-60">REG: {dept.regulation}</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-[var(--primary)] transition-all" size={16} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : !selectedSemester ? (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-[var(--primary)] to-[#2ecc71] rounded-3xl text-white shadow-lg shadow-[var(--primary)]/10 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-base font-black leading-tight mb-0.5">{selectedDept.name}</h2>
              <p className="text-[9px] font-black opacity-80 uppercase tracking-[0.2em] mb-4">Curriculum 2022</p>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg w-fit">
                 <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Select Semester</span>
              </div>
            </div>
            <Book className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <motion.div
                key={sem}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sem * 0.03 }}
                onClick={() => setSelectedSemester(sem)}
                className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:border-[var(--primary)] active:scale-[0.98] transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[11px] font-black text-gray-400 group-hover:text-[var(--primary)] transition-colors">
                    {sem}
                  </div>
                  <h3 className="text-[14px] font-bold text-[var(--text)]">
                    {sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester
                  </h3>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-[var(--primary)]" size={16} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
             <h2 className="text-base font-black text-[var(--text)] leading-tight">{selectedDept.name}</h2>
             <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black rounded-md uppercase tracking-widest">
                  {selectedSemester}{selectedSemester === 1 ? 'st' : selectedSemester === 2 ? 'nd' : selectedSemester === 3 ? 'rd' : 'th'} Sem
                </span>
                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[9px] font-black rounded-md uppercase tracking-widest">
                  REG 2022
                </span>
             </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
             <div className="p-3 bg-gray-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                   <List size={14} />
                   <span className="text-[10px] font-black uppercase tracking-[0.1em]">Subject Inventory</span>
                </div>
             </div>
             
             <div className="divide-y divide-black/5 dark:divide-white/5">
                {(selectedDept.semesters[selectedSemester.toString()] || []).length > 0 ? (
                  (selectedDept.semesters[selectedSemester.toString()] || []).map((book, idx) => (
                    <motion.div 
                      key={book.code}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-4 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center font-bold text-[var(--primary)] text-xs shadow-inner">
                            {idx + 1}
                          </div>
                          <div>
                             <h4 className="text-[13px] font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-tight">{book.name}</h4>
                             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.05em] mt-0.5">Code: {book.code}</p>
                          </div>
                       </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                        <ExternalLink size={32} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[var(--text)]">Data not yet imported</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                          The book list for this semester is not yet available in our database.
                        </p>
                    </div>
                    <button 
                      onClick={() => window.open('https://btebresultszone.com/booklists', '_blank')}
                      className="mt-2 text-[10px] font-black text-orange-500 underline underline-offset-4"
                    >
                      VIEW ON ORIGINAL WEBSITE
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Navigation Padding */}
      <div className="h-10" />
    </div>
  );
};

export default BookList;
