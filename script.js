// STATE
let currentBranch = "arithmetic";
let historyEntries = [];

// DOM
const exprInput = document.getElementById('exprInput');
const resultDisplay = document.getElementById('resultDisplay');
const stepsDisplay = document.getElementById('stepsDisplay');
const dynamicDiv = document.getElementById('dynamicButtons');

// ========== HISTORY ==========
function loadHistory() {
    const stored = localStorage.getItem('csCalcHistory');
    historyEntries = stored ? JSON.parse(stored) : [];
}
function saveHistory() {
    localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(-50)));
}
function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({ expr, result, steps: steps.substring(0, 200), branch, date: new Date().toLocaleString() });
    if (historyEntries.length > 50) historyEntries.pop();
    saveHistory();
}
function clearHistory() {
    historyEntries = [];
    saveHistory();
    document.getElementById('historyList').innerHTML = '<div class="history-item">No history</div>';
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
const arithmetic = ['7','8','9','/','(',' )','4','5','6','*','%','^','1','2','3','-','&','|','0','.','+','~','<<','>>','C','=','<','>','<=','>=','==','!='];
const combinatorics = ['nCr','nPr','!','P(n,r)','C(n,r)','C'];
const logic = ['TRUE','FALSE','AND','OR','NOT','XOR','IMPLIES','EQUIV','(',')','C'];
const settheory = ['UNION','∩','COMPLEMENT','\\','SUBSET','POWERSET','{', '}', ',', 'C'];
const numbertheory = ['gcd','lcm','mod','prime?','factor','C'];
const conversion = ['DEC->BIN','BIN->DEC','DEC->HEX','HEX->DEC','DEC->OCT','OCT->DEC','BIN->HEX','CLEAR'];
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
            btn.onclick = () => { exprInput.value = ''; stepsDisplay.innerHTML = 'Cleared'; resultDisplay.textContent = '0'; };
        } else {
            btn.onclick = () => {
                if (currentBranch === 'conversion' && label.includes('->')) exprInput.value = label + ' ';
                else exprInput.value += label;
            };
        }
        dynamicDiv.appendChild(btn);
    });
}

// ========== EVALUATION ENGINES ==========
function evaluateArithmetic(expr) {
    try {
        let clean = expr.replace(/\s/g, '');
        if (!clean) return { result: '0', steps: 'Empty' };
        const relMatch = clean.match(/(.+?)(==|!=|<=|>=|<|>)(.+)/);
        if (relMatch) {
            let left = evalArith(relMatch[1]);
            let right = evalArith(relMatch[3]);
            let op = relMatch[2];
            let bool = false;
            if (op === '==') bool = left.val === right.val;
            else if (op === '!=') bool = left.val !== right.val;
            else if (op === '<') bool = left.val < right.val;
            else if (op === '>') bool = left.val > right.val;
            else if (op === '<=') bool = left.val <= right.val;
            else if (op === '>=') bool = left.val >= right.val;
            return { result: bool, steps: `${left.steps}\n${right.steps}\n${left.val} ${op} ${right.val} = ${bool}` };
        }
        let res = evalArith(clean);
        return { result: res.val, steps: res.steps };
    } catch(e) { return { result: 'Error', steps: 'Invalid expression' }; }
}
function evalArith(expr) {
    let tokens = tokenize(expr);
    let rpn = toRPN(tokens);
    let stack = [], steps = [];
    for (let t of rpn) {
        if (!isOp(t)) stack.push({ val: parseFloat(t), raw: t });
        else if (t === '~') {
            let a = stack.pop();
            let res = ~a.val;
            steps.push(`~(${a.raw}) = ${res}`);
            stack.push({ val: res, raw: res });
        } else {
            let b = stack.pop(), a = stack.pop();
            let res = compute(a.val, b.val, t);
            steps.push(`${a.raw} ${t} ${b.raw} = ${res}`);
            stack.push({ val: res, raw: res });
        }
    }
    return { val: stack[0].val, steps: steps.map((s,i)=>`Step ${i+1}: ${s}`).join('\n') };
}
function tokenize(e) {
    let t=[], i=0;
    while(i<e.length) {
        let ch=e[i];
        if(ch>='0'&&ch<='9'||ch=='.') { let n=''; while(i<e.length&&(e[i]>='0'&&e[i]<='9'||e[i]=='.')) n+=e[i++]; t.push(n); continue; }
        if(ch=='('||ch==')') { t.push(ch); i++; continue; }
        if(ch=='<'&&e[i+1]=='<') { t.push('<<'); i+=2; continue; }
        if(ch=='>'&&e[i+1]=='>') { t.push('>>'); i+=2; continue; }
        if('+-*/%^&|~'.includes(ch)) { t.push(ch); i++; continue; }
        i++;
    }
    return t;
}
function isOp(op) { return '+-*/%^&|~<<>>'.includes(op); }
function prec(op) {
    if(op=='~') return 5; if(op=='^') return 4; if(op=='*'||op=='/'||op=='%') return 3;
    if(op=='+'||op=='-') return 2; if(op=='<<'||op=='>>') return 1; if(op=='&') return 0; if(op=='|') return -1; return -2;
}
function toRPN(tokens) {
    let out=[], stack=[];
    for(let t of tokens) {
        if(!isNaN(parseFloat(t))&&isFinite(t)) out.push(t);
        else if(t=='(') stack.push(t);
        else if(t==')') { while(stack.length && stack[stack.length-1]!='(') out.push(stack.pop()); stack.pop(); }
        else if(isOp(t)) { while(stack.length && isOp(stack[stack.length-1]) && prec(stack[stack.length-1])>=prec(t)) out.push(stack.pop()); stack.push(t); }
    }
    while(stack.length) out.push(stack.pop());
    return out;
}
function compute(a,b,op) {
    a=Number(a); b=Number(b);
    if(op=='+') return a+b; if(op=='-') return a-b; if(op=='*') return a*b; if(op=='/') return a/b;
    if(op=='%') return a%b; if(op=='^') return Math.pow(a,b); if(op=='&') return a&b;
    if(op=='|') return a|b; if(op=='<<') return a<<b; if(op=='>>') return a>>b;
    return 0;
}

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
function fact(n) { if(n<0) return NaN; let r=1; for(let i=2;i<=n;i++) r*=i; return r; }

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

