// STATE
let currentBranch = "arithmetic";
let historyEntries = [];

// DOM
const exprInput = document.getElementById('exprInput');
const resultDisplay = document.getElementById('resultDisplay');
const dynamicDiv = document.getElementById('dynamicButtons');
const calculatorView = document.getElementById('calculatorView');
const stepsView = document.getElementById('stepsView');

// ========== VIEW SWITCHING ==========
function showCalculatorView() {
    calculatorView.style.display = 'block';
    stepsView.style.display = 'none';
}

function showStepsView(expression, result, steps, branch) {
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
    const listDiv = document.getElementById('historyList');
    if (listDiv) listDiv.innerHTML = '<div class="history-item">No history</div>';
}
function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const listDiv = document.getElementById('historyList');
    if (historyEntries.length === 0) {
        listDiv.innerHTML = '<div class="history-item">No history</div>';
    } else {
        listDiv.innerHTML = historyEntries.map(h => `
            <div class="history-item">
                <div class="history-expr">${escapeHtml(h.expr)}</div>
                <div class="history-result">= ${escapeHtml(h.result)}</div>
                <div class="history-meta" style="font-size:0.65rem; opacity:0.6;">${h.branch} | ${h.date}</div>
            </div>
        `).join('');
    }
    modal.style.display = 'block';
}

// ========== THEMES (12) ==========
const themes = ['default','obsidian','royalblue','orange','highcontrast','forest','crimson','slate','purple','midnight','sand','cyan-night'];
const themeNames = ['Default','Obsidian','Royal Blue','Orange','High Contrast','Forest','Crimson','Slate','Purple','Midnight','Sand','Cyan Night'];

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
    const c = { default:'#7c3aed', obsidian:'#a855f7', royalblue:'#3b82f6', orange:'#f97316', highcontrast:'#ffff00', forest:'#22c55e', crimson:'#ef4444', slate:'#64748b', purple:'#c084fc', midnight:'#60a5fa', sand:'#fbbf24', 'cyan-night':'#06b6d4' };
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

// ========== BUTTONS PER BRANCH ==========
// Arithmetic includes fractions (a/b), exponents (x^y), roots (√), %, !, log, ln, sin, cos, tan, abs
const arithmetic = [
    '7','8','9','/','(',' )','4','5','6','*','%','^','1','2','3','-','+','0','.','√','!','abs','sin','cos','tan','log','ln','C'
];
const combinatorics = ['nCr','nPr','!','P(n,r)','C(n,r)','C'];
const logic = ['TRUE','FALSE','AND','OR','NOT','XOR','IMPLIES','EQUIV','(',')','C'];
const settheory = ['UNION','∩','COMPLEMENT','\\','SUBSET','POWERSET','{', '}', ',', 'C'];
const numbertheory = ['gcd','lcm','mod','prime?','factor','C'];
const conversion = [
    'DEC → BINARY', 'BIN → DECIMAL', 'DEC → HEX', 'HEX → DECIMAL',
    'DEC → OCT', 'OCT → DECIMAL', 'BIN → HEX', 'CLEAR'
];
const matrix = ['det2x2','add2x2','mul2x2','[a b; c d]','C'];
const complex = ['re','im','conj','abs','arg','+','-','*','/','C'];

