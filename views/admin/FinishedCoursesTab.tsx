
import React from 'react';
import { Course, User, CourseStatus } from '../../types';

interface FinishedCoursesTabProps {
  courses: Course[];
  users: User[];
}

const FinishedCoursesTab: React.FC<FinishedCoursesTabProps> = ({ courses, users }) => {
  const getStatus = (course: Course): CourseStatus => {
    const now = new Date();
    const end = new Date(course.end);
    
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === course.target && u.role === 'user');
    }

    const isFinished = targetUsers.length > 0 && course.completions.length === targetUsers.length;

    if (isFinished || now > end) return 'Finished';
    return 'Opening';
  };

  const finishedCourses = courses.filter(c => getStatus(c) === 'Finished');

  const getStats = (course: Course) => {
    let targetUsers: User[] = [];
    if (course.target === 'target') {
      const assignedIds = new Set(course.assignedUserIds || []);
      targetUsers = users.filter(u => assignedIds.has(u.id));
    } else {
      targetUsers = users.filter(u => u.company === course.target && u.role === 'user');
    }

    const signedCount = course.completions.length;
    const totalCount = targetUsers.length;
    const percentage = totalCount > 0 ? Math.round((signedCount / totalCount) * 100) : 0;
    return { signedCount, totalCount, percentage };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Course Name</th>
              <th className="px-6 py-4">Start</th>
              <th className="px-6 py-4">End</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Finish Rate</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {finishedCourses.map((c, i) => {
              const { signedCount, totalCount, percentage } = getStats(c);
              return (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-slate-400 text-xs font-medium">{i + 1}</td>
                  <td className="px-6 py-5 font-semibold text-slate-800 text-sm">{c.name}</td>
                  <td className="px-6 py-5 text-slate-500 text-xs">{c.start}</td>
                  <td className="px-6 py-5 text-slate-500 text-xs">{c.end}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[8px] font-bold uppercase tracking-tight">
                      {c.target === 'sev' ? 'SEV' : c.target === 'vendor' ? 'VENDOR' : 'TARGET'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {signedCount}/{totalCount} ({percentage}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => alert(`Đang tạo file PDF: ${c.end.replace(/-/g, '')}_${c.name}.pdf`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-bold text-[10px] uppercase tracking-wider"
                    >
                      📄 PDF Report
                    </button>
                  </td>
                </tr>
              );
            })}
            {finishedCourses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-300 font-medium text-xs uppercase tracking-widest">
                  Chưa có khóa học nào kết thúc
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinishedCoursesTab;
