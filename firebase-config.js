// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyBFNeOxhq-_DRHmMudaiObSExPIFhrZz-A",
  authDomain: "p2ptrance-d2dd6.firebaseapp.com",
  projectId: "p2ptrance-d2dd6",
  storageBucket: "p2ptrance-d2dd6.firebasestorage.app",
  messagingSenderId: "971834497171",
  appId: "1:971834497171:web:92a4825a033b13c2725566"
};

// 開発環境用の設定（必要に応じて）
export const developmentConfig = {
    apiKey: "dev-api-key-here",
    authDomain: "your-dev-project.firebaseapp.com",
    projectId: "your-dev-project",
    storageBucket: "your-dev-project.appspot.com",
    messagingSenderId: "987654321098",
    appId: "1:987654321098:web:fedcba654321"
};

// 環境に応じた設定の選択
export const getFirebaseConfig = () => {
    // 本番環境の判定（ドメインベース）
    const isProduction = window.location.hostname !== 'localhost' && 
                         !window.location.hostname.includes('127.0.0.1');
    
    return isProduction ? firebaseConfig : developmentConfig;
};
