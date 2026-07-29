import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, getDocs, onSnapshot,
  collection, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, enableMultiTabIndexedDbPersistence, writeBatch, deleteField
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const configAny = firebaseConfig as any;
export const db = configAny.firestoreDatabaseId
  ? getFirestore(app, configAny.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence for web
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence: multiple tabs open, persistence enabled in first tab only.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported in this browser.');
    }
  });
}

export type { User };
export {
  GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, onAuthStateChanged,
  doc, setDoc, getDoc, getDocs, onSnapshot,
  collection, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch, deleteField
};
