// STATE
var currentBranch = "universal";
var historyEntries = [];

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

// ========== SYMBOL PRE-PROCESSOR ==========
function preprocessExpression(expr) {
    var processed = expr;
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
    return s.replace(/[&<>]/g, function(m) { 
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; 
    });
}

// ========== VIEW SWITCHING ==========
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

// ========== HISTORY ==========
function loadHistory() {
    try {
        var stored = localStorage.getItem('csCalcHistory');
        historyEntries = stored ? JSON.parse(stored) : [];
    } catch (e) {
        historyEntries = [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(-50)));
    } catch (e) {
        console.warn('Could not save history');
    }
}

function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({ 
        expr: expr, 
        result: result, 
        steps: steps.substring(0, 300), 
        branch: branch, 
        date: new Date().toLocaleString() 
    });
    if (historyEntries.length > 50) historyEntries.pop();
    saveHistory();
}

function clearHistory() {
    historyEntries = [];
    saveHistory();
}

// ========== THEMES (12) ==========
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

// ========== FONTS ==========
function initFont() {
    var saved = localStorage.getItem('appFont');
    if (saved) document.body.style.fontFamily = saved;
    else document.body.style.fontFamily = 'Times New Roman';
}

function setFont(font) {
    document.body.style.fontFamily = font;
    localStorage.setItem('appFont', font);
}

// ========== HELPER FUNCTIONS ==========
function fact(n) {
    if (n < 0) return NaN;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
}

function gcd(a, b) {
    while (b) {
        var t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// ========== BUTTON DEFINITIONS PER BRANCH ==========
var universalButtons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '(', ')',
    '+', '^', '√', '!',
    '%', 'sin', 'cos', 'tan',
    'log', 'ln', 'abs', 'AND',
    'OR', 'NOT', 'XOR', '=',
    '≠', '≥', '≤', '>',
    '<', '÷', '×', '∧', '∨'
];

var arithmeticButtons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '(', ')',
    '+', '%', '^', '&',
    '|', '~', '<<', '>>',
    '√', '!', 'abs', '≥',
    '≤', '≠'
];

var combinatoricsButtons = [
    '7', '8', '9', 'nCr',
    '4', '5', '6', 'nPr',
    '1', '2', '3', '!',
    '0', '.', '(', ')',
    ',', 'C', 'P'
];

var logicButtons = [
    '7', '8', '9', 'AND',
    '4', '5', '6', 'OR',
    '1', '2', '3', 'NOT',
    '0', '.', '(', ')',
    'TRUE', 'FALSE', 'XOR', 'IMPLIES',
    'EQUIV', '+', '-', '*',
    '/', '^', '==', '!=',
    '>=', '<=', '>', '<'
];

var settheoryButtons = [
    '7', '8', '9', 'UNION',
    '4', '5', '6', '∩',
    '1', '2', '3', 'COMPLEMENT',
    '0', '.', '{', '}',
    ',', '\\', 'SUBSET', 'POWERSET'
];

var numbertheoryButtons = [
    '7', '8', '9', 'gcd',
    '4', '5', '6', 'lcm',
    '1', '2', '3', 'mod',
    '0', '.', '(', ')',
    'prime?', 'factor'
];

var conversionButtons = [
    'DEC → BINARY', 'BIN → DECIMAL',
    'DEC → HEX', 'HEX → DECIMAL',
    'DEC → OCT', 'OCT → DECIMAL',
    'BIN → HEX', 'CLEAR'
];

var matrixButtons = [
    'det2x2', 'add2x2',
    'mul2x2', '[a b; c d]'
];

