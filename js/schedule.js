/**
 * إدارة جدول المواعيد
 */

/**
 * الحصول على جميع المجموعات
 */
function getAllGroups() {
    const groups = [];
    for (let i = 1; i <= 30; i++) {
        const groupData = JSON.parse(localStorage.getItem(`group${i}`));
        if (groupData) {
            groups.push({
                number: i,
                name: groupData.groupName || `المجموعة ${i}`
            });
        }
    }
    return groups;
}

/**
 * تحويل الوقت إلى دقائق
 */
function convertTimeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
}

/**
 * تحويل من 24 ساعة إلى 12 ساعة
 */
function convert24To12(time24) {
    if (!time24) return "12:00 PM";
    const [hours24, minutes] = time24.split(':').map(Number);
    const period = hours24 >= 12 ? 'م' : 'ص';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * حساب الوقت المتبقي
 */
function calculateRemainingTime(lessonTime) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const remaining = lessonTime - currentTime;
    
    if (remaining <= 0) return null;
    
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    
    if (hours > 0) {
        return `${hours} س ${minutes} د`;
    }
    return `${minutes} دقيقة`;
}

/**
 * تحديث دروس اليوم
 */
function updateTodayLessons() {
    const todayContainer = document.getElementById('todayLessons');
    const tomorrowContainer = document.getElementById('tomorrowLessons');
    const dateDisplay = document.getElementById('currentDate');
    
    if (!todayContainer || !tomorrowContainer) return;

    const now = new Date();
    const today = now.getDay();
    const nextDay = (today + 1) % 7;
    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const dateFormatter = new Intl.DateTimeFormat('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'gregory'
    });

    if (dateDisplay) {
        dateDisplay.innerHTML = `
            <div class="today">${dateFormatter.format(now)}</div>
            <div class="tomorrow">غداً: ${dateFormatter.format(tomorrow)}</div>
        `;
    }

    const todayLessons = [];
    const tomorrowLessons = [];

    for (let i = 1; i <= 30; i++) {
        const groupData = JSON.parse(localStorage.getItem(`group${i}`));
        if (!groupData) continue;

        const day1 = parseInt(localStorage.getItem(`day1-${i}`));
        const day2 = parseInt(localStorage.getItem(`day2-${i}`));
        const time1 = localStorage.getItem(`time1-${i}`);
        const time2 = localStorage.getItem(`time2-${i}`);

        // دروس اليوم
        if (day1 === today && time1) {
            const timeValue = convertTimeToMinutes(time1);
            todayLessons.push({
                group: groupData.groupName || `المجموعة ${i}`,
                time: convert24To12(time1),
                timeValue: timeValue,
                isPast: currentTimeInMinutes > timeValue,
                remaining: calculateRemainingTime(timeValue)
            });
        }
        if (day2 === today && time2) {
            const timeValue = convertTimeToMinutes(time2);
            todayLessons.push({
                group: groupData.groupName || `المجموعة ${i}`,
                time: convert24To12(time2),
                timeValue: timeValue,
                isPast: currentTimeInMinutes > timeValue,
                remaining: calculateRemainingTime(timeValue)
            });
        }

        // دروس الغد
        if (day1 === nextDay && time1) {
            tomorrowLessons.push({
                group: groupData.groupName || `المجموعة ${i}`,
                time: convert24To12(time1),
                timeValue: convertTimeToMinutes(time1)
            });
        }
        if (day2 === nextDay && time2) {
            tomorrowLessons.push({
                group: groupData.groupName || `المجموعة ${i}`,
                time: convert24To12(time2),
                timeValue: convertTimeToMinutes(time2)
            });
        }
    }

    // ترتيب حسب الوقت
    todayLessons.sort((a, b) => a.timeValue - b.timeValue);
    tomorrowLessons.sort((a, b) => a.timeValue - b.timeValue);

    // عرض دروس اليوم
    if (todayLessons.length === 0) {
        todayContainer.innerHTML = `
            <div class="no-lessons">
                <i class="fas fa-coffee"></i>
                <p>لا توجد دروس اليوم</p>
            </div>
        `;
    } else {
        todayContainer.innerHTML = todayLessons.map(lesson => `
            <div class="lesson-card ${lesson.isPast ? 'past' : 'upcoming'}">
                <div class="time-badge">${lesson.time}</div>
                <div class="lesson-info">
                    <div class="group-name">${lesson.group}</div>
                    <div class="lesson-status">${lesson.isPast ? 'انتهى' : 'قادم'}</div>
                    ${lesson.remaining ? `<div class="remaining-time">متبقي: ${lesson.remaining}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // عرض دروس الغد
    if (tomorrowLessons.length === 0) {
        tomorrowContainer.innerHTML = `
            <div class="no-lessons">
                <i class="fas fa-moon"></i>
                <p>لا توجد دروس غداً</p>
            </div>
        `;
    } else {
        tomorrowContainer.innerHTML = tomorrowLessons.map(lesson => `
            <div class="lesson-card upcoming">
                <div class="time-badge">${lesson.time}</div>
                <div class="lesson-info">
                    <div class="group-name">${lesson.group}</div>
                    <div class="lesson-status">غداً</div>
                </div>
            </div>
        `).join('');
    }
}

// تصدير الدوال
window.getAllGroups = getAllGroups;
window.convertTimeToMinutes = convertTimeToMinutes;
window.convert24To12 = convert24To12;
window.calculateRemainingTime = calculateRemainingTime;
window.updateTodayLessons = updateTodayLessons;
