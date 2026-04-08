// UI增强功能库 - 与shared.js集成
// 版本: 1.0.0
// 作者: Claude AI

// ==================== 动画效果系统 ====================

// 动画队列管理器
class AnimationQueue {
    constructor() {
        this.queue = [];
        this.isRunning = false;
    }

    add(animation) {
        this.queue.push(animation);
        if (!this.isRunning) {
            this.run();
        }
    }

    async run() {
        this.isRunning = true;
        while (this.queue.length > 0) {
            const animation = this.queue.shift();
            try {
                await animation();
            } catch (error) {
                console.error('Animation error:', error);
            }
        }
        this.isRunning = false;
    }
}

// 全局动画队列
const globalAnimationQueue = new AnimationQueue();

// 平滑滚动到元素
function smoothScrollTo(element, duration = 500) {
    return new Promise(resolve => {
        const start = window.pageYOffset;
        const target = element.getBoundingClientRect().top + start;
        const distance = target - start;
        const startTime = performance.now();

        function scroll(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutCubic(progress);
            window.scrollTo(0, start + distance * ease);

            if (progress < 1) {
                requestAnimationFrame(scroll);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(scroll);
    });
}

// 缓动函数
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 淡入动画
function fadeIn(element, duration = 300) {
    return new Promise(resolve => {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            setTimeout(resolve, duration);
        });
    });
}

