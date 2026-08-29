// ================= STATE =================
var currentBranch = "universal";
var historyEntries = [];
var lastAnswer = 0;
var keyboardEnabled = false;
var lastCalculatedSteps = '';
var lastCalculatedExpression = '';
var lastCalculatedResult = '';

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
var desktopSideContent = document.getElementById('desktopSideContent');
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
    toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, 2000);
}

// ================= HAPTIC FEEDBACK =================
function buzz(ms) {
    if (navigator.vibrate) {
        try { navigator.vibrate(ms || 8); } catch (e) {}
    }
}

// ================= UTILITIES =================
function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return s.toString().replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function fact(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n === 0 || n === 1) return 1;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
}

function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a;
}

// Extended Euclidean Algorithm: returns { gcd, s, t, steps }
function extendedGcdWithSteps(a, b) {
    var steps = [];
    var x = Math.abs(a), y = Math.abs(b);
    steps.push('<strong>Euclidean Algorithm for gcd(' + x + ', ' + y + '):</strong>');
    if (y === 0) {
        steps.push('gcd(' + x + ', 0) = ' + x);
        return { gcd: x, s: 1, t: 0, steps: steps };
    }

    var r0 = x, r1 = y;
    var s0 = 1, s1 = 0;
    var t0 = 0, t1 = 1;
    var divisions = [];

    while (r1 !== 0) {
        var q = Math.floor(r0 / r1);
        var r2 = r0 % r1;
        var s2 = s0 - q * s1;
        var t2 = t0 - q * t1;
        divisions.push({ r0: r0, r1: r1, q: q, r2: r2 });
        steps.push(r0 + ' = ' + q + ' × ' + r1 + ' + ' + r2);
        r0 = r1; r1 = r2;
        s0 = s1; s1 = s2;
        t0 = t1; t1 = t2;
    }

    steps.push('Last non-zero remainder = <strong>' + r0 + '</strong> (GCD)');
    steps.push('<strong>Bézout Identity:</strong> ' + r0 + ' = (' + s0 + ' × ' + x + ') + (' + t0 + ' × ' + y + ')');
    return { gcd: r0, s: s0, t: t0, steps: steps };
}

// Repeated division for base conversion
function toBaseWithSteps(num, base) {
    var steps = [];
    var negative = num < 0;
    var n = Math.trunc(Math.abs(num));
    var baseNames = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
    var targetName = baseNames[base] || ('Base-' + base);

    steps.push('<strong>Converting ' + (negative ? '-' : '') + n + ' to ' + targetName + ' (Base ' + base + '):</strong>');

    if (n === 0) {
        steps.push('0 ÷ ' + base + ' = 0 with remainder 0');
        steps.push('Result: <strong>0</strong>');
        return { result: '0', steps: steps };
    }

    var digits = [];
    var stepIndex = 1;
    var tableRows = [];

    while (n > 0) {
        var q = Math.floor(n / base);
        var r = n % base;
        var digitChar = r.toString(base).toUpperCase();
        digits.unshift(digitChar);
        tableRows.push('Step ' + stepIndex + ': ' + n + ' ÷ ' + base + ' = ' + q + '  (Remainder: ' + digitChar + ')');
        n = q;
        stepIndex++;
    }

    steps.push(tableRows.join('\n'));
    steps.push('Read remainders from bottom to top (most significant to least significant): <strong>' + digits.join('') + '</strong>');

    var resultStr = (negative ? '-' : '') + digits.join('');
    if (negative) {
        steps.push('Include negative sign: <strong>' + resultStr + '</strong>');
    }

    // Include 8-bit/16-bit binary two\'s complement if base is 2
    if (base === 2 && !negative && num <= 255) {
        var padded8 = digits.join('').padStart(8, '0');
        steps.push('8-bit binary representation: <code>' + padded8.slice(0, 4) + ' ' + padded8.slice(4) + '</code>');
    }

    return { result: resultStr, steps: steps };
}

// Place-value expansion for converting back to decimal
function fromBaseWithSteps(str, base) {
    var steps = [];
    var clean = str.toUpperCase().trim();
    var negative = clean.charAt(0) === '-';
    if (negative) clean = clean.substring(1);
    clean = clean.replace(/^0+(?=.)/, '');
    var baseNames = { 2: 'Binary', 8: 'Octal', 16: 'Hexadecimal' };
    var sourceName = baseNames[base] || ('Base-' + base);

    steps.push('<strong>Converting ' + (negative ? '-' : '') + clean + ' from ' + sourceName + ' (Base ' + base + ') to Decimal:</strong>');

    var chars = clean.split('');
    var n = chars.length;
    var total = 0;
    var parts = [];

    for (var i = 0; i < n; i++) {
        var digit = parseInt(chars[i], base);
        if (isNaN(digit)) {
            steps.push('Invalid digit "' + chars[i] + '" for base ' + base);
            return { result: NaN, steps: steps };
        }
        var power = n - 1 - i;
        var val = digit * Math.pow(base, power);
        parts.push(chars[i] + ' × ' + base + '<sup>' + power + '</sup> (' + digit + ' × ' + Math.pow(base, power) + ' = ' + val + ')');
        total += val;
    }

    steps.push(parts.join('\n'));
    steps.push('Sum of all positional values: ' + parts.map(function(p) { return p.split(' = ')[1].replace(')', ''); }).join(' + ') + ' = <strong>' + total + '</strong>');

    if (negative) {
        total = -total;
        steps.push('Applying negative sign: <strong>' + total + '</strong>');
    }

    return { result: total, steps: steps };
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
    processed = processed.replace(/([^\s<>!=])=([^=])/g, '$1==$2');
    return processed;
}

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

// ================= VIEW SWITCHING & SIDE PANEL =================
function showCalculatorView() {
    calculatorView.style.display = 'flex';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'none';
}

function formatStepsHtml(steps) {
    if (!steps || !steps.trim()) {
        return '<div class="step-item">No detailed steps available for this calculation.</div>';
    }
    var stepLines = steps.split('\n');
    var html = '';
    var num = 0;
    for (var i = 0; i < stepLines.length; i++) {
        var line = stepLines[i].trim();
        if (line) {
            num++;
            var isRuleHeader = line.indexOf('<strong>') === 0 || line.indexOf('===') !== -1 || line.indexOf('Rule:') !== -1;
            var isHighlight = line.indexOf('Final result') !== -1 || line.indexOf('Result:') !== -1;
            var classes = 'step-item';
            if (isRuleHeader) classes += ' rule-header';
            if (isHighlight) classes += ' highlight-step';

            html += '<div class="' + classes + '"><span class="step-number">' + num + '.</span><span class="step-text">' + line + '</span></div>';
        }
    }
    return html;
}

function updateDesktopSidePanel(expression, result, steps) {
    if (!desktopSideContent) return;
    if (!expression && !result) {
        desktopSideContent.innerHTML = '<div class="side-empty-state">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>' +
            '<p>Perform an evaluation to inspect the <strong>detailed mathematical proof</strong> and step-by-step evaluation.</p>' +
            '</div>';
        return;
    }

    var html = '<div class="steps-expression"><strong>Expression:</strong> ' + escapeHtml(expression) + '</div>' +
               '<div class="steps-result-full"><span class="result-label">RESULT:</span> <span class="result-value">' + escapeHtml(result) + '</span></div>' +
               '<div class="steps-list-full">' + formatStepsHtml(steps) + '</div>';
    desktopSideContent.innerHTML = html;
}