var complexButtons = [
    '7', '8', '9', 're',
    '4', '5', '6', 'im',
    '1', '2', '3', 'conj',
    '0', '.', 'abs', 'arg',
    '+', '-', '*', '/'
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

function isNumberButton(label) {
    return /^[0-9.]$/.test(label);
}

function renderButtons() {
    var btns = getFullButtons(currentBranch);

    if (!dynamicDiv) return;
    dynamicDiv.innerHTML = '';

    for (var i = 0; i < btns.length; i++) {
        var label = btns[i];
        var btn = document.createElement('button');

        if (isNumberButton(label)) {
            btn.className = 'calc-btn number-btn';
        } else {
            btn.className = 'calc-btn operator-btn';
        }

        btn.textContent = label;
        btn.type = 'button';

        (function(btnLabel) {
            if (btnLabel === 'C' || btnLabel === 'CLEAR') {
                btn.onclick = function() {
                    exprInput.value = '';
                    resultDisplay.textContent = '0';
                    if (fallbackMessage) fallbackMessage.style.display = 'none';
                    exprInput.focus();
                };
            } else {
                btn.onclick = function() {
                    if (currentBranch === 'conversion' && btnLabel.indexOf('→') !== -1) {
                        exprInput.value = btnLabel + ' ';
                    } else {
                        exprInput.value += btnLabel;
                    }
                    exprInput.focus();
                };
            }
        })(label);

        dynamicDiv.appendChild(btn);
    }
}

function updateBranchIndicator() {
    if (branchIndicator) {
        branchIndicator.textContent = branchNames[currentBranch] || 'Universal (Scientific)';
    }
}

// ========== ROBUST MODULO / PERCENTAGE HANDLER ==========
function handleModuloAndPercentage(expr) {
    var protectedExpr = expr.replace(/(\d)\s*%\s*(?=\d)/g, '$1__MOD__');
    protectedExpr = protectedExpr.replace(/(\d+)\s*%/g, '($1/100)');
    protectedExpr = protectedExpr.replace(/__MOD__/g, ' % ');
    return protectedExpr;
}

// ========== AUTO-PARENTHESIZE FUNCTIONS ==========
function autoParenthesizeFunctions(expr) {
    var funcs = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs'];
    for (var i = 0; i < funcs.length; i++) {
        var fn = funcs[i];
        var regex = new RegExp('Math\\.' + fn + '(\\d+(\\.\\d+)?)', 'g');
        expr = expr.replace(regex, 'Math.' + fn + '($1)');
    }
    return expr;
}

// ========== STEP-BY-STEP BREAKDOWN GENERATOR ==========
function generateSteps(expr) {
    var steps = [];
    var clean = preprocessExpression(expr);

    steps.push('Original: ' + expr);
    steps.push('After symbol mapping: ' + clean);

    var processed = handleModuloAndPercentage(clean);
    steps.push('After modulo/percentage processing: ' + processed);

    processed = processed.replace(/√/g, 'sqrt').replace(/\^/g, '**');
    processed = processed.replace(/(\d+)!/g, function(_, n) { return 'fact(' + n + ')'; });
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

    steps.push('Converted to JS: ' + processed);

    var parenRegex = /\(([^()]+)\)/g;
    var match;
    var subExprs = [];
    while ((match = parenRegex.exec(processed)) !== null) {
        subExprs.push(match[1]);
    }

    if (subExprs.length > 0) {
        steps.push('Found ' + subExprs.length + ' sub-expression(s) in parentheses:');
        for (var i = 0; i < subExprs.length; i++) {
            var sub = subExprs[i];
            try {
                var fn = new Function('factorial', 'return (' + sub + ')');
                var val = fn(fact);
                steps.push('  (' + sub + ') = ' + val);
            } catch(e) {
                steps.push('  (' + sub + ') = [sub-expression]');
            }
        }
    }

    try {
        var fn = new Function('factorial', 'return (' + processed + ')');
        var result = fn(fact);
        steps.push('Final result: ' + result);
    } catch(e) {
        steps.push('Error: ' + e.message);
    }

    return steps.join('\n');
}

// ========== EVALUATION ENGINE ==========
function evaluateUniversal(expr) {
    try {
        var clean = preprocessExpression(expr);
        if (!clean) return { result: '0', steps: 'Empty expression' };

        var processed = handleModuloAndPercentage(clean);
        processed = processed.replace(/√/g, 'sqrt').replace(/\^/g, '**');
        processed = processed.replace(/(\d+)!/g, function(_, n) { return 'fact(' + n + ')'; });
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

        var fn = new Function('factorial', 'return (' + processed + ')');
        var result = fn(fact);
        var steps = generateSteps(expr);
        return { result: result, steps: steps };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid expression: ' + e.message };
    }
}

function evaluateCombinatorics(expr) {
    var u = expr.toUpperCase();
    var m = u.match(/NCR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        var n = parseInt(m[1]), r = parseInt(m[2]);
        var res = fact(n) / (fact(r) * fact(n - r));
        return { result: res, steps: 'C(' + n + ',' + r + ') = ' + n + '!/(' + r + '!(' + (n-r) + ')!) = ' + res };
    }
    m = u.match(/NPR\s*\(?\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        var n = parseInt(m[1]), r = parseInt(m[2]);
        var res = fact(n) / fact(n - r);
        return { result: res, steps: 'P(' + n + ',' + r + ') = ' + n + '!/(' + (n-r) + ')! = ' + res };
    }
    m = u.match(/(\d+)!/);
    if (m) {
        var n = parseInt(m[1]);
        var res = fact(n);
        return { result: res, steps: n + '! = ' + res };
    }
    return { result: 'Error', steps: 'No combinatorics operation detected' };
}

function evaluateLogic(expr) {
    return evaluateUniversal(expr);
}

function evaluateSetTheory(expr) {
    var u = expr.toUpperCase();
    if (u.indexOf('UNION') !== -1) return { result: 'A ∪ B', steps: 'Union: elements in A or B' };
    if (u.indexOf('∩') !== -1) return { result: 'A ∩ B', steps: 'Intersection: elements in both' };
    if (u.indexOf('COMPLEMENT') !== -1) return { result: 'A\'', steps: 'Complement: elements not in A' };
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
        var a = parseInt(m[1]), b = parseInt(m[2]);
        var l = a * b / gcd(a, b);
        return { result: l, steps: 'LCM(' + a + ',' + b + ') = ' + l };
    }
    m = u.match(/mod\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        return { result: parseInt(m[1]) % parseInt(m[2]), steps: m[1] + ' mod ' + m[2] + ' = ' + (parseInt(m[1]) % parseInt(m[2])) };
    }
    m = u.match(/prime\?\s*(\d+)/);
    if (m) {
        var n = parseInt(m[1]);
        var isPrime = n > 1;
        for (var i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) { isPrime = false; break; }
        }
        return { result: isPrime, steps: n + ' is ' + (isPrime ? 'prime' : 'not prime') };
    }
    return { result: 'Error', steps: 'No number theory operation detected' };
}

