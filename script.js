// ================= STATE =================
var currentBranch = "universal";
var historyEntries = [];
var lastAnswer = 0;
var keyboardEnabled = false; // Default: keyboard OFF

// DOM Elements
var exprInput = document.getElementById('exprInput');
var resultDisplay = document.getElementById('resultDisplay');
var fallbackMessage = document.getElementById('fallbackMessage');
var branchIndicator = document.getElementById('branchIndicator');
var dynamicDiv = document.getElementById('dynamicButtons');
var calculatorView = document.getElementById('calculatorView');
var stepsView = document.getElementById('stepsView');
var fullPageView = document.getElementById('fullPageView');
var fullPageTitle = document.getElementById('fullPageTitle');
var fullPageContent = document.getElementById('fullPageContent');
var toastEl = document.getElementById('toast');

var branchNames = {
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

// ================= TOAST =================
var toastTimer = null;
function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, 1800);
}

// ================= HAPTIC FEEDBACK =================
function buzz(ms) {
    if (navigator.vibrate) {
        try { navigator.vibrate(ms || 8); } catch (e) {}
    }
}

// ================= SYMBOL PRE-PROCESSOR =================
function preprocessExpression(expr) {
    var processed = expr;
    processed = processed.replace(/&&/g, ' AND ');
    processed = processed.replace(/\|\|/g, ' OR ');
    processed = processed.replace(/(?<![\d)])!(?!=)/g, ' NOT ');
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
    processed = processed.replace(/π/g, '(' + Math.PI + ')');
    processed = processed.replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, '(' + Math.E + ')');
    processed = processed.replace(/ANS/gi, '(' + lastAnswer + ')');
    // single "=" (not part of ==, !=, <=, >=) means equality comparison
    processed = processed.replace(/([^\s<>!=])=([^=])/g, '$1==$2');
    return processed;
}

// ================= UTILITIES =================
function escapeHtml(s) {
    if (!s) return '';
    return s.toString().replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function fact(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
}

function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a;
}

// ================= VIEW SWITCHING =================
function showCalculatorView() {
    calculatorView.style.display = 'flex';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'none';
}

function showStepsView(expression, result, steps) {
    document.getElementById('stepsExpression').innerHTML = '<strong>Expression:</strong> ' + escapeHtml(expression);
    document.getElementById('stepsResultFull').innerHTML = '<span class="result-label">RESULT:</span> <span class="result-value">' + escapeHtml(result) + '</span>';
    var stepsList = document.getElementById('stepsListFull');
    if (!steps || steps === 'No steps') {
        stepsList.innerHTML = '<div class="step-item">No detailed steps available</div>';
    } else {
        var stepLines = steps.split('\n');
        var html = '';
        for (var i = 0; i < stepLines.length; i++) {
            var line = stepLines[i];
            if (line.trim()) {
                html += '<div class="step-item"><span class="step-number">' + (i + 1) + '.</span> ' + escapeHtml(line) + '</div>';
            }
        }
        stepsList.innerHTML = html;
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

// ================= HISTORY =================
function loadHistory() {
    try {
        var stored = localStorage.getItem('csCalcHistory');
        historyEntries = stored ? JSON.parse(stored) : [];
    } catch (e) { historyEntries = []; }
}

function saveHistory() {
    try { localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(0, 50))); }
    catch (e) { console.warn('Could not save history'); }
}

function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({
        expr: expr, result: result, steps: (steps || '').substring(0, 300),
        branch: branch, date: new Date().toLocaleString()
    });
    if (historyEntries.length > 50) historyEntries.length = 50;
    saveHistory();
}

function clearHistory() { historyEntries = []; saveHistory(); }

// ================= THEMES =================
var themes = ['default', 'obsidian', 'royalblue', 'orange', 'highcontrast', 'forest', 'crimson', 'slate', 'purple', 'midnight', 'sand', 'cyan-night'];
var themeNames = ['Default', 'Obsidian', 'Royal Blue', 'Orange', 'High Contrast', 'Forest', 'Crimson', 'Slate', 'Purple', 'Midnight', 'Sand', 'Cyan Night'];

function applyTheme(theme) {
    document.body.className = '';
    document.body.classList.add('theme-' + theme);
    localStorage.setItem('activeTheme', theme);
}

function initTheme() {
    var saved = localStorage.getItem('activeTheme');
    if (saved && themes.indexOf(saved) !== -1) applyTheme(saved);
    else applyTheme('default');
}

// ================= FONTS =================
function initFont() {
    var saved = localStorage.getItem('appFont');
    document.body.style.fontFamily = saved || "'Inter', 'Segoe UI', system-ui, sans-serif";
}
function setFont(font) {
    document.body.style.fontFamily = font;
    localStorage.setItem('appFont', font);
}

// ================= KEYBOARD TOGGLE =================
function applyKeyboardState() {
    if (keyboardEnabled) {
        exprInput.removeAttribute('readonly');
        exprInput.inputMode = 'text';
        document.getElementById('keyboardToggleBtn').classList.add('active');
    } else {
        exprInput.setAttribute('readonly', 'readonly');
        exprInput.inputMode = 'none';
        document.getElementById('keyboardToggleBtn').classList.remove('active');
        // If input is focused, blur it to hide keyboard
        if (document.activeElement === exprInput) {
            exprInput.blur();
        }
    }
}

function toggleKeyboard() {
    keyboardEnabled = !keyboardEnabled;
    localStorage.setItem('keyboardEnabled', keyboardEnabled ? 'true' : 'false');
    applyKeyboardState();
    showToast(keyboardEnabled ? 'Keyboard enabled' : 'Keyboard disabled');
}

