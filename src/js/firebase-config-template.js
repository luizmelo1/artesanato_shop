// Template: credenciais injetadas via script de build

const firebaseConfig = globalThis.__FIREBASE_CONFIG__ || {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

firebase.initializeApp(firebaseConfig);
globalThis.db = firebase.firestore();
