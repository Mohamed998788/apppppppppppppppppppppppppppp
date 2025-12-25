/**
 * التعامل مع ملفات Excel
 */

/**
 * تصدير المجموعة إلى Excel
 */
async function exportToExcel(groupNumber) {
    if (typeof XLSX === 'undefined') {
        await showAlert('مكتبة Excel غير متاحة. تأكد من اتصالك بالإنترنت.', 'خطأ', 'error');
        return;
    }
    
    const groupDataStr = localStorage.getItem(`group${groupNumber}`);
    if (!groupDataStr) {
        await showAlert('لا توجد بيانات للتصدير', 'تنبيه', 'warning');
        return;
    }
    
    try {
        showLoading('جاري تصدير البيانات...');
        
        const groupData = JSON.parse(groupDataStr);
        const wb = XLSX.utils.book_new();
        
        // إعداد البيانات
        const headers = ['اسم الطالب', 'قيمة السداد'];
        groupData.dates.forEach((date, idx) => {
            headers.push(`حصة ${(idx % 8) + 1}${date ? ` (${date})` : ''}`);
            if ((idx + 1) % 8 === 0) {
                headers.push(`سداد شهر ${Math.floor(idx / 8) + 1}`);
            }
        });
        headers.push('ملاحظات');
        
        const data = [headers];
        
        groupData.students.forEach(student => {
            const row = [student.name || '', student.monthlyPayment || 150];
            
            student.attendance.forEach((att, idx) => {
                if (att && att[0] && att[1]) {
                    row.push('✓');
                } else if (att && att[0]) {
                    row.push('○');
                } else {
                    row.push('');
                }
                
                if ((idx + 1) % 8 === 0) {
                    row.push(student.payments?.[Math.floor(idx / 8)] || 0);
                }
            });
            
            row.push(student.notes || '');
            data.push(row);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!props'] = { RTL: true };
        
        XLSX.utils.book_append_sheet(wb, ws, groupData.groupName || `المجموعة ${groupNumber}`);
        
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        XLSX.writeFile(wb, `${groupData.groupName || 'Group'}_${date}.xlsx`);
        
        hideLoading();
        showToast('تم تصدير البيانات بنجاح', 'success');
    } catch (err) {
        hideLoading();
        console.error('Export Error:', err);
        await showAlert('حدث خطأ أثناء تصدير البيانات', 'خطأ', 'error');
    }
}

/**
 * استيراد من Excel
 */
async function importFromExcel(groupNumber) {
    if (typeof XLSX === 'undefined') {
        await showAlert('مكتبة Excel غير متاحة. تأكد من اتصالك بالإنترنت.', 'خطأ', 'error');
        return;
    }
    
    const fileInput = document.getElementById('importFile');
    const file = fileInput?.files?.[0];
    
    if (!file) {
        await showAlert('اختر ملف Excel أولاً', 'تنبيه', 'warning');
        return;
    }
    
    const confirmed = await showConfirm(
        'سيتم استبدال طلاب المجموعة ببيانات الملف.\n\nهل تريد المتابعة؟',
        'استيراد من Excel',
        { danger: true, confirmText: 'استيراد', cancelText: 'إلغاء' }
    );
    
    if (!confirmed) {
        fileInput.value = '';
        return;
    }
    
    showLoading('جاري استيراد البيانات...');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error("ملف Excel فارغ");
            }
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
            
            if (!jsonData || jsonData.length < 2) {
                throw new Error("الورقة فارغة");
            }
            
            const headerRow = jsonData[0];
            const studentDataRows = jsonData.slice(1);
            
            const nameCol = headerRow.findIndex(h => h && h.toLowerCase().includes('اسم الطالب'));
            const payCol = headerRow.findIndex(h => h && h.toLowerCase().includes('قيمة السداد'));
            const noteCol = headerRow.findIndex(h => h && h.toLowerCase().includes('ملاحظات'));
            
            if (nameCol === -1) {
                throw new Error("لم يتم العثور على عمود 'اسم الطالب'");
            }
            
            let firstDateCol = (payCol !== -1) ? payCol + 1 : nameCol + 1;
            let lastDateCol = -1, firstPayCol = -1;
            
            for (let i = firstDateCol; i < headerRow.length; i++) {
                if (headerRow[i] && typeof headerRow[i] === 'string' && headerRow[i].toLowerCase().includes('سداد شهر')) {
                    firstPayCol = i;
                    break;
                }
            }
            
            if (firstPayCol !== -1) {
                lastDateCol = firstPayCol - 1;
            } else if (noteCol !== -1) {
                lastDateCol = noteCol - 1;
            } else {
                lastDateCol = headerRow.length - 1;
            }
            
            const dateIndexes = [], importedDates = [];
            
            if (lastDateCol >= firstDateCol) {
                for (let i = firstDateCol; i <= lastDateCol; i++) {
                    dateIndexes.push(i);
                    let dateHeader = headerRow[i];
                    
                    if (dateHeader instanceof Date) {
                        const y = dateHeader.getFullYear();
                        const m = (dateHeader.getMonth() + 1).toString().padStart(2, '0');
                        const d = dateHeader.getDate().toString().padStart(2, '0');
                        importedDates.push(`${y}-${m}-${d}`);
                    } else if (typeof dateHeader === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateHeader)) {
                        importedDates.push(dateHeader);
                    } else {
                        importedDates.push('');
                    }
                }
            }
            
            const numDates = dateIndexes.length;
            const numMonths = Math.ceil(numDates / 8);
            const payIndexes = [];
            
            if (firstPayCol !== -1) {
                let expectedPayCols = (noteCol !== -1) ? noteCol - firstPayCol : headerRow.length - firstPayCol;
                for (let i = 0; i < expectedPayCols; i++) {
                    if (headerRow[firstPayCol + i]?.toLowerCase().includes('سداد شهر')) {
                        payIndexes.push(firstPayCol + i);
                    } else {
                        break;
                    }
                }
            }
            
            const importedStudents = studentDataRows.map(row => {
                if (!row || row.length === 0 || !row[nameCol]) return null;
                
                const student = {
                    name: row[nameCol] || 'طالب',
                    monthlyPayment: parseFloat(row[payCol]) || 150,
                    attendance: Array(numDates).fill([false, false]),
                    payments: Array(numMonths).fill(0),
                    notes: (noteCol !== -1 && row[noteCol]) ? row[noteCol] : ''
                };
                
                dateIndexes.forEach((colIdx, dateArrayIdx) => {
                    const cellValue = row[colIdx];
                    if (cellValue === '✓') {
                        student.attendance[dateArrayIdx] = [true, true];
                    } else if (cellValue === '○') {
                        student.attendance[dateArrayIdx] = [true, false];
                    } else {
                        student.attendance[dateArrayIdx] = [false, false];
                    }
                });
                
                payIndexes.forEach((colIdx, monthArrayIdx) => {
                    if (monthArrayIdx < numMonths) {
                        student.payments[monthArrayIdx] = parseFloat(row[colIdx]) || 0;
                    }
                });
                
                return student;
            }).filter(s => s !== null);
            
            const groupDataStr = localStorage.getItem(`group${groupNumber}`);
            let groupData;
            
            try {
                groupData = JSON.parse(groupDataStr) || { groupName: `المجموعة ${groupNumber}` };
            } catch (e) {
                groupData = { groupName: `المجموعة ${groupNumber}` };
            }
            
            groupData.students = importedStudents;
            groupData.dates = importedDates;
            
            saveData(`group${groupNumber}`, groupData);
            hideLoading();
            showToast(`تم استيراد ${importedStudents.length} طالب`, 'success');
            loadGroup(groupNumber);
            
        } catch (err) {
            hideLoading();
            console.error('Excel Import Error:', err);
            await showAlert(`خطأ في الاستيراد: ${err.message}`, 'خطأ', 'error');
        } finally {
            fileInput.value = '';
        }
    };
    
    reader.onerror = async function() {
        hideLoading();
        await showAlert('حدث خطأ أثناء قراءة الملف', 'خطأ', 'error');
        fileInput.value = '';
    };
    
    reader.readAsArrayBuffer(file);
}

