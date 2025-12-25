/**
 * البحث - Material Design Style
 */

/**
 * تهيئة البحث
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            showSearchPage(this.value);
        }
    });
}

/**
 * عرض صفحة نتائج البحث
 */
function showSearchPage(searchTerm) {
    document.activeElement?.blur();

    const searchInputEl = document.getElementById('searchInput');
    const currentCursorPosition = searchInputEl?.selectionStart;
    searchTerm = searchTerm ? searchTerm.trim().toLowerCase() : '';
    
    if (!searchTerm || searchTerm.length < 2) {
        const mc = document.getElementById('mainContentContainer');
        if (mc && mc.querySelector('.search-results')) {
            mc.querySelector('.search-results').innerHTML = `
                <div class="card" style="text-align: center; padding: 32px; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
                    <p>أدخل حرفين على الأقل للبحث</p>
                </div>
            `;
        }
        updateActiveNavItem('home');
        return;
    }
    
    let allResults = [];
    
    for (let i = 1; i <= 30; i++) {
        const gds = localStorage.getItem(`group${i}`);
        if (!gds) continue;
        
        try {
            const gd = JSON.parse(gds);
            if (!gd || !gd.students) continue;
            
            gd.students.forEach((s, sIdx) => {
                if (s && s.name && s.name.toLowerCase().includes(searchTerm)) {
                    const mp = s.monthlyPayment || 150;
                    const pays = s.payments || [];
                    const tp = pays.reduce((sum, p) => sum + (Number(p) || 0), 0);
                    
                    // حساب الحصص المحتسبة لكل فترة
                    let totalCounted = 0;
                    const periodsData = [];
                    const attendance = s.attendance || [];
                    
                    // حساب عدد الفترات الكاملة
                    attendance.forEach((att, idx) => {
                        if (att && att[0]) totalCounted++;
                    });
                    
                    const completePeriods = Math.floor(totalCounted / 8);
                    const currentPeriodLessons = totalCounted % 8;
                    
                    // جمع بيانات كل فترة
                    let countedSoFar = 0;
                    let periodIndex = 0;
                    let periodCounted = 0;
                    let periodAttended = 0;
                    
                    attendance.forEach((att, idx) => {
                        if (att && att[0]) {
                            countedSoFar++;
                            periodCounted++;
                            if (att[1]) periodAttended++;
                        }
                        
                        // نهاية كل 8 حصص محتسبة أو نهاية البيانات
                        if (periodCounted === 8 || idx === attendance.length - 1) {
                            if (periodCounted > 0) {
                                const paid = pays[periodIndex] || 0;
                                const isComplete = periodCounted === 8;
                                const expected = isComplete ? mp : 0;
                                const unpaid = Math.max(0, expected - paid);
                                
                                periodsData.push({
                                    periodNumber: periodIndex + 1,
                                    lessons: periodCounted,
                                    attended: periodAttended,
                                    isComplete: isComplete,
                                    expected: expected,
                                    paid: paid,
                                    unpaid: unpaid,
                                    status: !isComplete ? 'جارية' : (paid >= mp ? 'مدفوع' : (paid > 0 ? 'جزئي' : 'متأخر'))
                                });
                                
                                if (periodCounted === 8) {
                                    periodIndex++;
                                    periodCounted = 0;
                                    periodAttended = 0;
                                }
                            }
                        }
                    });
                    
                    // إذا لم تكن هناك فترات، أضف فترة فارغة
                    if (periodsData.length === 0) {
                        periodsData.push({
                            periodNumber: 1,
                            lessons: 0,
                            attended: 0,
                            isComplete: false,
                            expected: 0,
                            paid: pays[0] || 0,
                            unpaid: 0,
                            status: 'جديد'
                        });
                    }
                    
                    const te = completePeriods * mp;
                    const oa = Math.max(0, te - tp);
                    
                    allResults.push({
                        name: s.name,
                        groupName: gd.groupName || `المجموعة ${i}`,
                        groupNumber: i,
                        studentIndex: sIdx,
                        monthlyPayment: mp,
                        payments: pays,
                        overdueAmount: oa,
                        totalExpected: te,
                        totalPaid: tp,
                        completePeriods: completePeriods,
                        currentPeriodLessons: currentPeriodLessons,
                        periodsData: periodsData
                    });
                }
            });
        } catch (e) {
            console.error(`Error searching group ${i}:`, e);
        }
    }
    
    const resultsHTML = allResults.length > 0 ? `
        <p style="margin-bottom: 16px; font-weight: 600; color: var(--text-secondary);">
            ${allResults.length} نتيجة لـ "${searchTerm}"
        </p>
        <div class="students-list">
            ${allResults.map((r, idx) => `
                <div class="student-card" id="search-result-${idx}" onclick="toggleSearchDetails(${idx})">
                    <div class="student-card-header">
                        <span class="name">${r.name}</span>
                        ${r.overdueAmount > 0 
                            ? `<span class="badge danger">${r.overdueAmount} ج متأخر</span>` 
                            : `<span class="badge success">لا متأخرات ✓</span>`
                        }
                    </div>
                    <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                        <span class="badge primary" onclick="loadGroup(${r.groupNumber}); event.stopPropagation();">${r.groupName}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">
                            ${r.completePeriods} فترة مكتملة ${r.currentPeriodLessons > 0 ? `+ ${r.currentPeriodLessons}/8` : ''}
                        </span>
                    </div>
                    <div id="search-details-${idx}" class="student-details">
                        <!-- ملخص المدفوعات -->
                        <div class="payment-summary">
                            <div class="summary-item">
                                <span class="label">السداد الشهري</span>
                                <span class="value">${r.monthlyPayment} ج</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">إجمالي المطلوب</span>
                                <span class="value">${r.totalExpected} ج</span>
                            </div>
                            <div class="summary-item success">
                                <span class="label">إجمالي المدفوع</span>
                                <span class="value">${r.totalPaid} ج</span>
                            </div>
                            <div class="summary-item ${r.overdueAmount > 0 ? 'danger' : 'success'}">
                                <span class="label">المتأخرات</span>
                                <span class="value">${r.overdueAmount} ج</span>
                            </div>
                        </div>
                        
                        <!-- تفاصيل كل فترة -->
                        <div class="periods-title">
                            <i class="fas fa-calendar-check"></i>
                            تفاصيل الفترات (${r.periodsData.length})
                        </div>
                        <div class="periods-list">
                            ${r.periodsData.map(period => `
                                <div class="period-card ${period.status === 'متأخر' ? 'overdue' : period.status === 'جزئي' ? 'partial' : period.status === 'مدفوع' ? 'paid' : 'current'}">
                                    <div class="period-header">
                                        <span class="period-number">الفترة ${period.periodNumber}</span>
                                        <span class="period-status status-${period.status === 'متأخر' ? 'overdue' : period.status === 'جزئي' ? 'partial' : period.status === 'مدفوع' ? 'paid' : 'current'}">
                                            ${period.status === 'متأخر' ? '<i class="fas fa-exclamation-circle"></i>' : 
                                              period.status === 'جزئي' ? '<i class="fas fa-adjust"></i>' : 
                                              period.status === 'مدفوع' ? '<i class="fas fa-check-circle"></i>' : 
                                              '<i class="fas fa-hourglass-half"></i>'}
                                            ${period.status}
                                        </span>
                                    </div>
                                    <div class="period-details">
                                        <div class="period-row">
                                            <span><i class="fas fa-book"></i> الحصص</span>
                                            <span>${period.lessons}/8 ${period.isComplete ? '(مكتملة)' : '(جارية)'}</span>
                                        </div>
                                        <div class="period-row">
                                            <span><i class="fas fa-user-check"></i> الحضور</span>
                                            <span>${period.attended}/${period.lessons}</span>
                                        </div>
                                        <div class="period-row">
                                            <span><i class="fas fa-coins"></i> المطلوب</span>
                                            <span>${period.expected} ج</span>
                                        </div>
                                        <div class="period-row ${period.paid > 0 ? 'success' : ''}">
                                            <span><i class="fas fa-hand-holding-usd"></i> المدفوع</span>
                                            <span>${period.paid} ج</span>
                                        </div>
                                        ${period.unpaid > 0 ? `
                                            <div class="period-row danger">
                                                <span><i class="fas fa-exclamation-triangle"></i> غير مدفوع</span>
                                                <span>${period.unpaid} ج</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <button onclick="loadGroup(${r.groupNumber}); event.stopPropagation();" style="width: 100%; margin-top: 16px;">
                            <i class="fas fa-eye"></i> عرض المجموعة
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="card" style="text-align: center; padding: 32px; color: var(--text-secondary);">
            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
            <p>لا توجد نتائج لـ "${searchTerm}"</p>
        </div>
    `;
    
    const contentHTML = `
        <div class="search-bar" style="margin-bottom: 16px;">
            <input type="text" id="searchInput" value="${searchTerm}" placeholder="ابحث عن طالب..." autocomplete="off">
            <button onclick="showSearchPage(document.getElementById('searchInput').value.trim())">
                <i class="fas fa-search"></i>
            </button>
        </div>
        <div class="search-results">
            ${resultsHTML}
        </div>
    `;
    
    loadViewContent('', contentHTML);
    updateActiveNavItem('home');
    
    const newSearchInput = document.getElementById('searchInput');
    if (newSearchInput) {
        newSearchInput.focus();
        if (typeof currentCursorPosition === 'number') {
            try {
                newSearchInput.setSelectionRange(currentCursorPosition, currentCursorPosition);
            } catch (e) {}
        }
        newSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                showSearchPage(this.value);
            }
        });
    }
}

/**
 * تبديل عرض تفاصيل الطالب في البحث
 */
function toggleSearchDetails(index) {
    const details = document.getElementById(`search-details-${index}`);
    if (details) {
        details.classList.toggle('show');
    }
}

// تصدير الدوال
window.initializeSearch = initializeSearch;
window.showSearchPage = showSearchPage;
window.toggleSearchDetails = toggleSearchDetails;
