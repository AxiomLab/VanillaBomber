document.getElementById('applyCss').addEventListener('click', () => {
    const css = document.getElementById('cssInput').value;
    window.electronAPI.applyCSS(css);
});