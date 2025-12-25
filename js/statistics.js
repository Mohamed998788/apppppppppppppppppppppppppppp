/**
 * الإحصائيات والتقارير
 */

/**
 * حساب جميع الإحصائيات
 */
function calculateAllStatistics() {
    const output = {
        totalCollected: 0,
        totalExpected: 0,
        groupStats: [],
        unpaidStudents: []
    };
    
    for (let i = 1; i <= 30; i++) {
        const groupDataStr = localStorage.getItem(`group${i}`);
        if (!groupDataStr) continue;
        
        try {
            const groupData = JSON.parse(groupDataStr);
            if (!groupData || !groupData.students || groupData.students.length === 0) continue;
            
            const currentGroupStats = {
                number: i,
                name: groupData.groupName || `المجموعة ${i}`,
                collected: 0,
                expected: 0,
                remaining: 0
            };
            
            groupData.students.forEach((student) => {
                if (!student) return;
                
                const monthlyPayment = student.monthlyPayment || 150;
                const payments = student.payments || [];
                const studentTotalPaid = payments.reduce((sum, p) => sum + (Number(p) || 0), 0);
                
                let studentCounted = 0, studentAttended = 0;
                const countedLessonsDetails = [];
                
                (student.attendance || []).forEach((att, idx) => {
                    if (att && att[0]) {
                        studentCounted++;
                        if (att[1]) studentAttended++;
                        countedLessonsDetails.push({
                            index: idx,
                            countedLessons: 1,
                            attendedLessons: att[1] ? 1 : 0,
                            date: groupData.dates?.[idx] || ''
                        });
                    }
                });
                
                const completePeriods = Math.floor(studentCounted / 8);
                const studentTotalExpected = completePeriods * monthlyPayment;
                const studentUnpaidAmount = Math.max(0, studentTotalExpected - studentTotalPaid);
                
                currentGroupStats.collected += studentTotalPaid;
                currentGroupStats.expected += studentTotalExpected;
                
                if (studentUnpaidAmount > 0) {
                    let overduePeriods = 0;
                    const attendanceDetails = [];
                    
                    for (let p = 0; p < completePeriods; p++) {
                        const periodPayment = payments[p] || 0;
                        const isOverdue = periodPayment < monthlyPayment;
                        if (isOverdue) overduePeriods++;
                        
                        const periodStartIndex = p * 8;
                        const periodEndIndex = periodStartIndex + 8;
                        const periodLessons = countedLessonsDetails.filter(l => l.index >= periodStartIndex && l.index < periodEndIndex);
                        
                        attendanceDetails.push({
                            periodNumber: p + 1,
                            countedLessons: periodLessons.length,
                            attendedLessons: periodLessons.filter(l => l.attendedLessons).length,
                            paid: periodPayment,
                            expected: monthlyPayment,
                            isOverdue: isOverdue
                        });
                    }
                    
                    output.unpaidStudents.push({
                        name: student.name || 'طالب بدون اسم',
                        groupName: currentGroupStats.name,
                        groupNumber: i,
                        unpaidAmount: studentUnpaidAmount,
                        monthsOverdue: overduePeriods,
                        totalPaid: studentTotalPaid,
                        totalDue: studentTotalExpected,
                        expectedPerMonth: monthlyPayment,
                        attendanceDetails: attendanceDetails,
                        payments: payments
                    });
                }
                
                output.totalCollected += studentTotalPaid;
                output.totalExpected += studentTotalExpected;
            });
            
            currentGroupStats.remaining = currentGroupStats.expected - currentGroupStats.collected;
            if (currentGroupStats.expected > 0 || currentGroupStats.collected > 0) {
                output.groupStats.push(currentGroupStats);
            }
        } catch (e) {
            console.error(`Error calculating full stats for group ${i}:`, e);
        }
    }
    
    output.totalCollected = Number(output.totalCollected.toFixed(2));
    output.totalExpected = Number(output.totalExpected.toFixed(2));
    
    return output;
}

/**
 * حساب إحصائيات الصفحة الرئيسية
 */
