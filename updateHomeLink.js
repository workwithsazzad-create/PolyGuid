import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

content = content.replace(/name: "Book PDF",\s*icon: FileText,\s*color: "text-red-500",\s*bgColor: "bg-red-50 dark:bg-red-900\/20",\s*shadowColor: "shadow-red-500\/20",\s*route: "\/saved-items"/, 
`name: "Book PDF",
              icon: FileText,
              color: "text-red-500",
              bgColor: "bg-red-50 dark:bg-red-900/20",
              shadowColor: "shadow-red-500/20",
              route: "/books-pdf"`);

content = content.replace(/name: "Book PDF",\s*icon: FileText,\s*color: "text-red-500",\s*bg: "bg-red-500\/5",\s*path: "\/saved"/,
`name: "Book PDF",
            icon: FileText,
            color: "text-red-500",
            bg: "bg-red-500/5",
            path: "/books-pdf"`);

fs.writeFileSync('src/pages/Home.tsx', content);
