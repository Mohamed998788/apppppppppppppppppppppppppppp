/**
 * عرض جدول المجموعة - Android Style
 */

/**
 * تحميل وعرض مجموعة
 */
function loadGroup(groupNumber) {
    let groupData;
    
    try {
        groupData = JSON.parse(localStorage.getItem(`group${groupNumber}`)) || {
            students: [],
            dates: Array(8).fill(''),
            groupName: `المجموعة ${groupNumber}`
        };
        
        if (!groupData.students) groupData.students = [];
        if (!groupData.dates || groupData.dates.length === 0) groupData.dates = Array(8).fill('');
        
        // تصحيح بيانات الطلاب
        groupData.students.forEach(s => {
            if (!s.attendance || s.attendance.length !== groupData.dates.length) {
                const newAttendance = Array(groupData.dates.length).fill([false, false]);
                if (s.attendance) {
                    for (let i = 0; i < Math.min(s.attendance.length, newAttendance.length); i++) {
                        newAttendance[i] = s.attendance[i];
                    }
                }
                s.attendance = newAttendance;
            }
            
            const expectedPayments = Math.ceil(groupData.dates.length / 8);
            if (!s.payments || s.payments.length !== expectedPayments) {
                const newPayments = Array(expectedPayments).fill(0);
                if (s.payments) {
                    for (let i = 0; i < Math.min(s.payments.length, newPayments.length); i++) {
                        newPayments[i] = s.payments[i];
                    }
                }
                s.payments = newPayments;
            }
        });
        
    } catch (e) {
        console.error(`Error loading group ${groupNumber}:`, e);
        alert('حدث خطأ في تحميل المجموعة');
        showGroups();
        return;
    }
    
    const numMonths = Math.ceil(groupData.dates.length / 8);
    
    const contentHTML = `
        <button class="back-button" onclick="showGroups()">
            <i class="fas fa-arrow-right"></i>
            <span>المجموعات</span>
        </button>

        <!-- أزرار الإجراءات -->
        <div class="action-buttons">
            <button onclick="addStudent(${groupNumber})">
                <i class="fas fa-user-plus"></i> طالب
            </button>
            <button onclick="addNewMonth(${groupNumber})">
                <i class="fas fa-calendar-plus"></i> شهر
            </button>
            <button onclick="exportToExcel(${groupNumber})">
                <i class="fas fa-file-excel"></i> تصدير
            </button>
            <button onclick="changeGroupName(${groupNumber})" class="btn-outlined">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteGroup(${groupNumber})" class="btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <input type="file" id="importFile" onchange="importFromExcel(${groupNumber})" accept=".xlsx" style="display: none;">

        <!-- الجدول -->
        <div class="table-container">
            <table id="attendanceTable">
                <thead>
                    <tr>
                        <th rowspan="2">الطالب</th>
                        <th rowspan="2">السداد</th>
                        ${Array.from({ length: numMonths }).map((_, mIdx) => `
                            <th colspan="8">
                                الشهر ${mIdx + 1}
                                ${groupData.dates.length > 8 ? `
                                    <span class="action-icon delete-month" onclick="deleteMonth(${groupNumber}, ${mIdx})" title="حذف">×</span>
                                ` : ''}
                            </th>
                            <th>الدفع</th>
                        `).join('')}
                        <th rowspan="2">ملاحظات</th>
                    </tr>
                    <tr>
                        ${groupData.dates.map((date, index) => `
                            <th>
                                ${(index % 8) + 1}
                                <br>
                                <input type="date" value="${date || ''}"
                                    onchange="updateDate(${groupNumber}, ${index}, this.value)"
                                    onclick="try{this.showPicker()}catch(e){}">
                            </th>
                            ${(index + 1) % 8 === 0 ? `<th>💰</th>` : ''}
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${groupData.students.length === 0 ? `
                        <tr class="empty-row">
                            <td colspan="${2 + (numMonths * 9) + 1}">
                                <i class="fas fa-user-slash"></i>
                                لا يوجد طلاب - اضغط "طالب" للإضافة
                            </td>
                        </tr>
                    ` : ''}
                    ${groupData.students.map((student, sIdx) => {
                        const lessonCount = calculateCurrentLesson(student);
                        return `
                            <tr id="student-row-${groupNumber}-${sIdx}">
                                <td>
                                    <div class="student-name-cell">
                                        <div class="lesson-info-badge">
                                            <span class="lesson-counter ${lessonCount.current === 8 ? 'warning' : ''}"
                                                  title="الفترة ${lessonCount.period} - الحصص المحتسبة">
                                                <i class="fas fa-book"></i> ${lessonCount.current}/8
                                            </span>
                                            <span class="attendance-counter" title="الحضور في هذه الفترة">
                                                <i class="fas fa-user-check"></i> ${lessonCount.attended}
                                            </span>
                                        </div>
                                        <input type="text" value="${student.name || ''}"
                                            onchange="updateStudentName(${groupNumber}, ${sIdx}, this.value)"
                                            placeholder="اسم الطالب">
                                        <button class="delete-student" onclick="deleteStudent(${groupNumber}, ${sIdx})">
                                            <i class="fas fa-trash"></i> حذف
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <input type="number" class="monthly-payment-input"
                                        value="${student.monthlyPayment || 150}"
                                        onchange="updateMonthlyPayment(${groupNumber}, ${sIdx}, this.value)"
                                        min="0">
                                </td>
                                ${student.attendance.map((att, i) => {
                                    const countedChecked = att && att[0] ? 'checked' : '';
                                    const attendedChecked = att && att[1] ? 'checked' : '';
                                    const attendedDisabled = !(att && att[0]);
                                    const paymentValue = student.payments?.[Math.floor(i/8)] ?? 0;
                                    return `
                                        <td>
                                            <input type="checkbox" title="محتسبة" ${countedChecked}
                                                onchange="updateAttendance(${groupNumber}, ${sIdx}, ${i}, 0, this.checked)">
                                            <input type="checkbox" title="حضر" ${attendedChecked}
                                                onchange="updateAttendance(${groupNumber}, ${sIdx}, ${i}, 1, this.checked)"
                                                ${attendedDisabled ? 'disabled style="opacity:0.3"' : ''}>
                                        </td>
                                        ${(i + 1) % 8 === 0 ? `
                                            <td>
                                                <input type="number" value="${paymentValue}"
                                                    onchange="updatePayment(${groupNumber}, ${sIdx}, ${Math.floor(i/8)}, this.value)"
                                                    min="0" style="width:60px">
                                            </td>
                                        ` : ''}
                                    `;
                                }).join('')}
                                <td>
                                    <input type="text" value="${student.notes || ''}"
                                        onchange="updateStudentNotes(${groupNumber}, ${sIdx}, this.value)"
                                        placeholder="ملاحظات">
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    loadViewContent(groupData.groupName || `المجموعة ${groupNumber}`, contentHTML);
    updateActiveNavItem('groups');
}

// تصدير الدالة
window.loadGroup = loadGroup;
