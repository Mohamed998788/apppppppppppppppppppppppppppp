/**
 * إدارة المجموعات - Android Style
 */

/**
 * إضافة مجموعة جديدة
 */
async function addGroup() {
    let num = 1;
    while (localStorage.getItem(`group${num}`) !== null && num <= 30) num++;
    
    if (num > 30) {
        await showAlert('وصلت للحد الأقصى للمجموعات (30).', 'تنبيه', 'warning');
        return;
    }
    
    const name = await showPrompt('أدخل اسم المجموعة الجديدة:', `المجموعة ${num}`, 'مجموعة جديدة', {
        placeholder: 'اسم المجموعة',
        confirmText: 'إنشاء',
        cancelText: 'إلغاء'
    });
    
    if (name === null) return;
    
    const finalName = name.trim() || `المجموعة ${num}`;
    const data = { groupName: finalName, students: [], dates: Array(8).fill('') };
    
    saveData(`group${num}`, data);
    showToast(`تم إنشاء "${finalName}"`, 'success');
    loadGroup(num);
}

/**
 * حذف مجموعة
 */
async function deleteGroup(groupNumber) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    let groupName = `المجموعة ${groupNumber}`;
    try {
        groupName = JSON.parse(groupDataStr).groupName || groupName;
    } catch (e) {}
    
    const confirmed = await showConfirm(
        `هل أنت متأكد من حذف "${groupName}"؟\n\nسيتم حذف جميع بيانات الطلاب نهائياً!`,
        'حذف المجموعة',
        { danger: true, confirmText: 'حذف', cancelText: 'إلغاء' }
    );
    
    if (!confirmed) return;
    
    try {
        localStorage.removeItem(`group${groupNumber}`);
        showToast(`تم حذف "${groupName}"`, 'success');
        showGroups();
    } catch (err) {
        console.error('Delete Group Error:', err);
        await showAlert('حدث خطأ أثناء الحذف', 'خطأ', 'error');
    }
}

/**
 * تغيير اسم المجموعة
 */
async function changeGroupName(groupNumber) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    let currentName = `المجموعة ${groupNumber}`;
    let groupData;
    
    try {
        groupData = JSON.parse(groupDataStr);
        currentName = groupData.groupName || currentName;
    } catch (e) {
        await showAlert('خطأ في قراءة البيانات', 'خطأ', 'error');
        return;
    }
    
    const newName = await showPrompt('أدخل الاسم الجديد للمجموعة:', currentName, 'تعديل الاسم', {
        placeholder: 'اسم المجموعة',
        confirmText: 'حفظ',
        cancelText: 'إلغاء'
    });
    
    if (newName === null || newName.trim() === '') return;
    
    groupData.groupName = newName.trim();
    await saveData(`group${groupNumber}`, groupData);
    showToast('تم تحديث اسم المجموعة', 'success');
    loadGroup(groupNumber);
}

/**
 * حساب إحصائيات المجموعة
 */
function calculateGroupStats(groupData) {
    let stats = { collected: 0, expected: 0, remaining: 0, attendanceRate: 0 };
    
    if (!groupData || !groupData.students || groupData.students.length === 0) return stats;
    
    let totalCounted = 0, totalAttended = 0;
    
    groupData.students.forEach(student => {
        const monthlyPayment = student.monthlyPayment || 150;
        const payments = student.payments || [];
        stats.collected += payments.reduce((sum, p) => sum + (Number(p) || 0), 0);
        
        let studentCounted = 0;
        (student.attendance || []).forEach(att => {
            if (att && att[0]) {
                studentCounted++;
                totalCounted++;
                if (att[1]) totalAttended++;
            }
        });
        
        const completePeriods = Math.floor(studentCounted / 8);
        stats.expected += completePeriods * monthlyPayment;
    });
    
    stats.remaining = stats.expected - stats.collected;
    stats.attendanceRate = totalCounted > 0 ? Math.round((totalAttended / totalCounted) * 100) : 0;
    stats.collected = Number(stats.collected.toFixed(0));
    stats.expected = Number(stats.expected.toFixed(0));
    stats.remaining = Number(stats.remaining.toFixed(0));
    
    return stats;
}

/**
 * عرض قائمة المجموعات
 */
function showGroups() {
    let allGroups = [];
    
    for (let i = 1; i <= 30; i++) {
        const groupDataStr = localStorage.getItem(`group${i}`);
        if (groupDataStr) {
            try {
                const groupData = JSON.parse(groupDataStr);
                if (!groupData.students) groupData.students = [];
                const stats = calculateGroupStats(groupData);
                allGroups.push({ number: i, ...groupData, stats });
            } catch (e) {
                console.error(`Error parsing group ${i}:`, e);
            }
        }
    }
    
    const groupsHTML = allGroups.length > 0 ? `
        <div class="groups-list">
            ${allGroups.map(group => `
                <div class="group-card" onclick="loadGroup(${group.number})">
                    <div class="group-card-header">
                        <h3>${group.groupName || `المجموعة ${group.number}`}</h3>
                        <i class="fas fa-chevron-left arrow"></i>
                    </div>
                    <div class="group-card-stats">
                        <div class="group-stat">
                            <span class="label">الطلاب</span>
                            <span class="value">${group.students.length}</span>
                        </div>
                        <div class="group-stat">
                            <span class="label">المحصل</span>
                            <span class="value success">${group.stats.collected} ج</span>
                        </div>
                        <div class="group-stat">
                            <span class="label">المتأخرات</span>
                            <span class="value ${group.stats.remaining > 0 ? 'error' : 'success'}">${group.stats.remaining} ج</span>
                        </div>
                        <div class="group-stat">
                            <span class="label">الحضور</span>
                            <span class="value">${group.stats.attendanceRate}%</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <h3>لا توجد مجموعات</h3>
            <p>اضغط على + لإضافة مجموعة جديدة</p>
        </div>
    `;
    
    const contentHTML = `
        ${groupsHTML}
        <button class="fab" onclick="addGroup()">
            <i class="fas fa-plus"></i>
        </button>
    `;
    
    loadViewContent('المجموعات', contentHTML);
    updateActiveNavItem('groups');
}

/**
 * تبديل عرض تفاصيل المجموعة
 */
window.toggleGroupDetails = function(groupNumber) {
    const card = document.getElementById(`group-card-${groupNumber}`);
    if (card) card.classList.toggle('expanded');
};

/**
 * تحميل مجموعة بالاسم
 */
window.loadGroupByName = function(groupName) {
    for (let i = 1; i <= 30; i++) {
        const gds = localStorage.getItem(`group${i}`);
        if (gds) {
            try {
                const gd = JSON.parse(gds);
                if (gd && gd.groupName === groupName) {
                    loadGroup(i);
                    return;
                }
            } catch (e) {
                continue;
            }
        }
    }
    alert(`لم يتم العثور على "${groupName}"`);
};

// تصدير الدوال
window.addGroup = addGroup;
window.deleteGroup = deleteGroup;
window.changeGroupName = changeGroupName;
window.calculateGroupStats = calculateGroupStats;
window.showGroups = showGroups;
