import fs from 'fs';

let content = fs.readFileSync('src/components/admin/AdminPdfs.tsx', 'utf-8');

// Replace state
content = content.replace(
  /const \[pdfForm, setPdfForm\] = useState\(\{[\s\S]*?fakeUserCount: 0\s*\}\);/,
  `const [pdfForm, setPdfForm] = useState({
    title: '',
    thumbnail: '',
    pdfLink: '',
    isFree: true,
    originalPrice: 0,
    price: 0,
    categories: [] as string[],
    description: '',
    fakeUserCount: 0
  });`
);

// We need to inject fetching pdfLink when editing
content = content.replace(
  /setPdfForm\(\{\n\s*title: pdf\.title,[\s\S]*?fakeUserCount: [\s\S]*?\}\);/,
  `
  setPdfForm({
    title: pdf.title,
    thumbnail: pdf.thumbnail_url,
    pdfLink: '', // Will fetch below
    isFree: pdf.is_free,
    originalPrice: pdf.original_price || 0,
    price: pdf.price || 0,
    categories: pdf.categories || [],
    description: cleanDesc || '',
    fakeUserCount: fakeCount
  });
  
  // Fetch existing pdf link
  supabase.from('course_content').select('url').eq('course_id', pdf.id).eq('type', 'pdf').maybeSingle().then(({data}) => {
    if (data && data.url) {
      setPdfForm(prev => ({...prev, pdfLink: data.url}));
    }
  });
  `
);

// We also need to add pdfLink field to the form
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-4">[\s\S]*?placeholder="https:\/\/drive.google.com\/\.\.\."[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="relative pt-2">
      <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Book Name*</label>
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
      <input 
        required
        type="url" 
        value={pdfForm.thumbnail}
        onChange={(e) => setPdfForm({...pdfForm, thumbnail: e.target.value})}
        placeholder="https://drive.google.com/..."
        className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
  </div>`
);

// Clear form nicely
content = content.replace(
  /setPdfForm\(\{ title: '', thumbnail: '', isFree: true, originalPrice: 0, price: 0, categories: \[\], description: '', fakeUserCount: 0 \}\);/g,
  `setPdfForm({ title: '', thumbnail: '', pdfLink: '', isFree: true, originalPrice: 0, price: 0, categories: [], description: '', fakeUserCount: 0 });`
);

// Update handleCreatePdf
content = content.replace(
  /const handleCreatePdf = async \([\s\S]*?setLoading\(false\);\n  \};/,
  `const handleCreatePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanDesc = pdfForm.description.replace(/\\[meta:fake_user_count:\\d+\\]/, '').trim();
    const metaString = \`\\n\\n[meta:fake_user_count:\${pdfForm.fakeUserCount}]\`;
    
    const pdfData = {
      title: pdfForm.title,
      thumbnail_url: pdfForm.thumbnail,
      is_free: pdfForm.isFree,
      original_price: pdfForm.originalPrice,
      price: pdfForm.price,
      categories: ['বই'],
      description: cleanDesc + metaString
    };

    let savedCourseId = editingPdfId;

    if (editingPdfId) {
      const { error } = await supabase
        .from('courses')
        .update(pdfData)
        .eq('id', editingPdfId);

      if (error) {
        console.error('Error updating pdf:', error);
        alert('Error updating pdf.');
        setLoading(false);
        return;
      } else {
        setPdfs(prev => prev.map(c => c.id === editingPdfId ? { ...c, ...pdfData } : c));
      }
    } else {
      const { data, error } = await supabase
        .from('courses')
        .insert([pdfData])
        .select();

      if (error || !data) {
        console.error('Error creating pdf:', error);
        alert('Error creating pdf.');
        setLoading(false);
        return;
      } else {
        savedCourseId = data[0].id;
        setPdfs(prev => [data[0], ...prev]);
      }
    }

    if (savedCourseId && pdfForm.pdfLink) {
      // Manage PDF content link
      const { data: existingContent } = await supabase.from('course_content').select('id').eq('course_id', savedCourseId).eq('type', 'pdf').maybeSingle();
      
      if (existingContent) {
         await supabase.from('course_content').update({ url: pdfForm.pdfLink, title: pdfForm.title }).eq('id', existingContent.id);
      } else {
         await supabase.from('course_content').insert({
            course_id: savedCourseId,
            title: pdfForm.title,
            type: 'pdf',
            url: pdfForm.pdfLink,
            available_from: new Date().toISOString(),
            is_paid: !pdfForm.isFree
         });
      }
    }

    setIsAddingPdf(false);
    setEditingPdfId(null);
    setPdfForm({ title: '', thumbnail: '', pdfLink: '', isFree: true, originalPrice: 0, price: 0, categories: [], description: '', fakeUserCount: 0 });
    setLoading(false);
  };`
);


// remove the semesters block
content = content.replace(/<div className="flex flex-col gap-3">[\s\S]*?<label className="text-\[11px\] font-bold text-gray-400 uppercase tracking-widest ml-1">Semesters Selection<\/label>[\s\S]*?<\/div>\n\s*<\/div>/, '');

fs.writeFileSync('src/components/admin/AdminPdfs.tsx', content);
