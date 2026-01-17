
import React, { useState } from 'react';
import { AppState, Course } from '../types';
import SignaturePad from '../components/SignaturePad';

interface UserDashboardProps {
  state: AppState;
  onLogout: () => void;
  onSign: (courseId: string, signature: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ state, onLogout, onSign }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const pendingCourses = state.courses.filter(c => {
    const now = new Date();
    const start = new Date(c.start);
    const end = new Date(c.end);
    
    // Check if user is in target group
    let isTargetMember = false;
    if (c.target === 'target') {
      isTargetMember = c.assignedUserIds?.includes(state.currentUser?.id || '') || false;
    } else {
      isTargetMember = c.target === state.currentUser?.company;
    }

    const isOpening = now >= start && now <= end && c.isActive;
    const hasSigned = c.completions.some(comp => comp.userId === state.currentUser?.id);
    
    return isTargetMember && isOpening && !hasSigned;
  });

  const handleSign = () => {
    if (!selectedCourse || !signatureData || !hasAgreed) return;
    onSign(selectedCourse.id, signatureData);
    setSelectedCourse(null);
    setHasAgreed(false);
    setSignatureData(null);
    alert('Ký xác nhận thành công!');
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <header className="bg-white border-b border-slate-100 safe-area-top z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex flex-col">
             <h2 className="text-lg font-bold text-slate-800 leading-none uppercase tracking-tight">IQC TRAINING</h2>
             <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-700 uppercase">{state.currentUser?.name}</p>
              <p className="text-[9px] font-medium text-slate-400">{state.currentUser?.id}</p>
            </div>
            <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 active:text-red-600 transition-colors">🚪</button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
             <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
             <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Khóa đào tạo cần ký</h3>
          </div>

          <div className="grid gap-3">
            {pendingCourses.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCourse(c)}
                className="bg-white rounded-xl p-5 border border-slate-200 active:border-blue-300 active:bg-blue-50/30 transition-all flex justify-between items-center group"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 group-active:text-blue-600 text-sm">{c.name}</h4>
                  <div className="flex gap-3 text-[10px] font-medium text-slate-400 uppercase">
                    <span>Hạn kết thúc: {c.end}</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  →
                </div>
              </div>
            ))}
            
            {pendingCourses.length === 0 && (
              <div className="text-center py-20 px-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest leading-loose">
                  Hôm nay bạn không có<br/>khóa đào tạo nào cần ký.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedCourse && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end">
          <div className="bg-white w-full h-[94vh] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-4"></div>
            
            <div className="px-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-base font-bold text-slate-800 uppercase leading-tight max-w-[85%]">
                {selectedCourse.name}
              </h3>
              <button onClick={() => setSelectedCourse(null)} className="text-slate-300 text-xl p-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
                {selectedCourse.content}
              </div>

              <div className="space-y-6">
                <label className="flex items-start gap-4 p-5 bg-blue-50 rounded-xl border border-blue-100 active:scale-[0.99] transition-transform cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span className="font-semibold text-blue-700 uppercase text-[10px] tracking-tight leading-normal">
                    Tôi cam kết đã đọc, hiểu và tuân thủ các nội dung đào tạo nêu trên.
                  </span>
                </label>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Ký tên điện tử</p>
                  <SignaturePad onSave={(data) => setSignatureData(data)} />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 safe-area-bottom">
              <button 
                disabled={!hasAgreed || !signatureData}
                onClick={handleSign}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold uppercase tracking-widest shadow-lg disabled:opacity-20 disabled:shadow-none transition-all text-xs"
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
