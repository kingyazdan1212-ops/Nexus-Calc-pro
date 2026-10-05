/* ============================================
   Nexus Calculator — Logic Engine
   ============================================ */

class NexusCalculator {
  constructor() {
    this.expression = '';
    this.result = '0';
    this.lastAnswer = null;
    this.isDegree = true;
    this.history = JSON.parse(localStorage.getItem('nexus-history') || '[]');
    this.mode = 'basic';

    this.exprEl = document.getElementById('expression');
    this.resultEl = document.getElementById('result');
    this.historyPanel = document.getElementById('historyPanel');
    this.historyList = document.getElementById('historyList');
    this.basicKeys = document.getElementById('basicKeys');
    this.sciKeys = document.getElementById('sciKeys');

    this.bindEvents();
    this.renderHistory();
    this.updateDisplay();
  }

  bindEvents() {
    // Mode switch
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
    });

    // All keys
    document.querySelectorAll('.key').forEach(key => {
      key.addEventListener('click', (e) => {
        key.classList.add('pressed');
        setTimeout(() => key.classList.remove('pressed'), 150);
        this.handleKey(key);
      });
    });

    // History
    document.getElementById('historyBtn').addEventListener('click', () => {
      this.historyPanel.classList.toggle('open');
    });

    document.getElementById('clearHistory').addEventListener('click', () => {
      this.history = [];
      localStorage.setItem('nexus-history', '[]');
      this.renderHistory();
    });

    // Theme
    document.getElementById('themeBtn').addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('nexus-theme', isDark ? 'light' : 'dark');
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Restore theme
    const savedTheme = localStorage.getItem('nexus-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  switchMode(mode) {
    this.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    this.basicKeys.classList.toggle('active', mode === 'basic');
    this.sciKeys.classList.toggle('active', mode === 'scientific');
  }

  handleKey(key) {
    const action = key.dataset.action;
    const value = key.dataset.value;

    if (action) {
      this.doAction(action);
    } else if (value) {
      this.append(value);
    }
  }

  handleKeyboard(e) {
    const key = e.key;

    if (key >= '0' && key <= '9') {
      this.append(key);
    } else if (key === '.') {
      this.append('.');
    } else if (key === '+') {
      this.append('+');
    } else if (key === '-') {
      this.append('−');
    } else if (key === '*') {
      this.append('×');
    } else if (key === '/') {
      e.preventDefault();
      this.append('÷');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      this.doAction('equals');
    } else if (key === 'Backspace') {
      this.expression = this.expression.slice(0, -1);
      this.updateDisplay();
    } else if (key === 'Escape') {
      this.doAction('clear');
    } else if (key === '%') {
      this.doAction('percent');
    } else if (key === '(' || key === ')') {
      this.doAction('paren');
    }
  }

  append(val) {
    // Replace operators for nicer display
    const map = { '×': '×', '÷': '÷', '−': '−', '+': '+' };
    const displayVal = map[val] || val;

    // Prevent double operators
    const ops = ['+', '−', '×', '÷'];
    const last = this.expression.slice(-1);

    if (ops.includes(displayVal) && ops.includes(last)) {
      this.expression = this.expression.slice(0, -1) + displayVal;
    } else if (displayVal === '.' && this.getLastNumber().includes('.')) {
      return; // prevent multiple dots
    } else {
      this.expression += displayVal;
    }

    this.updateDisplay();
  }

  getLastNumber() {
    const parts = this.expression.split(/[+\−×÷]/);
    return parts[parts.length - 1] || '';
  }

  doAction(action) {
    switch (action) {
      case 'clear':
        this.expression = '';
        this.result = '0';
        this.updateDisplay();
        break;

      case 'sign':
        if (this.expression) {
          // Toggle sign of last number
          const match = this.expression.match(/(-?\d+\.?\d*)$/);
          if (match) {
            const num = match[1];
            const toggled = num.startsWith('-') ? num.slice(1) : '-' + num;
            this.expression = this.expression.slice(0, -num.length) + toggled;
            this.updateDisplay();
          }
        }
        break;

      case 'percent':
        if (this.expression) {
          try {
            const val = this.safeEval(this.expression);
            this.expression = (val / 100).toString();
            this.updateDisplay();
          } catch {}
        }
        break;

      case 'paren':
        // Smart parentheses
        const open = (this.expression.match(/\(/g) || []).length;
        const close = (this.expression.match(/\)/g) || []).length;
        if (open > close) {
          this.expression += ')';
        } else {
          this.expression += '(';
        }
        this.updateDisplay();
        break;

      case 'equals':
        this.calculate();
        break;

      // Scientific
      case 'sqrt':
        this.applyUnary(Math.sqrt, '√');
        break;
      case 'cbrt':
        this.applyUnary(Math.cbrt, '∛');
        break;
      case 'sin':
        this.applyUnary(x => this.isDegree ? Math.sin(x * Math.PI / 180) : Math.sin(x), 'sin');
        break;
      case 'cos':
        this.applyUnary(x => this.isDegree ? Math.cos(x * Math.PI / 180) : Math.cos(x), 'cos');
        break;
      case 'tan':
        this.applyUnary(x => this.isDegree ? Math.tan(x * Math.PI / 180) : Math.tan(x), 'tan');
        break;
      case 'ln':
        this.applyUnary(Math.log, 'ln');
        break;
      case 'log':
        this.applyUnary(Math.log10, 'log');
        break;
      case 'inv':
        this.applyUnary(x => 1 / x, '1/');
        break;
      case 'exp':
        this.applyUnary(Math.exp, 'e^');
        break;
      case 'square':
        this.applyUnary(x => x * x, '²');
        break;
      case 'pow':
        this.append('^');
        break;
      case 'abs':
        this.applyUnary(Math.abs, '|');
        break;
      case 'deg':
        this.isDegree = !this.isDegree;
        const degBtn = document.querySelector('[data-action="deg"]');
        if (degBtn) degBtn.textContent = this.isDegree ? 'DEG' : 'RAD';
        break;
    }
  }

  applyUnary(fn, symbol) {
    try {
      let val;
      if (this.expression) {
        val = this.safeEval(this.expression);
      } else if (this.lastAnswer !== null) {
        val = this.lastAnswer;
      } else {
        return;
      }
      const res = fn(val);
      if (!isFinite(res)) throw new Error('Error');
      this.expression = this.formatNumber(res);
      this.result = this.formatNumber(res);
      this.lastAnswer = res;
      this.updateDisplay();
    } catch {
      this.showError();
    }
  }

  calculate() {
    if (!this.expression) return;

    try {
      const value = this.safeEval(this.expression);
      if (!isFinite(value)) throw new Error('Error');

      const formatted = this.formatNumber(value);
      this.addToHistory(this.expression, formatted);
      this.result = formatted;
      this.lastAnswer = value;
      this.expression = formatted;
      this.updateDisplay();
    } catch (err) {
      this.showError();
    }
  }

  safeEval(expr) {
    // Convert display symbols to JS
    let js = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![x])/g, `(${Math.E})`)
      .replace(/\^/g, '**');

    // Security: only allow safe characters
    if (!/^[0-9+\-*/().\s*^]+$/.test(js.replace(/Math\./g, ''))) {
      // Allow our constants already replaced
    }

    // Final safety check
    const allowed = /^[0-9+\-*/().\s*]+$/;
    const cleaned = js.replace(/\*\*/g, '*'); // temp for check
    // Better: use Function with limited scope
    return Function('"use strict"; return (' + js + ')')();
  }

  formatNumber(n) {
    if (Number.isInteger(n)) return n.toString();
    // Limit decimals
    const str = parseFloat(n.toPrecision(12)).toString();
    return str;
  }

  showError() {
    this.resultEl.textContent = 'Error';
    this.resultEl.classList.add('error');
    setTimeout(() => {
      this.resultEl.classList.remove('error');
      this.expression = '';
      this.result = '0';
      this.updateDisplay();
    }, 1200);
  }

  updateDisplay() {
    this.exprEl.textContent = this.expression || '';
    this.resultEl.textContent = this.result;
    this.resultEl.classList.remove('error');
  }

  addToHistory(expr, result) {
    this.history.unshift({ expr, result, time: Date.now() });
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('nexus-history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (this.history.length === 0) {
      this.historyList.innerHTML = '<p class="empty-history">هنوز محاسبه‌ای انجام نشده</p>';
      return;
    }

    this.historyList.innerHTML = this.history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <div class="h-expr">${item.expr}</div>
        <div class="h-result">${item.result}</div>
      </div>
    `).join('');

    this.historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = this.history[el.dataset.index];
        this.expression = item.result;
        this.result = item.result;
        this.updateDisplay();
        this.historyPanel.classList.remove('open');
      });
    });
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  new NexusCalculator();
});
