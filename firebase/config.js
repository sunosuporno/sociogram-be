// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGUJwo7r3ZHH9feufAxEmp53VuTi7uOCI",
  authDomain: "sociogram-1d15a.firebaseapp.com",
  projectId: "sociogram-1d15a",
  storageBucket: "sociogram-1d15a.appspot.com",
  messagingSenderId: "55109145939",
  appId: "1:55109145939:web:f50cea2d33b0e30eacfda6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

module.exports = { storage, ref, uploadBytes, getDownloadURL };
