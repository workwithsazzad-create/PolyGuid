// Security and protection utility for PolyGuide Video Player

// Simple Obfuscation to prevent plain text YouTube URLs in DOM / JS state
export function obfuscateVideoUrl(url: string): string {
  if (!url) return '';
  try {
    const str = encodeURIComponent(url);
    let obfuscated = '';
    for (let i = 0; i < str.length; i++) {
      obfuscated += String.fromCharCode(str.charCodeAt(i) ^ 0x3F);
    }
    return 'pg_enc_' + btoa(obfuscated);
  } catch (e) {
    return url;
  }
}

export function deobfuscateVideoUrl(token: string): string {
  if (!token) return '';
  if (!token.startsWith('pg_enc_')) return token;
  try {
    const raw = atob(token.replace('pg_enc_', ''));
    let str = '';
    for (let i = 0; i < raw.length; i++) {
      str += String.fromCharCode(raw.charCodeAt(i) ^ 0x3F);
    }
    return decodeURIComponent(str);
  } catch (e) {
    return token;
  }
}

export function extractYouTubeId(urlOrToken: string): string | null {
  if (!urlOrToken) return null;
  const url = deobfuscateVideoUrl(urlOrToken);
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function getProtectedYouTubeEmbedUrl(urlOrToken: string): string {
  const videoId = extractYouTubeId(urlOrToken);
  if (!videoId) return '';
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: '1',            // Fast start buffering and play
    controls: '0',           // Hide all native YouTube controls
    rel: '0',                // Hide unrelated videos
    modestbranding: '1',     // Remove YouTube logo from control bar
    disablekb: '1',          // Disable YouTube keyboard shortcuts inside iframe
    fs: '0',                 // Disable YouTube native fullscreen button
    playsinline: '1',
    iv_load_policy: '3',     // Hide video annotations
    showinfo: '0',           // Hide title bar
    widget_referrer: origin,
    origin: origin
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

// Anti-inspection and anti-copy event listeners
export function attachVideoProtectionListeners(element: HTMLElement | null): () => void {
  if (!element) return () => {};

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+C
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const handleCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  element.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown);
  element.addEventListener('copy', handleCopy);

  return () => {
    element.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('keydown', handleKeyDown);
    element.removeEventListener('copy', handleCopy);
  };
}