function initKeyboardState() {
    var saved = localStorage.getItem('keyboardEnabled');
    keyboardEnabled = (saved === 'true');
    applyKeyboardState();
}

// ================= PWA WELCOME MODAL =================
function showPwaWelcomeModal() {
    var modal = document.getElementById('pwaWelcomeModal');
    if (modal) modal.style.display = 'flex';
}

function hidePwaWelcomeModal() {
    var modal = document.getElementById('pwaWelcomeModal');
    if (modal) modal.style.display = 'none';
}

function handlePwaWelcomeAgree() {
    // Mark as seen so it doesn't show again
    localStorage.setItem('pwaWelcomeSeen', 'true');
    hidePwaWelcomeModal();
    // Perform hard reset session
    hardResetAndRefresh();
}

function handlePwaWelcomeDisagree() {
    // Mark as seen so it doesn't show again
    localStorage.setItem('pwaWelcomeSeen', 'true');
    hidePwaWelcomeModal();
    // Continue to app without reset
}

function initPwaWelcomeModal() {
    var seen = localStorage.getItem('pwaWelcomeSeen');
    if (!seen) {
        showPwaWelcomeModal();
    }
    // Attach event listeners
    document.getElementById('pwaAgreeBtn').addEventListener('click', handlePwaWelcomeAgree);
    document.getElementById('pwaDisagreeBtn').addEventListener('click', handlePwaWelcomeDisagree);
}

// ================= BUTTON DEFINITIONS =================
var universalButtons = [
    '(', ')', 'π', 'e',
    '7', '8', '9', '÷',
    '4', '5', '6', '×',
    '1', '2', '3', '-',
    '0', '.', '%', '+',
    '√', '^', '!', '==',
    'sin', 'cos', 'tan', 'abs',
    'log', 'ln', 'AND', 'OR',
    'NOT', 'XOR', '≥', '≤',
    '≠', '<', '>'
];

var arithmeticButtons = [
    '(', ')', '%', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '^', '√',
    '!', 'abs', '&', '|',
    '~', '<<', '>>', 'XOR',
    '≥', '≤', '≠', '=='
];

var combinatoricsButtons = [
    '7', '8', '9', 'nCr(',
    '4', '5', '6', 'nPr(',
    '1', '2', '3', '!',
    '0', '.', '(', ')',
    ','
];

var logicButtons = [
    'TRUE', 'FALSE', '(', ')',
    '7', '8', '9', 'AND',
    '4', '5', '6', 'OR',
    '1', '2', '3', 'NOT',
    '0', '.', 'XOR', 'IMPLIES',
    'EQUIV', '==', '!=', '≥',
    '≤', '>', '<'
];

var settheoryButtons = [
    'UNION', '∩', 'COMPLEMENT', '\\',
    'SUBSET', 'POWERSET', '{', '}',
    '7', '8', '9', ',',
    '4', '5', '6',
    '1', '2', '3',
    '0'
];

var numbertheoryButtons = [
    'gcd(', 'lcm(', 'mod(', 'prime?(',
    'factor(', '(', ')', ',',
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '.'
];

var conversionButtons = [
    'DEC → BINARY', 'BIN → DECIMAL',
    'DEC → HEX', 'HEX → DECIMAL',
    'DEC → OCT', 'OCT → DECIMAL',
    'BIN → HEX', 'CLEAR',
    '7', '8', '9', 'A',
    '4', '5', '6', 'B',
    '1', '2', '3', 'C',
    '0', 'D', 'E', 'F'
];

var matrixButtons = [
    'det2x2(', 'add2x2(',
    'mul2x2(', ',', '(', ')',
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0'
];

var complexButtons = [
    're(', 'im(', 'conj(', 'arg(',
    '7', '8', '9', 'i',
    '4', '5', '6', 'abs(',
    '1', '2', '3', '(',
    '0', '.', '+', '-', '*', '/', ')'
];

function getFullButtons(branch) {
    switch (branch) {
        case 'universal': return universalButtons;
        case 'arithmetic': return arithmeticButtons;
        case 'combinatorics': return combinatoricsButtons;
        case 'logic': return logicButtons;
        case 'settheory': return settheoryButtons;
        case 'numbertheory': return numbertheoryButtons;
        case 'conversion': return conversionButtons;
        case 'matrix': return matrixButtons;
        case 'complex': return complexButtons;
        default: return universalButtons;
    }
}

function isNumberButton(label) { return /^[0-9.]$/.test(label); }
function isEqualsButton(label) { return label === '=='; }

// ================= CARET-AWARE INPUT =================
function insertAtCaret(text) {
    var el = exprInput;
    var start = el.selectionStart != null ? el.selectionStart : el.value.length;
    var end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
    var before = el.value.substring(0, start);
    var after = el.value.substring(end);
    el.value = before + text + after;
    var newPos = start + text.length;
    el.focus();
    el.setSelectionRange(newPos, newPos);
}

function moveCaret(delta) {
    var el = exprInput;
    var pos = (el.selectionStart != null ? el.selectionStart : el.value.length) + delta;
    pos = Math.max(0, Math.min(el.value.length, pos));
    el.focus();
    el.setSelectionRange(pos, pos);
}

function backspaceAtCaret() {
    var el = exprInput;
    var start = el.selectionStart != null ? el.selectionStart : el.value.length;
    var end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
    if (start === end) {
        if (start === 0) return;
        el.value = el.value.substring(0, start - 1) + el.value.substring(end);
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
    } else {
        el.value = el.value.substring(0, start) + el.value.substring(end);
        el.focus();
        el.setSelectionRange(start, start);
    }
}

