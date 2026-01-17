
import React, { useState, useRef } from 'react';
import { User, CompanyType } from '../../types';
import { DEFAULT_PASSWORD } from '../../constants';

interface UserManagementTabProps {
  users: User[];
  onDelete: (id: string) => void;
  onAdd: (u: User) => void;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ users, onDelete, onAdd }) => {
  const [subTab, setSubTab] = useState<CompanyType>('sev');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newPart, setNewPart] = useState('');
  const [newGroupOrCompany, setNewGroupOrCompany] = useState('');

  const filteredUsers = users.filter(u => 
    u.company === subTab && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search))
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (subTab === 'sev' && newId.length !== 8) {
      // In a real app, we'd use a custom Toast/Alert here too
      console.warn('id SEV phải đủ 8 số.');
      return;
    }
    if (subTab === 'vendor' && newId.length !== 12) {
      console.warn('CCCD phải đủ 12 số.');
      return;
    }

    onAdd({
      name: newName,
      id: newId,
      part: newPart,
      group: newGroupOrCompany,
      company: subTab as 'sev' | 'vendor',
      role: 'user',
      password: DEFAULT_PASSWORD
    });

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewId('');
    setNewPart('');
    setNewGroupOrCompany('');
  };

  const formatPart = (part: string) => {
    if (part === "Injection Innovation Support T/F") return "T/F";
    return part;
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDelete(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        let count = 0;
        data.forEach((row: any) => {
          const name = row.name || row.Name || row["Họ tên"];
          const id = String(row.id || row.ID || row["Mã số"] || row["CCCD"]);
          const part = row.part || row.Part || row["Bộ phận"];
          const group = row.group || row.Group || row["Nhóm"] || row.Company || row["Công ty"];

          if (name && id && id !== "undefined") {
            onAdd({
              name,
              id,
              part: part || "N/A",
              group: group || 'N/A',
              company: subTab as 'sev' | 'vendor',
              role: 'user',
              password: DEFAULT_PASSWORD
            });
            count++;
          }
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setSubTab('sev')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${subTab === 'sev' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-400'}`}
          >
            NHÂN VIÊN SEV
          </button>
          <button 
            onClick={() => setSubTab('vendor')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${subTab === 'vendor' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-400'}`}
          >
            NHÀ CUNG CẤP
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
            <input 
              type="text" 
              placeholder={`Tìm theo tên hoặc ID...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 text-white px-5 rounded-xl font-bold text-[11px] active:scale-95 transition-all uppercase tracking-wider shadow-sm flex items-center gap-2"
          >
            <span>+</span> THÊM
          </button>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold text-[9px] uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all bg-white active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>📂</span> NHẬP TỪ EXCEL
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".xlsx, .xls" 
          onChange={handleImportExcel} 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="mobile-table-wrapper">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="w-12 px-4 py-4">STT</th>
                <th className="px-4 py-4">HỌ TÊN / BỘ PHẬN</th>
                <th className="w-24 px-4 py-4">{subTab === 'sev' ? 'ID' : 'CCCD'}</th>
                <th className="w-28 px-4 py-4">NHÓM</th>
                <th className="w-16 px-4 py-4 text-right">TÁC VỤ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u, i) => (
                <tr key={u.id} className="active:bg-slate-50 transition-colors flex flex-col sm:table-row p-4 sm:p-0 relative group">
                  <td className="hidden sm:table-cell px-4 py-5 text-slate-400 text-[10px] font-semibold">{i + 1}</td>
                  
                  <td className="px-0 sm:px-4 py-0 sm:py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className="sm:hidden text-[9px] font-bold text-slate-300 uppercase">No.{i + 1}</span>
                         <p className="font-bold text-slate-800 text-[14px] sm:text-sm truncate leading-tight">{u.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {formatPart(u.part)}
                        </span>
                        <span className="sm:hidden text-[10px] text-slate-400 font-medium">
                          • {u.company === 'sev' ? 'ID' : 'CCCD'}: {u.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="hidden sm:table-cell px-4 py-5 text-slate-500 font-semibold text-xs">{u.id}</td>

                  <td className="px-0 sm:px-4 py-2 sm:py-5 text-slate-500 font-medium text-[11px] flex items-center gap-2">
                    <span className="sm:hidden text-slate-300 uppercase text-[9px] font-bold tracking-widest">Nhóm:</span>
                    {u.group}
                  </td>

                  <td className="px-0 sm:px-4 py-1 sm:py-5 sm:text-right flex sm:table-cell">
                    <button 
                      onClick={() => setUserToDelete(u)}
                      className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 w-9 h-9 flex items-center justify-center bg-red-50 text-red-400 rounded-xl active:bg-red-500 active:text-white transition-all sm:ml-auto group-hover:bg-red-500 group-hover:text-white"
                      title="Xóa nhân viên"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">
                    Dữ liệu trống
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[300] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3>
             <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Bạn có chắc chắn muốn xóa nhân viên <span className="font-bold text-slate-700">{userToDelete.name}</span> khỏi hệ thống? Hành động này không thể hoàn tác.
             </p>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-red-100 active:scale-95 transition-all"
                >
                  Đồng ý xóa
                </button>
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] active:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
             </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center p-0 z-[200] animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] p-6 sm:p-8 animate-slide-up shadow-2xl flex flex-col max-h-[92vh]">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Thêm {subTab === 'sev' ? 'Nhân viên SEV' : 'Nhà cung cấp'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-800 text-2xl p-2 transition-colors">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 overflow-y-auto flex-1 pb-10 scrollbar-hide">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-semibold text-slate-700 text-sm"
                  placeholder="Nhập họ tên đầy đủ"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {subTab === 'sev' ? 'Mã nhân viên (8 số)' : 'CCCD (12 số)'}
                  </label>
                  <input 
                    type="text" 
                    maxLength={subTab === 'sev' ? 8 : 12}
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-semibold text-slate-700 text-sm"
                    placeholder={subTab === 'sev' ? 'Nhập MSNV' : 'Nhập 12 số CCCD'}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bộ phận (Part)</label>
                  <input 
                    type="text"
                    value={newPart}
                    onChange={(e) => setNewPart(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-semibold text-slate-700 text-sm"
                    placeholder="VD: IQC G, T/F..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nhóm / Công ty</label>
                <input 
                  type="text" 
                  value={newGroupOrCompany}
                  onChange={(e) => setNewGroupOrCompany(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-semibold text-slate-700 text-sm"
                  placeholder="Nhập tên nhóm hoặc vendor"
                  required
                />
              </div>

              <div className="flex gap-4 pt-6 safe-area-bottom">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-[10px] active:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  Lưu nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