function evaluateConversion(expr) {
    var m = expr.match(/(DEC → BINARY|BIN → DECIMAL|DEC → HEX|HEX → DECIMAL|DEC → OCT|OCT → DECIMAL|BIN → HEX)\s+(\S+)/i);
    if (!m) return { result: 'Error', steps: 'Format: DEC → BINARY 255' };
    var type = m[1].toUpperCase(), val = m[2];
    try {
        if (type === 'DEC → BINARY') return { result: parseInt(val).toString(2), steps: 'Convert ' + val + ' to binary = ' + parseInt(val).toString(2) };
        if (type === 'BIN → DECIMAL') return { result: parseInt(val, 2), steps: 'Binary ' + val + ' to decimal = ' + parseInt(val, 2) };
        if (type === 'DEC → HEX') return { result: parseInt(val).toString(16).toUpperCase(), steps: 'Convert ' + val + ' to hex = ' + parseInt(val).toString(16).toUpperCase() };
        if (type === 'HEX → DECIMAL') return { result: parseInt(val, 16), steps: 'Hex ' + val + ' to decimal = ' + parseInt(val, 16) };
        if (type === 'DEC → OCT') return { result: parseInt(val).toString(8), steps: 'Convert ' + val + ' to octal = ' + parseInt(val).toString(8) };
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
    var m = u.match(/det2x2\s*\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var a = parseInt(m[1]), b = parseInt(m[2]), c = parseInt(m[3]), d = parseInt(m[4]);
        var det = a * d - b * c;
        return { result: det, steps: 'det([' + a + ' ' + b + '; ' + c + ' ' + d + ']) = ' + a + '*' + d + ' - ' + b + '*' + c + ' = ' + det };
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
    var raw = exprInput.value.trim();
    if (!raw) {
        resultDisplay.textContent = '0';
        fallbackMessage.style.display = 'none';
        return;
    }

    fallbackMessage.style.display = 'none';

    var res;
    var usedFallback = false;

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

    if (res.result === 'Error' || (typeof res.result === 'string' && res.result.indexOf('Error') === 0)) {
        var fallbackRes = evaluateUniversal(raw);
        if (fallbackRes.result !== 'Error' && !(typeof fallbackRes.result === 'string' && fallbackRes.result.indexOf('Error') === 0)) {
            usedFallback = true;
            fallbackRes.steps = 'Expression entered does not match the branch, evaluating using universal branch.\n\n' + fallbackRes.steps;
            res = fallbackRes;
        }
    }

    var resStr = res.result.toString();
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

// NEW: Hard reset that clears all caches and reloads the app
function hardResetAndRefresh() {
    if (confirm('Reset session: This will clear all history, preferences, and reload the app. Continue?')) {
        // Clear localStorage
        localStorage.clear();
        // Clear any cached data from service worker caches
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (var i = 0; i < names.length; i++) {
                    caches.delete(names[i]);
                }
            });
        }
        // If service worker is installed, try to unregister? Not needed, just reload.
        // Reload the page with cache-busting
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

function hideUpdateModal() {
    if (updateModal) updateModal.style.display = 'none';
}

// Call this when a waiting service worker is found
function promptForUpdate(worker) {
    pendingUpdateWorker = worker;
    showUpdateModal('A new version of the app is ready. Update now?');
}

// Setup service worker update detection
function setupServiceWorkerUpdates() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function(registration) {
        // Check for updates every 30 minutes
        setInterval(function() {
            registration.update();
        }, 30 * 60 * 1000);

        // Listen for new service worker waiting
        if (registration.waiting) {
            promptForUpdate(registration.waiting);
        }
        registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    promptForUpdate(newWorker);
                }
            });
        });
    });

    // Detect controller change (already updated)
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
    });
}

