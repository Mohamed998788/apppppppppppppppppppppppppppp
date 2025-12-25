/**
 * نظام النوافذ الحوارية المخصصة - Material Design Style
 */

/**
 * إنشاء عنصر النافذة الحوارية
 */
function createDialogElement() {
    // التحقق من وجود العنصر مسبقاً
    let overlay = document.getElementById('dialogOverlay');
    if (overlay) return overlay;
    
    overlay = document.createElement('div');
    overlay.id = 'dialogOverlay';
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
        <div class="dialog-container">
            <div class="dialog-header">
                <i class="dialog-icon fas fa-info-circle"></i>
                <h3 class="dialog-title">عنوان</h3>
            </div>
            <div class="dialog-body">
                <p class="dialog-message"></p>
                <div class="dialog-input-container" style="display: none;">
                    <input type="text" class="dialog-input" placeholder="">
                </div>
            </div>
            <div class="dialog-actions"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // إغلاق عند النقر خارج النافذة
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog(null);
        }
    });
    
    return overlay;
}

// متغير لتخزين callback النافذة الحالية
let currentDialogResolve = null;

/**
 * إغلاق النافذة الحوارية
 */
function closeDialog(result) {
    const overlay = document.getElementById('dialogOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 200);
    }
    
    if (currentDialogResolve) {
        currentDialogResolve(result);
        currentDialogResolve = null;
    }
}

/**
 * عرض نافذة تنبيه (بديل alert)
 */
function showAlert(message, title = 'تنبيه', icon = 'info-circle') {
    return new Promise((resolve) => {
        const overlay = createDialogElement();
        currentDialogResolve = resolve;
        
        const iconEl = overlay.querySelector('.dialog-icon');
        const titleEl = overlay.querySelector('.dialog-title');
        const messageEl = overlay.querySelector('.dialog-message');
        const inputContainer = overlay.querySelector('.dialog-input-container');
        const actionsEl = overlay.querySelector('.dialog-actions');
        
        // تحديد الأيقونة واللون
        let iconClass = 'fa-info-circle';
        let iconColor = 'var(--primary-color)';
        
        if (icon === 'success' || icon === 'check') {
            iconClass = 'fa-check-circle';
            iconColor = 'var(--success)';
        } else if (icon === 'error' || icon === 'danger') {
            iconClass = 'fa-exclamation-circle';
            iconColor = 'var(--error)';
        } else if (icon === 'warning') {
            iconClass = 'fa-exclamation-triangle';
            iconColor = 'var(--warning)';
        } else if (icon === 'question') {
            iconClass = 'fa-question-circle';
            iconColor = 'var(--primary-color)';
        }
        
        iconEl.className = `dialog-icon fas ${iconClass}`;
        iconEl.style.color = iconColor;
        titleEl.textContent = title;
        messageEl.textContent = message;
        inputContainer.style.display = 'none';
        
        actionsEl.innerHTML = `
            <button class="dialog-btn primary" onclick="closeDialog(true)">
                حسناً
            </button>
        `;
        
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);
    });
}

/**
 * عرض نافذة تأكيد (بديل confirm)
 */
function showConfirm(message, title = 'تأكيد', options = {}) {
    return new Promise((resolve) => {
        const overlay = createDialogElement();
        currentDialogResolve = resolve;
        
        const iconEl = overlay.querySelector('.dialog-icon');
        const titleEl = overlay.querySelector('.dialog-title');
        const messageEl = overlay.querySelector('.dialog-message');
        const inputContainer = overlay.querySelector('.dialog-input-container');
        const actionsEl = overlay.querySelector('.dialog-actions');
        
        const isDanger = options.danger || false;
        const confirmText = options.confirmText || 'تأكيد';
        const cancelText = options.cancelText || 'إلغاء';
        
        iconEl.className = `dialog-icon fas ${isDanger ? 'fa-exclamation-triangle' : 'fa-question-circle'}`;
        iconEl.style.color = isDanger ? 'var(--error)' : 'var(--warning)';
        titleEl.textContent = title;
        messageEl.textContent = message;
        inputContainer.style.display = 'none';
        
        actionsEl.innerHTML = `
            <button class="dialog-btn secondary" onclick="closeDialog(false)">
                ${cancelText}
            </button>
            <button class="dialog-btn ${isDanger ? 'danger' : 'primary'}" onclick="closeDialog(true)">
                ${confirmText}
            </button>
        `;
        
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);
    });
}

/**
 * عرض نافذة إدخال (بديل prompt)
 */
function showPrompt(message, defaultValue = '', title = 'إدخال', options = {}) {
    return new Promise((resolve) => {
        const overlay = createDialogElement();
        currentDialogResolve = resolve;
        
        const iconEl = overlay.querySelector('.dialog-icon');
        const titleEl = overlay.querySelector('.dialog-title');
        const messageEl = overlay.querySelector('.dialog-message');
        const inputContainer = overlay.querySelector('.dialog-input-container');
        const inputEl = overlay.querySelector('.dialog-input');
        const actionsEl = overlay.querySelector('.dialog-actions');
        
        iconEl.className = 'dialog-icon fas fa-edit';
        iconEl.style.color = 'var(--primary-color)';
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        inputContainer.style.display = 'block';
        inputEl.value = defaultValue;
        inputEl.placeholder = options.placeholder || '';
        inputEl.type = options.type || 'text';
        
        const confirmText = options.confirmText || 'حفظ';
        const cancelText = options.cancelText || 'إلغاء';
        
        actionsEl.innerHTML = `
            <button class="dialog-btn secondary" onclick="closeDialog(null)">
                ${cancelText}
            </button>
            <button class="dialog-btn primary" id="dialogConfirmBtn">
                ${confirmText}
            </button>
        `;
        
        // تأكيد بالزر
        document.getElementById('dialogConfirmBtn').onclick = () => {
            closeDialog(inputEl.value);
        };
        
        // تأكيد بـ Enter
        inputEl.onkeypress = (e) => {
            if (e.key === 'Enter') {
                closeDialog(inputEl.value);
            }
        };
        
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.classList.add('show');
            inputEl.focus();
            inputEl.select();
        }, 10);
    });
}

/**
 * عرض إشعار سريع (Snackbar/Toast)
 */
function showToast(message, type = 'info', duration = 3000) {
    // إزالة أي toast موجود
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-times-circle';
    else if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // إظهار
    setTimeout(() => toast.classList.add('show'), 10);
    
    // إخفاء
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * عرض نافذة تحميل
 */
function showLoading(message = 'جاري التحميل...') {
    let loader = document.getElementById('loadingOverlay');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('.loading-message').textContent = message;
    }
    
    loader.style.display = 'flex';
    setTimeout(() => loader.classList.add('show'), 10);
}

/**
 * إخفاء نافذة التحميل
 */
function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.remove('show');
        setTimeout(() => loader.style.display = 'none', 200);
    }
}

// تصدير الدوال
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.closeDialog = closeDialog;
