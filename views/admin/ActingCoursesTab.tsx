
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
    
    const assignedIds = new Set(course.assignedUserIds || []);
    const exceptionIds = new Set((course.exceptions || []).map(e => e.userId));
    const targetUsers = users.filter(u => assignedIds.has(u.id) && !exceptionIds.has(u.id));
    
    const isFinished = targetUsers.length > 0 && course.completions.length >= targetUsers.length;

    if (isFinished) return 'Closed';
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
    const assignedIds = new Set(course.assignedUserIds || []);
    const exceptionIds = new Set((course.exceptions || []).map(e => e.userId));
    const targetUsersCount = users.filter(u => assignedIds.has(u.id) && !exceptionIds.has(u.id)).length;
    if (targetUsersCount === 0) return 0;
    return Math.round((course.completions.length / targetUsersCount) * 100);
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
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Training List</h3>
        <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">{activeCourses.length} khóa đang chạy</span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeCourses.map((c) => {
          const status = getStatus(c);
          const progress = getOverallProgress(c);
          const unfinishedUsers = getUnfinishedUsers(c);
          const isVendorTarget = c.target === 'vendor';
          const groupingLabel = isVendorTarget ? "Pending by Company" : "Pending by Part";
          
          let statsToDisplay: { label: string, val: number }[] = [];
          if (isVendorTarget) {
            const companyCounts: Record<string, number> = {};
            unfinishedUsers.forEach(u => { companyCounts[u.group] = (companyCounts[u.group] || 0) + 1; });
            statsToDisplay = Object.entries(companyCounts).map(([label, val]) => ({ label, val })).sort((a, b) => b.val - a.val);
          } else {
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
                    {c.exceptions && c.exceptions.length > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600">
                         {c.exceptions.length} vắng mặt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onPushReminder(c.id)}
                      className="w-9 h-9 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl active:bg-orange-600 active:text-white transition-all shadow-sm"
                      title="Gửi thông báo nhắc nhở"
                    >
                      🔔
                    </button>
                    <button 
                      onClick={() => setExceptionModalCourse(c)}
                      className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl active:bg-blue-600 active:text-white transition-all shadow-sm"
                      title="Quản lý vắng mặt"
                    >
                      🚩
                    </button>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-900 leading-tight mb-4">{c.name}</h4>
                <div className="flex items-center gap-5 text-slate-400 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5"><span>📅 {c.start}</span></div>
                  <span>→</span>
                  <div className="flex items-center gap-1.5"><span>🏁 {c.end}</span></div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Tiến độ ({progress}%)</span>
                    <span className="text-[10px] font-bold text-slate-900">{c.completions.length} hoàn thành</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="px-7 py-5 bg-slate-50/40 border-y border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">{groupingLabel}</p>
                <div className="flex flex-wrap gap-2.5">
                  {statsToDisplay.map(s => (
                    <div key={s.label} className={`flex flex-col items-center justify-center min-w-[50px] flex-1 p-2.5 rounded-2xl border ${s.val > 0 ? 'bg-white border-red-100 shadow-sm' : 'bg-slate-50/50 border-transparent opacity-30'}`}>
                      <span className="text-[9px] font-black mb-1 uppercase text-slate-400">{s.label}</span>
                      <span className={`text-sm font-black ${s.val > 0 ? 'text-red-600' : 'text-slate-200'}`}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-7 flex items-center justify-between">
                <div className="flex gap-3">
                  <button onClick={() => setCourseToDelete(c)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-[1.2rem] active:bg-red-500 active:text-white transition-all shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${c.isActive ? 'text-blue-600' : 'text-slate-300'}`}>{c.isActive ? 'Active' : 'Disabled'}</span>
                  <button onClick={() => onToggle(c.id)} className={`w-14 h-8 rounded-full relative transition-all shadow-sm ${c.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${c.isActive ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exception Management Modal */}
      {exceptionModalCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center sm:justify-center p-0 sm:p-4 z-[300] animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[3rem] sm:rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quản lý vắng mặt</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{exceptionModalCourse.name}</p>
                </div>
                <button onClick={() => { setExceptionModalCourse(null); setSelectedUserForException(null); setAbsenceReason(''); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide pb-10">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Thêm ngoại lệ mới</p>
                  {!selectedUserForException ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
                        <input type="text" value={searchUserQuery} onChange={(e) => setSearchUserQuery(e.target.value)} placeholder="Tìm nhân viên theo tên hoặc ID..." className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-blue-100 focus:border-blue-500 outline-none text-sm font-medium transition-all" />
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-blue-50 divide-y divide-blue-50 bg-white shadow-sm">
                        {searchUserQuery.length > 0 && searchableUsers.map(u => (
                          <button key={u.id} onClick={() => setSelectedUserForException(u)} className="w-full px-4 py-3 flex justify-between items-center hover:bg-blue-50 transition-colors text-left">
                            <div><p className="text-[13px] font-bold text-slate-800">{u.name}</p><p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{u.part} • {u.id}</p></div>
                            <span className="text-blue-500 font-bold">+</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-200">
                        <div><p className="text-xs font-black text-slate-800">{selectedUserForException.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{selectedUserForException.id}</p></div>
                        <button onClick={() => setSelectedUserForException(null)} className="text-[10px] font-black text-red-500 uppercase">Hủy</button>
                      </div>
                      <input type="text" value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} placeholder="Lý do vắng mặt (vd: Nghỉ ốm, Thai sản...)" className="w-full px-4 py-3.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm font-medium transition-all" />
                      <button onClick={handleAddException} disabled={!absenceReason.trim()} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 disabled:opacity-30 disabled:shadow-none transition-all">Xác nhận vắng mặt</button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách ngoại lệ hiện tại ({exceptionModalCourse.exceptions?.length || 0})</p>
                  <div className="space-y-2.5">
                    {exceptionModalCourse.exceptions && exceptionModalCourse.exceptions.length > 0 ? (
                      exceptionModalCourse.exceptions.map(ex => {
                        const user = users.find(u => u.id === ex.userId);
                        return (
                          <div key={ex.userId} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all">
                            <div className="flex-1"><p className="text-[13px] font-black text-slate-800">{user?.name || 'Unknown'}</p><div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ex.userId}</span><span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">{ex.reason}</span></div></div>
                            <button onClick={() => onRemoveException(exceptionModalCourse.id, ex.userId)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                          </div>
                        );
                      })
                    ) : ( <div className="py-10 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chưa có trường hợp vắng mặt nào</p></div> )}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Course Delete Confirmation */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[400] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></div>
             <h3 className="text-lg font-bold text-slate-800 mb-2 uppercase tracking-tight">Xóa khóa học?</h3>
             <p className="text-slate-500 text-sm mb-8 leading-relaxed">Hành động này sẽ xóa toàn bộ dữ liệu xác nhận của <span className="font-bold">{courseToDelete.name}</span>.</p>
             <div className="flex flex-col gap-3">
                <button onClick={confirmDeleteCourse} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-red-100 active:scale-95 transition-all">Xóa ngay</button>
                <button onClick={() => setCourseToDelete(null)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] active:bg-slate-100 transition-colors">Quay lại</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActingCoursesTab;