function renderButtons() {
    let btns = [];
    if (currentBranch === 'arithmetic') btns = arithmetic;
    else if (currentBranch === 'combinatorics') btns = combinatorics;
    else if (currentBranch === 'logic') btns = logic;
    else if (currentBranch === 'settheory') btns = settheory;
    else if (currentBranch === 'numbertheory') btns = numbertheory;
    else if (currentBranch === 'conversion') btns = conversion;
    else if (currentBranch === 'matrix') btns = matrix;
    else btns = complex;
    
    dynamicDiv.innerHTML = '';
    btns.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'calc-btn';
        btn.textContent = label;
        if (label === 'C' || label === 'CLEAR') {
            btn.onclick = () => { exprInput.value = ''; resultDisplay.textContent = '0'; };
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

// ========== EVALUATION ENGINES ==========
// Enhanced arithmetic with functions, fractions, roots, etc.
function evaluateArithmetic(expr) {
    try {
        let clean = expr.replace(/\s/g, '');
        if (!clean) return { result: '0', steps: 'Empty expression' };
        // Replace √ with sqrt
        clean = clean.replace(/√/g, 'sqrt');
        // Replace ! with factorial handling
        if (clean.includes('!')) {
            let match = clean.match(/(\d+)!/);
            if (match) {
                let n = parseInt(match[1]);
                let res = fact(n);
                return { result: res, steps: `${n}! = ${res}` };
            }
        }
        // Replace abs(x) with Math.abs
        clean = clean.replace(/abs\(/g, 'Math.abs(');
        // Replace sin, cos, tan, log, ln
        clean = clean.replace(/sin\(/g, 'Math.sin(');
        clean = clean.replace(/cos\(/g, 'Math.cos(');
        clean = clean.replace(/tan\(/g, 'Math.tan(');
        clean = clean.replace(/log\(/g, 'Math.log10(');
        clean = clean.replace(/ln\(/g, 'Math.log(');
        clean = clean.replace(/sqrt\(/g, 'Math.sqrt(');
        
        // Handle fractions like a/b
        if (clean.includes('/') && !clean.includes('(') && !clean.includes('+') && !clean.includes('-') && !clean.includes('*')) {
            let parts = clean.split('/');
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                let res = parseFloat(parts[0]) / parseFloat(parts[1]);
                return { result: res, steps: `${parts[0]} / ${parts[1]} = ${res}` };
            }
        }
        
        // Relational operators
        const relMatch = clean.match(/(.+?)(==|!=|<=|>=|<|>)(.+)/);
        if (relMatch) {
            let left = evalArithSafe(relMatch[1]);
            let right = evalArithSafe(relMatch[3]);
            let op = relMatch[2];
            let bool = false;
            if (op === '==') bool = left === right;
            else if (op === '!=') bool = left !== right;
            else if (op === '<') bool = left < right;
            else if (op === '>') bool = left > right;
            else if (op === '<=') bool = left <= right;
            else if (op === '>=') bool = left >= right;
            return { result: bool, steps: `${left} ${op} ${right} = ${bool}` };
        }
        
        let res = evalArithSafe(clean);
        return { result: res, steps: `Result = ${res}` };
    } catch(e) {
        return { result: 'Error', steps: 'Invalid expression' };
    }
}
function evalArithSafe(expr) {
    try {
        // Use Function for safe evaluation with Math support
        const fn = new Function('return (' + expr + ')');
        return fn();
    } catch(e) {
        throw new Error('Evaluation error');
    }
}
function fact(n) { if(n<0) return NaN; let r=1; for(let i=2;i<=n;i++) r*=i; return r; }

// Combinatorics
function evaluateCombinatorics(expr) {
    let u = expr.toUpperCase();
    let m = u.match(/NCR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if(m) {
        let n=parseInt(m[1]), r=parseInt(m[2]);
        let res = fact(n)/(fact(r)*fact(n-r));
        return { result: res, steps: `C(${n},${r}) = ${n}!/(${r}!(${n-r})!) = ${res}` };
    }
    m = u.match(/NPR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if(m) {
        let n=parseInt(m[1]), r=parseInt(m[2]);
        let res = fact(n)/fact(n-r);
        return { result: res, steps: `P(${n},${r}) = ${n}!/(${n-r})! = ${res}` };
    }
    m = u.match(/(\d+)!/);
    if(m) {
        let n=parseInt(m[1]);
        let res = fact(n);
        return { result: res, steps: `${n}! = ${res}` };
    }
    return { result: 'Error', steps: 'Use nCr(n,r), nPr(n,r), or n!' };
}

// Logic
function evaluateLogic(expr) {
    let clean = expr.replace(/\s/g,'').toUpperCase();
    if(!clean) return { result:'Error', steps:'Empty' };
    try {
        let tokens = logicTokenize(clean);
        let rpn = logicToRPN(tokens);
        let stack=[], steps=[];
        for(let t of rpn) {
            if(!isLogicOp(t)) stack.push({val: t==='TRUE', raw:t});
            else if(t==='NOT') {
                let a=stack.pop();
                let res=!a.val;
                steps.push(`NOT(${a.raw}) = ${res}`);
                stack.push({val:res, raw:res});
            } else {
                let b=stack.pop(), a=stack.pop();
                let res = logicCompute(a.val,b.val,t);
                steps.push(`${a.raw} ${t} ${b.raw} = ${res}`);
                stack.push({val:res, raw:res});
            }
        }
        return { result: stack[0].val, steps: steps.map((s,i)=>`Step ${i+1}: ${s}`).join('\n') };
    } catch(e) { return { result:'Error', steps:'Invalid logic' }; }
}
function logicTokenize(e) {
    let t=[], i=0;
    const ops=['TRUE','FALSE','AND','OR','NOT','XOR','IMPLIES','EQUIV','(',')'];
    while(i<e.length) {
        if(e[i]=='('||e[i]==')') { t.push(e[i]); i++; continue; }
        let matched=false;
        for(let op of ops) {
            if(e.startsWith(op,i)) { t.push(op); i+=op.length; matched=true; break; }
        }
        if(!matched) i++;
    }
    return t;
}
function isLogicOp(t) { return ['AND','OR','NOT','XOR','IMPLIES','EQUIV'].includes(t); }
function logicPrec(op) { if(op=='NOT') return 4; if(op=='AND') return 3; if(op=='XOR') return 2; if(op=='OR') return 1; return 0; }
function logicToRPN(tokens) {
    let out=[], stack=[];
    for(let t of tokens) {
        if(t==='TRUE'||t==='FALSE') out.push(t);
        else if(t==='(') stack.push(t);
        else if(t===')') { while(stack.length && stack[stack.length-1]!=='(') out.push(stack.pop()); stack.pop(); }
        else if(isLogicOp(t)) { while(stack.length && isLogicOp(stack[stack.length-1]) && logicPrec(stack[stack.length-1])>=logicPrec(t)) out.push(stack.pop()); stack.push(t); }
    }
    while(stack.length) out.push(stack.pop());
    return out;
}
function logicCompute(a,b,op) {
    if(op==='AND') return a&&b; if(op==='OR') return a||b; if(op==='XOR') return a!==b;
    if(op==='IMPLIES') return (!a)||b; if(op==='EQUIV') return a===b; return false;
}

// Set Theory
function evaluateSetTheory(expr) {
    let u = expr.toUpperCase();
    if(u.includes('UNION')) return { result: 'A ∪ B', steps: 'Union: elements in A or B' };
    if(u.includes('∩')) return { result: 'A ∩ B', steps: 'Intersection: elements in both' };
    if(u.includes('COMPLEMENT')) return { result: 'A\'', steps: 'Complement: elements not in A' };
    if(u.includes('\\')) return { result: 'A \\ B', steps: 'Difference: A minus B' };
    if(u.includes('SUBSET')) return { result: 'A ⊆ B', steps: 'Subset: all A in B' };
    if(u.includes('POWERSET')) return { result: 'P(A)', steps: 'Set of all subsets' };
    return { result: 'Set op', steps: 'Use UNION, ∩, COMPLEMENT, \\, SUBSET, POWERSET' };
}

// Number Theory
function evaluateNumberTheory(expr) {
    let u = expr.toLowerCase();
    let m = u.match(/gcd\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if(m) {
        let a=parseInt(m[1]), b=parseInt(m[2]);
        let g = gcd(a,b);
        return { result: g, steps: `GCD(${a},${b}) = ${g}` };
    }
    m = u.match(/lcm\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if(m) {
        let a=parseInt(m[1]), b=parseInt(m[2]);
        let l = a*b/gcd(a,b);
        return { result: l, steps: `LCM(${a},${b}) = ${l}` };
    }
    m = u.match(/mod\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if(m) return { result: parseInt(m[1]) % parseInt(m[2]), steps: `${m[1]} mod ${m[2]} = ${parseInt(m[1])%parseInt(m[2])}` };
    m = u.match(/prime\?\s*(\d+)/);
    if(m) {
        let n=parseInt(m[1]);
        let isPrime = n>1 && ![...Array(Math.floor(Math.sqrt(n))).keys()].slice(2).some(i=>n%i===0);
        return { result: isPrime, steps: `${n} is ${isPrime ? 'prime' : 'not prime'}` };
    }
    return { result: 'Error', steps: 'Use gcd(a,b), lcm(a,b), mod(a,b), prime?(n)' };
}
function gcd(a,b) { while(b) { let t=b; b=a%b; a=t; } return a; }

// Conversion (with full names)
function evaluateConversion(expr) {
    let m = expr.match(/(DEC → BINARY|BIN → DECIMAL|DEC → HEX|HEX → DECIMAL|DEC → OCT|OCT → DECIMAL|BIN → HEX)\s+(\S+)/i);
    if(!m) return { result:'Error', steps:'Format: DEC → BINARY 255' };
    let type=m[1].toUpperCase(), val=m[2];
    try {
        if(type.includes('DEC → BINARY')) return { result: parseInt(val).toString(2), steps: `Convert ${val} to binary = ${parseInt(val).toString(2)}` };
        if(type.includes('BIN → DECIMAL')) return { result: parseInt(val,2), steps: `Binary ${val} to decimal = ${parseInt(val,2)}` };
        if(type.includes('DEC → HEX')) return { result: parseInt(val).toString(16).toUpperCase(), steps: `Convert ${val} to hex = ${parseInt(val).toString(16).toUpperCase()}` };
        if(type.includes('HEX → DECIMAL')) return { result: parseInt(val,16), steps: `Hex ${val} to decimal = ${parseInt(val,16)}` };
        if(type.includes('DEC → OCT')) return { result: parseInt(val).toString(8), steps: `Convert ${val} to octal = ${parseInt(val).toString(8)}` };
        if(type.includes('OCT → DECIMAL')) return { result: parseInt(val,8), steps: `Octal ${val} to decimal = ${parseInt(val,8)}` };
        if(type.includes('BIN → HEX')) {
            let dec=parseInt(val,2);
            return { result: dec.toString(16).toUpperCase(), steps: `Binary to decimal = ${dec}, then hex = ${dec.toString(16).toUpperCase()}` };
        }
    } catch(e) { return { result:'Error', steps:'Invalid input' }; }
    return { result:'Error', steps:'Unknown conversion' };
}

// Matrix
function evaluateMatrix(expr) {
    let u = expr.toLowerCase();
    if(u.includes('det2x2')) {
        let m = u.match(/det2x2\s*\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if(m) {
            let a=parseInt(m[1]),b=parseInt(m[2]),c=parseInt(m[3]),d=parseInt(m[4]);
            let det = a*d - b*c;
            return { result: det, steps: `det([${a} ${b}; ${c} ${d}]) = ${a}*${d} - ${b}*${c} = ${det}` };
        }
    }
    return { result: 'Matrix op', steps: 'Use det2x2(a,b,c,d) for determinant' };
}

// Complex
function evaluateComplex(expr) {
    return { result: 'Complex mode', steps: 'Use re(z), im(z), conj(z), abs(z), arg(z), and + - * /' };
}

// Main evaluate
function evaluate() {
    let raw = exprInput.value.trim();
    if (!raw) { 
        resultDisplay.textContent = '0'; 
        return; 
    }
    let res;
    if (currentBranch === 'arithmetic') res = evaluateArithmetic(raw);
    else if (currentBranch === 'combinatorics') res = evaluateCombinatorics(raw);
    else if (currentBranch === 'logic') res = evaluateLogic(raw);
    else if (currentBranch === 'settheory') res = evaluateSetTheory(raw);
    else if (currentBranch === 'numbertheory') res = evaluateNumberTheory(raw);
    else if (currentBranch === 'conversion') res = evaluateConversion(raw);
    else if (currentBranch === 'matrix') res = evaluateMatrix(raw);
    else res = evaluateComplex(raw);
    
    let resStr = res.result.toString();
    resultDisplay.textContent = resStr;
    addHistory(raw, resStr, res.steps, currentBranch);
    showStepsView(raw, resStr, res.steps || 'No detailed steps', currentBranch);
}

// ========== UI ==========
function toggleDrawer(open) {
    document.getElementById('drawer').classList.toggle('open', open);
    document.getElementById('overlay').classList.toggle('active', open);
}
function resetSession() { exprInput.value=''; resultDisplay.textContent='0'; }
function clearCache() {
    if(confirm('Clear all cache, history, and reset to defaults?')) {
        localStorage.clear();
        historyEntries=[];
        saveHistory();
        initTheme();
        initFont();
        resetSession();
        alert('Cache cleared');
    }
}
function escapeHtml(s) { if(!s) return ''; return s.replace(/[&<>]/g, m=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

// ========== INIT ==========
function init() {
    loadHistory();
    initTheme();
    initFont();
    renderButtons();
    
    // Branch selection from drawer
    document.querySelectorAll('.branch-drawer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.branch-drawer-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentBranch = btn.getAttribute('data-branch');
            renderButtons();
            exprInput.value='';
            resultDisplay.textContent='0';
            toggleDrawer(false);
        });
    });
    
    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = () => { exprInput.value=''; resultDisplay.textContent='0'; };
    document.getElementById('backBtn').onclick = () => { exprInput.value = exprInput.value.slice(0,-1); };
    document.getElementById('menuToggleBtn').onclick = () => toggleDrawer(true);
    document.getElementById('closeDrawerBtn').onclick = () => toggleDrawer(false);
    document.getElementById('overlay').onclick = () => toggleDrawer(false);
    document.getElementById('drawerClearCacheBtn').onclick = () => { toggleDrawer(false); clearCache(); };
    document.getElementById('drawerExitBtn').onclick = () => { toggleDrawer(false); resetSession(); };
    document.getElementById('drawerHistoryBtn').onclick = () => { toggleDrawer(false); showHistoryModal(); };
    document.getElementById('drawerClearHistoryBtn').onclick = () => { clearHistory(); toggleDrawer(false); alert('History cleared'); };
    document.getElementById('closeHistoryBtn').onclick = () => document.getElementById('historyModal').style.display='none';
    document.getElementById('backToCalculatorBtn').onclick = () => showCalculatorView();
    exprInput.addEventListener('keypress', e => { if(e.key==='Enter') evaluate(); });
}
init();
