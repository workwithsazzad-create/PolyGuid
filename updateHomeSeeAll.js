import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

content = content.replace(
  /onClick=\{[() =>]+navigate\("\/book-list"\)\}/,
  'onClick={() => navigate("/books-pdf")}'
);

fs.writeFileSync('src/pages/Home.tsx', content);
