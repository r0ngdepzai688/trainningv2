
// Import the functions you need from the SDKs you need
// Fix: Use compat imports for Firebase v8 compatibility in a v9+ environment to resolve property access errors
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCILzCo5fqyy4XlQaFvoAfev0CETVo4gsA",
  authDomain: "iqc-training-pro-91dfb.firebaseapp.com",
  projectId: "iqc-training-pro-91dfb",
  storageBucket: "iqc-training-pro-91dfb.firebasestorage.app",
  messagingSenderId: "157719523952",
  appId: "1:157719523952:web:2a629602335feb9393fab5",
  measurementId: "G-N6GK34XQZY"
};

// Initialize Firebase
// Fix: Use v8 initialization style with the compat layer to support existing app logic
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

export { app, analytics, db, auth, firebase };
