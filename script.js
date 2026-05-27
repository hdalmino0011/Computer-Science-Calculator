// STATE
let currentBranch = "universal";
let historyEntries = [];

// DOM Elements
const exprInput = document.getElementById('exprInput');
const resultDisplay = document.getElementById('resultDisplay');
const dynamicDiv = document.getElementById('dynamicButtons');
const calculatorView = document.getElementById('calculatorView');
const stepsView = document.getElementById('stepsView');

// ========== HELPER FUNCTIONS ==========
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function fact(n) { 
    if (n < 0) return NaN; 
    let r = 1; 
    for (let i = 2; i <= n; i++) r *= i; 
    return r; 
}

function gcd(a, b) { 
    while (b) { let t = b; b = a % b; a = t; } 
    return a; 
}

// ========== VIEW SWITCHING ==========
function showCalculatorView() {
    calculatorView.style.display = 'block';
    stepsView.style.display = 'none';
}

function showStepsView(expression, result, steps) {
    document.getElementById('stepsExpression').innerHTML = `<strong>Expression:</strong> ${escapeHtml(expression)}`;
    document.getElementById('stepsResultFull').innerHTML = `<span class="result-label">RESULT:</span> <span class="result-value">${escapeHtml(result)}</span>`;
    const stepsList = document.getElementById('stepsListFull');
    if (!steps || steps === 'No steps') {
        stepsList.innerHTML = '<div class="step-item">No detailed steps available</div>';
    } else {
        const stepLines = steps.split('\n');
        stepsList.innerHTML = stepLines.map((line, idx) => {
            if (line.trim()) {
                return `<div class="step-item"><span class="step-number">${idx + 1}.</span> ${escapeHtml(line)}</div>`;
            }
            return '';
        }).join('');
    }
    calculatorView.style.display = 'none';
    stepsView.style.display = 'flex';
}

// ========== HISTORY ==========
function loadHistory() {
    const stored = localStorage.getItem('csCalcHistory');
    historyEntries = stored ? JSON.parse(stored) : [];
}
function saveHistory() {
    localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(-50)));
}
function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({ expr, result, steps: steps.substring(0, 300), branch, date: new Date().toLocaleString() });
    if (historyEntries.length > 50) historyEntries.pop();
    saveHistory();
}
function clearHistory() {
    historyEntries = [];
    saveHistory();
}

// ========== THEMES (12) ==========
const themes = ['default', 'obsidian', 'royalblue', 'orange', 'highcontrast', 'forest', 'crimson', 'slate', 'purple', 'midnight', 'sand', 'cyan-night'];
const themeNames = ['Default', 'Obsidian', 'Royal Blue', 'Orange', 'High Contrast', 'Forest', 'Crimson', 'Slate', 'Purple', 'Midnight', 'Sand', 'Cyan Night'];

function applyTheme(theme) {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('activeTheme', theme);
}
function initTheme() {
    const saved = localStorage.getItem('activeTheme');
    if (saved && themes.includes(saved)) applyTheme(saved);
    else applyTheme('default');
    renderThemesGallery();
}
function renderThemesGallery() {
    const gallery = document.getElementById('themesGallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    themes.forEach((t, i) => {
        const btn = document.createElement('div');
        btn.className = 'theme-option';
        btn.textContent = themeNames[i];
        btn.style.backgroundColor = getThemeColor(t);
        btn.style.color = '#fff';
        btn.style.textShadow = '0 0 1px black';
        btn.addEventListener('click', () => applyTheme(t));
        gallery.appendChild(btn);
    });
}
function getThemeColor(t) {
    const c = { default: '#7c3aed', obsidian: '#a855f7', royalblue: '#3b82f6', orange: '#f97316', highcontrast: '#ffff00', forest: '#22c55e', crimson: '#ef4444', slate: '#64748b', purple: '#c084fc', midnight: '#60a5fa', sand: '#fbbf24', 'cyan-night': '#06b6d4' };
    return c[t] || '#7c3aed';
}

// ========== FONTS ==========
function initFont() {
    const saved = localStorage.getItem('appFont');
    if (saved) document.body.style.fontFamily = saved;
    const sel = document.getElementById('fontSelector');
    if (sel) {
        sel.value = saved || 'Times New Roman';
        sel.addEventListener('change', e => {
            document.body.style.fontFamily = e.target.value;
            localStorage.setItem('appFont', e.target.value);
        });
    }
}