function renderButtons() {
    var btns = getFullButtons(currentBranch);
    if (!dynamicDiv) return;
    dynamicDiv.innerHTML = '';

    for (var i = 0; i < btns.length; i++) {
        var label = btns[i];
        var btn = document.createElement('button');

        if (isNumberButton(label)) btn.className = 'calc-btn number-btn';
        else if (isEqualsButton(label)) btn.className = 'calc-btn equals-btn';
        else btn.className = 'calc-btn operator-btn';

        btn.textContent = label;
        btn.type = 'button';

        (function(btnLabel) {
            if (btnLabel === 'CLEAR') {
                btn.onclick = function() {
                    buzz();
                    exprInput.value = '';
                    resultDisplay.textContent = '0';
                    if (fallbackMessage) fallbackMessage.style.display = 'none';
                    exprInput.focus();
                };
            } else {
                btn.onclick = function() {
                    buzz();
                    if (currentBranch === 'conversion' && btnLabel.indexOf('→') !== -1) {
                        exprInput.value = btnLabel + ' ';
                        exprInput.focus();
                        exprInput.setSelectionRange(exprInput.value.length, exprInput.value.length);
                    } else {
                        insertAtCaret(btnLabel);
                    }
                };
            }
        })(label);

        dynamicDiv.appendChild(btn);
    }
}

function updateBranchIndicator() {
    if (branchIndicator) branchIndicator.textContent = branchNames[currentBranch] || 'Universal (Scientific)';
}

// ================= EXPRESSION COMPILER =================
// Wraps bare function calls like "sin30" -> "sin(30)" while leaving "sin(30+5)" untouched.
function wrapBareFunctionArgs(expr, fnNames) {
    var out = expr;
    for (var i = 0; i < fnNames.length; i++) {
        var fn = fnNames[i];
        var re = new RegExp('\\b' + fn + '\\s*(-?\\d+(?:\\.\\d+)?)', 'g');
        out = out.replace(re, function(_, num) { return fn + '(' + num + ')'; });
    }
    return out;
}

