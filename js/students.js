/**
 * إدارة الطلاب
 */

/**
 * إضافة طالب جديد
 */
async function addStudent(groupNumber) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    let groupData;
    try {
        groupData = JSON.parse(groupDataStr);
    } catch (e) {
        await showAlert('خطأ في قراءة بيانات المجموعة', 'خطأ', 'error');
        return;
    }
    
    if (!groupData.students) groupData.students = [];
    
    const studentName = await showPrompt('أدخل اسم الطالب:', '', 'إضافة طالب جديد', {
        placeholder: 'اسم الطالب',
        confirmText: 'إضافة',
        cancelText: 'إلغاء'
    });
    
    if (studentName === null) return;
    
    const datesCount = groupData.dates ? groupData.dates.length : 8;
    const monthsCount = Math.ceil(datesCount / 8);
    
    const newStudent = {
        name: studentName.trim() || 'طالب جديد ' + (groupData.students.length + 1),
        attendance: Array(datesCount).fill([false, false]),
        payments: Array(monthsCount).fill(0),
        notes: '',
        monthlyPayment: 150
    };
    
    groupData.students.push(newStudent);
    saveData(`group${groupNumber}`, groupData);
    showToast(`تم إضافة "${newStudent.name}"`, 'success');
    loadGroup(groupNumber);
    
    setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.scrollTop = tableContainer.scrollHeight;
    }, 100);
}

/**
 * حذف طالب
 */
async function deleteStudent(groupNumber, studentIndex) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    let groupData;
    try {
        groupData = JSON.parse(groupDataStr);
    } catch (e) {
        await showAlert('خطأ في قراءة بيانات المجموعة', 'خطأ', 'error');
        return;
    }
    
    if (!groupData.students || studentIndex < 0 || studentIndex >= groupData.students.length) {
        console.error('Invalid student index');
        return;
    }
    
    const studentName = groupData.students[studentIndex].name || 'الطالب';
    
    const confirmed = await showConfirm(
        `هل أنت متأكد من حذف "${studentName}"؟`,
        'حذف طالب',
        { danger: true, confirmText: 'حذف', cancelText: 'إلغاء' }
    );
    
    if (!confirmed) return;
    
    groupData.students.splice(studentIndex, 1);
    saveData(`group${groupNumber}`, groupData);
    showToast(`تم حذف "${studentName}"`, 'success');
    loadGroup(groupNumber);
}

/**
 * تحديث اسم الطالب
 */
async function updateStudentName(groupNumber, studentIndex, newName) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        if (groupData.students && groupData.students[studentIndex]) {
            groupData.students[studentIndex].name = newName.trim();
            await saveData(`group${groupNumber}`, groupData);
        }
    } catch (e) {
        console.error("Name Update Error:", e);
    }
}

/**
 * تحديث ملاحظات الطالب
 */
async function updateStudentNotes(groupNumber, studentIndex, notes) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        if (groupData.students && groupData.students[studentIndex]) {
            groupData.students[studentIndex].notes = notes;
            await saveData(`group${groupNumber}`, groupData);
        }
    } catch (e) {
        console.error("Notes Update Error:", e);
    }
}

/**
 * تحديث قيمة السداد الشهري
 */
async function updateMonthlyPayment(groupNumber, studentIndex, value) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        const parsedValue = parseFloat(value);
        
        if (groupData.students && groupData.students[studentIndex]) {
            groupData.students[studentIndex].monthlyPayment = (isNaN(parsedValue) || parsedValue < 0) ? 150 : parsedValue;
            await saveData(`group${groupNumber}`, groupData);
            
            const input = document.querySelector(`#student-row-${groupNumber}-${studentIndex} input.monthly-payment-input`);
            if (input) input.value = groupData.students[studentIndex].monthlyPayment;
        }
    } catch (e) {
        console.error("Payment Value Update Error:", e);
    }
}

/**
 * تحديث الحضور
 */
async function updateAttendance(groupNumber, studentIndex, dateIndex, checkboxIndex, isChecked) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        
        if (!groupData.students || !groupData.students[studentIndex] || !groupData.students[studentIndex].attendance) {
            console.error("Attendance data error:", groupNumber, studentIndex, dateIndex);
            return;
        }
        
        if (!groupData.students[studentIndex].attendance[dateIndex]) {
            groupData.students[studentIndex].attendance[dateIndex] = [false, false];
        }
        
        const pair = [...groupData.students[studentIndex].attendance[dateIndex]];
        const checkbox2 = document.querySelector(`#student-row-${groupNumber}-${studentIndex} td:nth-of-type(${3 + dateIndex}) input[type="checkbox"]:nth-of-type(2)`);
        
        if (checkboxIndex === 0) {
            pair[0] = isChecked;
            if (!isChecked) {
                pair[1] = false;
            }
            if (checkbox2) {
                checkbox2.disabled = !isChecked;
                checkbox2.style.opacity = isChecked ? '1' : '0.5';
                if (!isChecked) {
                    checkbox2.checked = false;
                }
            }
        } else if (checkboxIndex === 1) {
            if (pair[0]) {
                pair[1] = isChecked;
            } else {
                if (checkbox2) checkbox2.checked = false;
                alert('لا يمكن تسجيل الحضور لحصة غير محتسبة.');
                return;
            }
        }
        
        groupData.students[studentIndex].attendance[dateIndex] = pair;
        await saveData(`group${groupNumber}`, groupData);
        
        const lessonCount = calculateCurrentLesson(groupData.students[studentIndex]);
        const lessonCounterEl = document.querySelector(`#student-row-${groupNumber}-${studentIndex} .lesson-counter`);
        const attendanceCounterEl = document.querySelector(`#student-row-${groupNumber}-${studentIndex} .attendance-counter`);
        
        if (lessonCounterEl) {
            lessonCounterEl.innerHTML = `<i class="fas fa-book"></i> ${lessonCount.current}/8`;
            lessonCounterEl.title = `الفترة ${lessonCount.period} - الحصص المحتسبة`;
            lessonCounterEl.classList.toggle('warning', lessonCount.current === 8);
        }
        
        if (attendanceCounterEl) {
            attendanceCounterEl.innerHTML = `<i class="fas fa-user-check"></i> ${lessonCount.attended}`;
            attendanceCounterEl.title = `الحضور في هذه الفترة`;
        }
    } catch (e) {
        console.error("Attendance Update Error:", e);
        alert("حدث خطأ أثناء تحديث الحضور.");
    }
}