function showStepsView(expression, result, steps) {
    lastCalculatedExpression = expression;
    lastCalculatedResult = result;
    lastCalculatedSteps = steps;

    document.getElementById('stepsExpression').innerHTML = '<strong>Expression:</strong> ' + escapeHtml(expression);
    document.getElementById('stepsResultFull').innerHTML = '<span class="result-label">RESULT:</span> <span class="result-value">' + escapeHtml(result) + '</span>';
    var stepsList = document.getElementById('stepsListFull');
    if (stepsList) {
        stepsList.innerHTML = formatStepsHtml(steps);
    }

    updateDesktopSidePanel(expression, result, steps);

    // Only switch full view on mobile screens (< 900px)
    if (window.innerWidth < 900) {
        calculatorView.style.display = 'none';
        stepsView.style.display = 'flex';
        fullPageView.style.display = 'none';
    }
}

function showFullPage(title, contentHtml) {
    fullPageTitle.textContent = title;
    fullPageContent.innerHTML = contentHtml;
    calculatorView.style.display = 'none';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'flex';
}

function copyStepsToClipboard() {
    if (!lastCalculatedSteps && !lastCalculatedExpression) {
        showToast('No steps to copy');
        return;
    }
    var fullText = 'EXPRESSION: ' + lastCalculatedExpression + '\n' +
                   'RESULT: ' + lastCalculatedResult + '\n\n' +
                   'STEP-BY-STEP EVALUATION:\n' +
                   lastCalculatedSteps.replace(/<[^>]*>/g, '');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(function() {
            showToast('Steps copied to clipboard!');
        }).catch(function() {
            showToast('Unable to copy to clipboard');
        });
    } else {
        showToast('Clipboard access not supported');
    }
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
        expr: expr, result: result, steps: (steps || '').substring(0, 1000),
        branch: branch, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (historyEntries.length > 50) historyEntries.length = 50;
    saveHistory();
}

function clearHistory() { historyEntries = []; saveHistory(); }

// ================= THEMES =================
var themes = ['default', 'obsidian', 'royalblue', 'orange', 'highcontrast', 'forest', 'crimson', 'slate', 'purple', 'midnight', 'sand', 'cyan-night'];
var themeNames = ['Default Modern', 'Obsidian Violet', 'Royal Blue', 'Deep Amber', 'High Contrast', 'Emerald Forest', 'Crimson Rose', 'Slate Steel', 'Electric Purple', 'Midnight Indigo', 'Warm Sand', 'Cyan Neon'];

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
        if (document.activeElement === exprInput) {
            exprInput.blur();
        }
    }
}

function toggleKeyboard() {
    keyboardEnabled = !keyboardEnabled;
    localStorage.setItem('keyboardEnabled', keyboardEnabled ? 'true' : 'false');
    applyKeyboardState();
    showToast(keyboardEnabled ? 'Hardware keyboard enabled' : 'Virtual keypad mode');
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

function handlePwaWelcomeResponse() {
    localStorage.setItem('pwaWelcomeSeen', 'true');
    hidePwaWelcomeModal();
}

function initPwaWelcomeModal() {
    var seen = localStorage.getItem('pwaWelcomeSeen');
    if (!seen) {
        showPwaWelcomeModal();
    }
    var agreeBtn = document.getElementById('pwaAgreeBtn');
    var disagreeBtn = document.getElementById('pwaDisagreeBtn');
    if (agreeBtn) agreeBtn.addEventListener('click', handlePwaWelcomeResponse);
    if (disagreeBtn) disagreeBtn.addEventListener('click', handlePwaWelcomeResponse);
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
    '4', '5', '6', '∅',
    '1', '2', '3', 'A',
    '0', 'B', 'U', 'C'
];

var numbertheoryButtons = [
    'gcd(', 'lcm(', 'mod(', 'prime?(',
    'factor(', '(', ')', ',',
    '7', '8', '9', 'phi(',
    '4', '5', '6', 'modpow(',
    '1', '2', '3', '^',
    '0', '.'
];

var conversionButtons = [
    'DEC → BINARY', 'BIN → DECIMAL',
    'DEC → HEX', 'HEX → DECIMAL',
    'DEC → OCT', 'OCT → DECIMAL',
    'BIN → HEX', 'HEX → BINARY',
    '7', '8', '9', 'A',
    '4', '5', '6', 'B',
    '1', '2', '3', 'C',
    '0', 'D', 'E', 'F'
];

var matrixButtons = [
    'det2x2(', 'inv2x2(',
    'add2x2(', 'mul2x2(',
    'trace2x2(', 'trans2x2(',
    '7', '8', '9', ',',
    '4', '5', '6', '(',
    '1', '2', '3', ')',
    '0', '-'
];

var complexButtons = [
    're(', 'im(', 'conj(', 'arg(',
    'abs(', 'polar(', '(', ')',
    '7', '8', '9', 'i',
    '4', '5', '6', '+',
    '1', '2', '3', '-',
    '0', '.', '*', '/'
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

function isNumberButton(label) { return /^[0-9A-F.]$/.test(label); }
function isEqualsButton(label) { return label === '=='; }

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
        })(label);

        dynamicDiv.appendChild(btn);
    }
}

function switchBranch(branch) {
    currentBranch = branch;
    updateBranchIndicator();
    renderButtons();

    // Update drawer buttons
    var allDrawerBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < allDrawerBtns.length; i++) {
        if (allDrawerBtns[i].getAttribute('data-branch') === branch) {
            allDrawerBtns[i].classList.add('active');
        } else {
            allDrawerBtns[i].classList.remove('active');
        }
    }

    // Update desktop tabs
    var allTabs = document.querySelectorAll('.mode-tab-btn');
    for (var j = 0; j < allTabs.length; j++) {
        if (allTabs[j].getAttribute('data-branch') === branch) {
            allTabs[j].classList.add('active');
        } else {
            allTabs[j].classList.remove('active');
        }
    }

    if (fallbackMessage) fallbackMessage.style.display = 'none';
}

function updateBranchIndicator() {
    if (branchIndicator) branchIndicator.textContent = branchNames[currentBranch] || 'Universal (Scientific)';
}

