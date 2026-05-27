// STATE
let currentBranch = "arithmetic";
let historyEntries = [];

// DOM Elements
const exprInput = document.getElementById('exprInput');
const resultDisplay = document.getElementById('resultDisplay');
const stepsDisplay = document.getElementById('stepsDisplay');
const dynamicDiv = document.getElementById('dynamicButtons');

// ========== HISTORY ==========
function loadHistory() {
    const stored = localStorage.getItem('csCalcHistory');
    if (stored) historyEntries = JSON.parse(stored);
    else historyEntries = [];
}

function saveHistory() {
    localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(-50)));
}

function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({
        expr: expr,
        result: result,
        steps: steps.substring(0, 200),
        branch: branch,
        date: new Date().toLocaleString()
    });
    if (historyEntries.length > 50) historyEntries.pop();
    saveHistory();
}

function clearHistory() {
    historyEntries = [];
    saveHistory();
    const listDiv = document.getElementById('historyList');
    if (listDiv) listDiv.innerHTML = '<div class="history-item">No history yet</div>';
}

// ========== THEMES (12) ==========
const themes = ['default', 'obsidian', 'royalblue', 'orange', 'highcontrast', 'forest', 'crimson', 'slate', 'purple', 'midnight', 'sand', 'cyan-night'];
const themeNames = ['Default', 'Obsidian', 'Royal Blue', 'Orange', 'High Contrast', 'Forest', 'Crimson', 'Slate', 'Purple', 'Midnight', 'Sand', 'Cyan Night'];

function applyTheme(themeName) {
    document.body.className = '';
    document.body.classList.add(`theme-${themeName}`);
    localStorage.setItem('activeTheme', themeName);
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
    themes.forEach((theme, index) => {
        const themeBtn = document.createElement('div');
        themeBtn.className = 'theme-option';
        themeBtn.textContent = themeNames[index];
        themeBtn.style.backgroundColor = getThemeColor(theme);
        themeBtn.style.color = '#fff';
        themeBtn.style.textShadow = '0 0 2px black';
        themeBtn.addEventListener('click', () => applyTheme(theme));
        gallery.appendChild(themeBtn);
    });
}

function getThemeColor(theme) {
    const colors = {
        default: '#7c3aed', obsidian: '#a855f7', royalblue: '#3b82f6',
        orange: '#f97316', highcontrast: '#ffff00', forest: '#22c55e',
        crimson: '#ef4444', slate: '#64748b', purple: '#c084fc',
        midnight: '#60a5fa', sand: '#fbbf24', 'cyan-night': '#06b6d4'
    };
    return colors[theme] || '#7c3aed';
}

// ========== FONTS ==========
function initFont() {
    const saved = localStorage.getItem('appFont');
    if (saved) document.body.style.fontFamily = saved;
    const selector = document.getElementById('fontSelector');
    if (selector) {
        selector.value = saved || 'Times New Roman';
        selector.addEventListener('change', (e) => {
            document.body.style.fontFamily = e.target.value;
            localStorage.setItem('appFont', e.target.value);
        });
    }
}

// ========== BUTTON LAYOUTS ==========
const arithmeticButtons = [
    '7', '8', '9', '/', '(', ')',
    '4', '5', '6', '*', '%', '^',
    '1', '2', '3', '-', '&', '|',
    '0', '.', '+', '~', '<<', '>>', 'C'
];

const logicButtons = [
    'TRUE', 'FALSE', 'AND', 'OR', 'NOT', 'XOR',
    'IMPLIES', 'EQUIV', '(', ')', 'C'
];

const setTheoryButtons = [
    'UNION', 'INTERSECT', 'COMPLEMENT', 'DIFFERENCE',
    'SUBSET', 'POWERSET', '{', '}', ',', 'C'
];

const conversionButtons = [
    'DEC->BIN', 'BIN->DEC', 'DEC->HEX', 'HEX->DEC',
    'DEC->OCT', 'OCT->DEC', 'BIN->HEX', 'CLEAR'
];

