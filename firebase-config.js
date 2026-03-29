// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxlGshfcSUMO4yOSd2I1LyMOcAqimOGPM",
  authDomain: "libra-wedding.firebaseapp.com",
  projectId: "libra-wedding",
  storageBucket: "libra-wedding.firebasestorage.app",
  messagingSenderId: "908205937046",
  appId: "1:908205937046:web:25d79bf12bfbac15284db7",
  measurementId: "G-8Z0CXCP3Y4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
