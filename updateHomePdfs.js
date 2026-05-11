import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

content = content.replace(
  /"stat_polytechnics",\s*"donation_number",\s*"pinned_courses",/m,
  '"stat_polytechnics",\n            "donation_number",\n            "pinned_courses",\n            "pinned_pdfs",'
);

content = content.replace(
  /let pinnedMap: Record<string, number> = \{\};/,
  'let pinnedMap: Record<string, number> = {};\n        let pinnedPdfsMap: Record<string, number> = {};'
);

content = content.replace(
  /if \(item.key === "pinned_courses"\) \{\s*try \{\s*pinnedMap = JSON.parse\(item.value\);\s*\} catch \(e\) \{\}\s*\}/,
  `if (item.key === "pinned_courses") {
              try {
                pinnedMap = JSON.parse(item.value);
              } catch (e) {}
            }
            if (item.key === "pinned_pdfs") {
              try {
                pinnedPdfsMap = JSON.parse(item.value);
              } catch (e) {}
            }`
);

content = content.replace(
  /pinned_position: pinnedMap\[c.id\] \|\| null,/,
  'pinned_position: pinnedMap[c.id] || null,\n            pinned_pdf_position: pinnedPdfsMap[c.id] || null,'
);

// We need to change the rendering of "জনপ্রিয় বই সমূহ" to sort by `pinned_pdf_position`
content = content.replace(
  /c\.categories\?\.includes\("বই"\) \|\|\s*c\.categories\?\.includes\("Book"\) \|\|\s*c\.title\?\.includes\("বই"\),/g,
  `c.pinned_pdf_position !== null && (
                      c.categories?.includes("বই") ||
                      c.categories?.includes("Book") ||
                      c.title?.includes("বই")
                    ),`
);

content = content.replace(
  /\.map\(\(course, i\) => \(/m,
  `.sort((a, b) => (a.pinned_pdf_position || 99) - (b.pinned_pdf_position || 99))
                  .map((course, i) => (`
);

fs.writeFileSync('src/pages/Home.tsx', content);
