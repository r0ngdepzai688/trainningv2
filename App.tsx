
import React, { useState, useEffect, useCallback } from 'react';
import { User, Course, AppState, Completion, CompanyType, CourseStatus } from './types';
import { INITIAL_USERS, DEFAULT_PASSWORD } from './constants';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import UserDashboard from './views/UserDashboard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('iqc_training_data');
    if (saved) return JSON.parse(saved);
    return {
      currentUser: null,
      courses: [],
      users: INITIAL_USERS
    };
  });

  useEffect(() => {
    localStorage.setItem('iqc_training_data', JSON.stringify(state));
  }, [state]);

  const login = (userId: string, password: string) => {
    const user = state.users.find(u => u.id === userId && u.password === password);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const registerUser = (userData: Omit<User, 'role' | 'password'>) => {
    const newUser: User = {
      ...userData,
      role: 'user',
      password: DEFAULT_PASSWORD
    };
    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser]
    }));
  };

  const addCourse = (course: Omit<Course, 'id' | 'completions'>) => {
    const newCourse: Course = {
      ...course,
      id: Math.random().toString(36).substr(2, 9),
      completions: []
    };
    setState(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse]
    }));
  };

  const bulkAddUsers = (newUsers: User[]) => {
    setState(prev => {
      const existingIds = new Set(prev.users.map(u => u.id));
      const filteredNewUsers = newUsers.filter(u => !existingIds.has(u.id));
      if (filteredNewUsers.length === 0) return prev;
      return {
        ...prev,
        users: [...prev.users, ...filteredNewUsers]
      };
    });
  };

  const updateCourse = (updatedCourse: Course) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === updatedCourse.id ? updatedCourse : c)
    }));
  };

  const deleteCourse = (id: string) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id)
    }));
  };

  const toggleCourseActive = (id: string) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    }));
  };

  const signCourse = (courseId: string, signature: string) => {
    if (!state.currentUser) return;
    
    const completion: Completion = {
      userId: state.currentUser.id,
      timestamp: new Date().toISOString(),
      signature
    };

    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            completions: [...c.completions, completion]
          };
        }
        return c;
      })
    }));
  };

  const deleteUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
  };

  const addUser = (user: User) => {
    setState(prev => ({
      ...prev,
      users: [...prev.users, user]
    }));
  };

  if (!state.currentUser) {
    return <Login onLogin={login} onRegister={registerUser} />;
  }

  if (state.currentUser.role === 'admin') {
    return (
      <AdminDashboard 
        state={state} 
        onLogout={logout} 
        onAddCourse={addCourse}
        onBulkAddUsers={bulkAddUsers}
        onUpdateCourse={updateCourse}
        onDeleteCourse={deleteCourse}
        onToggleCourseActive={toggleCourseActive}
        onDeleteUser={deleteUser}
        onAddUser={addUser}
      />
    );
  }

  return (
    <UserDashboard 
      state={state} 
      onLogout={logout} 
      onSign={signCourse}
    />
  );
};

export default App;