// Relational operators for arithmetic branch
const relationalOps = ['=', '!=', '<', '>', '<=', '>='];

function renderButtons() {
    let btns = [];
    if (currentBranch === 'arithmetic') btns = [...arithmeticButtons, ...relationalOps];
    else if (currentBranch === 'logic') btns = logicButtons;
    else if (currentBranch === 'settheory') btns = setTheoryButtons;
    else btns = conversionButtons;
    
    dynamicDiv.innerHTML = '';
    
    btns.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'calc-btn';
        btn.textContent = label;
        
        if (label === 'C' || label === 'CLEAR') {
            btn.addEventListener('click', () => {
                exprInput.value = '';
                stepsDisplay.innerHTML = 'Cleared';
                resultDisplay.textContent = '0';
            });
        } else {
            btn.addEventListener('click', () => {
                if (currentBranch === 'conversion' && label.includes('->')) {
                    exprInput.value = label + ' ';
                } else {
                    exprInput.value += label;
                }
            });
        }
        dynamicDiv.appendChild(btn);
    });
}

// ========== EVALUATION ENGINES ==========

// Arithmetic with relational operators
function evaluateArithmetic(expr) {
    try {
        let clean = expr.replace(/\s/g, '');
        if (!clean) return { result: 'Error', steps: 'Empty expression' };
        
        // Check for relational operators
        const relMatch = clean.match(/(.+?)(==|!=|<=|>=|<|>)(.+)/);
        if (relMatch) {
            const left = evaluateArithmeticRaw(relMatch[1]);
            const right = evaluateArithmeticRaw(relMatch[3]);
            const op = relMatch[2];
            let boolResult = false;
            if (op === '==') boolResult = left.result === right.result;
            else if (op === '!=') boolResult = left.result !== right.result;
            else if (op === '<') boolResult = left.result < right.result;
            else if (op === '>') boolResult = left.result > right.result;
            else if (op === '<=') boolResult = left.result <= right.result;
            else if (op === '>=') boolResult = left.result >= right.result;
            return {
                result: boolResult,
                steps: `${left.steps}\n${right.steps}\nStep: ${left.result} ${op} ${right.result} = ${boolResult}`
            };
        }
        return evaluateArithmeticRaw(clean);
    } catch(e) {
        return { result: 'Error', steps: 'Invalid expression' };
    }
}

function evaluateArithmeticRaw(expr) {
    try {
        const tokens = tokenizeArithmetic(expr);
        const rpn = toRPN(tokens);
        const steps = [];
        const stack = [];
        
        for (let tok of rpn) {
            if (!isOperator(tok)) {
                stack.push({ val: parseFloat(tok), raw: tok });
            } else if (tok === '~') {
                let a = stack.pop();
                let res = ~a.val;
                steps.push(`Step ${steps.length+1}: ~(${a.raw}) = ${res}`);
                stack.push({ val: res, raw: res });
            } else {
                let b = stack.pop();
                let a = stack.pop();
                let res = compute(a.val, b.val, tok);
                steps.push(`Step ${steps.length+1}: ${a.raw} ${tok} ${b.raw} = ${res}`);
                stack.push({ val: res, raw: res });
            }
        }
        return { result: stack[0].val, steps: steps.join('\n') || 'Direct evaluation' };
    } catch(e) {
        return { result: 'Error', steps: 'Invalid arithmetic' };
    }
}

function tokenizeArithmetic(expr) {
    let tokens = [], i = 0;
    while (i < expr.length) {
        let ch = expr[i];
        if (ch >= '0' && ch <= '9' || ch === '.') {
            let num = '';
            while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) num += expr[i++];
            tokens.push(num);
            continue;
        }
        if (ch === '(' || ch === ')') { tokens.push(ch); i++; continue; }
        if (ch === '<' && expr[i+1] === '<') { tokens.push('<<'); i+=2; continue; }
        if (ch === '>' && expr[i+1] === '>') { tokens.push('>>'); i+=2; continue; }
        if ('+-*/%^&|~'.includes(ch)) { tokens.push(ch); i++; continue; }
        i++;
    }
    return tokens;
}