function calculateHomePageStats() {
    const stats = {
        totalStudents: 0,
        totalGroups: 0,
        totalCollected: 0,
        totalExpected: 0,
        totalOutstanding: 0,
        collectionRate: 0,
        studentsWithArrearsCount: 0,
        topUnpaidStudents: []
    };
    
    let groupsFound = 0;
    const unpaidStudentsList = [];
    
    for (let i = 1; i <= 30; i++) {
        const groupDataStr = localStorage.getItem(`group${i}`);
        if (!groupDataStr) continue;
        
        try {
            const groupData = JSON.parse(groupDataStr);
            if (!groupData || !groupData.students) continue;
            
            groupsFound++;
            stats.totalStudents += groupData.students.length;
            const groupName = groupData.groupName || `المجموعة ${i}`;
            
            groupData.students.forEach((student) => {
                if (!student) return;
                
                const monthlyPayment = student.monthlyPayment || 150;
                const payments = student.payments || [];
                const studentTotalPaid = payments.reduce((sum, p) => sum + (Number(p) || 0), 0);
                
                let studentCountedLessons = 0;
                (student.attendance || []).forEach(att => {
                    if (att && att[0]) studentCountedLessons++;
                });
                
                const completePeriods = Math.floor(studentCountedLessons / 8);
                const studentTotalExpected = completePeriods * monthlyPayment;
                const studentUnpaidAmount = Math.max(0, studentTotalExpected - studentTotalPaid);
                
                stats.totalCollected += studentTotalPaid;
                stats.totalExpected += studentTotalExpected;
                
                if (studentUnpaidAmount > 0) {
                    unpaidStudentsList.push({
                        name: student.name || 'طالب بدون اسم',
                        groupName: groupName,
                        groupNumber: i,
                        unpaidAmount: studentUnpaidAmount
                    });
                }
            });
        } catch (e) {
            console.error(`Error calculating stats for group ${i} on home page:`, e);
        }
    }
    
    stats.totalGroups = groupsFound;
    stats.totalOutstanding = Math.max(0, stats.totalExpected - stats.totalCollected);
    stats.collectionRate = stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 100;
    stats.studentsWithArrearsCount = unpaidStudentsList.length;
    
    unpaidStudentsList.sort((a, b) => b.unpaidAmount - a.unpaidAmount);
    stats.topUnpaidStudents = unpaidStudentsList.slice(0, 5);
    
    stats.totalCollected = Number(stats.totalCollected.toFixed(2));
    stats.totalExpected = Number(stats.totalExpected.toFixed(2));
    stats.totalOutstanding = Number(stats.totalOutstanding.toFixed(2));
    
    return stats;
}

/**
 * عرض صفحة الإحصائيات الكاملة - Material Design Style
 */
