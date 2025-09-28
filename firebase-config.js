// Firebase設定ファイル
const firebaseConfig = {
  apiKey: "AIzaSyBFNeOxhq-_DRHmMudaiObSExPIFhrZz-A",
  authDomain: "p2ptrance-d2dd6.firebaseapp.com",
  projectId: "p2ptrance-d2dd6",
  storageBucket: "p2ptrance-d2dd6.firebasestorage.app",
  messagingSenderId: "971834497171",
  appId: "1:971834497171:web:92a4825a033b13c2725566"
};

// Firebase Authentication Provider設定
export const authProviderConfig = {
    google: {
        // カスタムパラメータがあれば追加
        customParameters: {
            prompt: 'select_account'
        }
    }
};
