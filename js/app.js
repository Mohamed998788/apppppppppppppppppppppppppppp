/**
 * التطبيق الرئيسي - التهيئة
 */

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    try {
        // تحميل الصفحة الرئيسية
        navigateToMainPage();
        
        // تحديث حالة الاتصال
        updateConnectionStatus();
        
        // التحقق من عرض شاشة البداية
        const splash = document.querySelector('.splash-screen');
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
        
        if (hasSeenSplash && splash) {
            // إخفاء فوري إذا شاهدها المستخدم مسبقاً
            splash.remove();
        } else if (splash) {
            // عرض شاشة البداية للمرة الأولى
            sessionStorage.setItem('hasSeenSplash', 'true');
            setTimeout(() => {
                splash.classList.add('fade-out');
                splash.addEventListener('transitionend', () => splash.remove(), { once: true });
            }, 2200);
        }
        
        // مستمعات حالة الاتصال
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        
        // تسجيل Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered:', reg.scope))
                .catch(err => console.warn('SW registration failed:', err));
        }
        
        // معالجة الأخطاء العامة
        window.onerror = function(msg, src, lin, col, err) {
            console.error("Unhandled Error:", msg, "at", src, ":", lin, err);
            return true;
        };
        
        window.onunhandledrejection = function(event) {
            console.error("Unhandled Rejection:", event.reason);
        };
        
    } catch (error) {
        console.error("Initialization Error:", error);
        document.body.innerHTML = `
            <div style="padding:2rem; text-align:center;">
                <h1>خطأ</h1>
                <p>حدث خطأ فادح أثناء تحميل التطبيق. يرجى المحاولة مرة أخرى.</p>
            </div>`;
    }
});

// تحميل مكتبة XLSX كاحتياط
function loadXLSXFallback() {
    console.warn('XLSX CDN failed, using fallback...');
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/xlsx/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => console.log('XLSX loaded via fallback.');
    script.onerror = () => console.error('Failed to load XLSX from fallback.');
    document.head.appendChild(script);
}
