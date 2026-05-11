import fs from 'fs';
let content = fs.readFileSync('src/components/admin/AdminPdfs.tsx', 'utf-8');

const formContent = `
      {isAddingPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-lg overflow-hidden border border-black/10 transition-all font-sans"
          >
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="text-xl font-medium text-gray-800 dark:text-white">{editingPdfId ? 'Edit Book' : 'Add Book'}</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
              <form onSubmit={handleCreatePdf} className="flex flex-col gap-6">
                 <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Book Title*</label>
                    <input 
                      required
                      type="text" 
                      value={pdfForm.title}
                      onChange={(e) => setPdfForm({...pdfForm, title: e.target.value})}
                      placeholder="Book Title*"
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Thumbnail URL*</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Paperclip size={18} />
                      </div>
                      <input 
                        required
                        type="url" 
                        value={pdfForm.thumbnail}
                        onChange={(e) => setPdfForm({...pdfForm, thumbnail: e.target.value})}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 pl-10 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-[var(--primary)] uppercase z-10 transition-all">PDF Drive Link*</label>
                    <input 
                      required
                      type="url" 
                      value={pdfForm.pdfLink}
                      onChange={(e) => setPdfForm({...pdfForm, pdfLink: e.target.value})}
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="w-full bg-transparent border-2 border-[var(--primary)]/50 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:border-[var(--primary)] shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Market Strategy</label>
                      <label className={\`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all \${pdfForm.isFree ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-white/5 opacity-50'}\`}>
                        <input type="checkbox" className="sr-only" checked={pdfForm.isFree} onChange={(e) => setPdfForm({...pdfForm, isFree: e.target.checked})} />
                        <div className={\`w-5 h-5 rounded border flex items-center justify-center transition-all \${pdfForm.isFree ? 'bg-green-600 border-green-600' : 'border-gray-400'}\`}>
                          {pdfForm.isFree && <Plus size={14} className="text-white rotate-45" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-tight">Mark as Free Book</span>
                          <span className="text-[10px] text-gray-400">Checking this puts the book in the Free category</span>
                        </div>
                      </label>
                    </div>

                    {!pdfForm.isFree && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative pt-2">
                          <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 tracking-widest">Market Value</label>
                          <input type="number" value={pdfForm.originalPrice} onChange={(e) => setPdfForm({...pdfForm, originalPrice: parseInt(e.target.value) || 0})} className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="relative pt-2">
                          <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 tracking-widest">Your Price</label>
                          <input type="number" value={pdfForm.price} onChange={(e) => setPdfForm({...pdfForm, price: parseInt(e.target.value) || 0})} className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Book Description</label>
                    <textarea 
                      rows={4}
                      value={pdfForm.description}
                      onChange={(e) => setPdfForm({...pdfForm, description: e.target.value})}
                      placeholder="Brief description of the book..."
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fake User Count</label>
                    <input 
                      type="number" 
                      value={pdfForm.fakeUserCount} 
                      onChange={(e) => setPdfForm({...pdfForm, fakeUserCount: parseInt(e.target.value) || 0})} 
                      placeholder="e.g. 500"
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button type="submit" disabled={loading} className="bg-[#00c48c] text-white font-medium py-2 px-6 rounded-md hover:bg-[#00a375] transition-colors disabled:opacity-50">
                      {loading ? 'Submitting...' : 'Submit'}
                    </button>
                    <button type="button" onClick={() => setIsAddingPdf(false)} className="bg-[#ff4d4f] text-white font-medium py-2 px-6 rounded-md hover:bg-[#d9363e] transition-colors">
                      Close
                    </button>
                  </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
`;

content = content.replace(
  /<div className="flex flex-col gap-3">/,
  formContent + '\n      <div className="flex flex-col gap-3">'
);

fs.writeFileSync('src/components/admin/AdminPdfs.tsx', content);