function doUpdateNow() {
    if (pendingUpdateWorker) {
        pendingUpdateWorker.postMessage({ action: 'skipWaiting' });
        hideUpdateModal();
    } else {
        // Fallback: just reload
        window.location.reload(true);
    }
}

function showHelpPage() {
    var helpHtml = '<div class="about-text" style="font-size:0.8rem;">' +
        '<h3>HOW TO USE THIS CALCULATOR</h3>' +
        
        '<h3>--- BASIC ARITHMETIC ---</h3>' +
        '<p><strong>Addition:</strong> 5 + 3</p>' +
        '<p><strong>Subtraction:</strong> 10 - 4</p>' +
        '<p><strong>Multiplication:</strong> 6 * 7 (or use × button)</p>' +
        '<p><strong>Division:</strong> 15 / 3 (or use ÷ button)</p>' +
        '<p><strong>Exponent/Power:</strong> 2^3 or 5^2 (result: 8 and 25)</p>' +
        '<p><strong>Modulo:</strong> 10 % 3 or 10 % 3 (result: 1) — works with or without spaces</p>' +
        '<p><strong>Percentage:</strong> 200% (result: 2) — type a number followed by %</p>' +
        '<p><strong>Factorial:</strong> 5! (result: 120)</p>' +
        '<p><strong>Square Root:</strong> √16 or √(16) (both work now!)</p>' +
        '<p><strong>Nth Root:</strong> 27^(1/3) (cube root, result: 3)</p>' +
        '<p><strong>Absolute Value:</strong> abs(-5) or abs -5 (result: 5)</p>' +

        '<h3>--- SCIENTIFIC FUNCTIONS ---</h3>' +
        '<p><strong>Sine:</strong> sin30 or sin(30)</p>' +
        '<p><strong>Cosine:</strong> cos0 or cos(0)</p>' +
        '<p><strong>Tangent:</strong> tan45</p>' +
        '<p><strong>Log base 10:</strong> log100 or log(100)</p>' +
        '<p><strong>Natural Log (ln):</strong> ln2.718</p>' +
        '<p>You can type them with or without parentheses.</p>' +

        '<h3>--- RELATIONAL OPERATORS ---</h3>' +
        '<p><strong>Equal:</strong> 5 == 5 (result: true)</p>' +
        '<p><strong>Not Equal:</strong> 5 != 3 or 5 ≠ 3</p>' +
        '<p><strong>Greater Than:</strong> 8 > 3</p>' +
        '<p><strong>Less Than:</strong> 3 < 8</p>' +
        '<p><strong>Greater or Equal:</strong> 5 >= 5 or 5 ≥ 5</p>' +
        '<p><strong>Less or Equal:</strong> 4 <= 5 or 4 ≤ 5</p>' +

        '<h3>--- LOGICAL OPERATORS ---</h3>' +
        '<p><strong>AND:</strong> (5 > 3) AND (2 < 4) — or use && or ∧</p>' +
        '<p><strong>OR:</strong> (1 > 5) OR (3 == 3) — or use || or ∨</p>' +
        '<p><strong>NOT:</strong> NOT (5 > 3) — or use ! or ¬</p>' +
        '<p><strong>XOR:</strong> TRUE XOR FALSE</p>' +
        '<p><strong>IMPLIES:</strong> TRUE IMPLIES FALSE (result: false)</p>' +
        '<p><strong>EQUIV:</strong> TRUE EQUIV TRUE (result: true)</p>' +

        '<h3>--- COMBINATORICS ---</h3>' +
        '<p><strong>Combination (nCr):</strong> nCr(5,2) or nCr 5,2 (result: 10)</p>' +
        '<p><strong>Permutation (nPr):</strong> nPr(5,2) or nPr 5,2 (result: 20)</p>' +

        '<h3>--- NUMBER THEORY ---</h3>' +
        '<p><strong>GCD:</strong> gcd(12,8) or gcd 12,8 (result: 4)</p>' +
        '<p><strong>LCM:</strong> lcm(12,8) or lcm 12,8 (result: 24)</p>' +
        '<p><strong>Modulo (function):</strong> mod(10,3) or mod 10,3 (result: 1)</p>' +
        '<p><strong>Prime Check:</strong> prime?(7) (result: true)</p>' +

        '<h3>--- NUMBER SYSTEM CONVERSIONS ---</h3>' +
        '<p>Use the Conversion branch buttons. Format: <strong>DEC → BINARY 255</strong></p>' +
        '<p>Or type: DEC → BINARY 255, BIN → DECIMAL 1010, DEC → HEX 255, HEX → DECIMAL FF, DEC → OCT 64, OCT → DECIMAL 100, BIN → HEX 1111</p>' +

        '<h3>--- SET THEORY ---</h3>' +
        '<p><strong>Union:</strong> UNION</p>' +
        '<p><strong>Intersection:</strong> ∩</p>' +
        '<p><strong>Complement:</strong> COMPLEMENT</p>' +
        '<p><strong>Difference:</strong> \\</p>' +
        '<p><strong>Subset:</strong> SUBSET</p>' +
        '<p><strong>Powerset:</strong> POWERSET</p>' +

        '<h3>--- MATRIX ---</h3>' +
        '<p><strong>Determinant 2x2:</strong> det2x2(a,b,c,d) — for matrix [a b; c d]</p>' +
        '<p><strong>Example:</strong> det2x2(1,2,3,4) — det = 1*4 - 2*3 = -2</p>' +

        '<h3>--- COMPLEX NUMBERS ---</h3>' +
        '<p>This branch is a placeholder; use Universal for complex expressions.</p>' +

        '<h3>--- IMPORTANT TIPS ---</h3>' +
        '<p>Functions like √, sin, cos, etc. now work both with and without parentheses: √16, sin30, log100.</p>' +
        '<p>Modulo (%) works perfectly between numbers; at the end of a number it acts as percentage (e.g., 200% = 2).</p>' +
        '<p>If an expression fails in a specific branch, it automatically falls back to Universal mode with a warning message.</p>' +
        '</div>';
    showFullPage('HELP / HOW TO USE', helpHtml);
}

