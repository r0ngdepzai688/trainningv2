
import React, { useState } from 'react';
import { Course, User, CourseStatus } from '../../types';

interface FinishedCoursesTabProps {
  courses: Course[];
  users: User[];
}

const FinishedCoursesTab: React.FC<FinishedCoursesTabProps> = ({ courses, users }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedCourseForEmail, setSelectedCourseForEmail] = useState<Course | null>(null);

  const getStatus = (course: Course): CourseStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(course.end);
    end.setHours(0, 0, 0, 0);
    
    const assignedIds = course.assignedUserIds || [];
    if (assignedIds.length === 0) return today > end ? 'Finished' : 'Opening';

    const handledCount = course.completions.length + (course.exceptions?.length || 0);
    const isFinished = handledCount >= assignedIds.length;

    if (isFinished || today > end) return 'Finished';
    return 'Opening';
  };

  const finishedCourses = courses.filter(c => getStatus(c) === 'Finished');

  const getStats = (course: Course) => {
    const assignedIds = course.assignedUserIds || [];
    const signedCount = course.completions.length;
    const exceptionsCount = course.exceptions?.length || 0;
    const handledCount = signedCount + exceptionsCount;
    const percentage = assignedIds.length > 0 ? Math.round((handledCount / assignedIds.length) * 100) : 100;
    return { signedCount, exceptionsCount, totalCount: assignedIds.length, percentage };
  };

  const exportExcelReport = async (course: Course, sendEmail = false) => {
    const ExcelJS = (window as any).ExcelJS;
    const saveAs = (window as any).saveAs;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo hoàn thành');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'HỌ TÊN', key: 'name', width: 25 },
      { header: 'MÃ NHÂN VIÊN', key: 'id', width: 20 },
      { header: 'BỘ PHẬN', key: 'part', width: 20 },
      { header: 'NHÓM', key: 'group', width: 20 },
      { header: 'CHỮ KÝ / LÝ DO', key: 'sign', width: 30 }
    ];

    const titleRow = worksheet.addRow(['BÁO CÁO KẾT QUẢ ĐÀO TẠO NHÂN VIÊN IQC']);
    worksheet.mergeCells('A1:F1');
    titleRow.getCell(1).font = { size: 16, bold: true, color: { rgb: '0047BB' } };
    titleRow.getCell(1).alignment = { horizontal: 'center' };

    worksheet.addRow(['Khóa học:', course.name]);
    worksheet.addRow(['Thời gian:', `${course.start} ~ ${course.end}`]);
    worksheet.addRow(['Nội dung:', course.content]);
    worksheet.addRow(['Ngày xuất:', new Date().toLocaleDateString('vi-VN')]);
    worksheet.addRow([]); 

    [2, 3, 4, 5].forEach(r => {
      worksheet.getRow(r).getCell(1).font = { bold: true };
      worksheet.mergeCells(`B${r}:F${r}`);
      worksheet.getRow(r).getCell(2).alignment = { wrapText: true };
    });
    worksheet.getRow(4).height = 40; 

    const headerRowIdx = 7;
    const headerRow = worksheet.getRow(headerRowIdx);
    headerRow.values = ["STT", "HỌ TÊN", "MÃ NHÂN VIÊN", "BỘ PHẬN", "NHÓM", "XÁC NHẬN / GHI CHÚ"];
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { rgb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0047BB' } };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cell.alignment = { horizontal: 'center' };
    });

    let currentRow = headerRowIdx + 1;
    for (const comp of course.completions) {
      const u = users.find(user => user.id === comp.userId);
      if (!u) continue;

      const row = worksheet.addRow([currentRow - headerRowIdx, u.name, u.id, u.part, u.group, ""]);
      row.height = 60; 
      row.eachCell(cell => {
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      if (comp.signature) {
        try {
          const imageId = workbook.addImage({
            base64: comp.signature,
            extension: 'png',
          });
          worksheet.addImage(imageId, {
            tl: { col: 5.1, row: currentRow - 0.9 },
            ext: { width: 120, height: 50 }
          });
        } catch (e) {
          row.getCell(6).value = "Đã ký (Lỗi hiển thị ảnh)";
        }
      }
      currentRow++;
    }

    if (course.exceptions && course.exceptions.length > 0) {
      const excHeader = worksheet.addRow(['DANH SÁCH NHÂN VIÊN VẮNG MẶT / NGOẠI LỆ']);
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      excHeader.getCell(1).font = { bold: true, color: { rgb: 'FF0000' } };
      currentRow++;

      for (const ex of course.exceptions) {
        const u = users.find(user => user.id === ex.userId);
        const row = worksheet.addRow([currentRow - headerRowIdx, u?.name || 'Unknown', ex.userId, u?.part || 'N/A', u?.group || 'N/A', `LÝ DO: ${ex.reason}`]);
        row.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          cell.font = { color: { rgb: 'FF0000' } };
        });
        currentRow++;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `BAO_CAO_HOAN_THANH_${course.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (!sendEmail) {
      saveAs(new Blob([buffer]), filename);
    } else {
      saveAs(new Blob([buffer]), filename);
      const subject = encodeURIComponent(`[HOÀN THÀNH] BÁO CÁO ĐÀO TẠO: ${course.name}`);
      const body = encodeURIComponent(
        `Kính gửi,\n\nKhóa học "${course.name}" đã kết thúc.\n- Số lượng hoàn thành: ${course.completions.length}\n- Số lượng vắng mặt: ${course.exceptions?.length || 0}\n\nChi tiết chữ ký và lý do vắng mặt vui lòng xem trong file đính kèm đã được tải xuống máy của bạn.\n\nTrân trọng!`
      );
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
      setShowEmailModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Archived Courses</h3>
        <span className="text-[10px] bg-slate-800 text-white px-3 py-1 rounded-full font-bold shadow-sm">{finishedCourses.length} khóa đã đóng</span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {finishedCourses.map((c) => {
          const { signedCount, exceptionsCount, totalCount, percentage } = getStats(c);

          return (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all">
              <div className="p-7 pb-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500">Finished</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {c.target === 'sev' ? 'SEV' : c.target === 'vendor' ? 'Vendor' : 'Target'}
                    </span>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 leading-tight mb-4">{c.name}</h4>
                <div className="flex items-center gap-5 text-slate-400 text-[11px] font-bold">
                  <span>📅 {c.start} → {c.end}</span>
                </div>
              </div>

              <div className="px-7 py-6 bg-slate-50/40 border-y border-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Tỷ lệ xử lý (Ký + Vắng)</p>
                  <span className="text-[11px] font-black text-slate-800">{signedCount + exceptionsCount} / {totalCount} Nhân viên</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>

              <div className="p-7 flex gap-3">
                <button 
                  onClick={() => exportExcelReport(c)}
                  className="flex-1 px-4 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  📥 Tải Excel
                </button>
                <button 
                  onClick={() => { setSelectedCourseForEmail(c); setShowEmailModal(true); }}
                  className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  📧 Gửi Mail
                </button>
              </div>
            </div>
          );
        })}

        {finishedCourses.length === 0 && (
          <div className="py-24 text-center">
            <span className="text-4xl opacity-30">📂</span>
            <p className="text-slate-300 font-bold uppercase text-[11px] tracking-[0.5em] mt-4">No archived data</p>
          </div>
        )}
      </div>

      {showEmailModal && selectedCourseForEmail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[500] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 text-center">Gửi Báo Cáo Kết Thúc</h3>
            <p className="text-slate-400 text-[10px] font-bold text-center uppercase mb-6">{selectedCourseForEmail.name}</p>
            
            <input 
              type="email" 
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="nhap-email@samsung.com"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-700 mb-6 transition-all text-center"
            />
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => exportExcelReport(selectedCourseForEmail, true)}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                Xác nhận & Gửi Mail
              </button>
              <button 
                onClick={() => { setShowEmailModal(false); setTargetEmail(''); }}
                className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishedCoursesTab;
