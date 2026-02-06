const vscode = acquireVsCodeApi();
const input = document.getElementById('input');
const preview = document.getElementById('preview');
const searchBtn = document.getElementById('searchBtn');

const spacer = '[\\s\\r\\n]*';

function generatePattern(raw) {
    const parts = raw.split(/(@[^@]*@)/);
    return parts.map(part => {
        if (part.startsWith('@') && part.endsWith('@')) {
            return part.slice(1, -1);
        } else {
            return part
                .replace(/[.*+?^$\\{}()|[\\]]/g, '\\$&')
                .split('')
                .filter(char => !/\s/.test(char))
                .join(spacer);
        }
    }).join(spacer).replace(/(\[\\s\\r\\n\]\*)+/g, spacer);
}

input.addEventListener('input', () => {
    preview.textContent = "生成結果: " + generatePattern(input.value);
});

searchBtn.addEventListener('click', () => {
    vscode.postMessage({
        command: 'search',
        pattern: generatePattern(input.value)
    });
});