// ================= EXPRESSION COMPILER =================
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

    var processed = clean.replace(/(\d)\s*%\s*(?=\d)/g, '$1__MOD__');
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
    processed = processed.replace(/__MOD__/g, ' % ');

    processed = processed.replace(/√/g, 'sqrt');
    processed = processed.replace(/\^/g, '**');

    processed = processed.replace(/(\d+(?:\.\d+)?|\([^()]*\))!(?!=)/g, function(_, g) { return 'fact(' + g + ')'; });

    processed = wrapBareFunctionArgs(processed, ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']);

    processed = processed.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!');
    processed = processed.replace(/\bXOR\b/gi, ' XORFN ');
    processed = processed.replace(/\bIMPLIES\b/gi, ' IMPLIESFN ');
    processed = processed.replace(/\bEQUIV\b/gi, ' EQUIVFN ');
    processed = processed.replace(/\bTRUE\b/gi, 'true').replace(/\bFALSE\b/gi, 'false');

    processed = processed.replace(/==/g, '===').replace(/!==?=/g, '!==');
    processed = processed.replace(/!==(?!=)/g, '!==');

    processed = processed.replace(/\bsin\(/g, 'Math.sin(');
    processed = processed.replace(/\bcos\(/g, 'Math.cos(');
    processed = processed.replace(/\btan\(/g, 'Math.tan(');
    processed = processed.replace(/\blog\(/g, 'Math.log10(');
    processed = processed.replace(/\bln\(/g, 'Math.log(');
    processed = processed.replace(/\bsqrt\(/g, 'Math.sqrt(');
    processed = processed.replace(/\babs\(/g, 'Math.abs(');

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

// ================= STEP GENERATOR FOR ARITHMETIC & BITWISE =================
function generateSteps(expr) {
    var steps = [];
    steps.push('<strong>Input Expression:</strong> ' + expr);

    var clean = preprocessExpression(expr);
    if (clean !== expr) steps.push('Substitute standard notation: ' + clean);

    // Check for bitwise operations
    var bitwiseMatch = clean.match(/(-?\d+)\s*(&|\||\^|<<|>>)\s*(-?\d+)/);
    if (bitwiseMatch) {
        var op1 = parseInt(bitwiseMatch[1], 10);
        var op = bitwiseMatch[2];
        var op2 = parseInt(bitwiseMatch[3], 10);
        var bRes;
        if (op === '&') bRes = op1 & op2;
        else if (op === '|') bRes = op1 | op2;
        else if (op === '^') bRes = op1 ^ op2;
        else if (op === '<<') bRes = op1 << op2;
        else if (op === '>>') bRes = op1 >> op2;

        steps.push('<strong>Bitwise Operation Analysis (' + op1 + ' ' + op + ' ' + op2 + '):</strong>');
        var bin1 = (op1 >>> 0).toString(2).padStart(8, '0');
        var bin2 = (op2 >>> 0).toString(2).padStart(8, '0');
        var binRes = (bRes >>> 0).toString(2).padStart(8, '0');

        steps.push('Operand 1 (Binary): <code>' + bin1 + '</code> (' + op1 + ')');
        steps.push('Operand 2 (Binary): <code>' + bin2 + '</code> (' + op2 + ')');
        if (op === '&') steps.push('Bitwise AND: Each bit position is 1 if and only if both bits are 1.');
        else if (op === '|') steps.push('Bitwise OR: Each bit position is 1 if at least one bit is 1.');
        else if (op === '^') steps.push('Bitwise XOR: Each bit position is 1 if exactly one bit is 1.');
        else if (op === '<<') steps.push('Left Shift: Shift bits left by ' + op2 + ' positions (multiplies by 2<sup>' + op2 + '</sup>).');
        else if (op === '>>') steps.push('Right Shift: Shift bits right by ' + op2 + ' positions (integer division by 2<sup>' + op2 + '</sup>).');

        steps.push('Result (Binary): <code>' + binRes + '</code> = <strong>' + bRes + '</strong> (Decimal)');
    }

    var processed = compileToJS(expr);
    var working = processed;
    var guard = 0;
    var callRegex = /([A-Za-z_][A-Za-z0-9_.]*)?\(([^()]*)\)/;

    while (callRegex.test(working) && guard < 40) {
        guard++;
        var m = callRegex.exec(working);
        var fnName = m[1] || '';
        var inner = m[2];
        var exprToRun = fnName + '(' + (inner === '' ? '0' : inner) + ')';
        var value;
        try {
            value = runCompiled(exprToRun);
        } catch (e) {
            break;
        }
        var displayBefore = fnName ? (fnName + '(' + inner + ')') : ('(' + inner + ')');
        working = working.slice(0, m.index) + value + working.slice(m.index + m[0].length);
        steps.push('Evaluate sub-expression: ' + displayBefore + ' = ' + value + ' → ' + working);
    }

    try {
        var result = runCompiled(processed);
        steps.push('<strong>Final Evaluated Result:</strong> ' + result);
    } catch (e) {
        steps.push('Error during evaluation: ' + e.message);
    }

    return steps.join('\n');
}

// ================= EVALUATION ENGINE =================
function evaluateUniversal(expr) {
    try {
        if (!expr.trim()) return { result: '0', steps: 'Empty expression entered.' };
        var processed = compileToJS(expr);
        var result = runCompiled(processed);
        var steps = generateSteps(expr);
        return { result: result, steps: steps };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid mathematical expression: ' + e.message };
    }
}

function evaluateArithmetic(expr) { return evaluateUniversal(expr); }

// ================= LOGIC & BOOLEAN WITH TRUTH TABLES =================
function evaluateLogic(expr) {
    var steps = [];
    var raw = expr.trim();
    if (!raw) return { result: 'Error', steps: 'Empty logical expression.' };

    steps.push('<strong>Evaluating Propositional Logic:</strong> ' + raw);
    var clean = preprocessExpression(raw);
    var processed = compileToJS(raw);

    var result;
    try {
        result = runCompiled(processed);
        steps.push('Evaluates to Boolean: <strong>' + (result ? 'TRUE (1)' : 'FALSE (0)') + '</strong>');

        // Provide truth logic explanation
        if (/AND|&&|∧/.test(raw)) {
            steps.push('<strong>AND (Conjunction ∧):</strong> True only when both operands evaluate to TRUE.');
            steps.push('Truth values: T ∧ T = T, T ∧ F = F, F ∧ T = F, F ∧ F = F');
        }
        if (/OR|\|\||∨/.test(raw)) {
            steps.push('<strong>OR (Disjunction ∨):</strong> True when at least one operand evaluates to TRUE.');
            steps.push('Truth values: T ∨ T = T, T ∨ F = T, F ∨ T = T, F ∨ F = F');
        }
        if (/NOT|¬|!/.test(raw)) {
            steps.push('<strong>NOT (Negation ¬):</strong> Flips truth value (¬T = F, ¬F = T).');
        }
        if (/XOR|⊕/.test(raw)) {
            steps.push('<strong>XOR (Exclusive OR ⊕):</strong> True if and only if operands have different truth values (T ⊕ F = T, T ⊕ T = F).');
        }
        if (/IMPLIES|→/.test(raw)) {
            steps.push('<strong>IMPLIES (Conditional →):</strong> False only when hypothesis is TRUE and conclusion is FALSE (T → F = F; all others T).');
        }
        if (/EQUIV|↔/.test(raw)) {
            steps.push('<strong>EQUIV (Biconditional ↔):</strong> True when both propositions have identical truth values (T ↔ T = T, F ↔ F = T).');
        }

        return { result: result ? 'TRUE' : 'FALSE', steps: steps.join('\n') };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid Boolean expression: ' + e.message };
    }
}

// ================= SET THEORY WITH ELEMENT-WISE COMPUTATION =================
function parseSet(str) {
    str = str.replace(/∅/g, '').trim();
    var match = str.match(/\{([^}]*)\}/);
    if (!match) return null;
    var inner = match[1].trim();
    if (!inner) return [];
    return inner.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
}

function formatSet(arr) {
    if (!arr || arr.length === 0) return '∅';
    var unique = [];
    for (var i = 0; i < arr.length; i++) {
        if (unique.indexOf(arr[i]) === -1) unique.push(arr[i]);
    }
    return '{' + unique.join(', ') + '}';
}

function evaluateSetTheory(expr) {
    var raw = expr.trim();
    var steps = [];
    if (!raw) return { result: 'Error', steps: 'Empty set expression.' };

    steps.push('<strong>Set Theory Operation:</strong> ' + raw);

    // Look for explicit sets {1,2,3} OP {2,3,4}
    var setMatches = raw.match(/\{[^}]*\}|∅/g);
    if (setMatches && setMatches.length >= 2) {
        var setA = parseSet(setMatches[0]) || [];
        var setB = parseSet(setMatches[1]) || [];

        if (raw.indexOf('UNION') !== -1 || raw.indexOf('∪') !== -1) {
            var union = [].concat(setA);
            for (var i = 0; i < setB.length; i++) {
                if (union.indexOf(setB[i]) === -1) union.push(setB[i]);
            }
            steps.push('Set A = ' + formatSet(setA));
            steps.push('Set B = ' + formatSet(setB));
            steps.push('<strong>Union (A ∪ B):</strong> All elements from Set A combined with all elements from Set B, removing duplicate entries.');
            steps.push('A ∪ B = <strong>' + formatSet(union) + '</strong> (Cardinality |A ∪ B| = ' + union.length + ')');
            return { result: formatSet(union), steps: steps.join('\n') };
        }

        if (raw.indexOf('∩') !== -1 || raw.indexOf('INTERSECT') !== -1) {
            var intersect = [];
            for (var j = 0; j < setA.length; j++) {
                if (setB.indexOf(setA[j]) !== -1 && intersect.indexOf(setA[j]) === -1) {
                    intersect.push(setA[j]);
                }
            }
            steps.push('Set A = ' + formatSet(setA));
            steps.push('Set B = ' + formatSet(setB));
            steps.push('<strong>Intersection (A ∩ B):</strong> Elements that belong to BOTH Set A and Set B simultaneously.');
            steps.push('A ∩ B = <strong>' + formatSet(intersect) + '</strong> (Cardinality |A ∩ B| = ' + intersect.length + ')');
            return { result: formatSet(intersect), steps: steps.join('\n') };
        }

        if (raw.indexOf('\\') !== -1 || raw.indexOf('DIFF') !== -1) {
            var diff = [];
            for (var k = 0; k < setA.length; k++) {
                if (setB.indexOf(setA[k]) === -1 && diff.indexOf(setA[k]) === -1) {
                    diff.push(setA[k]);
                }
            }
            steps.push('Set A = ' + formatSet(setA));
            steps.push('Set B = ' + formatSet(setB));
            steps.push('<strong>Relative Complement / Difference (A \\ B):</strong> Elements in A that are NOT in B.');
            steps.push('A \\ B = <strong>' + formatSet(diff) + '</strong>');
            return { result: formatSet(diff), steps: steps.join('\n') };
        }

        if (raw.indexOf('SUBSET') !== -1 || raw.indexOf('⊆') !== -1) {
            var isSub = true;
            for (var m = 0; m < setA.length; m++) {
                if (setB.indexOf(setA[m]) === -1) { isSub = false; break; }
            }
            steps.push('Set A = ' + formatSet(setA));
            steps.push('Set B = ' + formatSet(setB));
            steps.push('<strong>Subset Test (A ⊆ B):</strong> True if every element of A is also found in B.');
            steps.push('A ⊆ B = <strong>' + (isSub ? 'TRUE' : 'FALSE') + '</strong>');
            return { result: isSub ? 'TRUE' : 'FALSE', steps: steps.join('\n') };
        }
    }

    // Powerset operation
    if (raw.indexOf('POWERSET') !== -1 || raw.indexOf('P(') !== -1) {
        var pMatch = raw.match(/\{[^}]*\}/);
        var targetSet = pMatch ? (parseSet(pMatch[0]) || []) : ['1', '2'];
        var n = targetSet.length;
        var totalSubsets = Math.pow(2, n);
        var subsets = [];
        for (var pi = 0; pi < totalSubsets; pi++) {
            var subset = [];
            for (var pj = 0; pj < n; pj++) {
                if ((pi & (1 << pj)) !== 0) subset.push(targetSet[pj]);
            }
            subsets.push(formatSet(subset));
        }
        steps.push('Set A = ' + formatSet(targetSet) + ' (n = ' + n + ' elements)');
        steps.push('<strong>Powerset Formula:</strong> |P(A)| = 2<sup>n</sup> = 2<sup>' + n + '</sup> = <strong>' + totalSubsets + ' subsets</strong>');
        steps.push('P(A) = {' + subsets.join(', ') + '}');
        return { result: '{' + subsets.join(', ') + '}', steps: steps.join('\n') };
    }

    // Symbolic descriptions fallback
    steps.push('<strong>Set Operator Definitions:</strong>');
    steps.push('• <strong>UNION (A ∪ B):</strong> Elements in A or B or both (e.g. {1,2} ∪ {2,3} = {1,2,3})');
    steps.push('• <strong>INTERSECTION (A ∩ B):</strong> Elements present in both (e.g. {1,2} ∩ {2,3} = {2})');
    steps.push('• <strong>DIFFERENCE (A \\ B):</strong> Elements in A but not in B (e.g. {1,2,3} \\ {2} = {1,3})');
    steps.push('• <strong>POWERSET (P(A)):</strong> Set of all 2<sup>n</sup> subsets including ∅');
    return { result: 'A ∪ B', steps: steps.join('\n') };
}

// ================= COMBINATORICS WITH PROOFS =================
function evaluateCombinatorics(expr) {
    var u = expr.toUpperCase();
    var m = u.match(/NCR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        var n = parseInt(m[1], 10), r = parseInt(m[2], 10);
        if (r > n) return { result: 'Error', steps: 'Error: r (' + r + ') cannot exceed n (' + n + ').' };
        var fn = fact(n), fr = fact(r), fnr = fact(n - r);
        var res = fn / (fr * fnr);
        var steps = [
            '<strong>Combination Formula:</strong> C(n, r) = <sup>n!</sup> / <sub>(r! × (n − r)!)</sub>',
            'Parameters: n = ' + n + ' (total items), r = ' + r + ' (items chosen without order)',
            'Step 1: ' + n + '! = ' + fn,
            'Step 2: ' + r + '! = ' + fr,
            'Step 3: (' + n + ' − ' + r + ')! = ' + (n - r) + '! = ' + fnr,
            'Step 4: C(' + n + ', ' + r + ') = ' + fn + ' / (' + fr + ' × ' + fnr + ')',
            'Step 5: = ' + fn + ' / ' + (fr * fnr) + ' = <strong>' + res + '</strong>',
            '<em>Interpretation: There are ' + res + ' distinct ways to choose ' + r + ' items from ' + n + ' items.</em>'
        ];
        return { result: res, steps: steps.join('\n') };
    }

    m = u.match(/NPR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        var n2 = parseInt(m[1], 10), r2 = parseInt(m[2], 10);
        if (r2 > n2) return { result: 'Error', steps: 'Error: r (' + r2 + ') cannot exceed n (' + n2 + ').' };
        var fn2 = fact(n2), fnr2 = fact(n2 - r2);
        var res2 = fn2 / fnr2;
        var steps2 = [
            '<strong>Permutation Formula:</strong> P(n, r) = <sup>n!</sup> / <sub>(n − r)!</sub>',
            'Parameters: n = ' + n2 + ' (total items), r = ' + r2 + ' (items arranged with order)',
            'Step 1: ' + n2 + '! = ' + fn2,
            'Step 2: (' + n2 + ' − ' + r2 + ')! = ' + (n2 - r2) + '! = ' + fnr2,
            'Step 3: P(' + n2 + ', ' + r2 + ') = ' + fn2 + ' / ' + fnr2 + ' = <strong>' + res2 + '</strong>',
            '<em>Interpretation: There are ' + res2 + ' distinct ordered arrangements of ' + r2 + ' items from ' + n2 + ' items.</em>'
        ];
        return { result: res2, steps: steps2.join('\n') };
    }

    m = u.match(/(\d+)!/);
    if (m) {
        var n3 = parseInt(m[1], 10);
        var res3 = fact(n3);
        var chain = [];
        for (var i = n3; i >= 1; i--) chain.push(i);
        var steps3 = [
            '<strong>Factorial Definition:</strong> ' + n3 + '! is the product of all positive integers ≤ ' + n3,
            n3 + '! = ' + chain.join(' × ') + ' = <strong>' + res3 + '</strong>'
        ];
        return { result: res3, steps: steps3.join('\n') };
    }

    return evaluateUniversal(expr);
}

// ================= NUMBER THEORY =================
function evaluateNumberTheory(expr) {
    var u = expr.toLowerCase();

    var m = u.match(/gcd\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var g = extendedGcdWithSteps(parseInt(m[1], 10), parseInt(m[2], 10));
        return { result: g.gcd, steps: g.steps.join('\n') };
    }

    m = u.match(/lcm\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var a2 = parseInt(m[1], 10), b2 = parseInt(m[2], 10);
        var gStep = extendedGcdWithSteps(a2, b2);
        var l = (a2 * b2) / gStep.gcd;
        var steps = gStep.steps.concat([
            '<strong>LCM Formula:</strong> lcm(a, b) = (|a × b|) / gcd(a, b)',
            'lcm(' + a2 + ', ' + b2 + ') = (' + a2 + ' × ' + b2 + ') / ' + gStep.gcd + ' = ' + (a2 * b2) + ' / ' + gStep.gcd + ' = <strong>' + l + '</strong>'
        ]);
        return { result: l, steps: steps.join('\n') };
    }

    m = u.match(/modpow\s*\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var base = parseInt(m[1], 10), exp = parseInt(m[2], 10), modVal = parseInt(m[3], 10);
        if (modVal === 0) return { result: 'Error', steps: 'Error: Modulo cannot be 0.' };
        var mpSteps = ['<strong>Modular Exponentiation (' + base + '<sup>' + exp + '</sup> mod ' + modVal + ') via Repeated Squaring:</strong>'];
        var curBase = base % modVal;
        var curExp = exp;
        var mpRes = 1;
        while (curExp > 0) {
            if (curExp % 2 === 1) {
                mpSteps.push('Exp odd: res = (' + mpRes + ' × ' + curBase + ') mod ' + modVal + ' = ' + ((mpRes * curBase) % modVal));
                mpRes = (mpRes * curBase) % modVal;
            }
            curBase = (curBase * curBase) % modVal;
            curExp = Math.floor(curExp / 2);
        }
        mpSteps.push('Final Result = <strong>' + mpRes + '</strong>');
        return { result: mpRes, steps: mpSteps.join('\n') };
    }

    m = u.match(/phi\s*\(?\s*(\d+)/);
    if (m) {
        var pn = parseInt(m[1], 10);
        var phiSteps = ['<strong>Euler\'s Totient Function φ(' + pn + '):</strong>'];
        phiSteps.push('φ(n) counts integers k in 1 ≤ k ≤ n such that gcd(k, n) = 1.');
        var count = 0;
        var coprimes = [];
        for (var k = 1; k <= pn; k++) {
            if (gcd(k, pn) === 1) {
                count++;
                if (coprimes.length < 15) coprimes.push(k);
            }
        }
        phiSteps.push('Coprimes with ' + pn + ': ' + coprimes.join(', ') + (count > 15 ? ' ...' : ''));
        phiSteps.push('φ(' + pn + ') = <strong>' + count + '</strong>');
        return { result: count, steps: phiSteps.join('\n') };
    }

    m = u.match(/mod\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var md = parseInt(m[1], 10), dv = parseInt(m[2], 10);
        if (dv === 0) return { result: 'Error', steps: 'Error: Division by zero in mod operation.' };
        var q = Math.floor(md / dv);
        var mm = md - q * dv;
        var steps4 = [
            '<strong>Modulo Definition (Dividend mod Divisor):</strong>',
            md + ' ÷ ' + dv + ' = ' + q + ' with remainder <strong>' + mm + '</strong>',
            'Formula: ' + md + ' = (' + q + ' × ' + dv + ') + ' + mm,
            'So ' + md + ' mod ' + dv + ' = <strong>' + mm + '</strong>'
        ];
        return { result: mm, steps: steps4.join('\n') };
    }

    m = u.match(/prime\?\s*\(?\s*(\d+)/);
    if (m) {
        var numP = parseInt(m[1], 10);
        var steps5 = ['<strong>Primality Test for ' + numP + ':</strong>'];
        if (numP < 2) {
            steps5.push(numP + ' is less than 2, therefore it is NOT prime.');
            return { result: 'FALSE', steps: steps5.join('\n') };
        }
        var isPrime = true;
        var limit = Math.floor(Math.sqrt(numP));
        steps5.push('Trial division threshold: √' + numP + ' ≈ ' + limit);
        for (var di = 2; di <= limit; di++) {
            if (numP % di === 0) {
                steps5.push('Divisible by ' + di + ' (' + numP + ' ÷ ' + di + ' = ' + (numP / di) + ').');
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            steps5.push('No integer factors found between 2 and ' + limit + '. ' + numP + ' is <strong>PRIME</strong>.');
        } else {
            steps5.push('Since a non-trivial factor was discovered, ' + numP + ' is <strong>COMPOSITE</strong>.');
        }
        return { result: isPrime ? 'TRUE' : 'FALSE', steps: steps5.join('\n') };
    }

    m = u.match(/factor\s*\(?\s*(\d+)/);
    if (m) {
        var numF = parseInt(m[1], 10);
        if (numF < 2) return { result: 'Error', steps: 'Number must be ≥ 2 for prime factorization.' };
        var factors = [];
        var steps6 = ['<strong>Prime Factorization of ' + numF + ':</strong>'];
        var d = 2, x = numF;
        while (d * d <= x) {
            while (x % d === 0) {
                steps6.push(x + ' ÷ ' + d + ' = ' + (x / d));
                factors.push(d);
                x /= d;
            }
            d++;
        }
        if (x > 1) {
            factors.push(x);
            steps6.push(x + ' is prime (final factor).');
        }

        // Count factor powers
        var counts = {};
        for (var fi = 0; fi < factors.length; fi++) {
            counts[factors[fi]] = (counts[factors[fi]] || 0) + 1;
        }
        var powerForm = Object.keys(counts).map(function(k) {
            return counts[k] > 1 ? (k + '<sup>' + counts[k] + '</sup>') : k;
        }).join(' × ');

        steps6.push('Prime factors: ' + factors.join(' × '));
        steps6.push('Canonical Exponential Form: <strong>' + powerForm + '</strong>');
        return { result: factors.join(' × '), steps: steps6.join('\n') };
    }

    return evaluateUniversal(expr);
}

// ================= CONVERSION =================
function evaluateConversion(expr) {
    var m = expr.match(/(DEC → BINARY|BIN → DECIMAL|DEC → HEX|HEX → DECIMAL|DEC → OCT|OCT → DECIMAL|BIN → HEX|HEX → BINARY)\s+(\S+)/i);
    if (!m) return { result: 'Error', steps: 'Format: DEC → BINARY 255 (tap a conversion button, then enter the value)' };
    var type = m[1].toUpperCase(), val = m[2];

    try {
        if (type === 'DEC → BINARY') {
            var r1 = toBaseWithSteps(parseInt(val, 10), 2);
            return { result: r1.result, steps: r1.steps.join('\n') };
        }
        if (type === 'BIN → DECIMAL') {
            var r2 = fromBaseWithSteps(val, 2);
            return { result: r2.result, steps: r2.steps.join('\n') };
        }
        if (type === 'DEC → HEX') {
            var r3 = toBaseWithSteps(parseInt(val, 10), 16);
            return { result: r3.result, steps: r3.steps.join('\n') };
        }
        if (type === 'HEX → DECIMAL') {
            var r4 = fromBaseWithSteps(val, 16);
            return { result: r4.result, steps: r4.steps.join('\n') };
        }
        if (type === 'DEC → OCT') {
            var r5 = toBaseWithSteps(parseInt(val, 10), 8);
            return { result: r5.result, steps: r5.steps.join('\n') };
        }
        if (type === 'OCT → DECIMAL') {
            var r6 = fromBaseWithSteps(val, 8);
            return { result: r6.result, steps: r6.steps.join('\n') };
        }
        if (type === 'BIN → HEX') {
            var toDecimal = fromBaseWithSteps(val, 2);
            var toHex = toBaseWithSteps(toDecimal.result, 16);
            var combined = ['<strong>Step 1: Convert Binary to Decimal:</strong>'].concat(toDecimal.steps)
                .concat(['<strong>Step 2: Convert Decimal to Hexadecimal:</strong>']).concat(toHex.steps);
            return { result: toHex.result, steps: combined.join('\n') };
        }
        if (type === 'HEX → BINARY') {
            var hexToDec = fromBaseWithSteps(val, 16);
            var decToBin = toBaseWithSteps(hexToDec.result, 2);
            var combinedHexBin = ['<strong>Step 1: Convert Hex to Decimal:</strong>'].concat(hexToDec.steps)
                .concat(['<strong>Step 2: Convert Decimal to Binary:</strong>']).concat(decToBin.steps);
            return { result: decToBin.result, steps: combinedHexBin.join('\n') };
        }
    } catch (e) { return { result: 'Error', steps: 'Invalid numeric input: ' + e.message }; }
    return { result: 'Error', steps: 'Unknown conversion request' };
}

// ================= MATRIX ALGEBRA (2x2) =================
function evaluateMatrix(expr) {
    var u = expr.toLowerCase();

    // det2x2(a, b, c, d)
    var m = u.match(/det2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var a = +m[1], b = +m[2], c = +m[3], d = +m[4];
        var ad = a * d, bc = b * c, det = ad - bc;
        var steps = [
            '<strong>2×2 Matrix Determinant:</strong>',
            'Matrix A = [ [' + a + ', ' + b + '], [' + c + ', ' + d + '] ]',
            'Formula: det(A) = (a × d) − (b × c)',
            'Step 1 (Main Diagonal): ' + a + ' × ' + d + ' = ' + ad,
            'Step 2 (Anti-Diagonal): ' + b + ' × ' + c + ' = ' + bc,
            'Step 3: det(A) = ' + ad + ' − ' + bc + ' = <strong>' + det + '</strong>',
            det === 0 ? '<em>Matrix is singular (non-invertible).</em>' : '<em>Matrix is non-singular (invertible).</em>'
        ];
        return { result: det, steps: steps.join('\n') };
    }

    // inv2x2(a, b, c, d)
    m = u.match(/inv2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var a2 = +m[1], b2 = +m[2], c2 = +m[3], d2 = +m[4];
        var det2 = a2 * d2 - b2 * c2;
        if (det2 === 0) return { result: 'Error', steps: 'Determinant is 0. Inverse does not exist.' };
        var invA = (d2 / det2).toFixed(3), invB = (-b2 / det2).toFixed(3);
        var invC = (-c2 / det2).toFixed(3), invD = (a2 / det2).toFixed(3);
        var stepsInv = [
            '<strong>2×2 Matrix Inverse Formula:</strong> A<sup>-1</sup> = (1 / det(A)) × [ [d, -b], [-c, a] ]',
            'det(A) = (' + a2 + '×' + d2 + ') − (' + b2 + '×' + c2 + ') = ' + det2,
            'Adjugate Matrix = [ [' + d2 + ', ' + (-b2) + '], [' + (-c2) + ', ' + a2 + '] ]',
            'A<sup>-1</sup> = [ [' + invA + ', ' + invB + '], [' + invC + ', ' + invD + '] ]'
        ];
        return { result: '[[' + invA + ', ' + invB + '], [' + invC + ', ' + invD + ']]', steps: stepsInv.join('\n') };
    }

    // add2x2
    m = u.match(/add2x2\s*\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (m) {
        var vals = m.slice(1, 9).map(Number);
        var r11 = vals[0] + vals[4], r12 = vals[1] + vals[5], r21 = vals[2] + vals[6], r22 = vals[3] + vals[7];
        var steps2 = [
            '<strong>2×2 Matrix Addition:</strong>',
            'Matrix A = [ [' + vals[0] + ', ' + vals[1] + '], [' + vals[2] + ', ' + vals[3] + '] ]',
            'Matrix B = [ [' + vals[4] + ', ' + vals[5] + '], [' + vals[6] + ', ' + vals[7] + '] ]',
            'Row 1, Col 1: ' + vals[0] + ' + ' + vals[4] + ' = ' + r11,
            'Row 1, Col 2: ' + vals[1] + ' + ' + vals[5] + ' = ' + r12,
            'Row 2, Col 1: ' + vals[2] + ' + ' + vals[6] + ' = ' + r21,
            'Row 2, Col 2: ' + vals[3] + ' + ' + vals[7] + ' = ' + r22,
            'Result = <strong>[ [' + r11 + ', ' + r12 + '], [' + r21 + ', ' + r22 + '] ]</strong>'
        ];
        return { result: '[[' + r11 + ', ' + r12 + '], [' + r21 + ', ' + r22 + ']]', steps: steps2.join('\n') };
    }

    // mul2x2
    m = u.match(/mul2x2\s*\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (m) {
        var v = m.slice(1, 9).map(Number);
        var r1c1 = v[0] * v[4] + v[1] * v[6];
        var r1c2 = v[0] * v[5] + v[1] * v[7];
        var r2c1 = v[2] * v[4] + v[3] * v[6];
        var r2c2 = v[2] * v[5] + v[3] * v[7];
        var steps3 = [
            '<strong>2×2 Matrix Multiplication (Row · Column):</strong>',
            'Matrix A = [ [' + v[0] + ', ' + v[1] + '], [' + v[2] + ', ' + v[3] + '] ]',
            'Matrix B = [ [' + v[4] + ', ' + v[5] + '], [' + v[6] + ', ' + v[7] + '] ]',
            'Cell (1,1) = (' + v[0] + ' × ' + v[4] + ') + (' + v[1] + ' × ' + v[6] + ') = ' + r1c1,
            'Cell (1,2) = (' + v[0] + ' × ' + v[5] + ') + (' + v[1] + ' × ' + v[7] + ') = ' + r1c2,
            'Cell (2,1) = (' + v[2] + ' × ' + v[4] + ') + (' + v[3] + ' × ' + v[6] + ') = ' + r2c1,
            'Cell (2,2) = (' + v[2] + ' × ' + v[5] + ') + (' + v[3] + ' × ' + v[7] + ') = ' + r2c2,
            'Result = <strong>[ [' + r1c1 + ', ' + r1c2 + '], [' + r2c1 + ', ' + r2c2 + '] ]</strong>'
        ];
        return { result: '[[' + r1c1 + ', ' + r1c2 + '], [' + r2c1 + ', ' + r2c2 + ']]', steps: steps3.join('\n') };
    }

    return { result: 'Error', steps: 'Supported Matrix operations: det2x2(a,b,c,d), inv2x2(a,b,c,d), add2x2(a,b,c,d,e,f,g,h), mul2x2(a,b,c,d,e,f,g,h)' };
}

// ================= COMPLEX NUMBERS =================
function evaluateComplex(expr) {
    var parseComplex = function(str) {
        str = str.replace(/\s/g, '');
        var mm = str.match(/^(-?\d+(?:\.\d+)?)?([+-]\d+(?:\.\d+)?)?i$/);
        if (mm) return { re: mm[1] ? parseFloat(mm[1]) : 0, im: mm[2] ? parseFloat(mm[2]) : 1 };
        var num = parseFloat(str);
        if (!isNaN(num)) return { re: num, im: 0 };
        return null;
    };

    var lower = expr.toLowerCase();
    var fn = lower.match(/^(re|im|conj|abs|arg|polar)\((.+)\)$/);
    if (fn) {
        var c = parseComplex(fn[2]);
        if (!c) return { result: 'Error', steps: 'Could not parse complex number format (e.g. 3+4i, 5-2i).' };
        var label = '<strong>Complex Number z:</strong> ' + c.re + (c.im >= 0 ? ' + ' : ' − ') + Math.abs(c.im) + 'i  (Real part a = ' + c.re + ', Imaginary part b = ' + c.im + ')';

        if (fn[1] === 're') return { result: c.re, steps: label + '\nRe(a + bi) = a\nRe(' + fn[2] + ') = <strong>' + c.re + '</strong>' };
        if (fn[1] === 'im') return { result: c.im, steps: label + '\nIm(a + bi) = b\nIm(' + fn[2] + ') = <strong>' + c.im + '</strong>' };
        if (fn[1] === 'conj') {
            var conj = c.re + (-c.im >= 0 ? '+' : '') + (-c.im) + 'i';
            return { result: conj, steps: label + '\n<strong>Complex Conjugate:</strong> Invert sign of imaginary component (a + bi → a − bi)\nz* = <strong>' + conj + '</strong>' };
        }
        if (fn[1] === 'abs') {
            var sq = c.re * c.re + c.im * c.im;
            var mag = Math.sqrt(sq);
            return { result: mag, steps: label + '\n<strong>Modulus |z|:</strong> |a + bi| = √(a² + b²)\n= √(' + c.re + '² + ' + c.im + '²)\n= √(' + (c.re * c.re) + ' + ' + (c.im * c.im) + ')\n= √' + sq + ' = <strong>' + mag.toFixed(4) + '</strong>' };
        }
        if (fn[1] === 'arg') {
            var ang = Math.atan2(c.im, c.re);
            var deg = (ang * 180 / Math.PI);
            return { result: ang.toFixed(4) + ' rad', steps: label + '\n<strong>Argument θ:</strong> arg(z) = atan2(b, a)\n= atan2(' + c.im + ', ' + c.re + ')\n= <strong>' + ang.toFixed(4) + ' radians (' + deg.toFixed(2) + '°)</strong>' };
        }
        if (fn[1] === 'polar') {
            var magP = Math.sqrt(c.re * c.re + c.im * c.im);
            var angP = Math.atan2(c.im, c.re);
            return { result: magP.toFixed(3) + '∠' + (angP * 180 / Math.PI).toFixed(1) + '°', steps: label + '\n<strong>Polar Form (r e<sup>iθ</sup>):</strong>\nr = |z| = ' + magP.toFixed(4) + '\nθ = ' + angP.toFixed(4) + ' rad\nPolar Representation: <strong>' + magP.toFixed(4) + ' · e<sup>' + angP.toFixed(4) + 'i</sup></strong>' };
        }
    }
    return evaluateUniversal(expr);
}

// ================= MAIN EVALUATE WITH FALLBACK =================
function evaluate() {
    var raw = exprInput.value.trim();
    if (!raw) {
        resultDisplay.textContent = '0';
        fallbackMessage.style.display = 'none';
        updateDesktopSidePanel('', '', '');
        return;
    }

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
                fallbackRes.steps = '<strong>Fallback Notice:</strong> Expression evaluated via Universal Engine.\n\n' + fallbackRes.steps;
                res = fallbackRes;
            }
        }
    }

    var resStr = res.result === undefined ? 'Error' : res.result.toString();
    resultDisplay.textContent = resStr;

    if (typeof res.result === 'number' && isFinite(res.result)) lastAnswer = res.result;

    if (usedFallback) {
        fallbackMessage.textContent = 'Expression evaluated using Universal Engine.';
        fallbackMessage.style.display = 'block';
    }

    addHistory(raw, resStr, res.steps, currentBranch);
    buzz(15);
    showStepsView(raw, resStr, res.steps || 'No detailed steps available for this expression.');
}

// ================= UI ACTIONS =================
function toggleDrawer(open) {
    var drawer = document.getElementById('drawer');
    var overlay = document.getElementById('overlay');
    if (drawer) drawer.classList.toggle('open', open);
    if (overlay) overlay.classList.toggle('active', open);
}

function clearCache() {
    if (confirm('Clear calculation history, saved preferences, and reset app?')) {
        localStorage.clear();
        historyEntries = [];
        saveHistory();
        initTheme();
        initFont();
        keyboardEnabled = false;
        localStorage.setItem('keyboardEnabled', 'false');
        applyKeyboardState();
        exprInput.value = '';
        resultDisplay.textContent = '0';
        fallbackMessage.style.display = 'none';
        updateDesktopSidePanel('', '', '');
        showToast('App reset to clean defaults.');
    }
}

function hardResetAndRefresh() {
    if (confirm('Reload application and refresh cache?')) {
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
    if (msgElem) msgElem.textContent = message || 'A new offline version is ready. Reload now?';
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
    if (pendingUpdateWorker) {
        pendingUpdateWorker.postMessage({ action: 'skipWaiting' });
        hideUpdateModal();
    } else {
        window.location.reload(true);
    }
}

// ================= CONTENT PAGES =================
function showHelpPage() {
    var helpHtml = '<div class="about-text">' +
        '<h3>HOW TO USE THIS CALCULATOR</h3>' +
        '<p><strong>Universal CS Calculator</strong> provides comprehensive, verified step-by-step evaluations across Computer Science disciplines with zero internet connection required.</p>' +
        '<h3>--- BASIC & SCIENTIFIC ARITHMETIC ---</h3>' +
        '<p><strong>Operations:</strong> +, −, ×, ÷, ^ (Power), % (Modulo), ! (Factorial), √ (Square Root)</p>' +
        '<p><strong>Functions:</strong> sin(x), cos(x), tan(x), abs(x), log(x), ln(x)</p>' +
        '<p><strong>Constants:</strong> π (3.14159...), e (2.71828...)</p>' +
        '<h3>--- BITWISE OPERATORS ---</h3>' +
        '<p><code>a &amp; b</code> (AND), <code>a | b</code> (OR), <code>a ^ b</code> (XOR), <code>~a</code> (NOT), <code>a &lt;&lt; b</code> (Left Shift), <code>a &gt;&gt; b</code> (Right Shift) with automatic 8-bit/32-bit column breakdown.</p>' +
        '<h3>--- NUMBER SYSTEM CONVERSIONS ---</h3>' +
        '<p><strong>Usage:</strong> Tap <code>DEC → BINARY</code> and enter <code>255</code> to view full repeated-division remainder tables and place-value polynomials.</p>' +
        '<h3>--- NUMBER THEORY ---</h3>' +
        '<p><code>gcd(120, 45)</code>, <code>lcm(12, 18)</code>, <code>prime?(104729)</code>, <code>factor(360)</code>, <code>phi(36)</code>, <code>modpow(7, 256, 13)</code></p>' +
        '<h3>--- COMBINATORICS ---</h3>' +
        '<p><code>nCr(10, 3)</code>, <code>nPr(8, 4)</code>, <code>6!</code></p>' +
        '<h3>--- PROPOSITIONAL LOGIC ---</h3>' +
        '<p><code>TRUE AND (FALSE OR TRUE)</code>, <code>TRUE IMPLIES FALSE</code>, <code>p EQUIV q</code></p>' +
        '<h3>--- SET THEORY ---</h3>' +
        '<p><code>{1,2,3} UNION {3,4,5}</code>, <code>{1,2,3} ∩ {2,3,4}</code>, <code>{1,2,3} \\ {2}</code>, <code>POWERSET({1,2,3})</code>, <code>SUBSET({1,2}, {1,2,3})</code></p>' +
        '<h3>--- MATRIX (2×2) ---</h3>' +
        '<p><code>det2x2(1,2,3,4)</code>, <code>inv2x2(1,2,3,4)</code>, <code>add2x2(1,2,3,4,5,6,7,8)</code>, <code>mul2x2(1,2,3,4,5,6,7,8)</code></p>' +
        '<h3>--- COMPLEX NUMBERS ---</h3>' +
        '<p><code>re(3+4i)</code>, <code>im(3+4i)</code>, <code>conj(3+4i)</code>, <code>abs(3+4i)</code>, <code>arg(3+4i)</code>, <code>polar(3+4i)</code></p>' +
        '</div>';
    showFullPage('HELP / DOCUMENTATION', helpHtml);
}

function showPrivacyPage() {
    var privacyHtml = '<div class="about-text">' +
        '<h2>PRIVACY POLICY</h2>' +
        '<p class="muted-small">Universal CS Calculator • Offline PWA</p>' +
        '<h3>1. Zero Data Collection</h3>' +
        '<p><strong>We do not collect, track, or transmit any personal data.</strong> All computations, calculation histories, and custom theme/font preferences remain strictly stored on your local device storage.</p>' +
        '<h3>2. Offline-First Operation</h3>' +
        '<p>The application is cached locally via Service Worker. Once installed, it performs all mathematical evaluations completely offline without sending network requests.</p>' +
        '<h3>3. Data Erasure</h3>' +
        '<p>You can erase all locally cached history and preferences at any time using the <strong>Clear App Data</strong> option in the menu.</p>' +
        '<h3>4. Developer Contact</h3>' +
        '<p>Developer: <strong>Hanz Dalmino</strong> (BSIT, Cebu Technological University)<br>Email: <a href="mailto:dalminohanz14@gmail.com" style="color:var(--accent);">dalminohanz14@gmail.com</a></p>' +
        '</div>';
    showFullPage('PRIVACY POLICY', privacyHtml);
}

function showAboutPage() {
    var aboutHtml = '<div class="about-text">' +
        '<h3>UNIVERSAL CS CALCULATOR</h3>' +
        '<p>Crafted for students, educators, and software engineers in <strong>Computer Science, IT, Computer Engineering, and Discrete Mathematics</strong>.</p>' +
        '<h3>Author</h3>' +
        '<p><strong>Hanz Dalmino</strong> — BSIT Student at Cebu Technological University - Main Campus.</p>' +
        '<h3>Key Capabilities</h3>' +
        '<ul>' +
        '<li>100% Offline-Capable Progressive Web App (PWA)</li>' +
        '<li>Comprehensive Step-by-Step Proofs and Working for every branch</li>' +
        '<li>Desktop Side-by-Side Mathematical Inspector</li>' +
        '<li>Pure Vector CSS & SVG Graphics with zero external icon CDNs</li>' +
        '<li>12 Handcrafted High-Contrast Aesthetic Themes</li>' +
        '</ul>' +
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
        { label: 'Inter Sans (Default)', value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" },
        { label: 'JetBrains Mono (Developer)', value: "'JetBrains Mono', 'Courier New', monospace" },
        { label: 'Times New Roman (Academic)', value: 'Times New Roman, serif' },
        { label: 'Arial (Clean)', value: 'Arial, sans-serif' },
        { label: 'Georgia (Editorial)', value: 'Georgia, serif' },
        { label: 'Verdana (Accessible)', value: 'Verdana, sans-serif' }
    ];
    var html = '<div class="font-selector-page">';
    for (var i = 0; i < fonts.length; i++) {
        html += '<div class="font-option" data-font="' + fonts[i].value + '" style="font-family:' + fonts[i].value + '">' + fonts[i].label + '</div>';
    }
    html += '</div>';
    showFullPage('TYPOGRAPHY & FONTS', html);

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
        showFullPage('CALCULATION HISTORY', '<div class="history-item-page">No calculations recorded yet.</div>');
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
    showFullPage('CALCULATION HISTORY', html);

    var items = document.querySelectorAll('.history-item-page[data-index]');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-index'), 10);
            var h = historyEntries[idx];
            exprInput.value = h.expr;
            switchBranch(h.branch);
            showCalculatorView();
            evaluate();
            exprInput.focus();
        });
    }
    var clearBtn = document.getElementById('clearHistoryFromPage');
    if (clearBtn) clearBtn.addEventListener('click', function() { clearHistory(); showHistoryPage(); });
}

function getThemeColor(t) {
    var c = {
        default: '#7c3aed', obsidian: '#a855f7', royalblue: '#2563eb', orange: '#ea580c',
        highcontrast: '#facc15', forest: '#16a34a', crimson: '#e11d48', slate: '#475569',
        purple: '#9333ea', midnight: '#4f46e5', sand: '#d97706', 'cyan-night': '#0891b2'
    };
    return c[t] || '#7c3aed';
}

// ================= KEYBOARD SUPPORT =================
function handlePhysicalKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); evaluate(); return; }
    if (e.key === 'Escape') {
        exprInput.value = '';
        resultDisplay.textContent = '0';
        if (fallbackMessage) fallbackMessage.style.display = 'none';
        updateDesktopSidePanel('', '', '');
        return;
    }
}

// ================= INITIALIZATION =================
function init() {
    loadHistory();
    initTheme();
    initFont();
    initKeyboardState();
    updateBranchIndicator();
    renderButtons();

    // Drawer branch buttons
    var branchBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < branchBtns.length; i++) {
        branchBtns[i].addEventListener('click', function() {
            var branch = this.getAttribute('data-branch');
            switchBranch(branch);
            toggleDrawer(false);
        });
    }

    // Desktop mode tabs
    var modeTabs = document.querySelectorAll('.mode-tab-btn');
    for (var k = 0; k < modeTabs.length; k++) {
        modeTabs[k].addEventListener('click', function() {
            var branch = this.getAttribute('data-branch');
            switchBranch(branch);
        });
    }

    // Drawer content links
    document.getElementById('drawerHelpBtn').onclick = function() { toggleDrawer(false); showHelpPage(); };
    document.getElementById('drawerPrivacyBtn').onclick = function() { toggleDrawer(false); showPrivacyPage(); };
    document.getElementById('drawerThemesBtn').onclick = function() { toggleDrawer(false); showThemesPage(); };
    document.getElementById('drawerFontBtn').onclick = function() { toggleDrawer(false); showFontPage(); };
    document.getElementById('drawerHistoryBtn').onclick = function() { toggleDrawer(false); showHistoryPage(); };
    document.getElementById('drawerAboutBtn').onclick = function() { toggleDrawer(false); showAboutPage(); };
    document.getElementById('drawerClearCacheBtn').onclick = function() { toggleDrawer(false); clearCache(); };
    document.getElementById('drawerExitBtn').onclick = function() { toggleDrawer(false); hardResetAndRefresh(); };

    // Action buttons
    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = function() {
        buzz();
        exprInput.value = '';
        resultDisplay.textContent = '0';
        if (fallbackMessage) fallbackMessage.style.display = 'none';
        exprInput.focus();
    };

    var inputClearBtn = document.getElementById('inputClearBtn');
    if (inputClearBtn) {
        inputClearBtn.onclick = function() {
            buzz();
            exprInput.value = '';
            resultDisplay.textContent = '0';
            exprInput.focus();
        };
    }

    document.getElementById('leftBtn').onclick = function() { buzz(); moveCaret(-1); };
    document.getElementById('rightBtn').onclick = function() { buzz(); moveCaret(1); };
    document.getElementById('backBtn').onclick = function() { buzz(); backspaceAtCaret(); };
    document.getElementById('ansToggleBtn').onclick = function() { buzz(); insertAtCaret('ANS'); showToast('Inserted last answer (' + lastAnswer + ')'); };

    // View controls
    document.getElementById('menuToggleBtn').onclick = function() { toggleDrawer(true); };
    document.getElementById('closeDrawerBtn').onclick = function() { toggleDrawer(false); };
    document.getElementById('overlay').onclick = function() { toggleDrawer(false); };
    document.getElementById('closeFullPageBtn').onclick = function() { showCalculatorView(); };
    document.getElementById('backToCalculatorBtn').onclick = function() { showCalculatorView(); };

    var copyDesktopBtn = document.getElementById('copyDesktopStepsBtn');
    if (copyDesktopBtn) copyDesktopBtn.onclick = copyStepsToClipboard;

    var copyStepsBtn = document.getElementById('copyStepsBtn');
    if (copyStepsBtn) copyStepsBtn.onclick = copyStepsToClipboard;

    document.getElementById('keyboardToggleBtn').onclick = function() {
        buzz();
        toggleKeyboard();
    };

    if (updateNotNowBtn) updateNotNowBtn.onclick = function() { hideUpdateModal(); };
    if (updateNowBtn) updateNowBtn.onclick = function() { doUpdateNow(); };

    initPwaWelcomeModal();

    window.addEventListener('keydown', handlePhysicalKeydown);

    setupServiceWorkerUpdates();

    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('./sw.js')
                .then(function(reg) {
                    console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
                })
                .catch(function(err) {
                    console.warn('[PWA] ServiceWorker registration failed:', err);
                });
        });
    }
}

init();
