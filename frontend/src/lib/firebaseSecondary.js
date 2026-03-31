// Secondary Firebase Project - Realtime Database for new features
// This project stores: Comments, User Profiles (fullName, bio, socialLinks)
// Shares the same Auth UID with primary Firebase for sync

import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  push, 
  update, 
  remove, 
  onValue, 
  off,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';

// Secondary Firebase configuration (discussit-e8c1d)
const secondaryFirebaseConfig = {
  apiKey: "AIzaSyDcUhVAum1uKqTbcsf8-7FF_IYe5vXI7DA",
  authDomain: "discussit-e8c1d.firebaseapp.com",
  databaseURL: "https://discussit-e8c1d-default-rtdb.firebaseio.com",
  projectId: "discussit-e8c1d",
  storageBucket: "discussit-e8c1d.firebasestorage.app",
  messagingSenderId: "745091797576",
  appId: "1:745091797576:web:97a9db1b0f33171899be7d",
  measurementId: "G-FF1ZTVZK8R"
};

// Initialize secondary app with unique name
const secondaryApp = getApps().find(app => app.name === 'secondary') 
  || initializeApp(secondaryFirebaseConfig, 'secondary');

// Get Realtime Database instance from secondary app
const secondaryDatabase = getDatabase(secondaryApp);

export { 
  secondaryApp,
  secondaryDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo
};

export default secondaryApp;
