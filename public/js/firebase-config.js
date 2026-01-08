/**
 * Firebase Configuration
 * 
 * INSTRUCCIONES:
 * 1. Crea un proyecto en https://console.firebase.google.com/
 * 2. Agrega una aplicación web al proyecto
 * 3. Copia las credenciales y pégalas aquí
 * 4. Habilita Firestore Database en el proyecto
 */

const firebaseConfig = {
    apiKey: "AIzaSyDYQtk-fqQUyRgH7rzE_1BhjEi2awYXYgg",
    authDomain: "smv-dashboard.firebaseapp.com",
    projectId: "smv-dashboard",
    storageBucket: "smv-dashboard.firebasestorage.app",
    messagingSenderId: "440198838976",
    appId: "1:440198838976:web:a0576dc7baf3b8ada3cb25",
    
    // AI Error Assistant - Get your free API key at https://aistudio.google.com/apikey
    geminiApiKey: "AIzaSyBA8KTdrpHVzCORaQFdJRXpljrAxZuV6R8" // Replace with your actual Gemini API key
};

// NO MODIFICAR DEBAJO DE ESTA LÍNEA
const FIRESTORE_CONFIG = {
    collectionName: 'orders',
    enablePersistence: true
};