function showPrivacyPage() {
    var privacyHtml = '<div class="about-text" style="font-size:0.8rem;">' +
        '<h2>PRIVACY POLICY</h2>' +
        '<p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:20px;">Last updated: May 2026</p>' +
        '<h3>1. Introduction</h3>' +
        '<p>This privacy policy applies to the <strong>Universal CS Calculator</strong> application developed by Hanz Dalmino. Your privacy is important, and this policy explains how your information is handled when you use the app.</p>' +
        '<h3>2. Data Collection</h3>' +
        '<p><strong>We do not collect any personal data.</strong> The Universal CS Calculator operates entirely on your device. All calculations, history, and preferences (such as theme and font settings) are stored locally using your device\'s internal storage (localStorage) and are never transmitted to any server or third party.</p>' +
        '<h3>3. Information Stored Locally</h3>' +
        '<ul>' +
            '<li>Calculation history (stored only on your device)</li>' +
            '<li>Theme preference (your chosen color theme)</li>' +
            '<li>Font preference (your chosen font style)</li>' +
        '</ul>' +
        '<p>This information never leaves your device and can be cleared at any time using the "Clear Cache" button within the app or by clearing your browser data.</p>' +
        '<h3>4. Third-Party Services</h3>' +
        '<p>This application does not use any third-party analytics, advertising, or tracking services. No data is shared with any external parties.</p>' +
        '<h3>5. Internet Usage</h3>' +
        '<p>The app works completely offline after the first visit. An internet connection is only required for the initial installation or when updating the app.</p>' +
        '<h3>6. Children\'s Privacy</h3>' +
        '<p>This application does not collect any personal information from anyone, including children under the age of 13.</p>' +
        '<h3>7. Changes to This Policy</h3>' +
        '<p>Any changes to this privacy policy will be reflected on this page. Continued use of the app after changes constitutes acceptance of the updated policy.</p>' +
        '<h3>8. Contact</h3>' +
        '<p>If you have any questions about this privacy policy, you can contact the developer through the GitHub repository or email.</p>' +
        '<h3>9. Support</h3>' +
        '<p>For help, questions, or feedback about the Universal CS Calculator, please visit the app page or contact the developer:</p>' +
        '<p style="text-align:center; margin-top:10px;"><a href="https://hdalmino0011.github.io/Computer-Science-Calculator/" style="color:#7c3aed; font-weight:bold;">hdalmino0011.github.io/Computer-Science-Calculator</a></p>' +
        '<p style="text-align:center; margin-top:5px;">Email: <a href="mailto:dalminohanz14@gmail.com" style="color:#7c3aed;">dalminohanz14@gmail.com</a></p>' +
        '</div>';
    showFullPage('PRIVACY & POLICY', privacyHtml);
}

