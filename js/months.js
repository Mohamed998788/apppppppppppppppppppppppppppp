/**
 * إدارة الأشهر/الفترات
 */

/**
 * إضافة شهر جديد
 */
async function addNewMonth(groupNumber) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        
        // إضافة 8 تواريخ جديدة
        groupData.dates = [...(groupData.dates || []), ...Array(8).fill('')];
        
        const newDatesCount = groupData.dates.length;
        const newMonthsCount = Math.ceil(newDatesCount / 8);
        
        if (!groupData.students) groupData.students = [];
        
        groupData.students.forEach(student => {
            // إضافة 8 سجلات حضور جديدة
            student.attendance = [...(student.attendance || []), ...Array(8).fill([false, false])];
            
            // التأكد من تطابق طول مصفوفة الحضور
            if (student.attendance.length !== newDatesCount) {
                const correctedAttendance = Array(newDatesCount).fill([false, false]);
                for (let i = 0; i < Math.min(student.attendance.length, newDatesCount); i++) {
                    correctedAttendance[i] = student.attendance[i];
                }
                student.attendance = correctedAttendance;
            }
            
            // إضافة سجل دفع جديد
            student.payments = student.payments || [];
            while (student.payments.length < newMonthsCount) {
                student.payments.push(0);
            }
        });
        
        saveData(`group${groupNumber}`, groupData);
        showToast(`تم إضافة الشهر ${newMonthsCount}`, 'success');
        loadGroup(groupNumber);
        
    } catch (e) {
        console.error("Add Month Error:", e);
        await showAlert('حدث خطأ أثناء إضافة الشهر', 'خطأ', 'error');
    }
}

/**
 * حذف شهر
 */
async function deleteMonth(groupNumber, monthIndex) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        const currentDatesCount = groupData.dates ? groupData.dates.length : 0;
        const currentMonthsCount = Math.ceil(currentDatesCount / 8);
        
        if (currentDatesCount <= 8) {
            await showAlert('لا يمكن حذف الشهر الوحيد', 'تنبيه', 'warning');
            return;
        }
        
        if (monthIndex < 0 || monthIndex >= currentMonthsCount) {
            console.error("Invalid month index:", monthIndex);
            return;
        }
        
        if (monthIndex !== currentMonthsCount - 1) {
            await showAlert('يمكن حذف الشهر الأخير فقط حالياً', 'تنبيه', 'warning');
            return;
        }
        
        const confirmed = await showConfirm(
            `هل أنت متأكد من حذف بيانات الشهر ${monthIndex + 1} بالكامل؟`,
            'حذف شهر',
            { danger: true, confirmText: 'حذف', cancelText: 'إلغاء' }
        );
        
        if (!confirmed) return;
        
        const startIndex = monthIndex * 8;
        const numToDelete = Math.min(8, currentDatesCount - startIndex);
        
        groupData.dates.splice(startIndex, numToDelete);
        
        if (groupData.students) {
            groupData.students.forEach(student => {
                if (student.attendance) {
                    student.attendance.splice(startIndex, numToDelete);
                }
                if (student.payments && monthIndex < student.payments.length) {
                    student.payments.splice(monthIndex, 1);
                }
            });
        }
        
        saveData(`group${groupNumber}`, groupData);
        showToast('تم حذف الشهر', 'success');
        loadGroup(groupNumber);
        
    } catch (err) {
        console.error('Delete Month Error:', err);
        await showAlert('حدث خطأ أثناء حذف الشهر', 'خطأ', 'error');
    }
}

// تصدير الدوال
window.addNewMonth = addNewMonth;
window.deleteMonth = deleteMonth;
