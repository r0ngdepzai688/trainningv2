
import React, { useState, useEffect, useCallback } from 'react';
import { User, Course, AppState, Completion, CompanyType, CourseStatus, CourseException, Notification } from './types';
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

  const getCourseStatus = (course: Course, users: User[]): CourseStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(course.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(course.end);
    end.setHours(0, 0, 0, 0);
    
    const assignedIds = new Set(course.assignedUserIds || []);
    const exceptionIds = new Set((course.exceptions || []).map(e => e.userId));
    
    const targetUsers = users.filter(u => assignedIds.has(u.id) && !exceptionIds.has(u.id));
    const isFinished = targetUsers.length > 0 && course.completions.length >= targetUsers.length;

    if (isFinished) return 'Finished';
    if (today < start) return 'Plan';
    if (today > end) return 'Pending';
    return 'Opening';
  };

  const createNotification = (message: string, type: 'new_course' | 'reminder'): Notification => ({
    id: Math.random().toString(36).substr(2, 9),
    message,
    timestamp: new Date().toISOString(),
    isRead: false,
    type
  });

  const addCourse = (course: Omit<Course, 'id' | 'completions'>) => {
    // Deduplicate assigned IDs immediately using a Set
    let initialUserIds = Array.from(new Set(course.assignedUserIds || []));
    
    if (course.target !== 'target') {
      initialUserIds = state.users
        .filter(u => u.company === (course.target as any) && u.role === 'user')
        .map(u => u.id);
    }

    const newCourse: Course = {
      ...course,
      id: Math.random().toString(36).substr(2, 9),
      completions: [],
      assignedUserIds: initialUserIds,
      exceptions: []
    };

    setState(prev => {
      const notification = createNotification(`Khóa học mới được gán: ${newCourse.name}`, 'new_course');
      const updatedUsers = prev.users.map(u => {
        if (initialUserIds.includes(u.id)) {
          // Check if this notification already exists (optional safety)
          const alreadyNotified = (u.notifications || []).some(n => n.message.includes(newCourse.name));
          if (!alreadyNotified) {
            return {
              ...u,
              notifications: [notification, ...(u.notifications || [])]
            };
          }
        }
        return u;
      });

      return {
        ...prev,
        courses: [...prev.courses, newCourse],
        users: updatedUsers,
        currentUser: prev.currentUser && initialUserIds.includes(prev.currentUser.id) 
          ? { ...prev.currentUser, notifications: [notification, ...(prev.currentUser.notifications || [])] } 
          : prev.currentUser
      };
    });
  };

  const bulkAddUsers = (newUsers: User[]) => {
    setState(prev => {
      const existingIds = new Set(prev.users.map(u => u.id));
      // Only add users whose IDs aren't already in the list
      const trulyNewUsers = newUsers.filter(u => !existingIds.has(u.id));
      
      if (trulyNewUsers.length === 0) return prev;
      
      return {
        ...prev,
        users: [...prev.users, ...trulyNewUsers]
      };
    });
  };

  const pushCourseReminders = (courseId: string) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    const assignedIds = new Set(course.assignedUserIds || []);
    const finishedIds = new Set(course.completions.map(c => c.userId));
    const exceptionIds = new Set((course.exceptions || []).map(e => e.userId));

    // Target users who haven't completed and have no exception
    const pendingUserIds = [...assignedIds].filter(id => !finishedIds.has(id) && !exceptionIds.has(id));

    if (pendingUserIds.length === 0) {
      alert("Tất cả nhân viên đã hoàn thành khóa học này!");
      return;
    }

    setState(prev => {
      const notification = createNotification(`Yêu cầu hoàn thành ngay khóa học: ${course.name}`, 'reminder');
      const updatedUsers = prev.users.map(u => {
        if (pendingUserIds.includes(u.id)) {
          return {
            ...u,
            notifications: [notification, ...(u.notifications || [])]
          };
        }
        return u;
      });

      return {
        ...prev,
        users: updatedUsers,
        currentUser: prev.currentUser && pendingUserIds.includes(prev.currentUser.id)
          ? { ...prev.currentUser, notifications: [notification, ...(prev.currentUser.notifications || [])] }
          : prev.currentUser
      };
    });

    alert(`Đã gửi thông báo nhắc nhở tới ${pendingUserIds.length} nhân viên.`);
  };

  const markNotificationsRead = () => {
    if (!state.currentUser) return;
    const userId = state.currentUser.id;
    setState(prev => {
      const updatedUsers = prev.users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            notifications: (u.notifications || []).map(n => ({ ...n, isRead: true }))
          };
        }
        return u;
      });
      return {
        ...prev,
        users: updatedUsers,
        currentUser: prev.currentUser ? {
          ...prev.currentUser,
          notifications: (prev.currentUser.notifications || []).map(n => ({ ...n, isRead: true }))
        } : null
      };
    });
  };

  const loginAfterRegister = (userData: Omit<User, 'role' | 'password'>) => {
    const existing = state.users.find(u => u.id === userData.id);
    if (existing) {
      setState(prev => ({ ...prev, currentUser: existing }));
      return;
    }

    const newUser: User = { ...userData, role: 'user', password: DEFAULT_PASSWORD, notifications: [] };
    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser
    }));
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
      courses: prev.courses.map(c => id === c.id ? { ...c, isActive: !c.isActive } : c)
    }));
  };

  const addCourseException = (courseId: string, exception: CourseException) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => {
        if (c.id === courseId) {
          const exceptions = c.exceptions || [];
          const exists = exceptions.find(e => e.userId === exception.userId);
          if (exists) {
            return { ...c, exceptions: exceptions.map(e => e.userId === exception.userId ? exception : e) };
          }
          return { ...c, exceptions: [...exceptions, exception] };
        }
        return c;
      })
    }));
  };

  const removeCourseException = (courseId: string, userId: string) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => {
        if (c.id === courseId) {
          return { ...c, exceptions: (c.exceptions || []).filter(e => e.userId !== userId) };
        }
        return c;
      })
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
          // Prevent duplicate signing
          const alreadySigned = c.completions.some(comp => comp.userId === completion.userId);
          if (alreadySigned) return c;
          return { ...c, completions: [...c.completions, completion] };
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

  const addUser = (user: User, assignedCourseIds: string[] = []) => {
    setState(prev => {
      const existing = prev.users.find(u => u.id === user.id);
      const newUsers = existing ? prev.users : [...prev.users, user];
      
      const newCourses = prev.courses.map(c => {
        if (assignedCourseIds.includes(c.id)) {
          const currentAssigned = c.assignedUserIds || [];
          if (!currentAssigned.includes(user.id)) {
            return { ...c, assignedUserIds: [...currentAssigned, user.id] };
          }
        }
        return c;
      });
      return { ...prev, users: newUsers, courses: newCourses };
    });
  };

  if (!state.currentUser) {
    return <Login onLogin={login} onRegister={loginAfterRegister} />;
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
        onAddException={addCourseException}
        onRemoveException={removeCourseException}
        onPushReminder={pushCourseReminders}
      />
    );
  }

  return (
    <UserDashboard 
      state={state} 
      onLogout={logout} 
      onSign={signCourse}
      onMarkRead={markNotificationsRead}
    />
  );
};

export default App;
