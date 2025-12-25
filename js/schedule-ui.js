/**
 * واجهة صفحة الجدول - Android Style
 */

/**
 * إنشاء حقول إدخال مواعيد المجموعات
 */
function createGroupScheduleInputs() {
    const container = document.getElementById('groupSchedules');
    if (!container) return;
    
    const groups = getAllGroups();
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>لا توجد مجموعات</h3>
                <p>أضف مجموعات من الصفحة الرئيسية أولاً</p>
            </div>
        `;
        return;
    }

    container.innerHTML = groups.map(group => {
        const savedDay1 = localStorage.getItem(`day1-${group.number}`) || "0";
        const savedDay2 = localStorage.getItem(`day2-${group.number}`) || "0";
        const savedTime1 = localStorage.getItem(`time1-${group.number}`) || "14:00";
        const savedTime2 = localStorage.getItem(`time2-${group.number}`) || "14:00";

        return `
            <div class="group-schedule-card">
                <h3>${group.name}</h3>
                <div class="schedule-row">
                    <div style="flex:1">
                        <label>اليوم الأول</label>
                        <select id="day1-${group.number}" onchange="autoSave(${group.number})">
                            <option value="0" ${savedDay1 === "0" ? "selected" : ""}>الأحد</option>
                            <option value="1" ${savedDay1 === "1" ? "selected" : ""}>الاثنين</option>
                            <option value="2" ${savedDay1 === "2" ? "selected" : ""}>الثلاثاء</option>
                            <option value="3" ${savedDay1 === "3" ? "selected" : ""}>الأربعاء</option>
                            <option value="4" ${savedDay1 === "4" ? "selected" : ""}>الخميس</option>
                            <option value="5" ${savedDay1 === "5" ? "selected" : ""}>الجمعة</option>
                            <option value="6" ${savedDay1 === "6" ? "selected" : ""}>السبت</option>
                        </select>
                    </div>
                    <div style="flex:1">
                        <label>الوقت</label>
                        <input type="time" id="time1-${group.number}" value="${savedTime1}" onchange="autoSave(${group.number})">
                    </div>
                </div>
                <div class="schedule-row">
                    <div style="flex:1">
                        <label>اليوم الثاني</label>
                        <select id="day2-${group.number}" onchange="autoSave(${group.number})">
                            <option value="0" ${savedDay2 === "0" ? "selected" : ""}>الأحد</option>
                            <option value="1" ${savedDay2 === "1" ? "selected" : ""}>الاثنين</option>
                            <option value="2" ${savedDay2 === "2" ? "selected" : ""}>الثلاثاء</option>
                            <option value="3" ${savedDay2 === "3" ? "selected" : ""}>الأربعاء</option>
                            <option value="4" ${savedDay2 === "4" ? "selected" : ""}>الخميس</option>
                            <option value="5" ${savedDay2 === "5" ? "selected" : ""}>الجمعة</option>
                            <option value="6" ${savedDay2 === "6" ? "selected" : ""}>السبت</option>
                        </select>
                    </div>
                    <div style="flex:1">
                        <label>الوقت</label>
                        <input type="time" id="time2-${group.number}" value="${savedTime2}" onchange="autoSave(${group.number})">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * حفظ تلقائي
 */
function autoSave(groupId) {
    const day1 = document.getElementById(`day1-${groupId}`)?.value;
    const day2 = document.getElementById(`day2-${groupId}`)?.value;
    const time1 = document.getElementById(`time1-${groupId}`)?.value;
    const time2 = document.getElementById(`time2-${groupId}`)?.value;

    if (day1 !== undefined) localStorage.setItem(`day1-${groupId}`, day1);
    if (day2 !== undefined) localStorage.setItem(`day2-${groupId}`, day2);
    if (time1) localStorage.setItem(`time1-${groupId}`, time1);
    if (time2) localStorage.setItem(`time2-${groupId}`, time2);
    
    updateTodayLessons();
    updateDashboardStats();
}

/**
 * حفظ جميع المواعيد
 */
function saveSchedules() {
    const groups = getAllGroups();
    groups.forEach(group => autoSave(group.number));

    // إظهار رسالة نجاح
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.textContent = '✓ تم حفظ المواعيد';
    document.body.appendChild(snackbar);
    setTimeout(() => snackbar.remove(), 3000);
}

/**
 * البحث في الدروس
 */
function searchLessons() {
    const dateInput = document.getElementById('searchDate');
    if (!dateInput.value) {
        alert('اختر تاريخاً للبحث');
        return;
    }
    
    const searchDate = new Date(dateInput.value);
    const searchDay = searchDate.getDay();
    const resultsContainer = document.getElementById('searchResults');
    
    const lessons = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    searchDate.setHours(0, 0, 0, 0);
    
    const diffTime = searchDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    for (let i = 1; i <= 30; i++) {
        const groupData = JSON.parse(localStorage.getItem(`group${i}`));
        if (!groupData) continue;

        const day1 = parseInt(localStorage.getItem(`day1-${i}`));
        const day2 = parseInt(localStorage.getItem(`day2-${i}`));
        const time1 = localStorage.getItem(`time1-${i}`);
        const time2 = localStorage.getItem(`time2-${i}`);

        if (day1 === searchDay && time1) {
            lessons.push({
                group: groupData.groupName,
                time: convert24To12(time1),
                timeValue: convertTimeToMinutes(time1),
                daysRemaining: diffDays
            });
        }
        if (day2 === searchDay && time2) {
            lessons.push({
                group: groupData.groupName,
                time: convert24To12(time2),
                timeValue: convertTimeToMinutes(time2),
                daysRemaining: diffDays
            });
        }
    }

    if (lessons.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-lessons">
                <i class="fas fa-calendar-times"></i>
                <p>لا توجد دروس في هذا اليوم</p>
            </div>
        `;
        return;
    }

    lessons.sort((a, b) => a.timeValue - b.timeValue);

    const dateFormatter = new Intl.DateTimeFormat('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'gregory'
    });

    resultsContainer.innerHTML = `
        <div class="date-display" style="margin-bottom: 12px;">
            <div class="today">${dateFormatter.format(searchDate)}</div>
        </div>
        ${lessons.map(lesson => `
            <div class="lesson-card upcoming">
                <div class="time-badge">${lesson.time}</div>
                <div class="lesson-info">
                    <div class="group-name">${lesson.group}</div>
                    <div class="lesson-status">
                        ${lesson.daysRemaining === 0 ? 'اليوم' : 
                          lesson.daysRemaining === 1 ? 'غداً' : 
                          `بعد ${lesson.daysRemaining} أيام`}
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

/**
 * تحديث إحصائيات لوحة المعلومات
 */
function updateDashboardStats() {
    const groups = getAllGroups();
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    document.getElementById('totalGroups').textContent = groups.length;

    let todayLessons = 0;
    let completedLessons = 0;
    let remainingLessons = 0;

    groups.forEach(group => {
        const day1 = parseInt(localStorage.getItem(`day1-${group.number}`));
        const day2 = parseInt(localStorage.getItem(`day2-${group.number}`));
        
        if (day1 === today || day2 === today) {
            const time = day1 === today ? 
                convertTimeToMinutes(localStorage.getItem(`time1-${group.number}`)) :
                convertTimeToMinutes(localStorage.getItem(`time2-${group.number}`));
            
            todayLessons++;
            if (currentTime > time) {
                completedLessons++;
            } else {
                remainingLessons++;
            }
        }
    });

    document.getElementById('todayTotal').textContent = todayLessons;
    document.getElementById('completedToday').textContent = completedLessons;
    document.getElementById('remainingToday').textContent = remainingLessons;
}

/**
 * عرض الصفحة
 */
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const targetId = pageId === 'home' ? 'home' : `${pageId}-page`;
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.classList.add('active');
    
    const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');

    if (pageId === 'home') {
        updateDashboardStats();
    }
    
    if (pageId === 'schedule') {
        updateTodayLessons();
    }
    
    if (pageId === 'settings') {
        createGroupScheduleInputs();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * العودة للصفحة الرئيسية
 */
function goHome() {
    window.location.href = 'index-new.html';
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    createGroupScheduleInputs();
    updateTodayLessons();
    updateDashboardStats();
    
    const hash = window.location.hash.slice(1) || 'home';
    showPage(hash);
});

// تصدير الدوال
window.createGroupScheduleInputs = createGroupScheduleInputs;
window.autoSave = autoSave;
window.saveSchedules = saveSchedules;
window.searchLessons = searchLessons;
window.updateDashboardStats = updateDashboardStats;
window.showPage = showPage;
window.goHome = goHome;
