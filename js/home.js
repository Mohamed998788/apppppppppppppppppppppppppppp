/**
 * الصفحة الرئيسية - Android Style
 */

/**
 * الحصول على المجموعة الحالية
 */
function getCurrentGroupStudents() {
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (let i = 1; i <= 30; i++) {
        const groupData = JSON.parse(localStorage.getItem(`group${i}`));
        if (!groupData) continue;

        const day1 = parseInt(localStorage.getItem(`day1-${i}`));
        const day2 = parseInt(localStorage.getItem(`day2-${i}`));
        const time1 = localStorage.getItem(`time1-${i}`);
        const time2 = localStorage.getItem(`time2-${i}`);

        if (day1 === today || day2 === today) {
            const time = day1 === today ? time1 : time2;
            if (!time) continue;

            const [hours, minutes] = time.split(':').map(Number);
            const lessonTime = hours * 60 + minutes;

            if (Math.abs(currentTime - lessonTime) <= 45) {
                return {
                    groupNumber: i,
                    groupName: groupData.groupName || `المجموعة ${i}`,
                    students: groupData.students || [],
                    lessonTime: time
                };
            }
        }
    }
    return null;
}

/**
 * التحقق من حضور الطالب اليوم
 */
function isStudentAttendedToday(student) {
    if (!student.attendance || student.attendance.length === 0) return false;
    const lastAttendanceIdx = student.attendance.length - 1;
    if (lastAttendanceIdx >= 0) {
        return student.attendance[lastAttendanceIdx][0] && student.attendance[lastAttendanceIdx][1];
    }
    return false;
}

/**
 * معالجة الحضور السريع
 */
function handleQuickAttendance(groupNumber, studentIndex, isChecked) {
    const groupData = JSON.parse(localStorage.getItem(`group${groupNumber}`));
    if (!groupData || !groupData.students || !groupData.students[studentIndex]) return;

    const today = new Date().toISOString().split('T')[0];
    let dateIndex = groupData.dates.indexOf(today);

    if (dateIndex === -1) {
        dateIndex = groupData.dates.findIndex(date => !date);
        if (dateIndex === -1) {
            const oldLength = groupData.dates.length;
            addNewMonth(groupNumber);
            const updatedGroupData = JSON.parse(localStorage.getItem(`group${groupNumber}`));
            groupData.dates = updatedGroupData.dates;
            groupData.students = updatedGroupData.students;
            dateIndex = oldLength;
        }
        groupData.dates[dateIndex] = today;
    }

    if (!groupData.students[studentIndex].attendance) {
        groupData.students[studentIndex].attendance = Array(groupData.dates.length).fill([false, false]);
    }

    groupData.students[studentIndex].attendance[dateIndex] = [true, isChecked];
    saveData(`group${groupNumber}`, groupData);

    // تحديث العداد
    const lessonCount = calculateCurrentLesson(groupData.students[studentIndex]);
    const badgeEl = document.querySelector(`.attendance-list .attendance-item:nth-child(${studentIndex + 1}) .lesson-badge`);
    
    if (badgeEl) {
        badgeEl.textContent = `${lessonCount.current}/8`;
        badgeEl.style.transform = 'scale(1.2)';
        setTimeout(() => badgeEl.style.transform = 'scale(1)', 200);
    }
}

/**
 * عرض HTML الصفحة الرئيسية
 */
function renderHomePageHTML() {
    const stats = calculateHomePageStats();
    const currentGroupStudents = getCurrentGroupStudents();

    // بطاقة المجموعة الحالية
    const currentGroupHTML = currentGroupStudents ? `
        <div class="current-group-card">
            <h3><i class="fas fa-chalkboard-teacher"></i> ${currentGroupStudents.groupName}</h3>
            <div class="attendance-list">
                ${currentGroupStudents.students.map((student, idx) => {
                    const lessonCount = calculateCurrentLesson(student);
                    const isChecked = isStudentAttendedToday(student);
                    return `
                        <div class="attendance-item">
                            <label>
                                <input type="checkbox"
                                    ${isChecked ? 'checked' : ''}
                                    onchange="handleQuickAttendance(${currentGroupStudents.groupNumber}, ${idx}, this.checked)">
                                <span class="student-name">${student.name || 'طالب'}</span>
                            </label>
                            <span class="lesson-badge">${lessonCount.current}/8</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    ` : `
        <div class="current-group-card empty">
            <i class="fas fa-clock"></i>
            <p>لا توجد مجموعة حالية</p>
        </div>
    `;

    // بطاقة المتأخرين
    const arrearsHTML = stats.topUnpaidStudents.length > 0 ? `
        <div class="alert-card">
            <h3><i class="fas fa-exclamation-triangle"></i> طلاب متأخرون</h3>
            <div class="arrears-list">
                ${stats.topUnpaidStudents.map(student => `
                    <div class="arrears-item" onclick="loadGroup(${student.groupNumber})">
                        <div class="info">
                            <span class="name">${student.name}</span>
                            <span class="group">${student.groupName}</span>
                        </div>
                        <span class="amount">${student.unpaidAmount} ج</span>
                    </div>
                `).join('')}
            </div>
            <button class="btn-text" onclick="showStatistics()" style="width: 100%; margin-top: 12px;">
                عرض الكل <i class="fas fa-arrow-left"></i>
            </button>
        </div>
    ` : '';

    return `
        <!-- شريط البحث -->
        <div class="search-bar">
            <input type="text" id="searchInput" placeholder="ابحث عن طالب..." autocomplete="off">
            <button onclick="showSearchPage(document.getElementById('searchInput').value.trim())">
                <i class="fas fa-search"></i>
            </button>
        </div>

        <!-- المجموعة الحالية -->
        ${currentGroupHTML}

        <!-- الإحصائيات -->
        <div class="stats-row">
            <div class="stat-card" onclick="showGroups()">
                <div class="stat-icon primary"><i class="fas fa-users"></i></div>
                <span class="stat-label">المجموعات</span>
                <span class="stat-value">${stats.totalGroups}</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon success"><i class="fas fa-coins"></i></div>
                <span class="stat-label">المحصل</span>
                <span class="stat-value">${stats.totalCollected}<small> ج</small></span>
            </div>
            <div class="stat-card" onclick="showStatistics()">
                <div class="stat-icon error"><i class="fas fa-exclamation-circle"></i></div>
                <span class="stat-label">المتأخرات</span>
                <span class="stat-value">${stats.totalOutstanding}<small> ج</small></span>
            </div>
            <div class="stat-card">
                <div class="stat-icon warning"><i class="fas fa-user-graduate"></i></div>
                <span class="stat-label">الطلاب</span>
                <span class="stat-value">${stats.totalStudents}</span>
            </div>
        </div>

        <!-- المتأخرون -->
        ${arrearsHTML}
    `;
}

// تصدير الدوال
window.getCurrentGroupStudents = getCurrentGroupStudents;
window.isStudentAttendedToday = isStudentAttendedToday;
window.handleQuickAttendance = handleQuickAttendance;
window.renderHomePageHTML = renderHomePageHTML;
