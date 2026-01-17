
import React, { useState, useRef } from 'react';
import { Course, CompanyType, User } from '../../types';
import { DEFAULT_PASSWORD } from '../../constants';

interface CreateCourseTabProps {
  allUsers: User[];
  onAdd: (c: Omit<Course, 'id' | 'completions'>) => void;
  onBulkAddUsers: (users: User[]) => void;
  onSuccess?: () => void;
}

const CreateCourseTab: React.FC<CreateCourseTabProps> = ({ allUsers, onAdd, onBulkAddUsers, onSuccess }) => {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<CompanyType>('sev');
  const [isActive, setIsActive] = useState(true);
  const [targetUsers, setTargetUsers] = useState<User[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTargetExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const XLSX = (window as any).XLSX;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // LOGIC FIX: Use a Map to ensure unique IDs from the Excel file
        const uniqueImportedMap = new Map<string, User>();
        
        data.forEach((row: any) => {
          const nameValue = row.name || row.Name || row["Họ tên"];
          const idValue = String(row.id || row.ID || row["Mã số"] || row["CCCD"]);
          const partValue = row.part || row.Part || row["Bộ phận"];
          const groupValue = row.group || row.Group || row["Nhóm"] || row.Company || row["Công ty"];
          
          const company: 'sev' | 'vendor' = (idValue.length === 8) ? 'sev' : 'vendor';

          if (nameValue && idValue && idValue !== "undefined") {
            uniqueImportedMap.set(idValue, {
              name: nameValue,
              id: idValue,
              part: partValue || "N/A",
              group: groupValue || 'N/A',
              company: company,
              role: 'user',
              password: DEFAULT_PASSWORD
            });
          }
        });

        const imported = Array.from(uniqueImportedMap.values());

        if (imported.length === 0) {
          alert('File Excel không có dữ liệu hợp lệ.');
          return;
        }

        // Check if all imported users exist in the system's user database
        const existingIds = new Set(allUsers.map(u => u.id));
        const missingUsers = imported.filter(u => !existingIds.has(u.id));

        if (missingUsers.length > 0) {
          const missingNames = missingUsers.slice(0, 3).map(u => `${u.name} (${u.id})`).join(', ');
          const suffix = missingUsers.length > 3 ? ` và ${missingUsers.length - 3} người khác` : '';
          alert(`Nhân viên không tồn tại, hãy đăng kí trước:\n${missingNames}${suffix}`);
          
          setTargetUsers([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setTargetUsers(imported);
        alert(`Đã nhận danh sách ${imported.length} nhân viên (duy nhất) từ file Excel.`);
      } catch (err) {
        console.error(err);
        alert('Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng (name, id, part, group).');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (target === 'target') {
      if (targetUsers.length === 0) {
        alert('Vui lòng import danh sách nhân viên cho đối tượng Target.');
        return;
      }

      // Final safety validation before submission
      const existingIds = new Set(allUsers.map(u => u.id));
      const missingUsers = targetUsers.filter(u => !existingIds.has(u.id));

      if (missingUsers.length > 0) {
        const missingNames = missingUsers.slice(0, 3).map(u => `${u.name} (${u.id})`).join(', ');
        const suffix = missingUsers.length > 3 ? ` và ${missingUsers.length - 3} người khác` : '';
        alert(`Nhân viên không tồn tại, hãy đăng kí trước:\n${missingNames}${suffix}`);
        return;
      }
      
      // Since they already exist, we don't strictly need to re-add them to global users
      // But we pass them to ensure the app state stays consistent
      onBulkAddUsers(targetUsers);
    }

    onAdd({
      name,
      start,
      end,
      content,
      target,
      // Ensure unique list one last time using Set
      assignedUserIds: target === 'target' ? Array.from(new Set(targetUsers.map(u => u.id))) : undefined,
      isActive
    });

    alert('Khóa học đã được tạo thành công!');
    
    setName('');
    setStart('');
    setEnd('');
    setContent('');
    setTargetUsers([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Tạo khóa đào tạo mới</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Tên khóa đào tạo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all"
              placeholder="Hãy nhập nội dung bằng tiếng Việt có dấu"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
              <input 
                type="date" 
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
              <input 
                type="date" 
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nội dung bài giảng</label>
            <textarea 
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all resize-none"
              placeholder="Nhập nội dung chi tiết hoặc dán dữ liệu vào đây..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Đối tượng áp dụng</label>
              <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                {(['sev', 'vendor', 'target'] as CompanyType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTarget(t)}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${
                      target === t ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-400'
                    }`}
                  >
                    {t === 'sev' ? 'SEV' : t === 'vendor' ? 'Vendor' : 'Target'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Cho phép ký xác nhận</label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${
                    !isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>

          {target === 'target' && (
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-widest">Danh sách Target (Excel)</h4>
                {targetUsers.length > 0 && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    {targetUsers.length} nhân viên
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-blue-200 bg-white rounded-xl text-blue-500 font-semibold text-xs uppercase tracking-widest hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                📂 {targetUsers.length > 0 ? 'Thay đổi File Excel' : 'Import File Excel Target'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleImportTargetExcel} 
              />
              {targetUsers.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 px-1">
                  {targetUsers.slice(0, 5).map((u, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                      <span>{u.name}</span>
                      <span className="font-bold">{u.id}</span>
                    </div>
                  ))}
                  {targetUsers.length > 5 && (
                    <p className="text-center text-[9px] text-slate-400 font-medium italic pt-1">... và {targetUsers.length - 5} người khác</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full py-5 bg-slate-900 text-white font-semibold rounded-xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
        >
          Tạo khóa học ngay
        </button>
      </form>
    </div>
  );
};

export default CreateCourseTab;
