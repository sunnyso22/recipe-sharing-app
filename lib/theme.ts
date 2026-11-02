const THEME_STORAGE_KEY = "theme";

const themeInitScript = `(function(){try{var stored=localStorage.getItem("${THEME_STORAGE_KEY}");var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=stored==="dark"||(stored!=="light"&&prefersDark);document.documentElement.classList.toggle("dark",isDark);}catch(e){}})();`;

export { THEME_STORAGE_KEY, themeInitScript };
