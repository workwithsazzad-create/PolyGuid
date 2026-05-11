import fs from 'fs';
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

content = content.replace(
  /\{activeTab === "pdf" && \(\s*<GlassmorphicCard[\s\S]*?<\/GlassmorphicCard>\s*\)\}/,
  '{activeTab === "pdf" && <AdminPdfs />}'
);

content = content.replace(
  /import AdminPages from "\.\.\/components\/admin\/AdminPages";/,
  'import AdminPages from "../components/admin/AdminPages";\nimport AdminPdfs from "../components/admin/AdminPdfs";'
);

fs.writeFileSync('src/pages/Admin.tsx', content);