function isOperator(op) {
    return '+-*/%^&|~<<>>'.includes(op);
}

function precedence(op) {
    if (op === '~') return 5;
    if (op === '^') return 4;
    if (op === '*' || op === '/' || op === '%') return 3;
    if (op === '+' || op === '-') return 2;
    if (op === '<<' || op === '>>') return 1;
    if (op === '&') return 0;
    if (op === '|') return -1;
    return -2;
}

function toRPN(tokens) {
    let output = [], stack = [];
    for (let t of tokens) {
        if (!isNaN(parseFloat(t)) && isFinite(t)) output.push(t);
        else if (t === '(') stack.push(t);
        else if (t === ')') {
            while (stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
            stack.pop();
        } else if (isOperator(t)) {
            while (stack.length && isOperator(stack[stack.length-1]) && precedence(stack[stack.length-1]) >= precedence(t)) output.push(stack.pop());
            stack.push(t);
        }
    }
    while (stack.length) output.push(stack.pop());
    return output;
}

function compute(a, b, op) {
    a = Number(a); b = Number(b);
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return a / b;
    if (op === '%') return a % b;
    if (op === '^') return Math.pow(a, b);
    if (op === '&') return a & b;
    if (op === '|') return a | b;
    if (op === '<<') return a << b;
    if (op === '>>') return a >> b;
    return 0;
}

// Logic
function evaluateLogic(expr) {
    try {
        let clean = expr.replace(/\s/g, '').toUpperCase();
        if (!clean) return { result: 'Error', steps: 'Empty expression' };
        const tokens = tokenizeLogic(clean);
        const rpn = toRPNLogic(tokens);
        let stack = [], steps = [];
        for (let t of rpn) {
            if (!isLogicOp(t)) {
                let val = (t === 'TRUE');
                stack.push({ val: val, raw: t });
            } else if (t === 'NOT') {
                let a = stack.pop();
                let res = !a.val;
                steps.push(`Step ${steps.length+1}: NOT(${a.raw}) = ${res}`);
                stack.push({ val: res, raw: res });
            } else {
                let b = stack.pop();
                let a = stack.pop();
                let res = applyLogicOp(a.val, b.val, t);
                steps.push(`Step ${steps.length+1}: ${a.raw} ${t} ${b.raw} = ${res}`);
                stack.push({ val: res, raw: res });
            }
        }
        return { result: stack[0].val, steps: steps.join('\n') || 'Evaluated' };
    } catch(e) {
        return { result: 'Error', steps: 'Invalid logic expression. Use TRUE/FALSE and operators.' };
    }
}

function tokenizeLogic(expr) {
    let tokens = [], i = 0;
    const ops = ['TRUE', 'FALSE', 'AND', 'OR', 'NOT', 'XOR', 'IMPLIES', 'EQUIV', '(', ')'];
    while (i < expr.length) {
        if (expr[i] === '(' || expr[i] === ')') { tokens.push(expr[i]); i++; continue; }
        let matched = false;
        for (let op of ops) {
            if (expr.startsWith(op, i)) {
                tokens.push(op);
                i += op.length;
                matched = true;
                break;
            }
        }
        if (!matched) i++;
    }
    return tokens;
}

function isLogicOp(tok) {
    return ['AND', 'OR', 'NOT', 'XOR', 'IMPLIES', 'EQUIV'].includes(tok);
}

function precedenceLogic(op) {
    if (op === 'NOT') return 4;
    if (op === 'AND') return 3;
    if (op === 'XOR') return 2;
    if (op === 'OR') return 1;
    if (op === 'IMPLIES' || op === 'EQUIV') return 0;
    return -1;
}

function toRPNLogic(tokens) {
    let output = [], stack = [];
    for (let t of tokens) {
        if (t === 'TRUE' || t === 'FALSE') output.push(t);
        else if (t === '(') stack.push(t);
        else if (t === ')') {
            while (stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
            stack.pop();
        } else if (isLogicOp(t)) {
            while (stack.length && isLogicOp(stack[stack.length-1]) && precedenceLogic(stack[stack.length-1]) >= precedenceLogic(t)) output.push(stack.pop());
            stack.push(t);
        }
    }
    while (stack.length) output.push(stack.pop());
    return output;
}

function applyLogicOp(a, b, op) {
    if (op === 'AND') return a && b;
    if (op === 'OR') return a || b;
    if (op === 'XOR') return a !== b;
    if (op === 'IMPLIES') return (!a) || b;
    if (op === 'EQUIV') return a === b;
    return false;
}

// Set Theory (simplified evaluation)
function evaluateSetTheory(expr) {
    let upper = expr.toUpperCase();
    if (upper.includes('UNION')) return { result: 'A ∪ B', steps: 'Union: elements in A or B' };
    if (upper.includes('INTERSECT')) return { result: 'A ∩ B', steps: 'Intersection: elements in both A and B' };
    if (upper.includes('COMPLEMENT')) return { result: 'A\'', steps: 'Complement: elements not in A' };
    if (upper.includes('DIFFERENCE')) return { result: 'A \\ B', steps: 'Difference: elements in A but not in B' };
    if (upper.includes('SUBSET')) return { result: 'A ⊆ B', steps: 'Subset: all elements of A are in B' };
    if (upper.includes('POWERSET')) return { result: 'P(A)', steps: 'Power set: set of all subsets of A' };
    return { result: 'Set operation', steps: 'Use UNION, INTERSECT, COMPLEMENT, DIFFERENCE, SUBSET, POWERSET' };
}

// Conversion
function evaluateConversion(expr) {
    const patterns = [
        /DEC->BIN\s+(\d+)/i, /BIN->DEC\s+([01]+)/i,
        /DEC->HEX\s+(\d+)/i, /HEX->DEC\s+([0-9A-F]+)/i,
        /DEC->OCT\s+(\d+)/i, /OCT->DEC\s+([0-7]+)/i,
        /BIN->HEX\s+([01]+)/i
    ];
    
    for (let pattern of patterns) {
        let match = expr.match(pattern);
        if (match) {
            let input = match[1];
            if (pattern.toString().includes('DEC->BIN')) {
                let num = parseInt(input);
                return { result: num.toString(2), steps: `Step 1: Convert ${num} to binary = ${num.toString(2)}` };
            }
            if (pattern.toString().includes('BIN->DEC')) {
                let num = parseInt(input, 2);
                return { result: num, steps: `Step 1: Binary ${input} to decimal = ${num}` };
            }
            if (pattern.toString().includes('DEC->HEX')) {
                let num = parseInt(input);
                return { result: num.toString(16).toUpperCase(), steps: `Step 1: Convert ${num} to hex = ${num.toString(16).toUpperCase()}` };
            }
            if (pattern.toString().includes('HEX->DEC')) {
                let num = parseInt(input, 16);
                return { result: num, steps: `Step 1: Hex ${input} to decimal = ${num}` };
            }
            if (pattern.toString().includes('DEC->OCT')) {
                let num = parseInt(input);
                return { result: num.toString(8), steps: `Step 1: Convert ${num} to octal = ${num.toString(8)}` };
            }
            if (pattern.toString().includes('OCT->DEC')) {
                let num = parseInt(input, 8);
                return { result: num, steps: `Step 1: Octal ${input} to decimal = ${num}` };
            }
            if (pattern.toString().includes('BIN->HEX')) {
                let dec = parseInt(input, 2);
                return { result: dec.toString(16).toUpperCase(), steps: `Step 1: Binary to decimal = ${dec}\nStep 2: Decimal to hex = ${dec.toString(16).toUpperCase()}` };
            }
        }
    }
    return { result: 'Error', steps: 'Use format: DEC->BIN 255 or BIN->DEC 1111' };
}

// Main evaluate
function evaluate() {
    let raw = exprInput.value.trim();
    if (!raw) {
        resultDisplay.textContent = '0';
        stepsDisplay.innerHTML = 'Enter an expression';
        return;
    }
    
    let evalRes;
    if (currentBranch === 'arithmetic') evalRes = evaluateArithmetic(raw);
    else if (currentBranch === 'logic') evalRes = evaluateLogic(raw);
    else if (currentBranch === 'settheory') evalRes = evaluateSetTheory(raw);
    else evalRes = evaluateConversion(raw);
    
    let resStr = evalRes.result.toString();
    resultDisplay.textContent = resStr;
    stepsDisplay.innerHTML = evalRes.steps || 'No steps available';
    addHistory(raw, resStr, evalRes.steps, currentBranch);
}

// ========== UI ==========
function toggleDrawer(open) {
    document.getElementById('drawer').classList.toggle('open', open);
    document.getElementById('overlay').classList.toggle('active', open);
}

function showHistory() {
    const modal = document.getElementById('historyModal');
    const listDiv = document.getElementById('historyList');
    
    if (historyEntries.length === 0) {
        listDiv.innerHTML = '<div class="history-item">No history yet</div>';
    } else {
        listDiv.innerHTML = historyEntries.map(h => `
            <div class="history-item">
                <div class="history-expr">${escapeHtml(h.expr)}</div>
                <div class="history-result">= ${escapeHtml(h.result)}</div>
                <div class="history-meta">${h.branch} | ${h.date}</div>
            </div>
        `).join('');
    }
    modal.style.display = 'block';
}

function resetSession() {
    exprInput.value = '';
    resultDisplay.textContent = '0';
    stepsDisplay.innerHTML = 'Ready';
}

function clearCache() {
    if (confirm('Clear all cache, history, and reset to defaults?')) {
        localStorage.clear();
        historyEntries = [];
        saveHistory();
        initTheme();
        initFont();
        resetSession();
        alert('Cache cleared. Theme and font reset to defaults.');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== INITIALIZATION ==========
function init() {
    loadHistory();
    initTheme();
    initFont();
    renderButtons();
    
    // Branch buttons
    document.querySelectorAll('.branch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.branch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBranch = btn.getAttribute('data-branch');
            renderButtons();
            exprInput.value = '';
            stepsDisplay.innerHTML = `Switched to ${currentBranch} mode`;
            resultDisplay.textContent = '0';
        });
    });
    
    // Action buttons
    document.getElementById('equalBtn').addEventListener('click', evaluate);
    document.getElementById('clearBtn').addEventListener('click', () => {
        exprInput.value = '';
        stepsDisplay.innerHTML = 'Cleared';
        resultDisplay.textContent = '0';
    });
    document.getElementById('backBtn').addEventListener('click', () => {
        exprInput.value = exprInput.value.slice(0, -1);
    });
    document.getElementById('historyShowBtn').addEventListener('click', showHistory);
    
    // Drawer
    document.getElementById('menuToggleBtn').addEventListener('click', () => toggleDrawer(true));
    document.getElementById('closeDrawerBtn').addEventListener('click', () => toggleDrawer(false));
    document.getElementById('overlay').addEventListener('click', () => toggleDrawer(false));
    document.getElementById('drawerClearCacheBtn').addEventListener('click', () => {
        toggleDrawer(false);
        clearCache();
    });
    document.getElementById('drawerExitBtn').addEventListener('click', () => {
        toggleDrawer(false);
        resetSession();
    });
    
    // History modal
    document.getElementById('closeHistoryBtn').addEventListener('click', () => {
        document.getElementById('historyModal').style.display = 'none';
    });
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        clearHistory();
        const modal = document.getElementById('historyModal');
        if (modal.style.display === 'block') showHistory(); // refresh
    });
    
    // Enter key
    exprInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') evaluate();
    });
}

init();
