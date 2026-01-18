
import React, { useState, useEffect } from 'react';
import { AppState, Course, Notification as AppNotification } from '../types';
import SignaturePad from '../components/SignaturePad';
// Fix: Import GoogleGenAI to add AI summary feature
import { GoogleGenAI } from "@google/genai";

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
  const [notifPermission, setNotifPermission] = useState<string>(Notification.permission);
  
  // State for AI Summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const notifications = state.currentUser?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const pendingCourses = state.courses.filter(c => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(c.start);
    const end = new Date(c.end);
    const userId = state.currentUser?.id || '';
    const isTargetMember = c.assignedUserIds?.includes(userId) || false;
    const isOpening = today >= start && today <= end && c.isActive;
    const isOverdue = today > end && c.isActive;
    const hasException = c.exceptions?.some(ex => ex.userId === userId) || false;
    const hasSigned = c.completions.some(comp => comp.userId === userId);
    return isTargetMember && (isOpening || isOverdue) && !hasException && !hasSigned;
  });

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification("IQC Training Pro", { body: "Thông báo đẩy đã được kích hoạt!" });
    }
  };

  // Function to generate AI summary
  const generateSummary = async (content: string) => {
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Hãy tóm tắt nội dung đào tạo sau đây thành 3 ý chính ngắn gọn, súc tích bằng tiếng Việt: \n\n${content}`,
      });
      setAiSummary(response.text || "Không thể tạo tóm tắt.");
    } catch (error) {
      console.error("Gemini summary failed:", error);
      setAiSummary("Lỗi khi tạo tóm tắt. Vui lòng thử lại sau.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSign = () => {
    if (!selectedCourse || !signatureData || !hasAgreed) return;
    onSign(selectedCourse.id, signatureData);
    setSelectedCourse(null);
    setHasAgreed(false);
    setSignatureData(null);
    setAiSummary(null);
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
             <h2 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tighter">IQC PRO</h2>
             <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{state.currentUser?.company === 'sev' ? 'SEV Staff' : 'Vendor Staff'}</span>
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
          {/* Dashboard Info Card */}
          <div className="bg-[#0047BB] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] mb-1">Xin chào,</p>
             <h3 className="text-2xl font-black truncate mb-6">{state.currentUser?.name}</h3>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                   <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Employee ID</p>
                   <p className="text-xs font-black tracking-tight">{state.currentUser?.id}</p>
                </div>
                <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                   <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Bộ phận</p>
                   <p className="text-xs font-black truncate">{state.currentUser?.part}</p>
                </div>
             </div>
          </div>

          {/* Notification Permission Request */}
          {notifPermission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              className="w-full p-5 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all"
            >
               <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-xs font-black text-orange-600 uppercase tracking-tight">Kích hoạt thông báo Push</p>
                    <p className="text-[10px] text-orange-400 font-bold">Để không bỏ lỡ thông báo đào tạo</p>
                  </div>
               </div>
               <span className="text-orange-300 font-black text-lg">›</span>
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-6 px-2">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Khóa cần xác nhận</h3>
               <span className={`text-[10px] font-black px-3 py-1 rounded-full ${pendingCourses.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                 {pendingCourses.length}
               </span>
            </div>
            
            <div className="grid gap-5">
              {pendingCourses.map((c) => (
                <div key={c.id} onClick={() => { setSelectedCourse(c); setAiSummary(null); }} className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm active:scale-[0.97] transition-all flex justify-between items-center group overflow-hidden">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-lg">Chưa ký</span>
                    </div>
                    <h4 className="font-black text-slate-800 text-base leading-tight group-active:text-blue-600 transition-colors mb-3">{c.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span>🏁 Hạn:</span>
                      <span className="text-slate-600">{c.end}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#0047BB] group-hover:text-white transition-all shadow-inner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              ))}
              
              {pendingCourses.length === 0 && (
                <div className="text-center py-24 px-8 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl grayscale opacity-50">✨</span></div>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {notifications.length > 0 ? notifications.map(n => (
                 <div key={n.id} className={`p-6 rounded-[2rem] border transition-all ${n.type === 'reminder' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${n.type === 'reminder' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                         {n.type === 'reminder' ? 'Nhắc nhở' : 'Khóa học'}
                       </span>
                       <span className="text-[9px] font-bold text-slate-300">
                         {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className={`text-sm font-bold leading-relaxed ${n.type === 'reminder' ? 'text-red-900' : 'text-slate-800'}`}>
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
              <div className="flex-1">
                <p className="text-[10px] font-black text-[#0047BB] uppercase tracking-[0.2em] mb-1">Chi tiết đào tạo</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedCourse.name}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ml-4">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-9 py-8 space-y-8">
              <div className="bg-slate-50 p-7 rounded-[2.5rem] text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap border border-slate-100/50 shadow-inner">
                {selectedCourse.content}
              </div>

              {/* Gemini AI Summary Section */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">Gemini AI Tóm tắt</p>
                  </div>
                  {!aiSummary && !isSummarizing && (
                    <button 
                      onClick={() => generateSummary(selectedCourse.content)}
                      className="text-[9px] font-black uppercase bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all"
                    >
                      Tạo tóm tắt
                    </button>
                  )}
                </div>
                {isSummarizing ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p className="text-[10px] font-bold italic opacity-70">Đang tóm tắt nội dung...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="text-[11px] font-bold leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-500">
                    {aiSummary}
                  </div>
                ) : (
                  <p className="text-[9px] font-medium opacity-60">Nhấn nút để xem tóm tắt thông minh từ AI giúp bạn nắm bắt nhanh nội dung.</p>
                )}
              </div>

              <div className="space-y-8">
                <label className="flex items-start gap-4 p-7 bg-[#0047BB]/5 rounded-[2.5rem] border border-[#0047BB]/10 transition-all cursor-pointer">
                  <div className="relative flex items-center justify-center mt-1">
                    <input type="checkbox" checked={hasAgreed} onChange={(e) => setHasAgreed(e.target.checked)} className="peer w-6 h-6 rounded-lg appearance-none border-2 border-[#0047BB]/20 bg-white checked:bg-[#0047BB] transition-all" />
                    <svg className="absolute w-4 h-4 text-white pointer-events-none hidden peer-checked:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="font-black text-[#0047BB] uppercase text-[10px] tracking-tight leading-snug">Tôi cam kết đã học, hiểu và tuân thủ các nội dung nêu trên.</span>
                </label>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Chữ ký điện tử</p>
                   <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-4 shadow-inner">
                      <SignaturePad onSave={(data) => setSignatureData(data)} />
                   </div>
                </div>
              </div>
            </div>
            <div className="px-9 py-8 border-t border-slate-50 safe-area-bottom">
              <button 
                disabled={!hasAgreed || !signatureData} 
                onClick={handleSign} 
                className="w-full bg-[#0047BB] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 disabled:opacity-20 transition-all text-xs"
              >
                Xác nhận hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