function compileToJS(expr) {
    var clean = preprocessExpression(expr);

    // modulo (between two numbers) vs percentage (trailing)
    var processed = clean.replace(/(\d)\s*%\s*(?=\d)/g, '$1__MOD__');
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
    processed = processed.replace(/__MOD__/g, ' % ');

    // roots and powers
    processed = processed.replace(/√/g, 'sqrt');
    processed = processed.replace(/\^/g, '**');

    // factorial: number or parenthesized group followed by !
    processed = processed.replace(/(\d+(?:\.\d+)?|\([^()]*\))!(?!=)/g, function(_, g) { return 'fact(' + g + ')'; });

    // bare function args without parens: sin30 -> sin(30)
    processed = wrapBareFunctionArgs(processed, ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']);

    // logical words
    processed = processed.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!');
    processed = processed.replace(/\bXOR\b/gi, ' XORFN ');
    processed = processed.replace(/\bIMPLIES\b/gi, ' IMPLIESFN ');
    processed = processed.replace(/\bEQUIV\b/gi, ' EQUIVFN ');
    processed = processed.replace(/\bTRUE\b/gi, 'true').replace(/\bFALSE\b/gi, 'false');

    processed = processed.replace(/==/g, '===').replace(/!==?=/g, '!==');
    processed = processed.replace(/!==(?!=)/g, '!==');

    // function name -> Math.*
    processed = processed.replace(/\bsin\(/g, 'Math.sin(');
    processed = processed.replace(/\bcos\(/g, 'Math.cos(');
    processed = processed.replace(/\btan\(/g, 'Math.tan(');
    processed = processed.replace(/\blog\(/g, 'Math.log10(');
    processed = processed.replace(/\bln\(/g, 'Math.log(');
    processed = processed.replace(/\bsqrt\(/g, 'Math.sqrt(');
    processed = processed.replace(/\babs\(/g, 'Math.abs(');

    // custom logical binary ops -> function calls
    processed = processed.replace(/(.+?)\s*XORFN\s*(.+)/, 'xorFn($1,$2)');
    processed = processed.replace(/(.+?)\s*IMPLIESFN\s*(.+)/, 'impliesFn($1,$2)');
    processed = processed.replace(/(.+?)\s*EQUIVFN\s*(.+)/, 'equivFn($1,$2)');

    return processed;
}

function xorFn(a, b) { return (!!a) !== (!!b); }
function impliesFn(a, b) { return (!a) || (!!b); }
function equivFn(a, b) { return (!!a) === (!!b); }

function runCompiled(processed) {
    var fn = new Function('fact', 'xorFn', 'impliesFn', 'equivFn', 'return (' + processed + ')');
    return fn(fact, xorFn, impliesFn, equivFn);
}

function generateSteps(expr) {
    var steps = [];
    var clean = preprocessExpression(expr);
    steps.push('Original: ' + expr);
    steps.push('After symbol mapping: ' + clean);

    var processed = compileToJS(expr);
    steps.push('Converted to JS: ' + processed);

    var parenRegex = /\(([^()]+)\)/g;
    var match, subExprs = [];
    while ((match = parenRegex.exec(processed)) !== null) subExprs.push(match[1]);

    if (subExprs.length > 0) {
        steps.push('Found ' + subExprs.length + ' sub-expression(s) in parentheses:');
        for (var i = 0; i < subExprs.length; i++) {
            var sub = subExprs[i];
            try {
                var val = runCompiled(sub);
                steps.push('  (' + sub + ') = ' + val);
            } catch (e) { steps.push('  (' + sub + ') = [sub-expression]'); }
        }
    }

    try {
        var result = runCompiled(processed);
        steps.push('Final result: ' + result);
    } catch (e) {
        steps.push('Error: ' + e.message);
    }

    return steps.join('\n');
}

// ================= EVALUATION ENGINE =================
function evaluateUniversal(expr) {
    try {
        if (!expr.trim()) return { result: '0', steps: 'Empty expression' };
        var processed = compileToJS(expr);
        var result = runCompiled(processed);
        var steps = generateSteps(expr);
        return { result: result, steps: steps };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid expression: ' + e.message };
    }
}

function evaluateArithmetic(expr) { return evaluateUniversal(expr); }
function evaluateLogic(expr) { return evaluateUniversal(expr); }

function evaluateCombinatorics(expr) {
    var u = expr.toUpperCase();
    var m = u.match(/NCR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        var n = parseInt(m[1]), r = parseInt(m[2]);
        var res = fact(n) / (fact(r) * fact(n - r));
        return { result: res, steps: 'C(' + n + ',' + r + ') = ' + n + '!/(' + r + '!(' + (n - r) + ')!) = ' + res };
    }
    m = u.match(/NPR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        var n2 = parseInt(m[1]), r2 = parseInt(m[2]);
        var res2 = fact(n2) / fact(n2 - r2);
        return { result: res2, steps: 'P(' + n2 + ',' + r2 + ') = ' + n2 + '!/(' + (n2 - r2) + ')! = ' + res2 };
    }
    m = u.match(/(\d+)!/);
    if (m) {
        var n3 = parseInt(m[1]);
        var res3 = fact(n3);
        return { result: res3, steps: n3 + '! = ' + res3 };
    }
    return { result: 'Error', steps: 'No combinatorics operation detected' };
}

function evaluateSetTheory(expr) {
    var u = expr.toUpperCase();
    if (u.indexOf('UNION') !== -1) return { result: 'A ∪ B', steps: 'Union: elements in A or B' };
    if (u.indexOf('∩') !== -1) return { result: 'A ∩ B', steps: 'Intersection: elements in both' };
    if (u.indexOf('COMPLEMENT') !== -1) return { result: "A'", steps: 'Complement: elements not in A' };
    if (u.indexOf('\\') !== -1) return { result: 'A \\ B', steps: 'Difference: A minus B' };
    if (u.indexOf('SUBSET') !== -1) return { result: 'A ⊆ B', steps: 'Subset: all A in B' };
    if (u.indexOf('POWERSET') !== -1) return { result: 'P(A)', steps: 'Set of all subsets' };
    return { result: 'Error', steps: 'No set operation detected' };
}

function evaluateNumberTheory(expr) {
    var u = expr.toLowerCase();
    var m = u.match(/gcd\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var a = parseInt(m[1]), b = parseInt(m[2]);
        var g = gcd(a, b);
        return { result: g, steps: 'GCD(' + a + ',' + b + ') = ' + g };
    }
    m = u.match(/lcm\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var a2 = parseInt(m[1]), b2 = parseInt(m[2]);
        var l = (a2 * b2) / gcd(a2, b2);
        return { result: l, steps: 'LCM(' + a2 + ',' + b2 + ') = ' + l };
    }
    m = u.match(/mod\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var mm = parseInt(m[1]) % parseInt(m[2]);
        return { result: mm, steps: m[1] + ' mod ' + m[2] + ' = ' + mm };
    }
    m = u.match(/prime\?\s*\(?\s*(\d+)/);
    if (m) {
        var n = parseInt(m[1]);
        var isPrime = n > 1;
        for (var i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) { isPrime = false; break; } }
        return { result: isPrime, steps: n + ' is ' + (isPrime ? 'prime' : 'not prime') };
    }
    m = u.match(/factor\s*\(?\s*(\d+)/);
    if (m) {
        var num = parseInt(m[1]);
        var factors = [];
        var d = 2, x = num;
        while (d * d <= x) {
            while (x % d === 0) { factors.push(d); x /= d; }
            d++;
        }
        if (x > 1) factors.push(x);
        return { result: factors.join(' × '), steps: num + ' = ' + factors.join(' × ') };
    }
    return { result: 'Error', steps: 'No number theory operation detected' };
}

function evaluateConversion(expr) {
    var m = expr.match(/(DEC → BINARY|BIN → DECIMAL|DEC → HEX|HEX → DECIMAL|DEC → OCT|OCT → DECIMAL|BIN → HEX)\s+(\S+)/i);
    if (!m) return { result: 'Error', steps: 'Format: DEC → BINARY 255' };
    var type = m[1].toUpperCase(), val = m[2];
    try {
        if (type === 'DEC → BINARY') return { result: parseInt(val, 10).toString(2), steps: 'Convert ' + val + ' to binary = ' + parseInt(val, 10).toString(2) };
        if (type === 'BIN → DECIMAL') return { result: parseInt(val, 2), steps: 'Binary ' + val + ' to decimal = ' + parseInt(val, 2) };
        if (type === 'DEC → HEX') return { result: parseInt(val, 10).toString(16).toUpperCase(), steps: 'Convert ' + val + ' to hex = ' + parseInt(val, 10).toString(16).toUpperCase() };
        if (type === 'HEX → DECIMAL') return { result: parseInt(val, 16), steps: 'Hex ' + val + ' to decimal = ' + parseInt(val, 16) };
        if (type === 'DEC → OCT') return { result: parseInt(val, 10).toString(8), steps: 'Convert ' + val + ' to octal = ' + parseInt(val, 10).toString(8) };
        if (type === 'OCT → DECIMAL') return { result: parseInt(val, 8), steps: 'Octal ' + val + ' to decimal = ' + parseInt(val, 8) };
        if (type === 'BIN → HEX') {
            var dec = parseInt(val, 2);
            return { result: dec.toString(16).toUpperCase(), steps: 'Binary to decimal = ' + dec + ', then hex = ' + dec.toString(16).toUpperCase() };
        }
    } catch (e) { return { result: 'Error', steps: 'Invalid input' }; }
    return { result: 'Error', steps: 'Unknown conversion' };
}

function evaluateMatrix(expr) {
    var u = expr.toLowerCase();
    var m = u.match(/det2x2\s*\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (m) {
        var a = +m[1], b = +m[2], c = +m[3], d = +m[4];
        var det = a * d - b * c;
        return { result: det, steps: 'det([' + a + ' ' + b + '; ' + c + ' ' + d + ']) = ' + a + '*' + d + ' - ' + b + '*' + c + ' = ' + det };
    }
    m = u.match(/add2x2\s*\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (m) {
        var vals = m.slice(1, 9).map(Number);
        var r = [vals[0] + vals[4], vals[1] + vals[5], vals[2] + vals[6], vals[3] + vals[7]];
        return { result: '[' + r[0] + ' ' + r[1] + '; ' + r[2] + ' ' + r[3] + ']', steps: 'Element-wise sum of the two 2x2 matrices' };
    }
    m = u.match(/mul2x2\s*\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (m) {
        var v = m.slice(1, 9).map(Number);
        var r1c1 = v[0] * v[4] + v[1] * v[6];
        var r1c2 = v[0] * v[5] + v[1] * v[7];
        var r2c1 = v[2] * v[4] + v[3] * v[6];
        var r2c2 = v[2] * v[5] + v[3] * v[7];
        return { result: '[' + r1c1 + ' ' + r1c2 + '; ' + r2c1 + ' ' + r2c2 + ']', steps: 'Matrix multiplication of two 2x2 matrices' };
    }
    return { result: 'Error', steps: 'No matrix operation detected' };
}

function evaluateComplex(expr) {
    var m = expr.replace(/\s/g, '').match(/^(-?\d+(?:\.\d+)?)?([+-]\d+(?:\.\d+)?)?i$/);
    var parseComplex = function(str) {
        str = str.replace(/\s/g, '');
        var mm = str.match(/^(-?\d+(?:\.\d+)?)?([+-]\d+(?:\.\d+)?)?i$/);
        if (mm) return { re: mm[1] ? parseFloat(mm[1]) : 0, im: mm[2] ? parseFloat(mm[2]) : 1 };
        var num = parseFloat(str);
        if (!isNaN(num)) return { re: num, im: 0 };
        return null;
    };
    var lower = expr.toLowerCase();
    var fn = lower.match(/^(re|im|conj|abs|arg)\((.+)\)$/);
    if (fn) {
        var c = parseComplex(fn[2]);
        if (!c) return { result: 'Error', steps: 'Could not parse complex number' };
        if (fn[1] === 're') return { result: c.re, steps: 'Real part of ' + fn[2] + ' = ' + c.re };
        if (fn[1] === 'im') return { result: c.im, steps: 'Imaginary part of ' + fn[2] + ' = ' + c.im };
        if (fn[1] === 'conj') return { result: c.re + (-c.im >= 0 ? '+' : '') + (-c.im) + 'i', steps: 'Conjugate flips the sign of the imaginary part' };
        if (fn[1] === 'abs') { var mag = Math.sqrt(c.re * c.re + c.im * c.im); return { result: mag, steps: '|a+bi| = sqrt(a²+b²) = ' + mag }; }
        if (fn[1] === 'arg') { var ang = Math.atan2(c.im, c.re); return { result: ang, steps: 'arg(a+bi) = atan2(b,a) = ' + ang + ' rad' }; }
    }
    return { result: 'Error', steps: 'Use re(), im(), conj(), abs(), or arg() with a complex number like 3+4i' };
}

// ================= MAIN EVALUATE WITH FALLBACK =================
function evaluate() {
    var raw = exprInput.value.trim();
    if (!raw) { resultDisplay.textContent = '0'; fallbackMessage.style.display = 'none'; return; }

    fallbackMessage.style.display = 'none';
    var res, usedFallback = false;

    if (currentBranch === 'universal') res = evaluateUniversal(raw);
    else if (currentBranch === 'arithmetic') res = evaluateArithmetic(raw);
    else if (currentBranch === 'combinatorics') res = evaluateCombinatorics(raw);
    else if (currentBranch === 'logic') res = evaluateLogic(raw);
    else if (currentBranch === 'settheory') res = evaluateSetTheory(raw);
    else if (currentBranch === 'numbertheory') res = evaluateNumberTheory(raw);
    else if (currentBranch === 'conversion') res = evaluateConversion(raw);
    else if (currentBranch === 'matrix') res = evaluateMatrix(raw);
    else if (currentBranch === 'complex') res = evaluateComplex(raw);
    else res = evaluateUniversal(raw);

    if (res.result === 'Error' || (typeof res.result === 'string' && res.result.indexOf('Error') === 0)) {
        if (currentBranch !== 'universal' && currentBranch !== 'arithmetic') {
            var fallbackRes = evaluateUniversal(raw);
            if (fallbackRes.result !== 'Error' && !(typeof fallbackRes.result === 'string' && fallbackRes.result.indexOf('Error') === 0)) {
                usedFallback = true;
                fallbackRes.steps = 'Expression entered does not match the branch, evaluating using universal branch.\n\n' + fallbackRes.steps;
                res = fallbackRes;
            }
        }
    }

    var resStr = res.result === undefined ? 'Error' : res.result.toString();
    resultDisplay.textContent = resStr;

    if (typeof res.result === 'number' && isFinite(res.result)) lastAnswer = res.result;

    if (usedFallback) {
        fallbackMessage.textContent = 'Expression entered does not match the branch, evaluating using universal branch.';
        fallbackMessage.style.display = 'block';
    }

    addHistory(raw, resStr, res.steps, currentBranch);
    buzz(15);
    showStepsView(raw, resStr, res.steps || 'No detailed steps');
}

// ================= UI ACTIONS =================
function toggleDrawer(open) {
    document.getElementById('drawer').classList.toggle('open', open);
    document.getElementById('overlay').classList.toggle('active', open);
}

function clearCache() {
    if (confirm('Clear all cache, history, and reset to defaults?')) {
        localStorage.clear();
        historyEntries = [];
        saveHistory();
        initTheme();
        initFont();
        // Reset keyboard state to default (OFF)
        keyboardEnabled = false;
        localStorage.setItem('keyboardEnabled', 'false');
        applyKeyboardState();
        exprInput.value = '';
        resultDisplay.textContent = '0';
        fallbackMessage.style.display = 'none';
        showToast('Cache cleared. Theme and font reset.');
    }
}

function hardResetAndRefresh() {
    if (confirm('Reset session: This will clear all history, preferences, and reload the app. Continue?')) {
        localStorage.clear();
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (var i = 0; i < names.length; i++) caches.delete(names[i]);
            });
        }
        window.location.reload(true);
    }
}

// Update modal logic
var updateModal = document.getElementById('updateModal');
var updateNotNowBtn = document.getElementById('updateNotNowBtn');
var updateNowBtn = document.getElementById('updateNowBtn');
var pendingUpdateWorker = null;

function showUpdateModal(message) {
    if (!updateModal) return;
    var msgElem = document.getElementById('updateMessage');
    if (msgElem) msgElem.textContent = message || 'A new version is available. Please update.';
    updateModal.style.display = 'flex';
}
function hideUpdateModal() { if (updateModal) updateModal.style.display = 'none'; }
function promptForUpdate(worker) { pendingUpdateWorker = worker; showUpdateModal('A new version of the app is ready. Update now?'); }

function setupServiceWorkerUpdates() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function(registration) {
        setInterval(function() { registration.update(); }, 30 * 60 * 1000);
        if (registration.waiting) promptForUpdate(registration.waiting);
        registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) promptForUpdate(newWorker);
            });
        });
    });
    navigator.serviceWorker.addEventListener('controllerchange', function() { window.location.reload(); });
}

function doUpdateNow() {
    if (pendingUpdateWorker) { pendingUpdateWorker.postMessage({ action: 'skipWaiting' }); hideUpdateModal(); }
    else window.location.reload(true);
}

// ================= CONTENT PAGES =================
function showHelpPage() {
    var helpHtml = '<div class="about-text">' +
        '<h3>HOW TO USE THIS CALCULATOR</h3>' +
        '<h3>--- BASIC ARITHMETIC ---</h3>' +
        '<p><strong>Addition:</strong> 5 + 3</p>' +
        '<p><strong>Subtraction:</strong> 10 - 4</p>' +
        '<p><strong>Multiplication:</strong> 6 × 7</p>' +
        '<p><strong>Division:</strong> 15 ÷ 3</p>' +
        '<p><strong>Exponent/Power:</strong> 2^3 or 5^2</p>' +
        '<p><strong>Modulo:</strong> 10 % 3 (result: 1)</p>' +
        '<p><strong>Percentage:</strong> 200% (result: 2)</p>' +
        '<p><strong>Factorial:</strong> 5! or (3+2)!</p>' +
        '<p><strong>Square Root:</strong> √16 or √(9+7)</p>' +
        '<p><strong>Absolute Value:</strong> abs(-5) or abs-5</p>' +
        '<p><strong>Constants:</strong> π and e are supported directly</p>' +
        '<p><strong>Last Answer:</strong> tap ANS to reuse your previous result</p>' +
        '<h3>--- SCIENTIFIC FUNCTIONS ---</h3>' +
        '<p><strong>Sine / Cosine / Tangent:</strong> sin30, cos(0), tan45</p>' +
        '<p><strong>Log base 10 / Natural Log:</strong> log100, ln2.718</p>' +
        '<h3>--- RELATIONAL & LOGICAL ---</h3>' +
        '<p><strong>Equal:</strong> 5==5 &nbsp; <strong>Not equal:</strong> 5≠3</p>' +
        '<p><strong>Comparisons:</strong> &gt; &lt; ≥ ≤</p>' +
        '<p><strong>AND / OR / NOT / XOR / IMPLIES / EQUIV</strong> combine TRUE/FALSE values</p>' +
        '<h3>--- COMBINATORICS ---</h3>' +
        '<p>nCr(5,2) = 10 &nbsp; nPr(5,2) = 20</p>' +
        '<h3>--- NUMBER THEORY ---</h3>' +
        '<p>gcd(12,8), lcm(12,8), mod(10,3), prime?(7), factor(60)</p>' +
        '<h3>--- NUMBER SYSTEM CONVERSIONS ---</h3>' +
        '<p>Format: <strong>DEC → BINARY 255</strong> (also HEX, OCT, BIN variants)</p>' +
        '<h3>--- SET THEORY ---</h3>' +
        '<p>UNION, ∩, COMPLEMENT, \\, SUBSET, POWERSET — symbolic explanations</p>' +
        '<h3>--- MATRIX (2×2) ---</h3>' +
        '<p>det2x2(1,2,3,4), add2x2(1,2,3,4,5,6,7,8), mul2x2(1,2,3,4,5,6,7,8)</p>' +
        '<h3>--- COMPLEX NUMBERS ---</h3>' +
        '<p>re(3+4i), im(3+4i), conj(3+4i), abs(3+4i), arg(3+4i)</p>' +
        '<h3>--- TIPS ---</h3>' +
        '<p>Tap anywhere in the expression to move the cursor, or use ◀ ▶ to navigate precisely.</p>' +
        '<p>If an expression fails in a specific branch, it automatically falls back to Universal mode.</p>' +
        '</div>';
    showFullPage('HELP / HOW TO USE', helpHtml);
}

function showPrivacyPage() {
    var privacyHtml = '<div class="about-text">' +
        '<h2>PRIVACY POLICY</h2>' +
        '<p class="muted-small">Last updated: May 2026</p>' +
        '<h3>1. Introduction</h3>' +
        '<p>This privacy policy applies to the <strong>Universal CS Calculator</strong> application developed by Hanz Dalmino.</p>' +
        '<h3>2. Data Collection</h3>' +
        '<p><strong>We do not collect any personal data.</strong> Calculations, history, and preferences are stored locally on your device and never transmitted anywhere.</p>' +
        '<h3>3. Information Stored Locally</h3>' +
        '<ul><li>Calculation history</li><li>Theme preference</li><li>Font preference</li></ul>' +
        '<p>Clear it anytime via "Clear Cache" in the app.</p>' +
        '<h3>4. Third-Party Services</h3>' +
        '<p>No analytics, advertising, or tracking services are used.</p>' +
        '<h3>5. Internet Usage</h3>' +
        '<p>The app works fully offline after the first visit.</p>' +
        '<h3>6. Children\'s Privacy</h3>' +
        '<p>No personal information is collected from anyone, including children under 13.</p>' +
        '<h3>7. Changes to This Policy</h3>' +
        '<p>Updates will be reflected on this page.</p>' +
        '<h3>8. Contact</h3>' +
        '<p style="text-align:center; margin-top:10px;"><a href="https://hdalmino0011.github.io/Computer-Science-Calculator/" style="color:var(--accent); font-weight:bold;">hdalmino0011.github.io/Computer-Science-Calculator</a></p>' +
        '<p style="text-align:center; margin-top:5px;">Email: <a href="mailto:dalminohanz14@gmail.com" style="color:var(--accent);">dalminohanz14@gmail.com</a></p>' +
        '</div>';
    showFullPage('PRIVACY & POLICY', privacyHtml);
}

function showAboutPage() {
    var aboutHtml = '<div class="about-text">' +
        '<h3>Developed by Hanz Dalmino</h3>' +
        '<p>A Bachelor of Science in Information Technology student from Cebu Technological University - Main Campus</p>' +
        '<h3>Purpose</h3>' +
        '<p>This Universal CS Calculator is designed for students and professionals in <strong>Computer Science, Information Technology, Computer Engineering,</strong> and related fields, offering step-by-step evaluation across key disciplines.</p>' +
        '<h3>Topics Covered</h3>' +
        '<ul>' +
        '<li>Arithmetic & Bitwise Operations</li><li>Relational and Logical Operators</li>' +
        '<li>Combinatorics (nCr, nPr, Factorials)</li><li>Boolean Algebra and Logic Gates</li>' +
        '<li>Set Theory</li><li>Number Theory (GCD, LCM, Modulo, Primality, Factoring)</li>' +
        '<li>Number System Conversions</li><li>Matrix Algebra (2×2)</li>' +
        '<li>Complex Numbers</li><li>Scientific Functions</li>' +
        '</ul>' +
        '<h3>Why This Calculator?</h3>' +
        '<p>It shows every step of the evaluation to help students understand the process, and handles mixed arithmetic, bitwise, relational, and logical expressions in one line — fully customizable with 12 themes and multiple fonts, on desktop, tablet, and mobile.</p>' +
        '</div>';
    showFullPage('ABOUT', aboutHtml);
}

function showThemesPage() {
    var html = '<div class="theme-grid">';
    for (var i = 0; i < themes.length; i++) {
        html += '<div class="theme-card" data-theme="' + themes[i] + '" style="--swatch:' + getThemeColor(themes[i]) + '">' +
                '<span class="theme-swatch"></span>' + themeNames[i] + '</div>';
    }
    html += '</div>';
    showFullPage('THEMES (12)', html);

    var cards = document.querySelectorAll('.theme-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function() {
            applyTheme(this.dataset.theme);
            showCalculatorView();
        });
    }
}

