import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
content = content.replace(
  /import CoursesPage from '\.\/pages\/CoursesPage';/, 
  "import CoursesPage from './pages/CoursesPage';\nimport PdfBooksPage from './pages/PdfBooksPage';"
);

// Switch route
content = content.replace(
  /<Route path="\/books-pdf" element=\{<CoursesPage \/>\} \/>/,
  '<Route path="/books-pdf" element={<PdfBooksPage />} />'
);

fs.writeFileSync('src/App.tsx', content);
