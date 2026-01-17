
import React from 'react';
import { Course, User, CourseStatus } from '../../types';

interface FinishedCoursesTabProps {
  courses: Course[];
  users: User[];
}

const FinishedCoursesTab: React.FC<FinishedCoursesTabProps> = ({ courses, users }) => {
  const getStatus = (course: Course): CourseStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    if (isFinished || today > end) return 'Finished';
    return 'Opening';
  };

  const finishedCourses = courses.filter(c => getStatus(c) === 'Finished');

  const getStats = (course: Course) => {
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === (course.target === 'target' ? 'sev' : course.target) && u.role === 'user');
    }

    const signedCount = course.completions.length;
    const totalCount = targetUsers.length;
    const percentage = totalCount > 0 ? Math.round((signedCount / totalCount) * 100) : 0;
    return { signedCount, totalCount, percentage };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Archived Courses</h3>
        <span className="text-[10px] bg-slate-800 text-white px-3 py-1 rounded-full font-bold shadow-sm">{finishedCourses.length} khóa đã đóng</span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {finishedCourses.map((c) => {
          const { signedCount, totalCount, percentage } = getStats(c);

          return (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all active:scale-[0.995]">
              {/* Card Header */}
              <div className="p-7 pb-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500">
                      Finished
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {c.target === 'sev' ? 'SEV' : c.target === 'vendor' ? 'Vendor' : 'Target'}
                    </span>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 leading-tight mb-4">{c.name}</h4>
                
                <div className="flex items-center gap-5 text-slate-400 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📅</span>
                    <span>{c.start}</span>
                  </div>
                  <span className="text-slate-200">→</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏁</span>
                    <span>{c.end}</span>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="px-7 py-6 bg-slate-50/40 border-y border-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Completion Status</p>
                  <span className="text-[11px] font-black text-slate-800">
                    {signedCount} / {totalCount} Nhân viên
                  </span>
                </div>
                
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% Success Rate</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-7 flex items-center justify-between">
                <div className="flex-1 pr-4">
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-snug">
                     Dữ liệu đã được lưu trữ an toàn trong cơ sở dữ liệu hệ thống.
                   </p>
                </div>
                <button 
                  onClick={() => alert(`Đang tạo file PDF: ${c.end.replace(/-/g, '')}_${c.name}.pdf`)}
                  className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Xuất Báo Cáo
                </button>
              </div>
            </div>
          );
        })}

        {finishedCourses.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl opacity-30">📂</span>
            </div>
            <p className="text-slate-300 font-bold uppercase text-[11px] tracking-[0.5em]">No archived data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinishedCoursesTab;