function showAboutPage() {
    var aboutHtml = '<div class="about-text">' +
        '<h3>Developed by Hanz Dalmino</h3>' +
        '<p>a Bachelor of Science in Information Technology student from Cebu Technological University - Main Campus</p>' +
        '<h3>Purpose</h3>' +
        '<p>This Universal CS Calculator is specifically designed for students and professionals in <strong>Computer Science, Information Technology, Computer Engineering, and related fields</strong>. It provides step-by-step evaluation for a wide range of mathematical concepts essential to these disciplines.</p>' +
        '<h3>Topics Covered</h3>' +
        '<ul>' +
            '<li>Arithmetic & Bitwise Operations</li>' +
            '<li>Relational and Logical Operators</li>' +
            '<li>Combinatorics (nCr, nPr, Factorials)</li>' +
            '<li>Boolean Algebra and Logic Gates</li>' +
            '<li>Set Theory (Union, Intersection, Complement, Subset)</li>' +
            '<li>Number Theory (GCD, LCM, Modulo, Primality)</li>' +
            '<li>Number System Conversions (Binary, Decimal, Hex, Octal)</li>' +
            '<li>Matrix Algebra (Determinants, basic operations)</li>' +
            '<li>Complex Numbers</li>' +
            '<li>Scientific Functions (sin, cos, tan, log, ln, sqrt, abs)</li>' +
        '</ul>' +
        '<h3>Why This Calculator?</h3>' +
        '<p>Unlike simple calculators, this tool shows every step of the evaluation, helping students understand the process behind the answer. It handles complex expressions mixing arithmetic, bitwise, relational, and logical operators in a single line.</p>' +
        '<p>It is also fully customizable with 12 themes and multiple fonts, and it works on desktop, tablet, and mobile devices.</p>' +
        '</div>';
    showFullPage('ABOUT', aboutHtml);
}

