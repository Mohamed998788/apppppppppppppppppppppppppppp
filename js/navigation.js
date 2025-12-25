/**
 * التنقل بين الصفحات - Android Style
 */

/**
 * تحديث عنصر التنقل النشط
 */
function updateActiveNavItem(pageName) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * تحميل محتوى العرض
 */
function loadViewContent(title, contentHTML, showBackButton = false) {
    const mainContent = document.getElementById('mainContentContainer');
    if (!mainContent) {
        console.error('Error: mainContentContainer not found!');
        return;
    }
    
    const titleHTML = title ? `
        <div class="page-title">
            ${showBackButton ? `<button class="btn-text" onclick="history.back()" style="padding: 8px;"><i class="fas fa-arrow-right"></i></button>` : ''}
            <span>${title}</span>
        </div>
    ` : '';
    
    mainContent.innerHTML = titleHTML + contentHTML;
    
    if (mainContent.querySelector('#searchInput')) {
        initializeSearch();
    }
}

/**
 * الانتقال للصفحة الرئيسية
 */
function navigateToMainPage() {
    const homePageHTML = renderHomePageHTML();
    loadViewContent('', homePageHTML);
    updateActiveNavItem('home');
}

/**
 * عرض صفحة الإعدادات
 */
function showSettings() {
    const contentHTML = `
        <div class="settings-section">
            <div class="settings-section-title">البيانات</div>
            <div class="settings-list">
                <div class="settings-item" onclick="backupLocalStorage()">
                    <div class="icon success"><i class="fas fa-download"></i></div>
                    <div class="content">
                        <div class="title">حفظ نسخة احتياطية</div>
                        <div class="subtitle">تصدير البيانات لملف JSON</div>
                    </div>
                    <i class="fas fa-chevron-left arrow"></i>
                </div>
                <div class="settings-item" onclick="document.getElementById('restoreInput').click()">
                    <div class="icon primary"><i class="fas fa-upload"></i></div>
                    <div class="content">
                        <div class="title">استعادة نسخة</div>
                        <div class="subtitle">استيراد بيانات من ملف JSON</div>
                    </div>
                    <i class="fas fa-chevron-left arrow"></i>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">عام</div>
            <div class="settings-list">
                <div class="settings-item" onclick="showAboutPage()">
                    <div class="icon info"><i class="fas fa-info-circle"></i></div>
                    <div class="content">
                        <div class="title">عن البرنامج</div>
                        <div class="subtitle">معلومات الإصدار والمميزات</div>
                    </div>
                    <i class="fas fa-chevron-left arrow"></i>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">خطر</div>
            <div class="settings-list">
                <div class="settings-item" onclick="clearAllDataWithConfirmation()">
                    <div class="icon error"><i class="fas fa-trash-alt"></i></div>
                    <div class="content">
                        <div class="title" style="color: var(--error);">مسح كل البيانات</div>
                        <div class="subtitle">حذف جميع المجموعات والطلاب نهائياً</div>
                    </div>
                    <i class="fas fa-chevron-left arrow"></i>
                </div>
            </div>
        </div>

        <input type="file" id="restoreInput" accept=".json" style="display: none;" onchange="restoreLocalStorage(event)">
    `;
    
    loadViewContent('الإعدادات', contentHTML);
    updateActiveNavItem('settings');
}

/**
 * عرض صفحة حول البرنامج
 */
function showAboutPage() {
    const contentHTML = `
        <button class="back-button" onclick="showSettings()">
            <i class="fas fa-arrow-right"></i>
            <span>رجوع</span>
        </button>

        <div class="about-header">
            <img src="logo.jpg" alt="رفيق المعلم" class="about-logo">
            <h2 class="about-title">رفيق المعلم</h2>
            <p class="about-version">الإصدار 2.0</p>
        </div>

        <div class="features-card">
            <h3><i class="fas fa-star"></i> المميزات</h3>
            <ul class="features-list">
                <li><i class="fas fa-check-circle"></i> إدارة المجموعات والطلاب</li>
                <li><i class="fas fa-check-circle"></i> تسجيل الحضور والغياب</li>
                <li><i class="fas fa-check-circle"></i> متابعة المدفوعات والمتأخرات</li>
                <li><i class="fas fa-check-circle"></i> إحصائيات تفصيلية</li>
                <li><i class="fas fa-check-circle"></i> جدول المواعيد</li>
                <li><i class="fas fa-check-circle"></i> تصدير واستيراد Excel</li>
                <li><i class="fas fa-check-circle"></i> نسخ احتياطي واستعادة</li>
                <li><i class="fas fa-check-circle"></i> يعمل بدون إنترنت</li>
            </ul>
        </div>

        <div class="app-footer">
            <p>تم التطوير بواسطة</p>
            <p><strong>الأستاذ يوسف الزغبي</strong></p>
            <p style="margin-top: 8px;">© 2024 جميع الحقوق محفوظة</p>
        </div>
    `;
    
    loadViewContent('', contentHTML);
    updateActiveNavItem('settings');
}

// تصدير الدوال
window.updateActiveNavItem = updateActiveNavItem;
window.loadViewContent = loadViewContent;
window.navigateToMainPage = navigateToMainPage;
window.showSettings = showSettings;
window.showAboutPage = showAboutPage;