function showFontPage() {
    var fonts = [
        { label: 'Sans (Inter)', value: "'Inter', 'Segoe UI', system-ui, sans-serif" },
        { label: 'Times New Roman', value: 'Times New Roman' },
        { label: 'Arial', value: 'Arial' },
        { label: 'Courier New (Mono)', value: 'Courier New' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Verdana', value: 'Verdana' }
    ];
    var html = '<div class="font-selector-page">';
    for (var i = 0; i < fonts.length; i++) {
        html += '<div class="font-option" data-font="' + fonts[i].value + '" style="font-family:' + fonts[i].value + '">' + fonts[i].label + '</div>';
    }
    html += '</div>';
    showFullPage('FONT', html);

    var opts = document.querySelectorAll('.font-option');
    for (var i = 0; i < opts.length; i++) {
        opts[i].addEventListener('click', function() {
            setFont(this.dataset.font);
            showCalculatorView();
        });
    }
}

function showHistoryPage() {
    if (historyEntries.length === 0) {
        showFullPage('HISTORY', '<div class="history-item-page">No history yet</div>');
        return;
    }
    var html = '<div class="history-list-page">';
    for (var i = 0; i < historyEntries.length; i++) {
        var h = historyEntries[i];
        html += '<div class="history-item-page" data-index="' + i + '">' +
                '<div class="history-expr">' + escapeHtml(h.expr) + '</div>' +
                '<div class="history-result">= ' + escapeHtml(h.result) + '</div>' +
                '<div class="history-meta">' + escapeHtml(branchNames[h.branch] || h.branch) + ' · ' + escapeHtml(h.date) + '</div>' +
                '</div>';
    }
    html += '</div><button id="clearHistoryFromPage" class="action-btn danger-btn full-width-btn">CLEAR ALL HISTORY</button>';
    showFullPage('HISTORY', html);

    var items = document.querySelectorAll('.history-item-page[data-index]');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-index'), 10);
            var h = historyEntries[idx];
            exprInput.value = h.expr;
            var branchBtn = document.querySelector('.branch-drawer-btn[data-branch="' + h.branch + '"]');
            if (branchBtn) branchBtn.click();
            showCalculatorView();
            exprInput.focus();
        });
    }
    var clearBtn = document.getElementById('clearHistoryFromPage');
    if (clearBtn) clearBtn.addEventListener('click', function() { clearHistory(); showHistoryPage(); });
}

