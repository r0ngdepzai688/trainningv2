
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Chú ý: Đây là cấu hình mẫu. Bạn cần thay thế bằng thông số từ Firebase Console của bạn.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "iqc-training-pro.firebaseapp.com",
  projectId: "iqc-training-pro",
  storageBucket: "iqc-training-pro.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
