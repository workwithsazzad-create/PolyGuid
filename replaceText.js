import fs from 'fs';
let content = fs.readFileSync('src/components/admin/AdminPdfs.tsx', 'utf-8');

content = content.replace(/Pdf Title\*/g, 'Book Title*');
content = content.replace(/Mark as Free Pdf/g, 'Mark as Free Book');
content = content.replace(/Brief description of the pdf\.\.\./g, 'Brief description of the book...');
content = content.replace(/Error updating pdf/g, 'Error updating book');
content = content.replace(/Error creating pdf/g, 'Error creating book');
content = content.replace(/Error pinning pdf/g, 'Error pinning book');
content = content.replace(/Add Pdf/g, 'Add Book');
content = content.replace(/Pin Pdf/g, 'Pin Book');
content = content.replace(/Delete Pdf/g, 'Delete Book');
content = content.replace(/delete this pdf/g, 'delete this book');
content = content.replace(/Awaiting Pdf Deployment/g, 'Awaiting Book Deployment');

fs.writeFileSync('src/components/admin/AdminPdfs.tsx', content);
