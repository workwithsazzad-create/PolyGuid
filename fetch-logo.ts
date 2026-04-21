import fs from 'fs';

async function fetchImage(id: string) {
  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

async function run() {
  try {
    const darkB64 = await fetchImage('1vv1p_uFa3gC7fSwgUMLH0805icz-9Y6p');
    const lightB64 = await fetchImage('1EUDGjXVwZ-u80BZ0XbXLZd807Q350BeD');
    
    const content = `export const logoDarkB64 = "data:image/png;base64,${darkB64}";\nexport const logoLightB64 = "data:image/png;base64,${lightB64}";\n`;
    fs.writeFileSync('src/components/ui/logo-data.ts', content);
    console.log('SUCCESS');
  } catch (e) {
    console.error(e);
  }
}

run();
