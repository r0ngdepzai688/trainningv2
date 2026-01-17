
import React, { useState } from 'react';
import { AppState, Course, Notification } from '../types';
import SignaturePad from '../components/SignaturePad';

interface UserDashboardProps {
  state: AppState;
  onLogout: () => void;
  onSign: (courseId: string, signature: string) => void;
  onMarkRead: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ state, onLogout, onSign, onMarkRead }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = state.currentUser?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const pendingCourses = state.courses.filter(c => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(c.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(c.end);
    end.setHours(0, 0, 0, 0);
    const userId = state.currentUser?.id || '';
    const isTargetMember = c.assignedUserIds?.includes(userId) || false;
    const isOpening = today >= start && today <= end && c.isActive;
    const isOverdue = today > end && c.isActive;
    const hasException = c.exceptions?.some(ex => ex.userId === userId) || false;
    const hasSigned = c.completions.some(comp => comp.userId === userId);
    return isTargetMember && (isOpening || isOverdue) && !hasException && !hasSigned;
  });

  const handleSign = () => {
    if (!selectedCourse || !signatureData || !hasAgreed) return;
    onSign(selectedCourse.id, signatureData);
    setSelectedCourse(null);
    setHasAgreed(false);
    setSignatureData(null);
    alert('Ký xác nhận thành công!');
  };

  const openNotifications = () => {
    setShowNotifications(true);
    onMarkRead();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-100 safe-area-top z-50 shadow-sm">
        <div className="px-6 py-5 flex justify-between items-center">
          <div className="flex flex-col">
             <h2 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tighter">IQC TRAINING</h2>
             <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online Portal</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={openNotifications}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:bg-blue-600 active:text-white transition-all relative shadow-inner"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              onClick={onLogout} 
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:bg-red-500 active:text-white transition-all shadow-inner"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-md mx-auto space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl sm:hidden relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
             <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-1">Welcome back,</p>
             <h3 className="text-xl font-black truncate mb-4">{state.currentUser?.name}</h3>
             <div className="flex justify-between items-center">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                   <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Employee ID</p>
                   <p className="text-sm font-black tracking-tight">{state.currentUser?.id}</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Part</p>
                   <p className="text-sm font-black">{state.currentUser?.part}</p>
                </div>
             </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6 px-2">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Khóa cần xác nhận</h3>
               <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full">{pendingCourses.length}</span>
            </div>
            <div className="grid gap-4">
              {pendingCourses.map((c) => (
                <div key={c.id} onClick={() => setSelectedCourse(c)} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm active:scale-[0.97] transition-all flex justify-between items-center group overflow-hidden">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-lg">Opening</span></div>
                    <h4 className="font-black text-slate-800 text-base leading-tight group-active:text-blue-600 transition-colors mb-3">{c.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400"><span>🏁 Hạn:</span><span className="text-slate-600">{c.end}</span></div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
                </div>
              ))}
              {pendingCourses.length === 0 && (
                <div className="text-center py-20 px-8 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-3xl grayscale opacity-50">🎉</span></div>
                  <h4 className="text-slate-800 font-black uppercase text-xs tracking-widest mb-2">Tuyệt vời!</h4>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] leading-loose">Bạn đã hoàn thành tất cả<br/>nội dung đào tạo hiện có.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Notification Sheet */}
      {showNotifications && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full h-[85vh] sm:h-auto sm:max-w-md rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Thông báo</h3>
               <button onClick={() => setShowNotifications(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
               {notifications.length > 0 ? notifications.map(n => (
                 <div key={n.id} className={`p-5 rounded-2xl border transition-all ${n.type === 'reminder' ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-1">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${n.type === 'reminder' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                         {n.type === 'reminder' ? 'Nhắc nhở' : 'Khóa học'}
                       </span>
                       <span className="text-[9px] font-bold text-slate-300">
                         {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className={`text-[13px] font-bold leading-relaxed ${n.type === 'reminder' ? 'text-orange-900' : 'text-slate-800'}`}>
                      {n.message}
                    </p>
                 </div>
               )) : (
                 <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Chưa có thông báo nào</div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="px-9 pb-6 pt-2 flex justify-between items-center border-b border-slate-50">
              <div className="flex-1"><p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Chi tiết khóa đào tạo</p><h3 className="text-xl font-black text-slate-900 leading-tight">{selectedCourse.name}</h3></div>
              <button onClick={() => setSelectedCourse(null)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ml-4">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-9 py-8 space-y-8">
              <div className="bg-slate-50 p-7 rounded-[2rem] text-slate-700 font-medium text-[15px] leading-relaxed whitespace-pre-wrap border border-slate-100/50 shadow-inner">{selectedCourse.content}</div>
              <div className="space-y-8">
                <label className="flex items-start gap-4 p-6 bg-blue-50/80 rounded-[2rem] border border-blue-100 transition-all cursor-pointer">
                  <div className="relative flex items-center justify-center mt-1"><input type="checkbox" checked={hasAgreed} onChange={(e) => setHasAgreed(e.target.checked)} className="peer w-6 h-6 rounded-lg appearance-none border-2 border-blue-200 bg-white checked:bg-blue-600 transition-all" /><svg className="absolute w-4 h-4 text-white pointer-events-none hidden peer-checked:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  <span className="font-black text-blue-700 uppercase text-[11px] tracking-tight leading-snug">Tôi cam kết đã đọc, hiểu và tuân thủ các nội dung đào tạo nêu trên.</span>
                </label>
                <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Chữ ký điện tử</p><div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-4 shadow-inner"><SignaturePad onSave={(data) => setSignatureData(data)} /></div></div>
              </div>
            </div>
            <div className="px-9 py-8 border-t border-slate-50 safe-area-bottom"><button disabled={!hasAgreed || !signatureData} onClick={handleSign} className="w-full bg-slate-900 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-20 transition-all text-xs">Xác nhận hoàn thành</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