// Conversion
function evaluateConversion(expr) {
    let m = expr.match(/(DEC->BIN|BIN->DEC|DEC->HEX|HEX->DEC|DEC->OCT|OCT->DEC|BIN->HEX)\s+(\S+)/i);
    if(!m) return { result:'Error', steps:'Format: DEC->BIN 255' };
    let type=m[1].toUpperCase(), val=m[2];
    try {
        if(type==='DEC->BIN') return { result: parseInt(val).toString(2), steps: `Convert ${val} to binary = ${parseInt(val).toString(2)}` };
        if(type==='BIN->DEC') return { result: parseInt(val,2), steps: `Binary ${val} to decimal = ${parseInt(val,2)}` };
        if(type==='DEC->HEX') return { result: parseInt(val).toString(16).toUpperCase(), steps: `Convert ${val} to hex = ${parseInt(val).toString(16).toUpperCase()}` };
        if(type==='HEX->DEC') return { result: parseInt(val,16), steps: `Hex ${val} to decimal = ${parseInt(val,16)}` };
        if(type==='DEC->OCT') return { result: parseInt(val).toString(8), steps: `Convert ${val} to octal = ${parseInt(val).toString(8)}` };
        if(type==='OCT->DEC') return { result: parseInt(val,8), steps: `Octal ${val} to decimal = ${parseInt(val,8)}` };
        if(type==='BIN->HEX') {
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
    if (!raw) { resultDisplay.textContent='0'; stepsDisplay.innerHTML='Enter expression'; return; }
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
    stepsDisplay.innerHTML = res.steps || 'No steps';
    addHistory(raw, resStr, res.steps, currentBranch);
}

// ========== UI ==========
function toggleDrawer(open) {
    document.getElementById('drawer').classList.toggle('open', open);
    document.getElementById('overlay').classList.toggle('active', open);
}
function showHistory() {
    let modal = document.getElementById('historyModal');
    let listDiv = document.getElementById('historyList');
    if (historyEntries.length===0) listDiv.innerHTML='<div class="history-item">No history</div>';
    else {
        listDiv.innerHTML = historyEntries.map(h => `
            <div class="history-item">
                <div class="history-expr">${escapeHtml(h.expr)}</div>
                <div class="history-result">= ${escapeHtml(h.result)}</div>
                <div class="history-meta" style="font-size:0.65rem; opacity:0.6;">${h.branch} | ${h.date}</div>
            </div>
        `).join('');
    }
    modal.style.display='block';
}
function resetSession() { exprInput.value=''; resultDisplay.textContent='0'; stepsDisplay.innerHTML='Ready'; }
function clearCache() {
    if(confirm('Clear all cache and history?')) {
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
    document.querySelectorAll('.branch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.branch-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentBranch = btn.getAttribute('data-branch');
            renderButtons();
            exprInput.value='';
            stepsDisplay.innerHTML=`${currentBranch.toUpperCase()} mode`;
            resultDisplay.textContent='0';
        });
    });
    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = () => { exprInput.value=''; stepsDisplay.innerHTML='Cleared'; resultDisplay.textContent='0'; };
    document.getElementById('backBtn').onclick = () => { exprInput.value = exprInput.value.slice(0,-1); };
    document.getElementById('historyShowBtn').onclick = showHistory;
    document.getElementById('menuToggleBtn').onclick = () => toggleDrawer(true);
    document.getElementById('closeDrawerBtn').onclick = () => toggleDrawer(false);
    document.getElementById('overlay').onclick = () => toggleDrawer(false);
    document.getElementById('drawerClearCacheBtn').onclick = () => { toggleDrawer(false); clearCache(); };
    document.getElementById('drawerExitBtn').onclick = () => { toggleDrawer(false); resetSession(); };
    document.getElementById('closeHistoryBtn').onclick = () => document.getElementById('historyModal').style.display='none';
    document.getElementById('clearHistoryBtn').onclick = () => { clearHistory(); if(document.getElementById('historyModal').style.display==='block') showHistory(); };
    exprInput.addEventListener('keypress', e => { if(e.key==='Enter') evaluate(); });
}
init();
