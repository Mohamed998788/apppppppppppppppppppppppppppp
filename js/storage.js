/**
 * إدارة التخزين المحلي
 */

// حالة الاتصال
let isOnline = navigator.onLine;

/**
 * تحديث حالة الاتصال
 */
function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    isOnline = navigator.onLine;
    if (!statusEl) return;
    
    localStorage.setItem('isOnline', isOnline.toString());
    
    // تحديث الحالة
    statusEl.classList.remove('online', 'offline');
    
    if (isOnline) {
        statusEl.classList.add('online');
        statusEl.innerHTML = '<span>متصل</span>';
        
        // إظهار لفترة قصيرة ثم إخفاء
        statusEl.classList.add('show');
        setTimeout(() => {
            statusEl.classList.remove('show');
        }, 9000);
    } else {
        statusEl.classList.add('offline');
        statusEl.innerHTML = '<span>غير متصل</span>';
        
        // يبقى ظاهراً طالما غير متصل
        statusEl.classList.add('show');
        
        // إظهار إشعار
        if (typeof showToast === 'function') {
            showToast('أنت غير متصل بالإنترنت', 'warning', 4000);
        }
    }
    
    if (!isOnline) syncPendingChanges();
}

/**
 * حفظ البيانات في التخزين المحلي
 */
async function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        if (!isOnline) {
            const pending = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
            if (!pending.includes(key)) {
                pending.push(key);
                localStorage.setItem('pendingChanges', JSON.stringify(pending));
            }
        }
    } catch (e) {
        console.error(`Save Error ${key}:`, e);
        if (e.name === 'QuotaExceededError') {
            alert('مساحة التخزين ممتلئة!');
        } else {
            alert(`خطأ حفظ ${key}`);
        }
    }
}

/**
 * مزامنة التغييرات المعلقة
 */
async function syncPendingChanges() {
    if (!isOnline) return;
    const pending = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
    if (pending.length > 0) {
        console.log('Syncing:', pending);
        localStorage.setItem('pendingChanges', '[]');
        console.log('Queue cleared.');
    }
}

/**
 * حفظ نسخة احتياطية
 */
async function backupLocalStorage() {
    try {
        const backupData = {};
        let found = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('group') || key === 'weeklySchedule' || key.startsWith('day') || key.startsWith('time'))) {
                backupData[key] = localStorage.getItem(key);
                found++;
            }
        }
        
        if (found === 0) {
            await showAlert('لا توجد بيانات للحفظ', 'تنبيه', 'warning');
            return false;
        }
        
        const backupString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `TeacherHelper_Backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`تم حفظ ${found} عنصر`, 'success');
        }, 100);
        
        return true;
    } catch (err) {
        console.error('Backup Error:', err);
        if (err.name === 'QuotaExceededError') {
            await showAlert('مساحة التخزين ممتلئة!', 'خطأ', 'error');
        } else {
            await showAlert('حدث خطأ أثناء حفظ النسخة', 'خطأ', 'error');
        }
        return false;
    }
}

/**
 * استعادة نسخة احتياطية
 */
async function restoreLocalStorage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.json')) {
        await showAlert('ملف غير صالح. يجب أن يكون بصيغة .json', 'خطأ', 'error');
        event.target.value = '';
        return;
    }
    
    const confirmed = await showConfirm(
        'سيتم استبدال البيانات الحالية ببيانات الملف.\n\nهل تريد المتابعة؟',
        'استعادة نسخة احتياطية',
        { danger: true, confirmText: 'استعادة', cancelText: 'إلغاء' }
    );
    
    if (!confirmed) {
        event.target.value = '';
        return;
    }
    
    showLoading('جاري استعادة البيانات...');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const backupJson = e.target.result;
            const backupData = JSON.parse(backupJson);
            
            if (typeof backupData !== 'object' || backupData === null) {
                throw new Error('ملف النسخة تالف');
            }
            
            let imported = 0;
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('group') || key === 'weeklySchedule' || key.startsWith('day') || key.startsWith('time'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(k => localStorage.removeItem(k));
            
            for (const key in backupData) {
                if (key.startsWith('group') || key === 'weeklySchedule' || key.startsWith('day') || key.startsWith('time')) {
                    if (typeof backupData[key] === 'string') {
                        try {
                            if (key.startsWith('group')) JSON.parse(backupData[key]);
                            localStorage.setItem(key, backupData[key]);
                            imported++;
                        } catch (pe) {
                            console.warn(`Skipping invalid key ${key}`);
                        }
                    }
                }
            }
            
            hideLoading();
            
            if (imported === 0) {
                await showAlert('لم يتم العثور على بيانات صالحة في الملف', 'تنبيه', 'warning');
            } else {
                await showAlert(`تم استعادة ${imported} عنصر بنجاح.\n\nسيتم إعادة تحميل التطبيق.`, 'تم', 'success');
                setTimeout(() => window.location.reload(), 500);
            }
        } catch (err) {
            hideLoading();
            console.error('Restore Error:', err);
            await showAlert(`خطأ في الاستعادة: ${err.message}`, 'خطأ', 'error');
        } finally {
            const restoreInput = document.getElementById('restoreInput');
            if (restoreInput) restoreInput.value = '';
        }
    };
    
    reader.onerror = async function() {
        hideLoading();
        await showAlert('حدث خطأ أثناء قراءة الملف', 'خطأ', 'error');
        const restoreInput = document.getElementById('restoreInput');
        if (restoreInput) restoreInput.value = '';
    };
    
    reader.readAsText(file);
}

/**
 * مسح جميع البيانات
 */
async function clearAllDataWithConfirmation() {
    const confirmed1 = await showConfirm(
        'هل أنت متأكد من حذف جميع البيانات؟\n\nسيتم حذف جميع المجموعات والطلاب وجدول المواعيد نهائياً!',
        'تحذير!',
        { danger: true, confirmText: 'متابعة', cancelText: 'إلغاء' }
    );
    
    if (!confirmed1) return;
    
    const confirmed2 = await showConfirm(
        'تأكيد أخير!\n\nلا يمكن التراجع عن هذا الإجراء.\nهل أنت متأكد 100%؟',
        'تأكيد الحذف النهائي',
        { danger: true, confirmText: 'حذف الكل', cancelText: 'إلغاء' }
    );
    
    if (!confirmed2) return;
    
    try {
        showLoading('جاري حذف البيانات...');
        console.warn("Clearing all data...");
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('group') || key === 'weeklySchedule' || key.startsWith('day') || key.startsWith('time'))) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(k => {
            localStorage.removeItem(k);
            console.log(`Removed: ${k}`);
        });
        
        hideLoading();
        await showAlert('تم حذف جميع البيانات بنجاح.\n\nسيتم إعادة تحميل الصفحة.', 'تم', 'success');
        setTimeout(() => window.location.reload(), 500);
    } catch (err) {
        hideLoading();
        console.error('Clear Error:', err);
        await showAlert('حدث خطأ أثناء مسح البيانات', 'خطأ', 'error');
    }
}

// تصدير الدوال للاستخدام العام
window.updateConnectionStatus = updateConnectionStatus;
window.saveData = saveData;
window.syncPendingChanges = syncPendingChanges;
window.backupLocalStorage = backupLocalStorage;
window.restoreLocalStorage = restoreLocalStorage;
window.clearAllDataWithConfirmation = clearAllDataWithConfirmation;
