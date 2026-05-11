import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Remove the erroneous sort
content = content.replace(
  /\.sort\(\(a, b\) => a\.pinned_position - b\.pinned_position\)\n\s*\.sort\(\(a, b\) => \(a\.pinned_pdf_position \|\| 99\) - \(b\.pinned_pdf_position \|\| 99\)\)\n\s*\.map\(\(course, i\) => \(/m,
  `.sort((a, b) => a.pinned_position - b.pinned_position)
                  .map((course, i) => (`
);

// Add the correct sort to PDFs
content = content.replace(
  /\.filter\(\n\s*\(c\) =>\n\s*c\.pinned_pdf_position !== null && \(\n\s*c\.categories\?\.includes\("বই"\) \|\|\n\s*c\.categories\?\.includes\("Book"\) \|\|\n\s*c\.title\?\.includes\("বই"\)\n\s*\),\n\s*\)\n\s*\.map\(\(course, i\) => \(/m,
  `.filter(
                    (c) =>
                      c.pinned_pdf_position !== null && (
                      c.categories?.includes("বই") ||
                      c.categories?.includes("Book") ||
                      c.title?.includes("বই")
                    ),
                  )
                  .sort((a, b) => (a.pinned_pdf_position || 99) - (b.pinned_pdf_position || 99))
                  .map((course, i) => (`
);

fs.writeFileSync('src/pages/Home.tsx', content);
