
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
  const [subTab, setSubTab] = useState<'sev' | 'vendor' | 'target'>('sev');
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const getStatus = (course: Course): CourseStatus => {
    const now = new Date();
    const start = new Date(course.start);
    const end = new Date(course.end);
    
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === course.target && u.role === 'user');
    }

    const isFinished = targetUsers.length > 0 && course.completions.length === targetUsers.length;

    if (now < start) return 'Plan';
    if (isFinished) return 'Closed';
    if (now > end && !isFinished) return 'Pending';
    return 'Opening';
  };

  const filteredCourses = courses.filter(c => {
    const status = getStatus(c);
    return (status === 'Plan' || status === 'Opening' || status === 'Pending') && c.target === subTab;
  });

  const getUnfinishedCount = (course: Course, partName: string) => {
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id) && u.part === partName);
    } else {
      targetUsers = users.filter(u => u.company === course.target && u.role === 'user' && u.part === partName);
    }
    const finishedIds = new Set(course.completions.map(comp => comp.userId));
    return targetUsers.filter(u => !finishedIds.has(u.id)).length;
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      onDelete(courseToDelete.id);
      setCourseToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        {(['sev', 'vendor', 'target'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all border ${subTab === tab ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            {tab === 'sev' ? 'SEV' : tab === 'vendor' ? 'VENDORS' : 'TARGETS'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                <th className="px-6 py-4">STT</th>
                <th className="px-6 py-4">Khóa đào tạo</th>
                <th className="px-6 py-4">Bắt đầu</th>
                <th className="px-6 py-4">Kết thúc</th>
                <th className="px-4 py-4 text-center">G</th>
                <th className="px-4 py-4 text-center">1P</th>
                <th className="px-4 py-4 text-center">2P</th>
                <th className="px-4 py-4 text-center">3P</th>
                <th className="px-4 py-4 text-center">TF</th>
                <th className="px-6 py-4 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 text-slate-400 font-medium text-xs">{i + 1}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <button className="text-slate-800 font-semibold hover:text-blue-600 text-left transition-colors text-sm">
                        {c.name}
                      </button>
                      <span className={`w-fit mt-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${
                        getStatus(c) === 'Pending' ? 'bg-red-50 text-red-500' : 
                        getStatus(c) === 'Opening' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {getStatus(c)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-xs font-medium">{c.start}</td>
                  <td className="px-6 py-5 text-slate-500 text-xs font-medium">{c.end}</td>
                  <td className="px-4 py-5 text-center font-bold text-red-500 text-xs">{getUnfinishedCount(c, "IQC G")}</td>
                  <td className="px-4 py-5 text-center font-bold text-red-500 text-xs">{getUnfinishedCount(c, "IQC 1P")}</td>
                  <td className="px-4 py-5 text-center font-bold text-red-500 text-xs">{getUnfinishedCount(c, "IQC 2P")}</td>
                  <td className="px-4 py-5 text-center font-bold text-red-500 text-xs">{getUnfinishedCount(c, "IQC 3P")}</td>
                  <td className="px-4 py-5 text-center font-bold text-red-500 text-xs">{getUnfinishedCount(c, "Injection Innovation Support T/F")}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-green-50 hover:text-green-500 transition-colors"
                        onClick={() => console.log('Exporting pending list...')}
                      >
                        📊
                      </button>
                      <button 
                        className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                        onClick={() => setCourseToDelete(c)}
                      >
                        🗑️
                      </button>
                      <button 
                        onClick={() => onToggle(c.id)}
                        className={`px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${c.isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                      >
                        {c.isActive ? 'On' : 'Off'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center text-slate-300 font-medium text-xs uppercase tracking-widest">Không có dữ liệu hiển thị</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Course Delete */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[300] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2 uppercase tracking-tight">Xóa khóa học?</h3>
             <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Xác nhận xóa khóa đào tạo <span className="font-bold text-slate-700">{courseToDelete.name}</span>? Mọi dữ liệu ký xác nhận liên quan cũng sẽ bị mất.
             </p>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDeleteCourse}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-lg shadow-red-100"
                >
                  Xác nhận xóa
                </button>
                <button 
                  onClick={() => setCourseToDelete(null)}
                  className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] active:bg-slate-100 transition-colors"
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
