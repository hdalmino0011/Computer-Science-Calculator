// --------------------------- STATE & GLOBALS ---------------------------
let currentBranch = "arithmetic";   // arithmetic, logic, conversion
let historyEntries = [];

// DOM elements
const exprInput = document.getElementById('exprInput');
const resultDisplay = document.getElementById('resultDisplay');
const stepsDisplay = document.getElementById('stepsDisplay');
const dynamicDiv = document.getElementById('dynamicButtons');
const equalBtn = document.getElementById('equalBtn');
const clearBtn = document.getElementById('clearBtn');
const backBtn = document.getElementById('backBtn');
const historyShowBtn = document.getElementById('historyShowBtn');

// ---------- HISTORY ----------
function loadHistory() {
    const stored = localStorage.getItem('csCalcHistory');
    if(stored) historyEntries = JSON.parse(stored);
    else historyEntries = [];
}
function saveHistory() {
    localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(-50)));
}
function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({ expr, result, stepsText: steps, branch, date: new Date().toLocaleString() });
    if(historyEntries.length > 50) historyEntries.pop();
    saveHistory();
}

// ---------- THEMES (12 themes) ----------
const themes = ["default","obsidian","royalblue","orange","highcontrast","forest","crimson","slate","purple","midnight","sand","cyan-night"];
function applyTheme(themeName) {
    document.body.className = '';
    document.body.classList.add(`theme-${themeName}`);
    localStorage.setItem('activeTheme', themeName);
}
function initTheme() {
    const saved = localStorage.getItem('activeTheme');
    if(saved && themes.includes(saved)) applyTheme(saved);
    else applyTheme('default');
    renderQuickThemes();
}
function renderQuickThemes() {
    const container = document.getElementById('quickThemeRow');
    if(!container) return;
    container.innerHTML = '';
    themes.slice(0,8).forEach(t => {
        const dot = document.createElement('div');
        dot.className = 'theme-dot';
        dot.style.background = getThemeColorHint(t);
        dot.title = t;
        dot.addEventListener('click', () => applyTheme(t));
        container.appendChild(dot);
    });
}
function getThemeColorHint(theme) {
    const hints = { default:"#cbd5e1", obsidian:"#2a2b3b", royalblue:"#103a66", orange:"#e65c1e", highcontrast:"#ffff00", forest:"#2c5e42", crimson:"#882e46", slate:"#3e5768" };
    return hints[theme] || "#9c58ff";
}

// ---------- FONTS ----------
function setFont(fontName) {
    document.body.style.fontFamily = fontName;
    localStorage.setItem('appFont', fontName);
}
function loadFont() {
    const savedFont = localStorage.getItem('appFont');
    if(savedFont) document.body.style.fontFamily = savedFont;
    else document.body.style.fontFamily = "Times New Roman";
    const selector = document.getElementById('fontSelector');
    if(selector) {
        selector.value = document.body.style.fontFamily || "Times New Roman";
        selector.addEventListener('change', (e) => setFont(e.target.value));
    }
}

// ---------- BUTTON LAYOUT PER BRANCH ----------
const arithmeticButtons = ["7","8","9","/","(",")","4","5","6","*","%","^","1","2","3","-","&","|","0",".","+","~","<<",">>","C","="];
const logicButtons = ["True","False","AND","OR","NOT","XOR","IMPLIES","EQUIV","(",")","C","="];
const conversionButtons = ["Dec->Bin","Bin->Dec","Dec->Hex","Hex->Dec","Dec->Oct","Oct->Dec","Bin->Hex","Clear","DEL"];

function renderButtonsForBranch() {
    let btns = [];
    if(currentBranch === "arithmetic") btns = arithmeticButtons;
    else if(currentBranch === "logic") btns = logicButtons;
    else btns = conversionButtons;
    dynamicDiv.innerHTML = "";
    btns.forEach(label => {
        const btn = document.createElement('button');
        btn.className = "calc-btn";
        btn.textContent = label;
        if(label === "C" || label === "Clear") {
            btn.addEventListener('click', () => { exprInput.value = ""; stepsDisplay.innerHTML = "Cleared"; resultDisplay.innerText = "Result: "; });
        }
        else if(label === "DEL") {
            btn.addEventListener('click', () => { exprInput.value = exprInput.value.slice(0,-1); });
        }
        else if(label === "=") { /* handled globally */ }
        else {
            btn.addEventListener('click', () => {
                if(currentBranch === "conversion" && label.includes("->")) {
                    exprInput.value = label;
                } else {
                    exprInput.value += label;
                }
            });
        }
        dynamicDiv.appendChild(btn);
    });
    if(currentBranch === "arithmetic") {
        const acBtn = document.createElement('button');
        acBtn.className = "calc-btn";
        acBtn.textContent = "AC";
        acBtn.addEventListener('click', () => exprInput.value = "");
        dynamicDiv.appendChild(acBtn);
    }
}

