// STATE
let currentBranch = "universal";
let historyEntries = [];

// DOM Elements
const exprInput = document.getElementById('exprInput');
const resultDisplay = document.getElementById('resultDisplay');
const fallbackMessage = document.getElementById('fallbackMessage');
const branchIndicator = document.getElementById('branchIndicator');
const dynamicDiv = document.getElementById('dynamicButtons');
const calculatorView = document.getElementById('calculatorView');
const stepsView = document.getElementById('stepsView');
const fullPageView = document.getElementById('fullPageView');
const fullPageTitle = document.getElementById('fullPageTitle');
const fullPageContent = document.getElementById('fullPageContent');

const branchNames = {
    'universal': 'Universal (Scientific)',
    'arithmetic': 'Arithmetic & Bitwise',
    'combinatorics': 'Combinatorics',
    'logic': 'Logic & Boolean',
    'settheory': 'Set Theory',
    'numbertheory': 'Number Theory',
    'conversion': 'Number System Conversion',
    'matrix': 'Matrix Algebra',
    'complex': 'Complex Numbers'
};

// ========== SYMBOL PRE-PROCESSOR ==========
function preprocessExpression(expr) {
    let processed = expr;
    processed = processed.replace(/&&/g, ' AND ');
    processed = processed.replace(/\|\|/g, ' OR ');
    processed = processed.replace(/!(?!=)/g, ' NOT ');
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

// ========== UTILITIES ==========
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== VIEW SWITCHING ==========
function showCalculatorView() {
    calculatorView.style.display = 'flex';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'none';
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
    fullPageView.style.display = 'none';
}

function showFullPage(title, contentHtml) {
    fullPageTitle.textContent = title;
    fullPageContent.innerHTML = contentHtml;
    calculatorView.style.display = 'none';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'flex';
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
}

// ========== FONTS ==========
function initFont() {
    const saved = localStorage.getItem('appFont');
    if (saved) document.body.style.fontFamily = saved;
    else document.body.style.fontFamily = 'Times New Roman';
}
function setFont(font) {
    document.body.style.fontFamily = font;
    localStorage.setItem('appFont', font);
}

// ========== HELPER FUNCTIONS ==========
function fact(n) { if (n < 0) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function gcd(a, b) { while (b) { let t = b; b = a % b; a = t; } return a; }

// ========== BUTTONS PER BRANCH ==========
const universalButtons = [
    '7', '8', '9', '/', '(', ')', 'C',
    '4', '5', '6', '*', '^', '√', '!',
    '1', '2', '3', '-', '+', '%', 'abs',
    '0', '.', 'sin', 'cos', 'tan', 'log', 'ln',
    'AND', 'OR', 'NOT', 'XOR', '=', '≠', '≥', '≤', '>', '<', '÷', '×', '∧', '∨'
];
const arithmeticButtons = [
    '7', '8', '9', '/', '(', ')', 'C',
    '4', '5', '6', '*', '%', '^', '&',
    '1', '2', '3', '-', '+', '|', '~',
    '0', '.', '<<', '>>', '√', '!', 'abs', '≥', '≤', '≠'
];
const combinatoricsButtons = [
    '7', '8', '9', 'nCr', 'nPr', '(', ')', 'C',
    '4', '5', '6', '!', 'C', 'P', ',',
    '1', '2', '3', '0', '.'
];
const logicButtons = [
    'TRUE', 'FALSE', 'AND', 'OR', 'NOT', 'XOR', 'IMPLIES', 'EQUIV', '(', ')', 'C',
    '7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.',
    '+', '-', '*', '/', '^', '==', '!=', '>=', '<=', '>', '<'
];
const settheoryButtons = [
    'UNION', '∩', 'COMPLEMENT', '\\', 'SUBSET', 'POWERSET', '{', '}', ',', 'C',
    '7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'
];
const numbertheoryButtons = [
    '7', '8', '9', 'gcd', 'lcm', 'mod', 'C',
    '4', '5', '6', 'prime?', 'factor', '(', ')',
    '1', '2', '3', '0', '.'
];
const conversionButtons = [
    'DEC → BINARY', 'BIN → DECIMAL', 'DEC → HEX', 'HEX → DECIMAL',
    'DEC → OCT', 'OCT → DECIMAL', 'BIN → HEX', 'CLEAR'
];
const matrixButtons = [
    'det2x2', 'add2x2', 'mul2x2', '[a b; c d]', 'C'
];
const complexButtons = [
    're', 'im', 'conj', 'abs', 'arg', '+', '-', '*', '/', 'C'
];

const BASE_BUTTONS = ['7','8','9','4','5','6','1','2','3','0','.','(',')','+','-','*','/'];

function getFullButtons(branch) {
    let specific = [];
    switch(branch) {
        case 'universal': specific = universalButtons; break;
        case 'arithmetic': specific = arithmeticButtons; break;
        case 'combinatorics': specific = combinatoricsButtons; break;
        case 'logic': specific = logicButtons; break;
        case 'settheory': specific = settheoryButtons; break;
        case 'numbertheory': specific = numbertheoryButtons; break;
        case 'conversion': specific = conversionButtons; break;
        case 'matrix': specific = matrixButtons; break;
        case 'complex': specific = complexButtons; break;
        default: specific = universalButtons;
    }
    const merged = [...new Set([...BASE_BUTTONS, ...specific])];
    const clearBtn = merged.find(b => b === 'C' || b === 'CLEAR');
    const filtered = merged.filter(b => b !== 'C' && b !== 'CLEAR');
    if (clearBtn) filtered.push(clearBtn);
    return filtered;
}

function isNumberButton(label) {
    return /^[0-9.]$/.test(label);
}

function renderButtons() {
    const btns = getFullButtons(currentBranch);
    
    // Separate numbers from everything else
    const numberBtns = btns.filter(label => isNumberButton(label));
    const otherBtns = btns.filter(label => !isNumberButton(label));
    
    dynamicDiv.innerHTML = '';
    
    // Render number buttons first (they fill columns 1-3 naturally)
    numberBtns.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'calc-btn number-btn';
        btn.textContent = label;
        btn.onclick = () => { exprInput.value += label; };
        dynamicDiv.appendChild(btn);
    });
    
    // Render all other buttons
    otherBtns.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'calc-btn';
        btn.textContent = label;
        if (label === 'C' || label === 'CLEAR') {
            btn.onclick = () => { exprInput.value = ''; if (resultDisplay) resultDisplay.textContent = '0'; if (fallbackMessage) fallbackMessage.style.display = 'none'; };
        } else {
            btn.onclick = () => {
                if (currentBranch === 'conversion' && label.includes('→')) {
                    exprInput.value = label + ' ';
                } else {
                    exprInput.value += label;
                }
            };
        }
        dynamicDiv.appendChild(btn);
    });
}

