import fs from 'fs';
const content = fs.readFileSync('src/components/admin/AdminCourses.tsx', 'utf-8');
let newContent = content
  .replace(/Course/g, 'Pdf')
  .replace(/course/g, 'pdf')
  .replace(/COURSES/g, 'PDFS')
  .replace(/courses/g, 'pdfs');
fs.writeFileSync('src/components/admin/AdminPdfs.tsx', newContent);
