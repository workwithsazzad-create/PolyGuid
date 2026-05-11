import fs from 'fs';
let content = fs.readFileSync('src/components/admin/AdminPdfs.tsx', 'utf-8');
content = content.replace(/\.from\('pdfs'\)/g, ".from('courses')");
content = content.replace(/\.from\('pdf_content'\)/g, ".from('course_content')");
fs.writeFileSync('src/components/admin/AdminPdfs.tsx', content);
