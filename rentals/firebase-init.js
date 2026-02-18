import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyATwdoRfeWGaFtk39-WfF-gLeMagCasKsQ",
    authDomain: "lisence-3e52f.firebaseapp.com",
    projectId: "lisence-3e52f",
    storageBucket: "lisence-3e52f.firebasestorage.app",
    messagingSenderId: "908821113391",
    appId: "1:908821113391:web:a3326971a05d47aaf4f4da",
    measurementId: "G-NE8V25BX0T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

window.firebaseServices = {
    app,
    db,
    storage,
    collection,
    doc,
    setDoc,
    getDocs,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL
};