/**
 * تصدير الإحصائيات إلى Excel
 */
async function exportStatisticsToExcel() {
    if (typeof XLSX === 'undefined') {
        await showAlert('مكتبة Excel غير متاحة. تأكد من اتصالك بالإنترنت.', 'خطأ', 'error');
        return;
    }
    
    showLoading('جاري تصدير الإحصائيات...');
    
    const stats = calculateAllStatistics();
    const wb = XLSX.utils.book_new();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    try {
        // ورقة الطلاب المتأخرين
        if (stats.unpaidStudents.length > 0) {
            const unpaidData = stats.unpaidStudents.map(s => ({
                'اسم الطالب': s.name,
                'المجموعة': s.groupName,
                'المتأخرات (ج)': s.unpaidAmount,
                'إجمالي المطلوب': s.totalDue,
                'إجمالي المدفوع': s.totalPaid,
                'فترات متأخرة': s.monthsOverdue,
                'قيمة السداد': s.expectedPerMonth
            }));
            
            const ws = XLSX.utils.json_to_sheet(unpaidData);
            ws['!props'] = { RTL: true };
            ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws, 'الطلاب المتأخرين');
        }
        
        // ورقة إحصائيات المجموعات
        if (stats.groupStats.length > 0) {
            const groupData = stats.groupStats.map(g => ({
                'المجموعة': g.name,
                'المحصل': g.collected,
                'المتوقع': g.expected,
                'المتبقي': g.remaining,
                'التحصيل (%)': g.expected > 0 ? Math.round((g.collected / g.expected) * 100) : 100
            }));
            
            const ws = XLSX.utils.json_to_sheet(groupData);
            ws['!props'] = { RTL: true };
            ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws, 'إحصائيات المجموعات');
        }
        
        // ورقة الملخص العام
        const summaryData = [
            { "البند": "إجمالي المحصل", "القيمة": stats.totalCollected },
            { "البند": "إجمالي المتوقع", "القيمة": stats.totalExpected },
            { "البند": "إجمالي المتأخرات", "القيمة": stats.totalExpected - stats.totalCollected },
            { "البند": "عدد الطلاب المتأخرين", "القيمة": stats.unpaidStudents.length },
            { "البند": "عدد المجموعات النشطة", "القيمة": stats.groupStats.length }
        ];
        
        const ws = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
        ws['!props'] = { RTL: true };
        ws['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.sheet_add_aoa(ws, [["البند", "القيمة"]], { origin: "A1" });
        XLSX.utils.book_append_sheet(wb, ws, 'الملخص العام');
        
        if (wb.SheetNames.length === 0) {
            hideLoading();
            await showAlert('لا توجد بيانات للتصدير', 'تنبيه', 'warning');
            return;
        }
        
        XLSX.writeFile(wb, `TeacherHelper_Stats_${date}.xlsx`);
        hideLoading();
        showToast('تم تصدير الإحصائيات بنجاح', 'success');
        
    } catch (err) {
        hideLoading();
        console.error('Stats Export Error:', err);
        await showAlert('حدث خطأ أثناء تصدير الإحصائيات', 'خطأ', 'error');
    }
}

// تصدير الدوال
window.exportToExcel = exportToExcel;
window.importFromExcel = importFromExcel;
window.exportStatisticsToExcel = exportStatisticsToExcel;