// 淡出动画
function fadeOut(element, duration = 300) {
    return new Promise(resolve => {
        element.style.opacity = '1';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        requestAnimationFrame(() => {
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    });
}

// 滑入动画
function slideIn(element, from = 'bottom', duration = 300) {
    return new Promise(resolve => {
        const originalDisplay = element.style.display;
        element.style.display = 'block';

        const transform = {
            bottom: 'translateY(100%)',
            top: 'translateY(-100%)',
            left: 'translateX(-100%)',
            right: 'translateX(100%)'
        }[from] || 'translateY(100%)';

        element.style.transform = transform;
        element.style.transition = `transform ${duration}ms ease-out`;

        requestAnimationFrame(() => {
            element.style.transform = 'translate(0, 0)';
            setTimeout(() => {
                element.style.transform = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    });
}

// 滑出动画
function slideOut(element, to = 'bottom', duration = 300) {
    return new Promise(resolve => {
        const transform = {
            bottom: 'translateY(100%)',
            top: 'translateY(-100%)',
            left: 'translateX(-100%)',
            right: 'translateX(100%)'
        }[to] || 'translateY(100%)';

        element.style.transform = transform;
        element.style.transition = `transform ${duration}ms ease-in`;

        setTimeout(() => {
            element.style.display = 'none';
            element.style.transform = '';
            element.style.transition = '';
        }, duration);
    });
}

// ==================== UI组件系统 ====================

// Toast 提示组件
class Toast {
    constructor(options = {}) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getIcon(type)}</span>
                <span class="toast-message">${safeHtml(message)}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toast.style.cssText = `
            background: ${this.getBackground(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
            min-width: 300px;
            max-width: 500px;
        `;

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || 'ℹ';
    }

    getBackground(type) {
        const backgrounds = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return backgrounds[type] || '#3b82f6';
    }
}

// Loading 加载组件
class Loading {
    constructor(container = document.body) {
        this.container = container;
        this.overlay = null;
        this.spinner = null;
    }

    show(message = '加载中...') {
        this.hide();

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        this.spinner = document.createElement('div');
        this.spinner.className = 'loading-spinner';
        this.spinner.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-message">${safeHtml(message)}</div>
        `;
        this.spinner.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        `;

        this.overlay.appendChild(this.spinner);
        this.container.appendChild(this.overlay);
    }

    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// Modal 对话框组件
class Modal {
    constructor(options = {}) {
        this.container = document.createElement('div');
        this.container.className = 'modal-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        this.content = document.createElement('div');
        this.content.className = 'modal-content';
        this.content.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;

        this.container.appendChild(this.content);
        document.body.appendChild(this.container);

        this.options = {
            closeOnOutsideClick: true,
            ...options
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.options.closeOnOutsideClick) {
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
        }
    }

    show() {
        this.container.style.opacity = '1';
        this.content.style.transform = 'scale(1)';
    }

    close() {
        this.container.style.opacity = '0';
        this.content.style.transform = 'scale(0.9)';
        setTimeout(() => this.container.remove(), 300);
    }

    setHeader(title) {
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h2>${safeHtml(title)}</h2>
            <button class="modal-close" onclick="this.closest('.modal-container').remove()">×</button>
        `;
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        this.content.appendChild(header);
    }

    setBody(content) {
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = content;
        body.style.cssText = 'padding: 20px;';
        this.content.appendChild(body);
    }

    setFooter(content) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = content;
        footer.style.cssText = `
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;
        this.content.appendChild(footer);
    }
}

// Tab 选项卡组件
class Tabs {
    constructor(container) {
        this.container = container;
        this.tabs = [];
        this.panels = [];
        this.activeTab = null;
    }

    addTab(label, content) {
        const tab = document.createElement('button');
        tab.className = 'tab';
        tab.textContent = label;
        tab.style.cssText = `
            padding: 10px 20px;
            border: none;
            background: #f3f4f6;
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            transition: all 0.3s ease;
        `;

        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        panel.innerHTML = content;
        panel.style.cssText = `
            display: none;
            padding: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0 8px 8px 8px;
        `;

        this.tabs.push(tab);
        this.panels.push(panel);

        tab.addEventListener('click', () => this.switchTab(this.tabs.indexOf(tab)));

        this.container.appendChild(tab);
        this.container.parentElement.appendChild(panel);
    }

    switchTab(index) {
        this.tabs.forEach((tab, i) => {
            if (i === index) {
                tab.style.background = '#3b82f6';
                tab.style.color = 'white';
                tab.style.fontWeight = 'bold';
            } else {
                tab.style.background = '#f3f4f6';
                tab.style.color = '';
                tab.style.fontWeight = '';
            }
        });

        this.panels.forEach((panel, i) => {
            panel.style.display = i === index ? 'block' : 'none';
        });

        this.activeTab = index;
    }
}

// ==================== 表单增强 ====================

// 表单验证器
class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = new Map();
        this.rules = new Map();
    }

    addField(fieldName, rules) {
        this.rules.set(fieldName, rules);
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.addEventListener('blur', () => this.validateField(fieldName));
            field.addEventListener('input', () => {
                if (this.errors.has(fieldName)) {
                    this.validateField(fieldName);
                }
            });
        }
    }

    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const rules = this.rules.get(fieldName);
        const value = field.value.trim();

        this.errors.delete(fieldName);

        for (const rule of rules) {
            const error = this.checkRule(rule, value, field);
            if (error) {
                this.errors.set(fieldName, error);
                this.showError(field, error);
                return false;
            }
        }

        this.clearError(field);
        return true;
    }

    checkRule(rule, value, field) {
        if (rule.required && !value) {
            return rule.message || '此字段为必填项';
        }

        if (rule.minLength && value.length < rule.minLength) {
            return rule.message || `最少需要${rule.minLength}个字符`;
        }

        if (rule.maxLength && value.length > rule.maxLength) {
            return rule.message || `最多允许${rule.maxLength}个字符`;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
            return rule.message || '格式不正确';
        }

        if (rule.custom && !rule.custom(value, field)) {
            return rule.message || '验证失败';
        }

        return null;
    }

    showError(field, message) {
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            errorDiv.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 5px;';
            field.parentElement.appendChild(errorDiv);
        }

        field.style.borderColor = '#ef4444';
    }

    clearError(field) {
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        field.style.borderColor = '';
    }

    validate() {
        let isValid = true;

        for (const fieldName of this.rules.keys()) {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        }

        return isValid;
    }

    getErrors() {
        return Array.from(this.errors.values());
    }
}

// 自动保存表单
class AutoSave {
    constructor(form, onSave, interval = 5000) {
        this.form = form;
        this.onSave = onSave;
        this.interval = interval;
        this.timer = null;
        this.isSaving = false;

        this.form.addEventListener('input', () => this.scheduleSave());
        this.form.addEventListener('change', () => this.scheduleSave());
    }

    scheduleSave() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.save(), this.interval);
    }

    async save() {
        if (this.isSaving) return;

        this.isSaving = true;
        const data = new FormData(this.form);
        const dataObj = Object.fromEntries(data);

        try {
            await this.onSave(dataObj);
            console.log('表单已自动保存');
        } catch (error) {
            console.error('自动保存失败:', error);
        }

        this.isSaving = false;
    }
}

// ==================== 错误处理增强 ====================

// 错误日志管理器
class ErrorLogger {
    constructor(maxLogs = 100) {
        this.maxLogs = maxLogs;
        this.logs = [];
    }

