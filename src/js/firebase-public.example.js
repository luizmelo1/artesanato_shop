// Configuração do Firebase para SITE PÚBLICO
// Este arquivo carrega apenas Firestore (sem Auth)

// INSTRUÇÕES:
// 1. Copie este arquivo para 'firebase-public.js'
// 2. Substitua os valores abaixo pelas suas credenciais do Firebase
// 3. NUNCA comite o arquivo firebase-public.js no Git

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};

// Inicializar Firebase (se ainda não foi inicializado)
if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

// Apenas Firestore é necessário para o site público
const db = firebase.firestore();
