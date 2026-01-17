
import React, { useState } from 'react';
import { Course, User, CourseStatus } from '../../types';

interface ActingCoursesTabProps {
  courses: Course[];
  users: User[];
  onUpdate: (c: Course) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const ActingCoursesTab: React.FC<ActingCoursesTabProps> = ({ courses, users, onUpdate, onDelete, onToggle }) => {
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const getStatus = (course: Course): CourseStatus => {
    // Normalize current date to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize course dates to start of day
    const start = new Date(course.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(course.end);
    end.setHours(0, 0, 0, 0);
    
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === (course.target === 'target' ? 'sev' : course.target) && u.role === 'user');
    }

    const isFinished = targetUsers.length > 0 && course.completions.length === targetUsers.length;

    if (today < start) return 'Plan';
    if (isFinished) return 'Closed';
    // Only pending if TODAY is strictly after END DATE
    if (today > end && !isFinished) return 'Pending';
    return 'Opening';
  };

  const activeCourses = courses.filter(c => {
    const status = getStatus(c);
    return status === 'Plan' || status === 'Opening' || status === 'Pending';
  });

  const getUnfinishedUsers = (course: Course) => {
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === (course.target === 'target' ? 'sev' : course.target) && u.role === 'user');
    }
    const finishedIds = new Set(course.completions.map(comp => comp.userId));
    return targetUsers.filter(u => !finishedIds.has(u.id));
  };

  const getOverallProgress = (course: Course) => {
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === (course.target === 'target' ? 'sev' : course.target) && u.role === 'user');
    }
    if (targetUsers.length === 0) return 0;
    return Math.round((course.completions.length / targetUsers.length) * 100);
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      onDelete(courseToDelete.id);
      setCourseToDelete(null);
    }
  };

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
            unfinishedUsers.forEach(u => {
              companyCounts[u.group] = (companyCounts[u.group] || 0) + 1;
            });
            statsToDisplay = Object.entries(companyCounts)
              .map(([label, val]) => ({ label, val }))
              .sort((a, b) => b.val - a.val)
              .slice(0, 10);
          } else {
            const parts = ["IQC G", "IQC 1P", "IQC 2P", "IQC 3P", "Injection Innovation Support T/F"];
            const labelsMap: Record<string, string> = {
              "IQC G": "G",
              "IQC 1P": "1P",
              "IQC 2P": "2P",
              "IQC 3P": "3P",
              "Injection Innovation Support T/F": "TF"
            };
            
            statsToDisplay = parts.map(p => ({
              label: labelsMap[p] || p,
              val: unfinishedUsers.filter(u => u.part === p).length
            }));
          }

          return (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all active:scale-[0.995]">
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
                      {c.target}
                    </span>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-900 leading-tight mb-4">{c.name}</h4>
                
                <div className="flex items-center gap-5 text-slate-400 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📅</span>
                    <span>{c.start}</span>
                  </div>
                  <span className="text-slate-200">→</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏁</span>
                    <span className={status === 'Pending' ? 'text-red-500' : ''}>{c.end}</span>
                  </div>
                </div>
              </div>

              <div className="px-7 py-5 bg-slate-50/40 border-y border-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{groupingLabel}</p>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                      {progress}% Done
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {statsToDisplay.map(s => (
                    <div 
                      key={s.label} 
                      className={`flex flex-col items-center justify-center min-w-[50px] flex-1 p-2.5 rounded-2xl border transition-all ${
                        s.val > 0 ? 'bg-white border-red-100 shadow-sm' : 'bg-slate-50/50 border-transparent opacity-30'
                      }`}
                    >
                      <span className={`text-[9px] font-black mb-1 uppercase tracking-tighter truncate w-full text-center ${s.val > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                      <span className={`text-sm font-black ${s.val > 0 ? 'text-red-600' : 'text-slate-200'}`}>
                        {s.val}
                      </span>
                    </div>
                  ))}
                  {statsToDisplay.length === 0 && (
                    <p className="w-full text-center py-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">
                      All users completed
                    </p>
                  )}
                </div>
              </div>

              <div className="p-7 flex items-center justify-between">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCourseToDelete(c)}
                    className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-[1.2rem] active:bg-red-500 active:text-white transition-all shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                  <button 
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-[1.2rem] active:scale-95 transition-all shadow-lg"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${c.isActive ? 'text-blue-600' : 'text-slate-300'}`}>
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                  <button 
                    onClick={() => onToggle(c.id)}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${c.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${c.isActive ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-100">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {activeCourses.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl opacity-50">🍃</span>
            </div>
            <p className="text-slate-300 font-bold uppercase text-[11px] tracking-[0.5em]">No active campaigns</p>
          </div>
        )}
      </div>

      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[300] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-9 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-tight">Xóa khóa học?</h3>
             <p className="text-slate-500 text-sm mb-9 leading-relaxed px-2">
                Bạn có chắc chắn muốn xóa khóa đào tạo này? Mọi dữ liệu chữ ký đã thu thập sẽ bị <span className="text-red-500 font-bold">mất vĩnh viễn</span>.
             </p>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDeleteCourse}
                  className="w-full bg-red-500 text-white py-4.5 rounded-[1.5rem] font-bold uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-lg shadow-red-200"
                >
                  Xác nhận xóa
                </button>
                <button 
                  onClick={() => setCourseToDelete(null)}
                  className="w-full bg-slate-100 text-slate-400 py-4.5 rounded-[1.5rem] font-bold uppercase tracking-widest text-[11px] active:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActingCoursesTab;