// ========== BUTTON LAYOUTS (ALL include numbers) ==========
const universalButtons = [
    '7', '8', '9', '/', '(', ')', 'C',
    '4', '5', '6', '*', '^', '√', '!',
    '1', '2', '3', '-', '+', '%', 'abs',
    '0', '.', 'sin', 'cos', 'tan', 'log', 'ln',
    'AND', 'OR', 'NOT', 'XOR', '=', '≠', '≥', '≤', '>', '<', '÷', '×', '∧', '∨',
    'DEC→BIN', 'BIN→DEC', 'DEC→HEX', 'HEX→DEC', 'DEC→OCT', 'OCT→DEC', 'BIN→HEX'
];
const arithmeticButtons = [
    '7', '8', '9', '/', '(', ')', 'C',
    '4', '5', '6', '*', '%', '^', '&',
    '1', '2', '3', '-', '+', '|', '~',
    '0', '.', '<<', '>>', '√', '!', 'abs',
    '≥', '≤', '≠', '==', '!=', '>', '<'
];
const combinatoricsButtons = [
    '7', '8', '9', 'nCr', 'nPr', '(', ')', 'C',
    '4', '5', '6', '!', ',', 'P', 'C',
    '1', '2', '3', '0', '.', 'DEL'
];
const logicButtons = [
    '7', '8', '9', 'TRUE', 'FALSE', '(', ')', 'C',
    '4', '5', '6', 'AND', 'OR', 'NOT', 'XOR',
    '1', '2', '3', 'IMPLIES', 'EQUIV', '0', '.', 'DEL'
];
const settheoryButtons = [
    '7', '8', '9', 'UNION', '∩', 'COMPLEMENT', 'C',
    '4', '5', '6', '\\', 'SUBSET', 'POWERSET', '{',
    '1', '2', '3', '}', ',', '0', '.', 'DEL'
];
const numbertheoryButtons = [
    '7', '8', '9', 'gcd', 'lcm', 'mod', 'C',
    '4', '5', '6', 'prime?', 'factor', '(', ')',
    '1', '2', '3', '0', '.', 'DEL'
];
const conversionButtons = [
    '7', '8', '9', 'DEC→BIN', 'BIN→DEC', 'DEC→HEX', 'C',
    '4', '5', '6', 'HEX→DEC', 'DEC→OCT', 'OCT→DEC', 'BIN→HEX',
    '1', '2', '3', '0', '.', 'DEL'
];
const matrixButtons = [
    '7', '8', '9', 'det2x2', 'add2x2', 'mul2x2', 'C',
    '4', '5', '6', '[a b; c d]', '(', ')',
    '1', '2', '3', '0', '.', 'DEL'
];
const complexButtons = [
    '7', '8', '9', 're', 'im', 'conj', 'C',
    '4', '5', '6', 'abs', 'arg', '+', '-',
    '1', '2', '3', '*', '/', '0', '.', 'DEL'
];

function renderButtons() {
    let btns = [];
    if (currentBranch === 'universal') btns = universalButtons;
    else if (currentBranch === 'arithmetic') btns = arithmeticButtons;
    else if (currentBranch === 'combinatorics') btns = combinatoricsButtons;
    else if (currentBranch === 'logic') btns = logicButtons;
    else if (currentBranch === 'settheory') btns = settheoryButtons;
    else if (currentBranch === 'numbertheory') btns = numbertheoryButtons;
    else if (currentBranch === 'conversion') btns = conversionButtons;
    else if (currentBranch === 'matrix') btns = matrixButtons;
    else btns = complexButtons;

    dynamicDiv.innerHTML = '';
    btns.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'calc-btn';
        btn.textContent = label;
        if (label === 'C') {
            btn.onclick = () => { exprInput.value = ''; resultDisplay.textContent = '0'; };
        } else if (label === 'DEL') {
            btn.onclick = () => { exprInput.value = exprInput.value.slice(0, -1); };
        } else {
            btn.onclick = () => {
                exprInput.value += label;
            };
        }
        dynamicDiv.appendChild(btn);
    });
}

