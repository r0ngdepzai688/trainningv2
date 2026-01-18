
import React, { useState, useEffect, useCallback } from 'react';
import { User, Course, AppState, Completion, CourseException, Notification as AppNotification } from './types';
import { INITIAL_USERS, DEFAULT_PASSWORD } from './constants';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import UserDashboard from './views/UserDashboard';

// Firebase Imports
// Fix: Import firebase and instances from local config using v8 style
import { db, auth, firebase } from './lib/firebase';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    courses: [],
    users: []
  });
  const [loading, setLoading] = useState(true);

  // 1. Theo dõi trạng thái đăng nhập (Auth)
  useEffect(() => {
    // Fix: Use the auth instance from our firebase lib and call onAuthStateChanged as a method
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Find user by email prefix (id)
        const userId = firebaseUser.email?.split('@')[0] || '';
        // Current user is updated via the real-time snapshot below
      } else {
        setState(prev => ({ ...prev, currentUser: null }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Đồng bộ hóa dữ liệu thời gian thực từ Firestore
  useEffect(() => {
    // Fix: Use v8 collection().onSnapshot style
    const unsubCourses = db.collection("courses").onSnapshot((snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
      setState(prev => ({ ...prev, courses: coursesData }));
    });

    // Lắng nghe danh sách Nhân sự
    const unsubUsers = db.collection("users").onSnapshot((snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setState(prev => {
        // Cập nhật lại currentUser nếu có thay đổi từ DB
        const updatedCurrentUser = prev.currentUser 
          ? usersData.find(u => u.id === prev.currentUser?.id) || prev.currentUser 
          : null;
        return { ...prev, users: usersData, currentUser: updatedCurrentUser };
      });
    });

    return () => {
      unsubCourses();
      unsubUsers();
    };
  }, []);

  const login = async (userId: string, password: string) => {
    try {
      const email = `${userId}@iqc.training`;
      // Fix: Use auth.signInWithEmailAndPassword (v8 style)
      await auth.signInWithEmailAndPassword(email, password);
      const userProfile = state.users.find(u => u.id === userId);
      if (userProfile) {
        setState(prev => ({ ...prev, currentUser: userProfile }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      // Fix: Use auth.signOut (v8 style)
      await auth.signOut();
    }
  };

  const createNotification = (message: string, type: 'new_course' | 'reminder'): AppNotification => ({
    id: Math.random().toString(36).substr(2, 9),
    message,
    timestamp: new Date().toISOString(),
    isRead: false,
    type
  });

  const addCourse = async (course: Omit<Course, 'id' | 'completions'>) => {
    const courseId = Math.random().toString(36).substr(2, 9);
    let initialUserIds = Array.from(new Set(course.assignedUserIds || []));
    
    if (course.target === 'sev' || course.target === 'vendor') {
      initialUserIds = state.users
        .filter(u => u.company === course.target && u.role === 'user')
        .map(u => u.id);
    }

    const newCourse: Course = {
      ...course,
      id: courseId,
      completions: [],
      assignedUserIds: initialUserIds,
      exceptions: []
    };

    // Fix: Use db.collection().doc().set (v8 style)
    await db.collection("courses").doc(courseId).set(newCourse);

    // Gửi thông báo cho từng user
    const notification = createNotification(`Khóa học mới: ${newCourse.name}`, 'new_course');
    for (const uid of initialUserIds) {
      await db.collection("users").doc(uid).update({
        notifications: firebase.firestore.FieldValue.arrayUnion(notification)
      });
    }
  };

  const pushCourseReminders = async (courseId: string) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    const assignedIds = new Set(course.assignedUserIds || []);
    const finishedIds = new Set(course.completions.map(c => c.userId));
    const exceptionIds = new Set((course.exceptions || []).map(e => e.userId));
    const pendingUserIds = [...assignedIds].filter(id => !finishedIds.has(id) && !exceptionIds.has(id));

    const notification = createNotification(`NHẮC NHỞ: Vui lòng ký xác nhận ${course.name}`, 'reminder');
    
    for (const uid of pendingUserIds) {
      await db.collection("users").doc(uid).update({
        notifications: firebase.firestore.FieldValue.arrayUnion(notification)
      });
    }
    alert(`Đã gửi nhắc nhở tới ${pendingUserIds.length} nhân viên.`);
  };

  const markNotificationsRead = async () => {
    if (!state.currentUser) return;
    const updatedNotifs = (state.currentUser.notifications || []).map(n => ({ ...n, isRead: true }));
    await db.collection("users").doc(state.currentUser.id).update({ notifications: updatedNotifs });
  };

  const addUser = async (u: User, manualCourseIds: string[] = []) => {
    try {
      const email = `${u.id}@iqc.training`;
      try {
        // Fix: Use auth.createUserWithEmailAndPassword (v8 style)
        await auth.createUserWithEmailAndPassword(email, u.password);
      } catch (e) { /* User already exists */ }

      // Fix: Use db.collection().doc().set (v8 style)
      await db.collection("users").doc(u.id).set({ ...u, notifications: [] });

      for (const course of state.courses) {
        if ((course.target === u.company || manualCourseIds.includes(course.id)) && course.isActive) {
          await db.collection("courses").doc(course.id).update({
            assignedUserIds: firebase.firestore.FieldValue.arrayUnion(u.id)
          });
        }
      }
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const bulkAddUsers = async (newUsers: User[]) => {
    for (const u of newUsers) {
      await addUser(u);
    }
  };

  const signCourse = async (courseId: string, signature: string) => {
    if (!state.currentUser) return;
    const completion: Completion = {
      userId: state.currentUser.id,
      timestamp: new Date().toISOString(),
      signature
    };
    // Fix: Use FieldValue.arrayUnion (v8 style)
    await db.collection("courses").doc(courseId).update({
      completions: firebase.firestore.FieldValue.arrayUnion(completion)
    });
  };

  const updateCourse = async (c: Course) => await db.collection("courses").doc(c.id).update({ ...c });
  const deleteCourse = async (id: string) => await db.collection("courses").doc(id).delete();
  const toggleCourseActive = async (id: string) => {
    const c = state.courses.find(item => item.id === id);
    if (c) await db.collection("courses").doc(id).update({ isActive: !c.isActive });
  };
  const deleteUser = async (id: string) => await db.collection("users").doc(id).delete();
  const addException = async (courseId: string, ex: CourseException) => {
    await db.collection("courses").doc(courseId).update({ exceptions: firebase.firestore.FieldValue.arrayUnion(ex) });
  };
  const removeException = async (courseId: string, userId: string) => {
    const c = state.courses.find(item => item.id === courseId);
    if (c) {
      const filtered = (c.exceptions || []).filter(e => e.userId !== userId);
      await db.collection("courses").doc(courseId).update({ exceptions: filtered });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#00205B]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold uppercase tracking-widest text-[10px]">Đang kết nối hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) return <Login onLogin={login} onRegister={addUser} />;

  return state.currentUser.role === 'admin' ? (
    <AdminDashboard 
      state={state} 
      onLogout={handleLogout} 
      onAddCourse={addCourse}
      onBulkAddUsers={bulkAddUsers}
      onUpdateCourse={updateCourse}
      onDeleteCourse={deleteCourse}
      onToggleCourseActive={toggleCourseActive}
      onDeleteUser={deleteUser}
      onAddUser={addUser}
      onAddException={addException}
      onRemoveException={removeException}
      onPushReminder={pushCourseReminders}
    />
  ) : (
    <UserDashboard state={state} onLogout={handleLogout} onSign={signCourse} onMarkRead={markNotificationsRead} />
  );
};

export default App;