/**
 * تحديث التاريخ
 */
async function updateDate(groupNumber, dateIndex, newDate) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        if (groupData.dates && dateIndex >= 0 && dateIndex < groupData.dates.length) {
            groupData.dates[dateIndex] = newDate;
            await saveData(`group${groupNumber}`, groupData);
            
            const input = document.querySelector(`#attendanceTable th:nth-of-type(${dateIndex + 1}) input[type="date"]`);
            if (input) {
                input.title = newDate || 'اختر التاريخ';
                input.setAttribute('data-date', newDate || '');
            }
        }
    } catch (e) {
        console.error("Date Update Error:", e);
    }
}

/**
 * تحديث الدفع
 */
async function updatePayment(groupNumber, studentIndex, monthIndex, value) {
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) return;
    
    try {
        const groupData = JSON.parse(groupDataStr);
        const parsedValue = parseFloat(value);
        
        if (groupData.students && groupData.students[studentIndex]) {
            if (!groupData.students[studentIndex].payments) {
                groupData.students[studentIndex].payments = [];
            }
            
            const expectedLength = Math.ceil(groupData.dates.length / 8);
            while (groupData.students[studentIndex].payments.length < expectedLength) {
                groupData.students[studentIndex].payments.push(0);
            }
            
            if (monthIndex >= 0 && monthIndex < groupData.students[studentIndex].payments.length) {
                groupData.students[studentIndex].payments[monthIndex] = (isNaN(parsedValue) || parsedValue < 0) ? 0 : parsedValue;
                await saveData(`group${groupNumber}`, groupData);
            }
        }
    } catch (e) {
        console.error("Payment Update Error:", e);
    }
}

/**
 * حساب الحصة الحالية (للشهر/الفترة الأخيرة فقط)
 */
function calculateCurrentLesson(student) {
    if (!student.attendance) return { current: 0, period: 1, attended: 0 };
    
    let totalCounted = 0;
    let totalAttended = 0;
    
    // حساب إجمالي الحصص المحتسبة والحضور
    student.attendance.forEach(att => {
        if (att && att[0]) {
            totalCounted++;
            if (att[1]) totalAttended++;
        }
    });
    
    // حساب رقم الفترة الحالية
    const period = Math.floor(totalCounted / 8) + 1;
    
    // حساب الحصص في الفترة الحالية فقط
    const currentPeriodStart = (period - 1) * 8;
    const currentPeriodLessons = totalCounted - currentPeriodStart;
    
    // حساب الحضور في الفترة الحالية فقط
    let currentPeriodAttended = 0;
    let countedSoFar = 0;
    
    student.attendance.forEach(att => {
        if (att && att[0]) {
            countedSoFar++;
            // إذا كانت الحصة في الفترة الحالية
            if (countedSoFar > currentPeriodStart) {
                if (att[1]) currentPeriodAttended++;
            }
        }
    });
    
    return { 
        current: currentPeriodLessons, 
        period: period,
        attended: currentPeriodAttended,
        totalCounted: totalCounted,
        totalAttended: totalAttended
    };
}

/**
 * تبديل عرض تفاصيل الطالب
 */
window.toggleStudentDetails = function(index, cardIdPrefix = 'student') {
    const details = document.getElementById(`student-details-${index}`);
    const card = document.getElementById(`${cardIdPrefix}-${index}`);
    if (!details || !card) return;
    
    const isShowing = details.classList.contains('show');
    
    document.querySelectorAll('.student-details.show').forEach(el => {
        if (el !== details) {
            el.classList.remove('show');
            el.closest('.student-card')?.classList.remove('active');
        }
    });
    
    details.classList.toggle('show', !isShowing);
    card.classList.toggle('active', !isShowing);
};

window.toggleSearchDetails = function(index, cardIdPrefix = 'student') {
    const details = document.getElementById(`search-details-${index}`);
    const card = document.getElementById(`${cardIdPrefix}-${index}`);
    if (!details || !card) return;
    
    const isShowing = details.classList.contains('show');
    
    document.querySelectorAll('.student-details.show').forEach(el => {
        if (el !== details) {
            el.classList.remove('show');
            el.closest('.student-card')?.classList.remove('active');
        }
    });
    
    details.classList.toggle('show', !isShowing);
    card.classList.toggle('active', !isShowing);
};

// تصدير الدوال
window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.updateStudentName = updateStudentName;
window.updateStudentNotes = updateStudentNotes;
window.updateMonthlyPayment = updateMonthlyPayment;
window.updateAttendance = updateAttendance;
window.updateDate = updateDate;
window.updatePayment = updatePayment;
window.calculateCurrentLesson = calculateCurrentLesson;
