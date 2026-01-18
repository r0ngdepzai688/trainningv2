
import React, { useState, useEffect, useCallback } from 'react';
import { User, Course, AppState, Completion, CourseException, Notification as AppNotification } from './types';
import { INITIAL_USERS, DEFAULT_PASSWORD } from './constants';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import UserDashboard from './views/UserDashboard';

// Firebase Imports
import { db, auth } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    courses: [],
    users: []
  });
  const [loading, setLoading] = useState(true);

  // 1. Theo dõi trạng thái đăng nhập (Auth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Tìm thông tin user trong Firestore dựa trên email/id
        const userId = firebaseUser.email?.split('@')[0] || '';
        // Trong thực tế, bạn sẽ fetch profile từ collection 'users'
        // Ở bản này, ta tạm thời lấy từ state đã đồng bộ bên dưới
      } else {
        setState(prev => ({ ...prev, currentUser: null }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Đồng bộ hóa dữ liệu thời gian thực từ Firestore
  useEffect(() => {
    // Lắng nghe danh sách Khóa học
    const unsubCourses = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
      setState(prev => ({ ...prev, courses: coursesData }));
    });

    // Lắng nghe danh sách Nhân sự
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Khi login thành công, onAuthStateChanged sẽ tự xử lý
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
      await signOut(auth);
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

    // Lưu vào Firestore
    await setDoc(doc(db, "courses", courseId), newCourse);

    // Gửi thông báo cho từng user (Cập nhật mảng notifications trong Firestore)
    const notification = createNotification(`Khóa học mới: ${newCourse.name}`, 'new_course');
    for (const uid of initialUserIds) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        notifications: arrayUnion(notification)
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
      await updateDoc(doc(db, "users", uid), {
        notifications: arrayUnion(notification)
      });
    }
    alert(`Đã gửi nhắc nhở tới ${pendingUserIds.length} nhân viên.`);
  };

  const markNotificationsRead = async () => {
    if (!state.currentUser) return;
    const userRef = doc(db, "users", state.currentUser.id);
    const updatedNotifs = (state.currentUser.notifications || []).map(n => ({ ...n, isRead: true }));
    await updateDoc(userRef, { notifications: updatedNotifs });
  };

  const addUser = async (u: User, manualCourseIds: string[] = []) => {
    try {
      const email = `${u.id}@iqc.training`;
      // 1. Tạo tài khoản Auth (Nếu chưa có)
      // Chú ý: Trong thực tế bạn cần xử lý lỗi nếu user đã tồn tại
      try {
        await createUserWithEmailAndPassword(auth, email, u.password);
      } catch (e) { /* User might already exist in Auth */ }

      // 2. Lưu profile vào Firestore
      await setDoc(doc(db, "users", u.id), { ...u, notifications: [] });

      // 3. Gán khóa học hiện có nếu thỏa mãn điều kiện
      for (const course of state.courses) {
        if ((course.target === u.company || manualCourseIds.includes(course.id)) && course.isActive) {
          await updateDoc(doc(db, "courses", course.id), {
            assignedUserIds: arrayUnion(u.id)
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
    const courseRef = doc(db, "courses", courseId);
    await updateDoc(courseRef, {
      completions: arrayUnion(completion)
    });
  };

  // --- Các hàm CRUD khác cho Firestore ---
  const updateCourse = async (c: Course) => await updateDoc(doc(db, "courses", c.id), { ...c });
  const deleteCourse = async (id: string) => await deleteDoc(doc(db, "courses", id));
  const toggleCourseActive = async (id: string) => {
    const c = state.courses.find(item => item.id === id);
    if (c) await updateDoc(doc(db, "courses", id), { isActive: !c.isActive });
  };
  const deleteUser = async (id: string) => await deleteDoc(doc(db, "users", id));
  const addException = async (courseId: string, ex: CourseException) => {
    await updateDoc(doc(db, "courses", courseId), { exceptions: arrayUnion(ex) });
  };
  const removeException = async (courseId: string, userId: string) => {
    const c = state.courses.find(item => item.id === courseId);
    if (c) {
      const filtered = (c.exceptions || []).filter(e => e.userId !== userId);
      await updateDoc(doc(db, "courses", courseId), { exceptions: filtered });
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
