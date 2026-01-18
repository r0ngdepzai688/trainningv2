
// Import the functions you need from the SDKs you need
// Fix: Use default import for Firebase v8 compatibility
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/analytics";

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
// Fix: Use v8 initialization style
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

export { app, analytics, db, auth, firebase };