    log(error, context = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: error.toString(),
            stack: error.stack,
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.error('Error logged:', logEntry);

        // 发送到错误追踪服务（可选）
        this.sendToErrorTrackingService(logEntry);
    }

    sendToErrorTrackingService(logEntry) {
        // 这里可以集成 Sentry、Bugsnag 等错误追踪服务
        // 或者发送到自己的后端服务
        fetch('/api/log-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logEntry)
        }).catch(err => console.error('Failed to send error log:', err));
    }

    getLogs() {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }
}

// 全局错误处理器
class GlobalErrorHandler {
    constructor() {
        this.errorLogger = new ErrorLogger();
        this.setupHandlers();
    }

    setupHandlers() {
        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new Error(event.reason), {
                type: 'unhandledrejection',
                promise: event.promise
            });
        });

        // 捕获全局错误
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                type: 'error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }

    handleError(error, context = {}) {
        this.errorLogger.log(error, context);

        // 显示用户友好的错误消息
        const toast = new Toast();
        toast.show('发生错误，请稍后重试', 'error', 5000);

        // 对于严重错误，可以显示更多信息
        if (this.isSevereError(error)) {
            console.error('严重错误:', error);
        }
    }

    isSevereError(error) {
        // 判断是否为严重错误
        return error instanceof TypeError ||
               error instanceof ReferenceError ||
               error.name === 'NetworkError';
    }
}

// ==================== 数据可视化 ====================

// 简单的图表组件
class SimpleChart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            width: 400,
            height: 300,
            padding: 40,
            ...options
        };

        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
    }

    drawBarChart(data) {
        const { width, height, padding } = this.options;
        const barWidth = (width - padding * 2) / data.length * 0.8;
        const barGap = (width - padding * 2) / data.length * 0.2;
        const maxValue = Math.max(...data.map(d => d.value));

        // 清空画布
        this.ctx.clearRect(0, 0, width, height);

        // 绘制坐标轴
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, height - padding);
        this.ctx.lineTo(width - padding, height - padding);
        this.ctx.stroke();

        // 绘制柱状图
        data.forEach((item, index) => {
            const x = padding + index * (barWidth + barGap) + barGap / 2;
            const barHeight = (item.value / maxValue) * (height - padding * 2);
            const y = height - padding - barHeight;

            // 绘制柱子
            this.ctx.fillStyle = item.color || '#3b82f6';
            this.ctx.fillRect(x, y, barWidth, barHeight);

            // 绘制标签
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.label, x + barWidth / 2, height - padding + 20);
            this.ctx.fillText(item.value, x + barWidth / 2, y - 5);
        });
    }

    drawLineChart(data) {
        const { width, height, padding } = this.options;
        const pointSpacing = (width - padding * 2) / (data.length - 1);
        const maxValue = Math.max(...data.map(d => d.value));

        // 清空画布
        this.ctx.clearRect(0, 0, width, height);

        // 绘制坐标轴
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, height - padding);
        this.ctx.lineTo(width - padding, height - padding);
        this.ctx.stroke();

        // 绘制折线
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        data.forEach((item, index) => {
            const x = padding + index * pointSpacing;
            const y = height - padding - (item.value / maxValue) * (height - padding * 2);

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        // 绘制数据点
        data.forEach((item, index) => {
            const x = padding + index * pointSpacing;
            const y = height - padding - (item.value / maxValue) * (height - padding * 2);

            this.ctx.fillStyle = '#3b82f6';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

// ==================== 性能优化 ====================

// 节流函数
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;

    return function(...args) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// 防抖函数
function debounce(func, delay) {
    let timeoutId;

    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// 懒加载图片
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ==================== 初始化 ====================

// 初始化所有UI增强功能
function initializeUIEnhancements() {
    // 初始化Toast
    window.toast = new Toast();

    // 初始化全局错误处理器
    const globalErrorHandler = new GlobalErrorHandler();

    // 初始化懒加载
    if ('IntersectionObserver' in window) {
        lazyLoadImages();
    }

    // 添加全局样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        .loading-overlay .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .lazy {
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .lazy.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    console.log('UI Enhancements initialized successfully');
}

// 当DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUIEnhancements);
} else {
    initializeUIEnhancements();
}

// 导出到全局
window.UIEnhancements = {
    AnimationQueue,
    globalAnimationQueue,
    smoothScrollTo,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    Toast,
    Loading,
    Modal,
    Tabs,
    FormValidator,
    AutoSave,
    ErrorLogger,
    GlobalErrorHandler,
    SimpleChart,
    throttle,
    debounce,
    lazyLoadImages
};