// ---------- ARITHMETIC EVALUATION (Step-by-step) ----------
function tokenizeArithmetic(expr) {
    let tokens = [], i = 0;
    while(i < expr.length) {
        let ch = expr[i];
        if(ch >= '0' && ch <= '9' || ch === '.') {
            let num = '';
            while(i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) num += expr[i++];
            tokens.push(num);
            continue;
        }
        if(ch === '(' || ch === ')') { tokens.push(ch); i++; continue; }
        if(ch === '&' && expr[i+1] === '&') { tokens.push('&&'); i+=2; continue; }
        if(ch === '|' && expr[i+1] === '|') { tokens.push('||'); i+=2; continue; }
        if(ch === '<' && expr[i+1] === '<') { tokens.push('<<'); i+=2; continue; }
        if(ch === '>' && expr[i+1] === '>') { tokens.push('>>'); i+=2; continue; }
        if('+-*/%^&|~'.includes(ch)) { tokens.push(ch); i++; continue; }
        i++;
    }
    return tokens;
}
function isOperatorArith(op) { return '+-*/%^&|~<<>>'.includes(op); }
function precedenceArith(op) {
    if(op === '~') return 4;
    if(op === '^') return 3;
    if(op === '*' || op === '/' || op === '%') return 2;
    if(op === '+' || op === '-') return 1;
    if(op === '<<' || op === '>>') return 0;
    if(op === '&') return -1;
    if(op === '|') return -2;
    return -3;
}
function toRPN(tokens) {
    let output = [], stack = [];
    for(let t of tokens) {
        if(!isNaN(parseFloat(t)) && isFinite(t)) output.push(t);
        else if(t === '(') stack.push(t);
        else if(t === ')') {
            while(stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
            stack.pop();
        } else if(isOperatorArith(t)) {
            while(stack.length && isOperatorArith(stack[stack.length-1]) && precedenceArith(stack[stack.length-1]) >= precedenceArith(t)) output.push(stack.pop());
            stack.push(t);
        }
    }
    while(stack.length) output.push(stack.pop());
    return output;
}
function computeArith(a,b,op) {
    a = Number(a); b = Number(b);
    if(op === '+') return a+b;
    if(op === '-') return a-b;
    if(op === '*') return a*b;
    if(op === '/') return a/b;
    if(op === '%') return a%b;
    if(op === '^') return Math.pow(a,b);
    if(op === '&') return a&b;
    if(op === '|') return a|b;
    if(op === '<<') return a<<b;
    if(op === '>>') return a>>b;
    return 0;
}
function evaluateArithmeticSteps(expression) {
    try {
        let expr = expression.replace(/\s/g, '');
        if(expr === "") throw new Error();
        const tokens = tokenizeArithmetic(expr);
        const rpn = toRPN(tokens);
        const steps = [];
        const stack = [];
        for(let tok of rpn) {
            if(!isOperatorArith(tok)) {
                stack.push({val: parseFloat(tok), raw: tok});
                continue;
            }
            if(tok === '~') {
                let a = stack.pop();
                let res = ~(a.val);
                steps.push(`Step ${steps.length+1}: ~(${a.raw}) = ${res}`);
                stack.push({val: res, raw: res});
            } else {
                let b = stack.pop(); let a = stack.pop();
                if(!a || !b) throw new Error();
                let res = computeArith(a.val, b.val, tok);
                steps.push(`Step ${steps.length+1}: ${a.raw} ${tok} ${b.raw} = ${res}`);
                stack.push({val: res, raw: res});
            }
        }
        return { result: stack[0].val, steps: steps.join('\n') };
    } catch(e) {
        return { result: "Error", steps: "Invalid arithmetic expression" };
    }
}

// ---------- LOGIC EVALUATION ----------
function tokenizeLogic(expr) {
    let tokens = [], i = 0;
    const ops = ['AND','OR','NOT','XOR','IMPLIES','EQUIV','TRUE','FALSE','(',')'];
    while(i < expr.length) {
        if(expr[i] === '(' || expr[i] === ')') { tokens.push(expr[i]); i++; continue; }
        let matched = false;
        for(let op of ops) {
            if(expr.startsWith(op, i)) {
                tokens.push(op);
                i += op.length;
                matched = true;
                break;
            }
        }
        if(!matched) i++;
    }
    return tokens;
}
function isLogicOp(tok) { return ['AND','OR','NOT','XOR','IMPLIES','EQUIV'].includes(tok); }
function precedenceLogic(op) {
    if(op === 'NOT') return 4;
    if(op === 'AND') return 3;
    if(op === 'XOR') return 2;
    if(op === 'OR') return 1;
    if(op === 'IMPLIES' || op === 'EQUIV') return 0;
    return -1;
}
function toRPNLogic(tokens) {
    let output = [], stack = [];
    for(let t of tokens) {
        if(t === 'TRUE' || t === 'FALSE') output.push(t);
        else if(t === '(') stack.push(t);
        else if(t === ')') {
            while(stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
            stack.pop();
        } else if(isLogicOp(t)) {
            while(stack.length && isLogicOp(stack[stack.length-1]) && precedenceLogic(stack[stack.length-1]) >= precedenceLogic(t)) output.push(stack.pop());
            stack.push(t);
        }
    }
    while(stack.length) output.push(stack.pop());
    return output;
}
function applyLogic(a,b,op) {
    if(op === 'AND') return a && b;
    if(op === 'OR') return a || b;
    if(op === 'XOR') return a !== b;
    if(op === 'IMPLIES') return (!a) || b;
    if(op === 'EQUIV') return a === b;
    return false;
}
function evaluateLogicSteps(expr) {
    try {
        let clean = expr.replace(/\s/g, '').toUpperCase();
        if(clean === "") throw new Error();
        const tokens = tokenizeLogic(clean);
        const rpn = toRPNLogic(tokens);
        let stack = [], steps = [];
        for(let t of rpn) {
            if(!isLogicOp(t)) {
                let boolVal = (t === 'TRUE');
                stack.push({val: boolVal, raw: t});
                continue;
            }
            if(t === 'NOT') {
                let a = stack.pop();
                let res = !a.val;
                steps.push(`Step ${steps.length+1}: NOT(${a.raw}) = ${res}`);
                stack.push({val: res, raw: res});
            } else {
                let b = stack.pop(), a = stack.pop();
                let res = applyLogic(a.val, b.val, t);
                steps.push(`Step ${steps.length+1}: ${a.raw} ${t} ${b.raw} = ${res}`);
                stack.push({val: res, raw: res});
            }
        }
        return { result: stack[0].val, steps: steps.join('\n') };
    } catch(e) {
        return { result: "Logic Error", steps: "Use TRUE/FALSE, AND, OR, NOT, XOR, IMPLIES, EQUIV, parentheses" };
    }
}

// ---------- CONVERSION (Step-by-step) ----------
function performConversion(convType, inputVal) {
    let steps = [];
    try {
        if(convType === "Dec->Bin") {
            let num = parseInt(inputVal);
            if(isNaN(num)) throw new Error();
            let binary = num.toString(2);
            steps.push(`Step 1: Convert ${num} to binary: ${binary}`);
            return {result: binary, steps: steps.join('\n')};
        }
        if(convType === "Bin->Dec") {
            let dec = parseInt(inputVal, 2);
            steps.push(`Step 1: Binary ${inputVal} = ${dec} decimal`);
            return {result: dec, steps: steps.join('\n')};
        }
        if(convType === "Dec->Hex") {
            let num = parseInt(inputVal);
            let hex = num.toString(16).toUpperCase();
            steps.push(`Step 1: Convert ${num} to hex: ${hex}`);
            return {result: hex, steps: steps.join('\n')};
        }
        if(convType === "Hex->Dec") {
            let dec = parseInt(inputVal, 16);
            steps.push(`Step 1: Hex ${inputVal} = ${dec} decimal`);
            return {result: dec, steps: steps.join('\n')};
        }
        if(convType === "Dec->Oct") {
            let num = parseInt(inputVal);
            let oct = num.toString(8);
            steps.push(`Step 1: Convert ${num} to octal: ${oct}`);
            return {result: oct, steps: steps.join('\n')};
        }
        if(convType === "Oct->Dec") {
            let dec = parseInt(inputVal, 8);
            steps.push(`Step 1: Octal ${inputVal} = ${dec} decimal`);
            return {result: dec, steps: steps.join('\n')};
        }
        if(convType === "Bin->Hex") {
            let dec = parseInt(inputVal, 2);
            let hex = dec.toString(16).toUpperCase();
            steps.push(`Step 1: Binary to decimal: ${dec}`);
            steps.push(`Step 2: Decimal to hex: ${hex}`);
            return {result: hex, steps: steps.join('\n')};
        }
        return {result: "Invalid conversion", steps: "Use conversion buttons then enter a number"};
    } catch(e) {
        return {result: "Error", steps: "Invalid input for conversion"};
    }
}

// ---------- MAIN EVALUATION ----------
function evaluateCurrent() {
    let raw = exprInput.value.trim();
    if(!raw) {
        resultDisplay.innerText = "Result: ";
        stepsDisplay.innerHTML = "Enter an expression or conversion.";
        return;
    }
    let evalRes;
    if(currentBranch === "arithmetic") {
        evalRes = evaluateArithmeticSteps(raw);
    } else if(currentBranch === "logic") {
        evalRes = evaluateLogicSteps(raw);
    } else {
        // conversion branch
        let match = raw.match(/(Dec->Bin|Bin->Dec|Dec->Hex|Hex->Dec|Dec->Oct|Oct->Dec|Bin->Hex)\s+(.+)/i);
        if(match) {
            evalRes = performConversion(match[1], match[2]);
        } else if(raw.includes("->")) {
            let parts = raw.split("->");
            let convType = parts[0] + "->" + (parts[1].split(" ")[0] || "");
            let val = parts[1].replace(convType.split("->")[1], "").trim();
            evalRes = performConversion(convType, val);
        } else {
            evalRes = {result: "Invalid conversion", steps: "Click a conversion button (e.g., Dec->Bin) then type a number"};
        }
    }
    let resStr = evalRes.result.toString();
    resultDisplay.innerText = "Result: " + resStr;
    stepsDisplay.innerHTML = evalRes.steps || "No steps generated";
    addHistory(raw, resStr, evalRes.steps || "Steps computed", currentBranch);
}

// ---------- DRAWER & UI ----------
function toggleDrawer(open) {
    document.getElementById('drawer').classList.toggle('open', open);
    document.getElementById('overlay').classList.toggle('active', open);
}
function clearCache() {
    localStorage.clear();
    historyEntries = [];
    saveHistory();
    alert("Cache and history cleared. Theme reset to default.");
    applyTheme('default');
    loadFont();
}
function showAbout() {
    alert("Developed by Hanz Dalmino\nCebu Technological University Main Campus\n\nReason: Designed to assist CS/IT students with discrete mathematics, logic, binary conversions, and complex arithmetic. Provides step-by-step evaluation. Built for web, desktop, and mobile as an educational tool.");
}
function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const listDiv = document.getElementById('historyList');
    if(historyEntries.length === 0) listDiv.innerHTML = "<i>No history yet</i>";
    else {
        listDiv.innerHTML = historyEntries.map(h => 
            `<div style="border-bottom:1px solid #6a4a9a; padding:8px;">
                <b>${escapeHtml(h.expr)}</b> = ${escapeHtml(h.result)}<br>
                <small style="color:#b77cff;">${h.branch} | ${h.date}</small>
             </div>`
        ).join('');
    }
    modal.style.display = 'block';
    document.getElementById('closeHistoryBtn').onclick = () => modal.style.display = 'none';
}
function escapeHtml(str) {
    if(!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if(m === '&') return '&amp;';
        if(m === '<') return '&lt;';
        if(m === '>') return '&gt;';
        return m;
    });
}

