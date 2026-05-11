import fs from 'fs';
let content = fs.readFileSync('src/components/admin/AdminPdfs.tsx', 'utf-8');

// Remove Contents view completely (lines from `if (selectedPdf) {` to the end of its `return ( ... ); }`)
// Actually since we already replaced the whole modal things, `if (selectedPdf) { return ( <div ...> </div> ); }` takes up quite a bit.
// Let's use string manipulation to remove it safely.
const startIndex = content.indexOf('if (selectedPdf) {');
if (startIndex !== -1) {
  // we want to remove the entire if block
  // the block ends with padding and a closing brace `  }` followed by `return (` for the main component.
  const endIndex = content.indexOf('\n  return (', startIndex);
  if (endIndex !== -1) {
    content = content.slice(0, startIndex) + content.slice(endIndex);
  }
}

// Remove the Contents button in the list
const btnStartIndex = content.indexOf('<button \n                  onClick={(e) => {\n                    e.stopPropagation();\n                    setSelectedPdf(pdf);');
if (btnStartIndex !== -1) {
  const btnEndIndex = content.indexOf('</button>', btnStartIndex) + 9;
  content = content.slice(0, btnStartIndex) + content.slice(btnEndIndex);
}

// Change "Add Pdf" title in modal to "Add Book" just in case we missed it
content = content.replace(/{editingPdfId \? 'Edit Pdf' : 'Add Pdf'}/g, "{editingPdfId ? 'Edit Book' : 'Add Book'}");


fs.writeFileSync('src/components/admin/AdminPdfs.tsx', content);
