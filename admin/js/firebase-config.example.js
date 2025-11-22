// Configuração do Firebase para ADMIN
// Projeto: artesanato-shop-c80f0
// https://console.firebase.google.com/

// INSTRUÇÕES:
// 1. Copie este arquivo para 'firebase-config.js'
// 2. Substitua os valores abaixo pelas suas credenciais do Firebase
// 3. NUNCA comite o arquivo firebase-config.js no Git

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

// Serviços Firebase
let auth = null;
let db = null;
let storage = null;

// Auth - essencial para admin
try {
    if (typeof firebase.auth === 'function') {
        auth = firebase.auth();
    } else {
        console.error('✗ Firebase Auth SDK não carregado!');
    }
} catch (error) {
    console.error('Erro ao inicializar Auth:', error);
}

// Firestore - essencial para admin
try {
    if (typeof firebase.firestore === 'function') {
        db = firebase.firestore();
    } else {
        console.error('✗ Firestore SDK não carregado!');
    }
} catch (error) {
    console.error('Erro ao inicializar Firestore:', error);
}

// Storage - essencial para upload de imagens
try {
    if (typeof firebase.storage === 'function') {
        storage = firebase.storage();
    }
} catch (error) {
    console.error('Erro ao inicializar Storage:', error);
}

// Configurações
const STORAGE_PATH = 'produtos/';