function getThemeColor(t) {
    var c = {
        default: '#7c3aed', obsidian: '#a855f7', royalblue: '#3b82f6', orange: '#f97316',
        highcontrast: '#ffff00', forest: '#22c55e', crimson: '#ef4444', slate: '#64748b',
        purple: '#c084fc', midnight: '#60a5fa', sand: '#fbbf24', 'cyan-night': '#06b6d4'
    };
    return c[t] || '#7c3aed';
}

// ================= KEYBOARD SUPPORT =================
var keyMap = {
    '*': '×', '/': '÷'
};

function handlePhysicalKeydown(e) {
    // don't hijack when a full page / steps view is open and target isn't the expr input
    if (document.activeElement !== exprInput) return;

    if (e.key === 'Enter') { e.preventDefault(); evaluate(); return; }
    if (e.key === 'Escape') {
        exprInput.value = '';
        resultDisplay.textContent = '0';
        if (fallbackMessage) fallbackMessage.style.display = 'none';
        return;
    }
    // let native Backspace/Delete/ArrowLeft/ArrowRight behave natively in the input
}

// ================= INITIALIZATION =================
function init() {
    loadHistory();
    initTheme();
    initFont();
    initKeyboardState();
    updateBranchIndicator();
    renderButtons();

    // Set up branch buttons
    var branchBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < branchBtns.length; i++) {
        branchBtns[i].addEventListener('click', function() {
            var allBtns = document.querySelectorAll('.branch-drawer-btn');
            for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
            this.classList.add('active');
            currentBranch = this.getAttribute('data-branch');
            updateBranchIndicator();
            renderButtons();
            if (fallbackMessage) fallbackMessage.style.display = 'none';
            toggleDrawer(false);
        });
    }

    // Drawer actions
    document.getElementById('drawerHelpBtn').onclick = function() { toggleDrawer(false); showHelpPage(); };
    document.getElementById('drawerPrivacyBtn').onclick = function() { toggleDrawer(false); showPrivacyPage(); };
    document.getElementById('drawerThemesBtn').onclick = function() { toggleDrawer(false); showThemesPage(); };
    document.getElementById('drawerFontBtn').onclick = function() { toggleDrawer(false); showFontPage(); };
    document.getElementById('drawerHistoryBtn').onclick = function() { toggleDrawer(false); showHistoryPage(); };
    document.getElementById('drawerAboutBtn').onclick = function() { toggleDrawer(false); showAboutPage(); };
    document.getElementById('drawerClearCacheBtn').onclick = function() { toggleDrawer(false); clearCache(); };
    document.getElementById('drawerExitBtn').onclick = function() { toggleDrawer(false); hardResetAndRefresh(); };

    // Calculator buttons
    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = function() {
        buzz();
        exprInput.value = '';
        resultDisplay.textContent = '0';
        if (fallbackMessage) fallbackMessage.style.display = 'none';
        exprInput.focus();
    };
    document.getElementById('leftBtn').onclick = function() { buzz(); moveCaret(-1); };
    document.getElementById('rightBtn').onclick = function() { buzz(); moveCaret(1); };
    document.getElementById('backBtn').onclick = function() { buzz(); backspaceAtCaret(); };
    document.getElementById('ansToggleBtn').onclick = function() { buzz(); insertAtCaret('ANS'); showToast('Inserted last answer'); };

    // Menu and overlay
    document.getElementById('menuToggleBtn').onclick = function() { toggleDrawer(true); };
    document.getElementById('closeDrawerBtn').onclick = function() { toggleDrawer(false); };
    document.getElementById('overlay').onclick = function() { toggleDrawer(false); };
    document.getElementById('closeFullPageBtn').onclick = function() { showCalculatorView(); };
    document.getElementById('backToCalculatorBtn').onclick = function() { showCalculatorView(); };

    // Keyboard toggle
    document.getElementById('keyboardToggleBtn').onclick = function() {
        buzz();
        toggleKeyboard();
    };

    // Update modal
    if (updateNotNowBtn) updateNotNowBtn.onclick = function() { hideUpdateModal(); };
    if (updateNowBtn) updateNowBtn.onclick = function() { doUpdateNow(); };

    // PWA welcome modal
    initPwaWelcomeModal();

    // Input event
    exprInput.addEventListener('keydown', handlePhysicalKeydown);

    // Highlight active branch
    var activeBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < activeBtns.length; i++) {
        if (activeBtns[i].getAttribute('data-branch') === currentBranch) activeBtns[i].classList.add('active');
    }

    setupServiceWorkerUpdates();

    // real keyboard should appear on mobile even though inputmode=none blocks autofocus zoom quirks
    exprInput.addEventListener('focus', function() { exprInput.removeAttribute('inputmode'); });
}

init();
