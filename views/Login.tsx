
import React, { useState } from 'react';
import { User, CompanyType } from '../types';
import { DEFAULT_PASSWORD } from '../constants';

interface LoginProps {
  onLogin: (id: string, pass: string) => boolean;
  onRegister: (user: Omit<User, 'role' | 'password'>) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regId, setRegId] = useState('');
  const [regPart, setRegPart] = useState('');
  const [regGroupOrCompany, setRegGroupOrCompany] = useState('');
  const [regCompanyType, setRegCompanyType] = useState<CompanyType>('sev');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(userId, password)) {
      setError('');
    } else {
      setError('ID hoặc mật khẩu không chính xác.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regCompanyType === 'sev' && regId.length !== 8) {
      setError('id must be 8 digits.');
      return;
    }
    if (regCompanyType === 'vendor' && regId.length !== 12) {
      setError('CCCD must be 12 digits.');
      return;
    }

    onRegister({
      name: regName,
      id: regId,
      part: regPart,
      group: regGroupOrCompany,
      company: regCompanyType
    });

    setIsRegistering(false);
    setError('');
    alert(`Registration Successful!\nDefault Password: ${DEFAULT_PASSWORD}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-100"></div>
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h2 className="text-2xl app-title-font text-slate-800 leading-none mb-2">
            IQC TRAINING PRO
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-slate-100"></span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Training Confirmation System
            </p>
            <span className="h-px w-6 bg-slate-100"></span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-xl rounded-[1.5rem] p-8">
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1">User id</label>
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="Enter your id"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-[11px] font-medium text-center">{error}</p>
              )}

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center text-xs font-medium text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" className="mr-2 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember
                </label>
                <button 
                  type="button" 
                  onClick={() => alert(`Mật khẩu mặc định là: ${DEFAULT_PASSWORD}`)}
                  className="text-xs text-blue-600 font-semibold"
                >
                  Forgot?
                </button>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold uppercase tracking-widest active:opacity-90 transition-all text-sm">
                Login
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-blue-600"
                >
                  Create new account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setIsRegistering(false)} className="text-slate-300 active:text-blue-600 p-2 text-lg">←</button>
                <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Register Account</h3>
              </div>

              <div className="flex p-1 bg-slate-50 rounded-xl mb-4">
                <button 
                  type="button"
                  onClick={() => { setRegCompanyType('sev'); setRegId(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${regCompanyType === 'sev' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                >
                  SEV
                </button>
                <button 
                  type="button"
                  onClick={() => { setRegCompanyType('vendor'); setRegId(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all ${regCompanyType === 'vendor' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                >
                  VENDOR
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">name</label>
                  <input 
                    type="text" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700"
                    placeholder="Full name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                      {regCompanyType === 'sev' ? 'id' : 'CCCD'}
                    </label>
                    <input 
                      type="text" 
                      maxLength={regCompanyType === 'sev' ? 8 : 12}
                      value={regId}
                      onChange={(e) => setRegId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium"
                      placeholder={regCompanyType === 'sev' ? '8 digits' : '12 digits'}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">part</label>
                    <input 
                      type="text"
                      value={regPart}
                      onChange={(e) => setRegPart(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700"
                      placeholder="Enter part"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">group / company</label>
                  <input 
                    type="text" 
                    value={regGroupOrCompany}
                    onChange={(e) => setRegGroupOrCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700"
                    placeholder="Enter group or company"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl mt-4 font-semibold uppercase tracking-widest active:opacity-90 transition-all text-xs shadow-lg shadow-blue-50">
                Register
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center mt-12 text-[9px] text-slate-300 font-semibold uppercase tracking-[0.4em]">
          © 2025 IQC QUALITY CONTROL
        </p>
      </div>
    </div>
  );
};

export default Login;
