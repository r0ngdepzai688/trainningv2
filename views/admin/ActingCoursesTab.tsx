
import React, { useState } from 'react';
import { Course, User, CourseStatus, CourseException } from '../../types';

interface ActingCoursesTabProps {
  courses: Course[];
  users: User[];
  onUpdate: (c: Course) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onAddException: (courseId: string, exception: CourseException) => void;
  onRemoveException: (courseId: string, userId: string) => void;
  onPushReminder: (courseId: string) => void;
}

const ActingCoursesTab: React.FC<ActingCoursesTabProps> = ({ 
  courses, users, onUpdate, onDelete, onToggle, onAddException, onRemoveException, onPushReminder
}) => {
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [exceptionModalCourse, setExceptionModalCourse] = useState<Course | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUserForException, setSelectedUserForException] = useState<User | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');

  const getStatus = (course: Course): CourseStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(course.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(course.end);
    end.setHours(0, 0, 0, 0);
    
    const assignedIds = course.assignedUserIds || [];
    if (assignedIds.length === 0) return today < start ? 'Plan' : 'Opening';

    const handledCount = course.completions.length + (course.exceptions?.length || 0);
    const isFinished = handledCount >= assignedIds.length;

    if (isFinished) return 'Finished';
    if (today < start) return 'Plan';
    if (today > end && !isFinished) return 'Pending';
    return 'Opening';
  };

  const activeCourses = courses.filter(c => {
    const status = getStatus(c);
    return status === 'Plan' || status === 'Opening' || status === 'Pending';
  });

  const getUnfinishedUsers = (course: Course) => {
    const assignedIds = new Set(course.assignedUserIds || []);
    const exceptionIds = new Set((course.exceptions || []).map(e => e.userId));
    const finishedIds = new Set(course.completions.map(comp => comp.userId));
    return users.filter(u => assignedIds.has(u.id) && !finishedIds.has(u.id) && !exceptionIds.has(u.id));
  };

  const getOverallProgress = (course: Course) => {
    const assignedIds = course.assignedUserIds || [];
    if (assignedIds.length === 0) return 0;
    const handledCount = course.completions.length + (course.exceptions?.length || 0);
    return Math.round((handledCount / assignedIds.length) * 100);
  };

  const applyCellStyle = (cell: any, type: 'title' | 'summary' | 'header' | 'data') => {
    if (!cell) return;
    const border = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };

    cell.s = {
      font: { name: 'Arial', sz: 10 },
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: border
    };

    switch(type) {
      case 'title':
        cell.s.font = { name: 'Arial', sz: 14, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "0047BB" } };
        cell.s.alignment.horizontal = "center";
        break;
      case 'summary':
        cell.s.font.bold = true;
        cell.s.fill = { fgColor: { rgb: "F2F2F2" } };
        cell.s.border = { bottom: { style: "thin", color: { rgb: "CCCCCC" } } };
        break;
      case 'header':
        cell.s.font.bold = true;
        cell.s.font.color = { rgb: "FFFFFF" };
        cell.s.fill = { fgColor: { rgb: "0047BB" } };
        cell.s.alignment.horizontal = "center";
        break;
      case 'data':
        cell.s.alignment.horizontal = "center";
        break;
    }
  };

  const formatWorksheet = (course: Course, unfinished: User[]) => {
    const XLSX = (window as any).XLSX;
    
    // Dữ liệu hàng (AoA)
    const rows: any[][] = [
      ["BÁO CÁO TỒN ĐỌNG ĐÀO TẠO NHÂN VIÊN IQC"], // R0: Title
      [`Khóa học: ${course.name}`], // R1
      [`Thời gian: ${course.start} ~ ${course.end}`], // R2
      [`Nội dung: ${course.content}`], // R3
      [`Tổng số: ${course.assignedUserIds?.length || 0} | Tồn đọng: ${unfinished.length} nhân viên`], // R4
      [], // R5: Spacer
      ["STT", "HỌ TÊN", "MÃ NHÂN VIÊN / CCCD", "BỘ PHẬN", "NHÓM / CÔNG TY", "GHI CHÚ"] // R6: Header
    ];

    unfinished.forEach((u, idx) => {
      rows.push([idx + 1, u.name, u.id, u.part, u.group, "CHƯA XÁC NHẬN"]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merge Cells từ cột A đến F cho tất cả các dòng tiêu đề và tóm tắt
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Course name
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Date
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Content
      { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }, // Summary stats
    ];

    // Áp dụng Style
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C } as any);
        if (!ws[addr]) ws[addr] = { v: "" }; 
        
        if (R === 0) applyCellStyle(ws[addr], 'title');
        else if (R >= 1 && R <= 4) applyCellStyle(ws[addr], 'summary');
        else if (R === 6) applyCellStyle(ws[addr], 'header');
        else if (R > 6) applyCellStyle(ws[addr], 'data');
      }
    }

    // Tối ưu kích thước cột và hàng
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 30 }];
    ws['!rows'] = [
      { hpt: 35 }, // Title
      { hpt: 25 }, // Course Name
      { hpt: 25 }, // Date
      { hpt: 40 }, // Content (cao hơn để wrap text)
      { hpt: 25 }, // Stats
      { hpt: 10 }, // Spacer
      { hpt: 25 }  // Header
    ];

    return ws;
  };

  const handleExportAndEmail = () => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      alert("Vui lòng nhập email hợp lệ.");
      return;
    }
    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();
    let summaryText = "KÍNH GỬI QUÝ BỘ PHẬN/CÔNG TY,\n\nĐây là danh sách tồn đọng đào tạo IQC tính đến hôm nay:\n\n";
    let hasAnyData = false;
    activeCourses.forEach(course => {
      const unfinished = getUnfinishedUsers(course);
      if (unfinished.length > 0) {
        hasAnyData = true;
        summaryText += `- ${course.name}: Còn ${unfinished.length} người chưa ký.\n`;
        const ws = formatWorksheet(course, unfinished);
        const sheetName = course.name.replace(/[\\/*?[\]]/g, '').substring(0, 30) || `Course_${course.id}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    if (!hasAnyData) {
      alert("Hiện tại không có nhân viên nào tồn đọng đào tạo.");
      setShowEmailModal(false);
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `BAO_CAO_TON_DONG_IQC_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);

    const subject = encodeURIComponent(`[BÁO CÁO] TỒN ĐỌNG ĐÀO TẠO NHÂN VIÊN IQC - ${dateStr}`);
    const body = encodeURIComponent(
      summaryText + "\n--------------------------------------------------\n" +
      "LƯU Ý: File báo cáo Excel chuyên nghiệp đã được tải xuống máy của bạn.\n" +
      "Vui lòng ĐÍNH KÈM file '" + filename + "' vào email này trước khi gửi.\n\n" +
      "Trân trọng,\nIQC Management System"
    );
    alert("File Excel đã được tải xuống. Hệ thống sẽ mở Email ngay bây giờ.");
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    setShowEmailModal(false);
    setTargetEmail('');
  };

  const handleAddException = () => {
    if (exceptionModalCourse && selectedUserForException && absenceReason.trim()) {
      onAddException(exceptionModalCourse.id, {
        userId: selectedUserForException.id,
        reason: absenceReason
      });
      setSelectedUserForException(null);
      setAbsenceReason('');
      setSearchUserQuery('');
    }
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      onDelete(courseToDelete.id);
      setCourseToDelete(null);
    }
  };

  const searchableUsers = exceptionModalCourse ? users.filter(u => {
    const isAssigned = exceptionModalCourse.assignedUserIds?.includes(u.id);
    const hasFinished = exceptionModalCourse.completions.some(c => c.userId === u.id);
    const hasException = exceptionModalCourse.exceptions?.some(e => e.userId === u.id);
    if (!isAssigned || hasFinished || hasException) return false;
    return u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || u.id.includes(searchUserQuery);
  }) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Training List</h3>
          <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">{activeCourses.length} khóa đang chạy</span>
        </div>
        <button onClick={() => setShowEmailModal(true)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Gửi Báo Cáo Tồn Đọng (Excel Style)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeCourses.map((c) => {
          const status = getStatus(c);
          const progress = getOverallProgress(c);
          const unfinishedUsers = getUnfinishedUsers(c);
          
          let statsToDisplay: { label: string, val: number }[] = [];
          if (c.target === 'vendor') {
            const companyCounts: Record<string, number> = {};
            unfinishedUsers.forEach(u => { companyCounts[u.group] = (companyCounts[u.group] || 0) + 1; });
            statsToDisplay = Object.entries(companyCounts).map(([label, val]) => ({ label, val })).sort((a, b) => b.val - a.val);
          } else if (c.target === 'sev') {
            const parts = ["IQC G", "IQC 1P", "IQC 2P", "IQC 3P", "Injection Innovation Support T/F"];
            const labelsMap: Record<string, string> = { "IQC G": "G", "IQC 1P": "1P", "IQC 2P": "2P", "IQC 3P": "3P", "Injection Innovation Support T/F": "TF" };
            statsToDisplay = parts.map(p => ({ label: labelsMap[p] || p, val: unfinishedUsers.filter(u => u.part === p).length }));
          }

          return (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all">
              <div className="p-7 pb-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status === 'Opening' ? 'bg-green-500 animate-pulse' : status === 'Pending' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                      status === 'Pending' ? 'bg-red-50 text-red-600' : 
                      status === 'Opening' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {status}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {c.target === 'sev' ? 'SEV' : c.target === 'vendor' ? 'Vendor' : `${c.assignedUserIds?.length || 0} Target`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onPushReminder(c.id)} className="w-9 h-9 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl active:bg-orange-600 active:text-white transition-all">🔔</button>
                    <button onClick={() => setExceptionModalCourse(c)} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl active:bg-blue-600 active:text-white transition-all">🚩</button>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-900 leading-tight mb-4">{c.name}</h4>
                <div className="flex items-center gap-5 text-slate-400 text-[11px] font-bold">
                  <span>📅 {c.start} → {c.end}</span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Tiến độ ({progress}%)</span>
                    <span className="text-[10px] font-bold text-slate-900">{c.completions.length + (c.exceptions?.length || 0)}/{c.assignedUserIds?.length || 0} xử lý</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>

              {statsToDisplay.length > 0 && (
                <div className="px-7 py-5 bg-slate-50/40 border-y border-slate-50">
                  <div className="flex flex-wrap gap-2.5">
                    {statsToDisplay.map(s => (
                      <div key={s.label} className={`flex flex-col items-center justify-center min-w-[50px] flex-1 p-2.5 rounded-2xl border ${s.val > 0 ? 'bg-white border-red-100 shadow-sm' : 'bg-slate-50/50 border-transparent opacity-30'}`}>
                        <span className="text-[9px] font-black mb-1 uppercase text-slate-400">{s.label}</span>
                        <span className={`text-sm font-black ${s.val > 0 ? 'text-red-600' : 'text-slate-200'}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-7 flex items-center justify-between">
                <button onClick={() => setCourseToDelete(c)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-[1.2rem] active:bg-red-500 active:text-white transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
                <button onClick={() => onToggle(c.id)} className={`w-14 h-8 rounded-full relative transition-all ${c.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${c.isActive ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[500] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 text-center">Gửi Báo Cáo Tồn Đọng</h3>
            <input type="email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} placeholder="nhap-email@samsung.com" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-700 mb-6 transition-all text-center" />
            <div className="flex flex-col gap-3">
              <button onClick={handleExportAndEmail} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all">Gửi Mail</button>
              <button onClick={() => setShowEmailModal(false)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {exceptionModalCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center sm:justify-center p-0 sm:p-4 z-[300] animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[3rem] sm:rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quản lý vắng mặt</h3>
                <button onClick={() => { setExceptionModalCourse(null); setSelectedUserForException(null); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-8 pb-10">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                  {!selectedUserForException ? (
                    <div className="space-y-3">
                      <input type="text" value={searchUserQuery} onChange={(e) => setSearchUserQuery(e.target.value)} placeholder="Tìm nhân viên..." className="w-full px-5 py-3.5 rounded-xl border border-blue-100 outline-none text-sm font-medium" />
                      <div className="max-h-40 overflow-y-auto rounded-xl bg-white divide-y divide-blue-50">
                        {searchUserQuery.length > 0 && searchableUsers.map(u => (
                          <button key={u.id} onClick={() => setSelectedUserForException(u)} className="w-full px-4 py-3 flex justify-between items-center text-left">
                            <div><p className="text-[13px] font-bold text-slate-800">{u.name}</p><p className="text-[10px] text-slate-400">{u.id}</p></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-200 flex justify-between"><p className="text-xs font-black">{selectedUserForException.name}</p><button onClick={() => setSelectedUserForException(null)} className="text-[10px] text-red-500 font-black">Hủy</button></div>
                      <input type="text" value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} placeholder="Lý do..." className="w-full px-4 py-3.5 rounded-xl border border-blue-200 outline-none text-sm font-medium" />
                      <button onClick={handleAddException} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px]">Xác nhận</button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {exceptionModalCourse.exceptions?.map(ex => {
                    const u = users.find(user => user.id === ex.userId);
                    return (
                      <div key={ex.userId} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                        <div><p className="text-xs font-black text-slate-800">{u?.name}</p><p className="text-[9px] font-bold text-orange-600 uppercase">{ex.reason}</p></div>
                        <button onClick={() => onRemoveException(exceptionModalCourse.id, ex.userId)} className="text-red-400 font-bold p-2 text-sm">✕</button>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>
      )}

      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[400]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center">
             <h3 className="text-lg font-bold text-slate-800 mb-2 uppercase">Xóa khóa học?</h3>
             <div className="flex flex-col gap-3 mt-8">
                <button onClick={confirmDeleteCourse} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold uppercase text-[11px]">Xóa ngay</button>
                <button onClick={() => setCourseToDelete(null)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold uppercase text-[11px]">Hủy</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActingCoursesTab;