function renderFullStatisticsHTML() {
    const stats = calculateAllStatistics();
    
    if (!stats) {
        console.error("Failed to calculate full statistics.");
        return `<div class="card" style="text-align: center; padding: 32px;"><p>حدث خطأ أثناء حساب الإحصائيات.</p></div>`;
    }
    
    const activeGroupStats = stats.groupStats.filter(g => g.collected > 0 || g.expected > 0 || g.remaining !== 0);
    stats.unpaidStudents.sort((a, b) => b.unpaidAmount - a.unpaidAmount);
    
    // بطاقات الإحصائيات الرئيسية
    const totalRemaining = stats.totalExpected - stats.totalCollected;
    const collectionRate = stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 100;
    
    const summaryHTML = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-icon success"><i class="fas fa-coins"></i></div>
                <span class="stat-label">المحصل</span>
                <span class="stat-value">${stats.totalCollected}<small> ج</small></span>
            </div>
            <div class="stat-card">
                <div class="stat-icon primary"><i class="fas fa-calculator"></i></div>
                <span class="stat-label">المتوقع</span>
                <span class="stat-value">${stats.totalExpected}<small> ج</small></span>
            </div>
            <div class="stat-card">
                <div class="stat-icon error"><i class="fas fa-exclamation-circle"></i></div>
                <span class="stat-label">المتبقي</span>
                <span class="stat-value">${totalRemaining}<small> ج</small></span>
            </div>
            <div class="stat-card">
                <div class="stat-icon warning"><i class="fas fa-percentage"></i></div>
                <span class="stat-label">نسبة التحصيل</span>
                <span class="stat-value">${collectionRate}<small>%</small></span>
            </div>
        </div>
    `;
    
    // قائمة الطلاب المتأخرين
    const unpaidStudentsHTML = stats.unpaidStudents.length > 0 ? `
        <div class="alert-card" style="margin-bottom: 16px;">
            <h3><i class="fas fa-exclamation-triangle"></i> طلاب متأخرون (${stats.unpaidStudents.length})</h3>
            <div class="students-list" style="margin-top: 12px;">
                ${stats.unpaidStudents.map((student, index) => `
                    <div class="student-card" id="unpaid-student-${index}" onclick="toggleStudentDetails(${index}, 'unpaid-student')">
                        <div class="student-card-header">
                            <span class="name">${student.name}</span>
                            <span class="badge danger">${student.unpaidAmount} ج</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                            <span class="badge primary" style="cursor: pointer;" onclick="loadGroup(${student.groupNumber}); event.stopPropagation();">${student.groupName}</span>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">(${student.monthsOverdue} فترة)</span>
                        </div>
                        <div id="student-details-${index}" class="student-details">
                            <div class="detail-row">
                                <span class="label">المطلوب شهرياً</span>
                                <span class="value">${student.expectedPerMonth} ج</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">المدفوع</span>
                                <span class="value" style="color: var(--success);">${student.totalPaid} ج</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">المطلوب</span>
                                <span class="value" style="color: var(--error);">${student.totalDue} ج</span>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                                ${(student.attendanceDetails || []).map((period, pIdx) => `
                                    <div style="background: var(--surface-variant); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.8rem;">
                                        <div style="font-weight: 600; margin-bottom: 4px;">الفترة ${pIdx + 1}</div>
                                        <div>الحضور: ${period.attendedLessons}/${period.countedLessons}</div>
                                        <div style="color: ${period.paid >= period.expected ? 'var(--success)' : 'var(--error)'}">
                                            ${period.paid}/${period.expected} ج
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <button onclick="loadGroup(${student.groupNumber}); event.stopPropagation();" style="width: 100%; margin-top: 12px;">
                                <i class="fas fa-eye"></i> عرض المجموعة
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // إحصائيات المجموعات
    const groupStatsHTML = activeGroupStats.length > 0 ? `
        <div class="card" style="margin-bottom: 16px;">
            <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-layer-group" style="color: var(--primary-color);"></i>
                إحصائيات المجموعات
            </h3>
            <div class="groups-list">
                ${activeGroupStats.map(g => {
                    const rate = g.expected > 0 ? Math.round((g.collected / g.expected) * 100) : 100;
                    return `
                        <div class="group-card" onclick="loadGroupByName('${g.name}')">
                            <div class="group-card-header">
                                <h3>${g.name}</h3>
                                <span class="arrow"><i class="fas fa-chevron-left"></i></span>
                            </div>
                            <div class="group-card-stats">
                                <div class="group-stat">
                                    <span class="label">المحصل</span>
                                    <span class="value success">${g.collected} ج</span>
                                </div>
                                <div class="group-stat">
                                    <span class="label">المتوقع</span>
                                    <span class="value">${g.expected} ج</span>
                                </div>
                                <div class="group-stat">
                                    <span class="label">المتبقي</span>
                                    <span class="value ${g.remaining > 0 ? 'error' : 'success'}">${g.remaining} ج</span>
                                </div>
                                <div class="group-stat">
                                    <span class="label">التحصيل</span>
                                    <span class="value">${rate}%</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    ` : `<div class="card" style="text-align: center; padding: 32px; color: var(--text-secondary);">
            <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
            <p>لا توجد إحصائيات للمجموعات</p>
        </div>`;
    
    return `
        ${summaryHTML}
        ${unpaidStudentsHTML}
        ${groupStatsHTML}
        <button onclick="exportStatisticsToExcel()" style="width: 100%; margin-top: 8px;">
            <i class="fas fa-file-excel"></i> تصدير Excel
        </button>
    `;
}

/**
 * عرض صفحة الإحصائيات
 */
function showStatistics() {
    const fullStatsHTML = renderFullStatisticsHTML();
    loadViewContent('الإحصائيات العامة', fullStatsHTML);
    updateActiveNavItem('showStatistics');
}

// تصدير الدوال
window.calculateAllStatistics = calculateAllStatistics;
window.calculateHomePageStats = calculateHomePageStats;
window.renderFullStatisticsHTML = renderFullStatisticsHTML;
window.showStatistics = showStatistics;
