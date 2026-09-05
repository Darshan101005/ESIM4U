/**
 * Inline, render-blocking script that applies the stored dark theme to its
 * parent element before React hydrates — avoiding a flash of the light theme
 * on load. Scoped to the shell root (not <html>), so it never leaks onto
 * public pages during client-side navigation.
 */
export default function ThemeInitScript({ storageKey }: { storageKey: string }) {
  const js = `(function(){try{var t=localStorage.getItem(${JSON.stringify(storageKey)});var e=document.currentScript&&document.currentScript.parentElement;if(t==='dark'&&e){e.classList.add('theme-dark');}}catch(_){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