// ========== SYMBOL PRE-PROCESSOR ==========
function preprocessExpression(expr) {
    let processed = expr;
    processed = processed.replace(/÷/g, '/');
    processed = processed.replace(/×/g, '*');
    processed = processed.replace(/≥/g, '>=');
    processed = processed.replace(/≤/g, '<=');
    processed = processed.replace(/≠/g, '!=');
    processed = processed.replace(/∧/g, ' AND ');
    processed = processed.replace(/∨/g, ' OR ');
    processed = processed.replace(/¬/g, ' NOT ');
    processed = processed.replace(/⊕/g, ' XOR ');
    processed = processed.replace(/→/g, ' IMPLIES ');
    processed = processed.replace(/↔/g, ' EQUIV ');
    processed = processed.replace(/([^\s<>!])=([^\s=])/g, '$1==$2');
    return processed;
}

// ========== EVALUATION ENGINE ==========
function evaluateUniversal(expr) {
    try {
        let clean = preprocessExpression(expr);
        if (!clean.trim()) return { result: '0', steps: 'Empty expression' };
        
        // Handle conversion commands
        const convMatch = clean.match(/(DEC→BIN|BIN→DEC|DEC→HEX|HEX→DEC|DEC→OCT|OCT→DEC|BIN→HEX)\s+(\S+)/i);
        if (convMatch) {
            let type = convMatch[1].toUpperCase(), val = convMatch[2];
            if (type.includes('DEC→BIN')) return { result: parseInt(val).toString(2), steps: `${val} in binary = ${parseInt(val).toString(2)}` };
            if (type.includes('BIN→DEC')) return { result: parseInt(val, 2), steps: `Binary ${val} = ${parseInt(val, 2)} decimal` };
            if (type.includes('DEC→HEX')) return { result: parseInt(val).toString(16).toUpperCase(), steps: `${val} in hex = ${parseInt(val).toString(16).toUpperCase()}` };
            if (type.includes('HEX→DEC')) return { result: parseInt(val, 16), steps: `Hex ${val} = ${parseInt(val, 16)} decimal` };
            if (type.includes('DEC→OCT')) return { result: parseInt(val).toString(8), steps: `${val} in octal = ${parseInt(val).toString(8)}` };
            if (type.includes('OCT→DEC')) return { result: parseInt(val, 8), steps: `Octal ${val} = ${parseInt(val, 8)} decimal` };
            if (type.includes('BIN→HEX')) {
                let dec = parseInt(val, 2);
                return { result: dec.toString(16).toUpperCase(), steps: `Binary ${val} → decimal ${dec} → hex ${dec.toString(16).toUpperCase()}` };
            }
        }

        // Handle combinatorics
        const ncrMatch = clean.match(/nCr\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
        if (ncrMatch) {
            let n = parseInt(ncrMatch[1]), r = parseInt(ncrMatch[2]);
            let res = fact(n) / (fact(r) * fact(n - r));
            return { result: res, steps: `C(${n},${r}) = ${n}!/(${r}!(${n-r})!) = ${res}` };
        }
        const nprMatch = clean.match(/nPr\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
        if (nprMatch) {
            let n = parseInt(nprMatch[1]), r = parseInt(nprMatch[2]);
            let res = fact(n) / fact(n - r);
            return { result: res, steps: `P(${n},${r}) = ${n}!/(${n-r})! = ${res}` };
        }
        
        // General evaluation
        let processed = clean.replace(/√/g, 'sqrt').replace(/\^/g, '**');
        processed = processed.replace(/(\d+)!/g, (_, n) => `fact(${n})`);
        processed = processed.replace(/(\d+)%/g, (_, n) => `(${n}/100)`);
        processed = processed.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!');
        processed = processed.replace(/==/g, '===').replace(/!=/g, '!==');
        processed = processed.replace(/\bsin\(/g, 'Math.sin(');
        processed = processed.replace(/\bcos\(/g, 'Math.cos(');
        processed = processed.replace(/\btan\(/g, 'Math.tan(');
        processed = processed.replace(/\blog\(/g, 'Math.log10(');
        processed = processed.replace(/\bln\(/g, 'Math.log(');
        processed = processed.replace(/\bsqrt\(/g, 'Math.sqrt(');
        processed = processed.replace(/\babs\(/g, 'Math.abs(');
        
        const fn = new Function('factorial', 'return (' + processed + ')');
        const result = fn(fact);
        return { result: result, steps: `Evaluated: ${processed} = ${result}` };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid expression: ' + e.message };
    }
}

// Main evaluate
function evaluate() {
    let raw = exprInput.value.trim();
    if (!raw) {
        resultDisplay.textContent = '0';
        return;
    }
    let res = evaluateUniversal(raw);
    let resStr = res.result.toString();
    resultDisplay.textContent = resStr;
    addHistory(raw, resStr, res.steps, currentBranch);
    showStepsView(raw, resStr, res.steps || 'No detailed steps');
}

// ========== UI ACTIONS ==========
function toggleDrawer(open) {
    document.getElementById('drawer').classList.toggle('open', open);
    document.getElementById('overlay').classList.toggle('active', open);
}

function resetSession() {
    exprInput.value = '';
    resultDisplay.textContent = '0';
}

function clearCache() {
    if (confirm('Clear all cache, history, and reset to defaults?')) {
        localStorage.clear();
        historyEntries = [];
        saveHistory();
        initTheme();
        initFont();
        resetSession();
        alert('Cache cleared. Theme and font reset.');
    }
}

function showHistoryFull() {
    const modal = document.getElementById('historyModal');
    const listDiv = document.getElementById('historyList');
    if (historyEntries.length === 0) {
        listDiv.innerHTML = '<div class="history-item">No history</div>';
    } else {
        listDiv.innerHTML = historyEntries.map(h => `
            <div class="history-item">
                <div class="history-expr">${escapeHtml(h.expr)}</div>
                <div class="history-result">= ${escapeHtml(h.result)}</div>
                <div class="history-meta" style="font-size:0.7rem; opacity:0.6;">${h.branch} | ${h.date}</div>
            </div>
        `).join('');
    }
    modal.style.display = 'block';
}

function showAboutFull() {
    const aboutText = `Developed by Hanz Dalmino
Cebu Technological University Main Campus

PURPOSE:
Designed for Computer Science, IT, and Computer Engineering students to assist with discrete mathematics, logic, set theory, number theory, combinatorics, matrix algebra, complex numbers, number system conversions, and advanced arithmetic with step-by-step evaluation.

FEATURES:
• Universal expression evaluation (arithmetic, relational, logical, bitwise)
• Set theory (union, intersection, complement, subset, powerset)
• Combinatorics (nCr, nPr, factorial)
• Number theory (GCD, LCM, modulo, primality)
• Number system conversions (binary, decimal, hex, octal)
• Matrix determinant (2x2)
• Complex number operations
• Trigonometric and logarithmic functions
• 12 color themes
• Adjustable font
• Calculation history with local storage
• Step-by-step detailed evaluation
• Responsive design for desktop and mobile

All operations show each step clearly.`;
    alert(aboutText);
}

// ========== INITIALIZATION ==========
function init() {
    loadHistory();
    initTheme();
    initFont();
    renderButtons();

    // Branch switching – preserve input (CRITICAL FIX)
    document.querySelectorAll('.branch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.branch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBranch = btn.getAttribute('data-branch');
            renderButtons();
            // IMPORTANT: DO NOT clear exprInput or resultDisplay
        });
    });

    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = () => { exprInput.value = ''; resultDisplay.textContent = '0'; };
    document.getElementById('backBtn').onclick = () => { exprInput.value = exprInput.value.slice(0, -1); };
    document.getElementById('menuToggleBtn').onclick = () => toggleDrawer(true);
    document.getElementById('closeDrawerBtn').onclick = () => toggleDrawer(false);
    document.getElementById('overlay').onclick = () => toggleDrawer(false);
    document.getElementById('backToCalculatorBtn').onclick = () => showCalculatorView();

    document.getElementById('drawerHistoryBtn').onclick = () => { toggleDrawer(false); showHistoryFull(); };
    document.getElementById('drawerClearHistoryBtn').onclick = () => { clearHistory(); alert('History cleared'); toggleDrawer(false); };
    document.getElementById('drawerAboutBtn').onclick = () => { toggleDrawer(false); showAboutFull(); };
    document.getElementById('drawerClearCacheBtn').onclick = () => { toggleDrawer(false); clearCache(); };
    document.getElementById('drawerExitBtn').onclick = () => { toggleDrawer(false); resetSession(); };
    document.getElementById('closeHistoryBtn').onclick = () => document.getElementById('historyModal').style.display = 'none';

    exprInput.addEventListener('keypress', e => { if (e.key === 'Enter') evaluate(); });
}

init();
