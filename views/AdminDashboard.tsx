
import React, { useState } from 'react';
import { AppState, Course, User, CourseException } from '../types';
import CreateCourseTab from './admin/CreateCourseTab';
import ActingCoursesTab from './admin/ActingCoursesTab';
import FinishedCoursesTab from './admin/FinishedCoursesTab';
import UserManagementTab from './admin/UserManagementTab';

interface AdminDashboardProps {
  state: AppState;
  onLogout: () => void;
  onAddCourse: (c: Omit<Course, 'id' | 'completions'>) => void;
  onBulkAddUsers: (users: User[]) => void;
  onUpdateCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onToggleCourseActive: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onAddUser: (u: User, courseIds?: string[]) => void;
  onAddException: (courseId: string, exception: CourseException) => void;
  onRemoveException: (courseId: string, userId: string) => void;
  onPushReminder: (courseId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  state, onLogout, onAddCourse, onBulkAddUsers, onUpdateCourse, onDeleteCourse, onToggleCourseActive, onDeleteUser, onAddUser, onAddException, onRemoveException, onPushReminder
}) => {
  const [activeTab, setActiveTab] = useState(1);

  const tabs = [
    { title: 'Tạo mới', icon: '📝', id: 0 },
    { title: 'Đang chạy', icon: '⚡', id: 1 },
    { title: 'Kết thúc', icon: '📁', id: 2 },
    { title: 'Nhân sự', icon: '👥', id: 3 }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-slate-900 text-white safe-area-top shadow-sm z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <h1 className="text-lg font-bold tracking-tight uppercase">IQC TRAINING</h1>
             <span className="text-[9px] font-semibold bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">Admin Portal</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl active:bg-red-500 transition-all border border-white/10 text-white/70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 0 && (
            <CreateCourseTab 
              allUsers={state.users}
              onAdd={onAddCourse} 
              onBulkAddUsers={onBulkAddUsers} 
              onSuccess={() => setActiveTab(1)} 
            />
          )}
          {activeTab === 1 && (
            <ActingCoursesTab 
              courses={state.courses} 
              users={state.users} 
              onUpdate={onUpdateCourse}
              onDelete={onDeleteCourse}
              onToggle={onToggleCourseActive}
              onAddException={onAddException}
              onRemoveException={onRemoveException}
              onPushReminder={onPushReminder}
            />
          )}
          {activeTab === 2 && <FinishedCoursesTab courses={state.courses} users={state.users} />}
          {activeTab === 3 && (
            <UserManagementTab 
              users={state.users} 
              courses={state.courses}
              onDelete={onDeleteUser}
              onAdd={onAddUser}
            />
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-area-bottom z-50 shadow-sm">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider">{tab.title}</span>
              {activeTab === tab.id && <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminDashboard;
