import fs from 'fs';
let content = fs.readFileSync('src/components/admin/AdminPdfs.tsx', 'utf-8');

// The ContentModal went from `interface ContentModalProps` to `export default function AdminPdfs() {`
content = content.replace(/interface ContentModalProps[\s\S]*?export default function AdminPdfs\(\) \{/, 'export default function AdminPdfs() {');

// Remove instances of isPreviewModalOpen because we don't have courseContents anymore
content = content.replace(/const \[isPreviewModalOpen, setIsPreviewModalOpen\] = useState\(false\);/, '');
content = content.replace(/const \[previewContent, setPreviewContent\] = useState<any>\(null\);/, '');

// Remove instances of ContentModal and Preview Modal
content = content.replace(/<ContentModal[\s\S]*?SEMESTERS=\{SEMESTERS\}\n\s*\/>/g, '');
content = content.replace(/\{\/\* Preview Modal \*\/\}[\s\S]*?<\/motion\.div>\n\s*<\/div>\n\s*\)\}/, '');

fs.writeFileSync('src/components/admin/AdminPdfs.tsx', content);
