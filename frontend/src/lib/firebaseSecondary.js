// Secondary Firebase Project - Firestore for new features
// This project stores: Comments, User Profiles (fullName, bio, socialLinks)
// Shares the same Auth UID with primary Firebase for sync

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';

// Secondary Firebase configuration (discussit-e8c1d)
const secondaryFirebaseConfig = {
  apiKey: "AIzaSyDcUhVAum1uKqTbcsf8-7FF_IYe5vXI7DA",
  authDomain: "discussit-e8c1d.firebaseapp.com",
  projectId: "discussit-e8c1d",
  storageBucket: "discussit-e8c1d.firebasestorage.app",
  messagingSenderId: "745091797576",
  appId: "1:745091797576:web:97a9db1b0f33171899be7d",
  measurementId: "G-FF1ZTVZK8R"
};

// Initialize secondary app with unique name
const secondaryApp = getApps().find(app => app.name === 'secondary') 
  || initializeApp(secondaryFirebaseConfig, 'secondary');

// Get Firestore instance from secondary app
const firestoreDb = getFirestore(secondaryApp);

export { 
  secondaryApp,
  firestoreDb,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  deleteField
};

export default secondaryApp;