function updateBranchIndicator() {
    branchIndicator.textContent = branchNames[currentBranch] || 'Universal (Scientific)';
}

// ========== ROBUST MODULO / PERCENTAGE HANDLER ==========
function handleModuloAndPercentage(expr) {
    let protectedExpr = expr.replace(/(\d)\s*%\s*(?=\d)/g, '$1__MOD__');
    protectedExpr = protectedExpr.replace(/(\d+)\s*%/g, '($1/100)');
    protectedExpr = protectedExpr.replace(/__MOD__/g, ' % ');
    return protectedExpr;
}

// ========== AUTO-PARENTHESIZE FUNCTIONS ==========
function autoParenthesizeFunctions(expr) {
    const funcs = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs'];
    funcs.forEach(fn => {
        const regex = new RegExp(`Math\\.${fn}(\\d+(\\.\\d+)?)`, 'g');
        expr = expr.replace(regex, `Math.${fn}($1)`);
    });
    return expr;
}

// ========== STEP-BY-STEP BREAKDOWN GENERATOR ==========
function generateSteps(expr) {
    let steps = [];
    let clean = preprocessExpression(expr);
    
    steps.push(`Original: ${expr}`);
    steps.push(`After symbol mapping: ${clean}`);
    
    let processed = handleModuloAndPercentage(clean);
    steps.push(`After modulo/percentage processing: ${processed}`);
    
    processed = processed.replace(/√/g, 'sqrt').replace(/\^/g, '**');
    processed = processed.replace(/(\d+)!/g, (_, n) => `fact(${n})`);
    processed = processed.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!');
    processed = processed.replace(/==/g, '===').replace(/!=/g, '!==');
    processed = processed.replace(/\bsin\(/g, 'Math.sin(');
    processed = processed.replace(/\bcos\(/g, 'Math.cos(');
    processed = processed.replace(/\btan\(/g, 'Math.tan(');
    processed = processed.replace(/\blog\(/g, 'Math.log10(');
    processed = processed.replace(/\bln\(/g, 'Math.log(');
    processed = processed.replace(/\bsqrt\(/g, 'Math.sqrt(');
    processed = processed.replace(/\babs\(/g, 'Math.abs(');
    processed = autoParenthesizeFunctions(processed);
    
    steps.push(`Converted to JS: ${processed}`);
    
    const parenRegex = /\(([^()]+)\)/g;
    let match;
    let subExprs = [];
    while ((match = parenRegex.exec(processed)) !== null) {
        subExprs.push(match[1]);
    }
    
    if (subExprs.length > 0) {
        steps.push(`Found ${subExprs.length} sub-expression(s) in parentheses:`);
        subExprs.forEach((sub) => {
            try {
                const fn = new Function('factorial', 'return (' + sub + ')');
                const val = fn(fact);
                steps.push(`  (${sub}) = ${val}`);
            } catch(e) {
                steps.push(`  (${sub}) = [sub-expression]`);
            }
        });
    }
    
    try {
        const fn = new Function('factorial', 'return (' + processed + ')');
        const result = fn(fact);
        steps.push(`Final result: ${result}`);
    } catch(e) {
        steps.push(`Error: ${e.message}`);
    }
    
    return steps.join('\n');
}

// ========== EVALUATION ENGINE ==========
function evaluateUniversal(expr) {
    try {
        let clean = preprocessExpression(expr);
        if (!clean) return { result: '0', steps: 'Empty expression' };
        
        let processed = handleModuloAndPercentage(clean);
        processed = processed.replace(/√/g, 'sqrt').replace(/\^/g, '**');
        processed = processed.replace(/(\d+)!/g, (_, n) => `fact(${n})`);
        processed = processed.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!');
        processed = processed.replace(/==/g, '===').replace(/!=/g, '!==');
        processed = processed.replace(/\bsin\(/g, 'Math.sin(');
        processed = processed.replace(/\bcos\(/g, 'Math.cos(');
        processed = processed.replace(/\btan\(/g, 'Math.tan(');
        processed = processed.replace(/\blog\(/g, 'Math.log10(');
        processed = processed.replace(/\bln\(/g, 'Math.log(');
        processed = processed.replace(/\bsqrt\(/g, 'Math.sqrt(');
        processed = processed.replace(/\babs\(/g, 'Math.abs(');
        processed = autoParenthesizeFunctions(processed);
        
        const fn = new Function('factorial', 'return (' + processed + ')');
        const result = fn(fact);
        const steps = generateSteps(expr);
        return { result: result, steps: steps };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid expression: ' + e.message };
    }
}

function evaluateCombinatorics(expr) {
    let u = expr.toUpperCase();
    let m = u.match(/NCR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        let n = parseInt(m[1]), r = parseInt(m[2]);
        let res = fact(n) / (fact(r) * fact(n - r));
        return { result: res, steps: `C(${n},${r}) = ${n}!/(${r}!(${n-r})!) = ${res}` };
    }
    m = u.match(/NPR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        let n = parseInt(m[1]), r = parseInt(m[2]);
        let res = fact(n) / fact(n - r);
        return { result: res, steps: `P(${n},${r}) = ${n}!/(${n-r})! = ${res}` };
    }
    m = u.match(/(\d+)!/);
    if (m) {
        let n = parseInt(m[1]);
        let res = fact(n);
        return { result: res, steps: `${n}! = ${res}` };
    }
    return { result: 'Error', steps: 'No combinatorics operation detected' };
}

function evaluateLogic(expr) {
    return evaluateUniversal(expr);
}

function evaluateSetTheory(expr) {
    let u = expr.toUpperCase();
    if (u.includes('UNION')) return { result: 'A ∪ B', steps: 'Union: elements in A or B' };
    if (u.includes('∩')) return { result: 'A ∩ B', steps: 'Intersection: elements in both' };
    if (u.includes('COMPLEMENT')) return { result: 'A\'', steps: 'Complement: elements not in A' };
    if (u.includes('\\')) return { result: 'A \\ B', steps: 'Difference: A minus B' };
    if (u.includes('SUBSET')) return { result: 'A ⊆ B', steps: 'Subset: all A in B' };
    if (u.includes('POWERSET')) return { result: 'P(A)', steps: 'Set of all subsets' };
    return { result: 'Error', steps: 'No set operation detected' };
}

function evaluateNumberTheory(expr) {
    let u = expr.toLowerCase();
    let m = u.match(/gcd\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        let a = parseInt(m[1]), b = parseInt(m[2]);
        let g = gcd(a, b);
        return { result: g, steps: `GCD(${a},${b}) = ${g}` };
    }
    m = u.match(/lcm\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        let a = parseInt(m[1]), b = parseInt(m[2]);
        let l = a * b / gcd(a, b);
        return { result: l, steps: `LCM(${a},${b}) = ${l}` };
    }
    m = u.match(/mod\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) return { result: parseInt(m[1]) % parseInt(m[2]), steps: `${m[1]} mod ${m[2]} = ${parseInt(m[1]) % parseInt(m[2])}` };
    m = u.match(/prime\?\s*(\d+)/);
    if (m) {
        let n = parseInt(m[1]);
        let isPrime = n > 1 && ![...Array(Math.floor(Math.sqrt(n))).keys()].slice(2).some(i => n % i === 0);
        return { result: isPrime, steps: `${n} is ${isPrime ? 'prime' : 'not prime'}` };
    }
    return { result: 'Error', steps: 'No number theory operation detected' };
}

function evaluateConversion(expr) {
    let m = expr.match(/(DEC → BINARY|BIN → DECIMAL|DEC → HEX|HEX → DECIMAL|DEC → OCT|OCT → DECIMAL|BIN → HEX)\s+(\S+)/i);
    if (!m) return { result: 'Error', steps: 'Format: DEC → BINARY 255' };
    let type = m[1].toUpperCase(), val = m[2];
    try {
        if (type.includes('DEC → BINARY')) return { result: parseInt(val).toString(2), steps: `Convert ${val} to binary = ${parseInt(val).toString(2)}` };
        if (type.includes('BIN → DECIMAL')) return { result: parseInt(val, 2), steps: `Binary ${val} to decimal = ${parseInt(val, 2)}` };
        if (type.includes('DEC → HEX')) return { result: parseInt(val).toString(16).toUpperCase(), steps: `Convert ${val} to hex = ${parseInt(val).toString(16).toUpperCase()}` };
        if (type.includes('HEX → DECIMAL')) return { result: parseInt(val, 16), steps: `Hex ${val} to decimal = ${parseInt(val, 16)}` };
        if (type.includes('DEC → OCT')) return { result: parseInt(val).toString(8), steps: `Convert ${val} to octal = ${parseInt(val).toString(8)}` };
        if (type.includes('OCT → DECIMAL')) return { result: parseInt(val, 8), steps: `Octal ${val} to decimal = ${parseInt(val, 8)}` };
        if (type.includes('BIN → HEX')) {
            let dec = parseInt(val, 2);
            return { result: dec.toString(16).toUpperCase(), steps: `Binary to decimal = ${dec}, then hex = ${dec.toString(16).toUpperCase()}` };
        }
    } catch (e) { return { result: 'Error', steps: 'Invalid input' }; }
    return { result: 'Error', steps: 'Unknown conversion' };
}

function evaluateMatrix(expr) {
    let u = expr.toLowerCase();
    let m = u.match(/det2x2\s*\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        let a = parseInt(m[1]), b = parseInt(m[2]), c = parseInt(m[3]), d = parseInt(m[4]);
        let det = a * d - b * c;
        return { result: det, steps: `det([${a} ${b}; ${c} ${d}]) = ${a}*${d} - ${b}*${c} = ${det}` };
    }
    return { result: 'Error', steps: 'No matrix operation detected' };
}

function evaluateComplex(expr) {
    return { result: 'Error', steps: 'No complex operation detected' };
}

function evaluateArithmetic(expr) {
    return evaluateUniversal(expr);
}

// ========== MAIN EVALUATE WITH FALLBACK ==========
function evaluate() {
    let raw = exprInput.value.trim();
    if (!raw) {
        resultDisplay.textContent = '0';
        fallbackMessage.style.display = 'none';
        return;
    }
    
    fallbackMessage.style.display = 'none';
    
    let res;
    let usedFallback = false;
    
    if (currentBranch === 'universal') {
        res = evaluateUniversal(raw);
    } else if (currentBranch === 'arithmetic') {
        res = evaluateArithmetic(raw);
    } else if (currentBranch === 'combinatorics') {
        res = evaluateCombinatorics(raw);
    } else if (currentBranch === 'logic') {
        res = evaluateLogic(raw);
    } else if (currentBranch === 'settheory') {
        res = evaluateSetTheory(raw);
    } else if (currentBranch === 'numbertheory') {
        res = evaluateNumberTheory(raw);
    } else if (currentBranch === 'conversion') {
        res = evaluateConversion(raw);
    } else if (currentBranch === 'matrix') {
        res = evaluateMatrix(raw);
    } else if (currentBranch === 'complex') {
        res = evaluateComplex(raw);
    } else {
        res = evaluateUniversal(raw);
    }

    if (res.result === 'Error' || (typeof res.result === 'string' && res.result.startsWith('Error'))) {
        const fallbackRes = evaluateUniversal(raw);
        if (fallbackRes.result !== 'Error' && !(typeof fallbackRes.result === 'string' && fallbackRes.result.startsWith('Error'))) {
            usedFallback = true;
            fallbackRes.steps = 'Expression entered does not match the branch, evaluating using universal branch.\n\n' + fallbackRes.steps;
            res = fallbackRes;
        }
    }

    let resStr = res.result.toString();
    resultDisplay.textContent = resStr;
    
    if (usedFallback && currentBranch !== 'universal' && currentBranch !== 'arithmetic') {
        fallbackMessage.textContent = 'Expression entered does not match the branch, evaluating using universal branch.';
        fallbackMessage.style.display = 'block';
    }
    
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
    fallbackMessage.style.display = 'none';
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

function showHelpPage() {
    const helpHtml = `
        <div class="about-text" style="font-size:0.8rem;">
            <h3>HOW TO USE THIS CALCULATOR</h3>
            
            <h3>--- BASIC ARITHMETIC ---</h3>
            <p><strong>Addition:</strong> 5 + 3</p>
            <p><strong>Subtraction:</strong> 10 - 4</p>
            <p><strong>Multiplication:</strong> 6 * 7 (or use × button)</p>
            <p><strong>Division:</strong> 15 / 3 (or use ÷ button)</p>
            <p><strong>Exponent/Power:</strong> 2^3 or 5^2</p>
            <p><strong>Modulo:</strong> 10 % 3 (works with or without spaces)</p>
            <p><strong>Percentage:</strong> 200% (result: 2)</p>
            <p><strong>Factorial:</strong> 5! (result: 120)</p>
            <p><strong>Square Root:</strong> √16 or √(16)</p>
            <p><strong>Nth Root:</strong> 27^(1/3)</p>
            <p><strong>Absolute Value:</strong> abs(-5)</p>

            <h3>--- SCIENTIFIC FUNCTIONS ---</h3>
            <p><strong>Sine:</strong> sin30 or sin(30)</p>
            <p><strong>Cosine:</strong> cos0</p>
            <p><strong>Tangent:</strong> tan45</p>
            <p><strong>Log base 10:</strong> log100</p>
            <p><strong>Natural Log:</strong> ln2.718</p>

            <h3>--- RELATIONAL OPERATORS ---</h3>
            <p><strong>Equal:</strong> 5 == 5</p>
            <p><strong>Not Equal:</strong> 5 != 3 or 5 ≠ 3</p>
            <p><strong>Greater/Less:</strong> 8 > 3, 3 < 8</p>
            <p><strong>Greater/Equal:</strong> 5 >= 5 or 5 ≥ 5</p>
            <p><strong>Less/Equal:</strong> 4 <= 5 or 4 ≤ 5</p>

            <h3>--- LOGICAL OPERATORS ---</h3>
            <p><strong>AND:</strong> (5>3) AND (2<4) — also && or ∧</p>
            <p><strong>OR:</strong> (1>5) OR (3==3) — also || or ∨</p>
            <p><strong>NOT:</strong> NOT(5>3) — also ! or ¬</p>
            <p><strong>XOR/IMPLIES/EQUIV:</strong> TRUE XOR FALSE, etc.</p>

            <h3>--- COMBINATORICS ---</h3>
            <p><strong>nCr:</strong> nCr(5,2)</p>
            <p><strong>nPr:</strong> nPr(5,2)</p>

            <h3>--- NUMBER THEORY ---</h3>
            <p><strong>GCD:</strong> gcd(12,8)</p>
            <p><strong>LCM:</strong> lcm(12,8)</p>
            <p><strong>Modulo:</strong> mod(10,3)</p>
            <p><strong>Prime:</strong> prime?(7)</p>

            <h3>--- CONVERSIONS ---</h3>
            <p>Use Conversion branch buttons, e.g. <strong>DEC → BINARY 255</strong></p>

            <h3>--- SET THEORY ---</h3>
            <p>UNION, ∩, COMPLEMENT, \\, SUBSET, POWERSET</p>

            <h3>--- MATRIX ---</h3>
            <p>det2x2(a,b,c,d)</p>

            <h3>--- COMPLEX ---</h3>
            <p>Placeholder; use Universal for arithmetic.</p>
        </div>
    `;
    showFullPage('HELP / HOW TO USE', helpHtml);
}

function showPrivacyPage() {
    const privacyHtml = `
        <div class="about-text" style="font-size:0.8rem;">
            <h2>PRIVACY POLICY</h2>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:20px;">Last updated: May 2026</p>
            <h3>1. Introduction</h3>
            <p>This privacy policy applies to the <strong>Universal CS Calculator</strong> application developed by Hanz Dalmino.</p>
            <h3>2. Data Collection</h3>
            <p><strong>We do not collect any personal data.</strong></p>
            <h3>3. Information Stored Locally</h3>
            <p>Calculation history, theme, and font preferences are stored only on your device.</p>
            <h3>4. Third-Party Services</h3>
            <p>None.</p>
            <h3>5. Internet Usage</h3>
            <p>Works offline after first launch.</p>
            <h3>6. Children's Privacy</h3>
            <p>No data collected from anyone.</p>
            <h3>7. Contact</h3>
            <p>Email: dalminohanz14@gmail.com</p>
        </div>
    `;
    showFullPage('PRIVACY & POLICY', privacyHtml);
}

function showThemesPage() {
    let html = '<div class="theme-grid">';
    themes.forEach((t, i) => {
        html += `<div class="theme-card" data-theme="${t}" style="background:${getThemeColor(t)}; color:white;">${themeNames[i]}</div>`;
    });
    html += '</div>';
    showFullPage('THEMES (12)', html);
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            applyTheme(card.dataset.theme);
            showCalculatorView();
        });
    });
}

function showFontPage() {
    const fonts = ['Times New Roman', 'Arial', 'Courier New', 'Georgia', 'Verdana'];
    let html = '<div class="font-selector-page">';
    fonts.forEach(f => {
        html += `<div class="font-option" data-font="${f}">${f}</div>`;
    });
    html += '</div>';
    showFullPage('FONT', html);
    document.querySelectorAll('.font-option').forEach(opt => {
        opt.addEventListener('click', () => {
            setFont(opt.dataset.font);
            showCalculatorView();
        });
    });
}

function showHistoryPage() {
    if (historyEntries.length === 0) {
        showFullPage('HISTORY', '<div class="history-item-page">No history yet</div>');
        return;
    }
    let html = '<div class="history-list-page">';
    historyEntries.forEach(h => {
        html += `<div class="history-item-page">
                    <div class="history-expr" style="font-family:monospace; font-weight:bold;">${escapeHtml(h.expr)}</div>
                    <div class="history-result" style="color:var(--accent);">= ${escapeHtml(h.result)}</div>
                    <div class="history-meta" style="font-size:0.7rem; opacity:0.6;">${h.branch} | ${h.date}</div>
                 </div>`;
    });
    html += '</div><button id="clearHistoryFromPage" class="action-btn" style="margin-top:15px; background:#ef4444; border:none; padding:10px; border-radius:30px; color:white; cursor:pointer; width:100%;">CLEAR ALL HISTORY</button>';
    showFullPage('HISTORY', html);
    document.getElementById('clearHistoryFromPage')?.addEventListener('click', () => {
        clearHistory();
        showHistoryPage();
    });
}

function showAboutPage() {
    const aboutHtml = `
        <div class="about-text">
            <h3>Developed by Hanz Dalmino</h3>
            <p>a Bachelor of Science in Information Technology student from Cebu Technological University - Main Campus</p>
            <h3>Purpose</h3>
            <p>This Universal CS Calculator is specifically designed for students and professionals in Computer Science, Information Technology, and Computer Engineering. It provides step-by-step evaluation for a wide range of mathematical concepts.</p>
            <h3>Topics Covered</h3>
            <ul>
                <li>Arithmetic & Bitwise Operations</li>
                <li>Relational and Logical Operators</li>
                <li>Combinatorics (nCr, nPr, Factorials)</li>
                <li>Boolean Algebra and Logic Gates</li>
                <li>Set Theory</li>
                <li>Number Theory (GCD, LCM, Modulo, Primality)</li>
                <li>Number System Conversions</li>
                <li>Matrix Algebra</li>
                <li>Complex Numbers</li>
                <li>Scientific Functions</li>
            </ul>
        </div>
    `;
    showFullPage('ABOUT', aboutHtml);
}

function getThemeColor(t) {
    const c = { default: '#7c3aed', obsidian: '#a855f7', royalblue: '#3b82f6', orange: '#f97316', highcontrast: '#ffff00', forest: '#22c55e', crimson: '#ef4444', slate: '#64748b', purple: '#c084fc', midnight: '#60a5fa', sand: '#fbbf24', 'cyan-night': '#06b6d4' };
    return c[t] || '#7c3aed';
}

// ========== INITIALIZATION ==========
function init() {
    loadHistory();
    initTheme();
    initFont();
    updateBranchIndicator();
    renderButtons();

    document.querySelectorAll('.branch-drawer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.branch-drawer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBranch = btn.getAttribute('data-branch');
            updateBranchIndicator();
            renderButtons();
            fallbackMessage.style.display = 'none';
            toggleDrawer(false);
        });
    });

    document.getElementById('drawerHelpBtn').onclick = () => { toggleDrawer(false); showHelpPage(); };
    document.getElementById('drawerPrivacyBtn').onclick = () => { toggleDrawer(false); showPrivacyPage(); };
    document.getElementById('drawerThemesBtn').onclick = () => { toggleDrawer(false); showThemesPage(); };
    document.getElementById('drawerFontBtn').onclick = () => { toggleDrawer(false); showFontPage(); };
    document.getElementById('drawerHistoryBtn').onclick = () => { toggleDrawer(false); showHistoryPage(); };
    document.getElementById('drawerAboutBtn').onclick = () => { toggleDrawer(false); showAboutPage(); };
    document.getElementById('drawerClearCacheBtn').onclick = () => { toggleDrawer(false); clearCache(); };
    document.getElementById('drawerExitBtn').onclick = () => { toggleDrawer(false); resetSession(); };

    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = () => { exprInput.value = ''; resultDisplay.textContent = '0'; fallbackMessage.style.display = 'none'; };
    document.getElementById('spaceBtn').onclick = () => { exprInput.value += ' '; };
    document.getElementById('backBtn').onclick = () => { exprInput.value = exprInput.value.slice(0, -1); };
    document.getElementById('menuToggleBtn').onclick = () => toggleDrawer(true);
    document.getElementById('closeDrawerBtn').onclick = () => toggleDrawer(false);
    document.getElementById('overlay').onclick = () => toggleDrawer(false);
    document.getElementById('closeFullPageBtn').onclick = () => showCalculatorView();
    document.getElementById('backToCalculatorBtn').onclick = () => showCalculatorView();

    exprInput.addEventListener('keypress', e => { if (e.key === 'Enter') evaluate(); });

    document.querySelectorAll('.branch-drawer-btn').forEach(btn => {
        if (btn.getAttribute('data-branch') === currentBranch) btn.classList.add('active');
    });
}

init();