function showThemesPage() {
    var html = '<div class="theme-grid">';
    for (var i = 0; i < themes.length; i++) {
        html += '<div class="theme-card" data-theme="' + themes[i] + '" style="background:' + getThemeColor(themes[i]) + '; color:white;">' + themeNames[i] + '</div>';
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
    var fonts = ['Times New Roman', 'Arial', 'Courier New', 'Georgia', 'Verdana'];
    var html = '<div class="font-selector-page">';
    for (var i = 0; i < fonts.length; i++) {
        html += '<div class="font-option" data-font="' + fonts[i] + '">' + fonts[i] + '</div>';
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
        html += '<div class="history-item-page">' +
                    '<div class="history-expr" style="font-family:monospace; font-weight:bold;">' + escapeHtml(h.expr) + '</div>' +
                    '<div class="history-result" style="color:var(--accent);">= ' + escapeHtml(h.result) + '</div>' +
                    '<div class="history-meta" style="font-size:0.7rem; opacity:0.6;">' + h.branch + ' | ' + h.date + '</div>' +
                 '</div>';
    }
    html += '</div><button id="clearHistoryFromPage" class="action-btn" style="margin-top:15px; background:#ef4444; border:none; padding:10px; border-radius:30px; color:white; cursor:pointer; width:100%;">CLEAR ALL HISTORY</button>';
    showFullPage('HISTORY', html);
    
    var clearBtn = document.getElementById('clearHistoryFromPage');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearHistory();
            showHistoryPage();
        });
    }
}

function getThemeColor(t) {
    var c = { 
        default: '#7c3aed', 
        obsidian: '#a855f7', 
        royalblue: '#3b82f6', 
        orange: '#f97316', 
        highcontrast: '#ffff00', 
        forest: '#22c55e', 
        crimson: '#ef4444', 
        slate: '#64748b', 
        purple: '#c084fc', 
        midnight: '#60a5fa', 
        sand: '#fbbf24', 
        'cyan-night': '#06b6d4' 
    };
    return c[t] || '#7c3aed';
}

// ========== INITIALIZATION ==========
function init() {
    loadHistory();
    initTheme();
    initFont();
    updateBranchIndicator();
    renderButtons();

    var branchBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < branchBtns.length; i++) {
        branchBtns[i].addEventListener('click', function() {
            var allBtns = document.querySelectorAll('.branch-drawer-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            currentBranch = this.getAttribute('data-branch');
            updateBranchIndicator();
            renderButtons();
            if (fallbackMessage) fallbackMessage.style.display = 'none';
            toggleDrawer(false);
        });
    }

    document.getElementById('drawerHelpBtn').onclick = function() { toggleDrawer(false); showHelpPage(); };
    document.getElementById('drawerPrivacyBtn').onclick = function() { toggleDrawer(false); showPrivacyPage(); };
    document.getElementById('drawerThemesBtn').onclick = function() { toggleDrawer(false); showThemesPage(); };
    document.getElementById('drawerFontBtn').onclick = function() { toggleDrawer(false); showFontPage(); };
    document.getElementById('drawerHistoryBtn').onclick = function() { toggleDrawer(false); showHistoryPage(); };
    document.getElementById('drawerAboutBtn').onclick = function() { toggleDrawer(false); showAboutPage(); };
    document.getElementById('drawerClearCacheBtn').onclick = function() { toggleDrawer(false); clearCache(); };
    // Changed to use hardResetAndRefresh instead of resetSession
    document.getElementById('drawerExitBtn').onclick = function() { toggleDrawer(false); hardResetAndRefresh(); };

    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = function() { 
        exprInput.value = ''; 
        resultDisplay.textContent = '0'; 
        if (fallbackMessage) fallbackMessage.style.display = 'none'; 
    };
    document.getElementById('spaceBtn').onclick = function() { exprInput.value += ' '; };
    document.getElementById('backBtn').onclick = function() { exprInput.value = exprInput.value.slice(0, -1); };
    document.getElementById('menuToggleBtn').onclick = function() { toggleDrawer(true); };
    document.getElementById('closeDrawerBtn').onclick = function() { toggleDrawer(false); };
    document.getElementById('overlay').onclick = function() { toggleDrawer(false); };
    document.getElementById('closeFullPageBtn').onclick = function() { showCalculatorView(); };
    document.getElementById('backToCalculatorBtn').onclick = function() { showCalculatorView(); };

    // Update modal buttons
    if (updateNotNowBtn) updateNotNowBtn.onclick = function() { hideUpdateModal(); };
    if (updateNowBtn) updateNowBtn.onclick = function() { doUpdateNow(); };

    exprInput.addEventListener('keypress', function(e) { 
        if (e.key === 'Enter') evaluate(); 
    });

    var activeBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < activeBtns.length; i++) {
        if (activeBtns[i].getAttribute('data-branch') === currentBranch) {
            activeBtns[i].classList.add('active');
        }
    }

    // Setup service worker update detection after page loads
    setupServiceWorkerUpdates();
}

init();