// ---------- INITIALIZATION ----------
function init() {
    loadHistory();
    initTheme();
    loadFont();
    renderButtonsForBranch();
    
    document.querySelectorAll('.branch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentBranch = e.target.getAttribute('data-branch');
            renderButtonsForBranch();
            exprInput.value = "";
            stepsDisplay.innerHTML = `Switched to ${currentBranch} mode.`;
            resultDisplay.innerText = "Result: ";
        });
    });
    
    equalBtn.addEventListener('click', evaluateCurrent);
    clearBtn.addEventListener('click', () => { exprInput.value = ""; stepsDisplay.innerHTML = "Cleared input."; });
    backBtn.addEventListener('click', () => { exprInput.value = exprInput.value.slice(0,-1); });
    historyShowBtn.addEventListener('click', showHistoryModal);
    
    document.getElementById('menuToggleBtn').addEventListener('click', () => toggleDrawer(true));
    document.getElementById('closeDrawerBtn').addEventListener('click', () => toggleDrawer(false));
    document.getElementById('overlay').addEventListener('click', () => toggleDrawer(false));
    document.getElementById('drawerClearCacheBtn').addEventListener('click', () => { clearCache(); toggleDrawer(false); });
    document.getElementById('drawerExitBtn').addEventListener('click', () => {
        if(confirm("Reset current session and clear input?")) {
            exprInput.value = "";
            resultDisplay.innerText = "Result: ";
            stepsDisplay.innerHTML = "Session reset";
        }
        toggleDrawer(false);
    });
    document.getElementById('drawerAboutBtn').addEventListener('click', () => { showAbout(); toggleDrawer(false); });
    document.getElementById('drawerThemesBtn').addEventListener('click', () => {
        alert("Use the colored dots at the top right to switch between 12 themes.");
        toggleDrawer(false);
    });
    document.getElementById('drawerSettingsBtn').addEventListener('click', () => {
        alert("Font selector is in the drawer. Theme dots are at the top.");
        toggleDrawer(false);
    });
}

init();
