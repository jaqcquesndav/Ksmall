// Mock Firebase configuration for demo mode

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  [key: string]: any;
}

// Firebase Auth mock
const auth = {
  currentUser: null as FirebaseUser | null,
  
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    // Simulate an authenticated user for demo mode
    const demoUser: FirebaseUser = {
      uid: 'demo-user-123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null,
      emailVerified: true,
      phoneNumber: null,
      isDemo: true,
    };
    
    // Execute callback with demo user
    setTimeout(() => callback(demoUser), 100);
    
    // Return unsubscribe function
    return () => {};
  },
  
  signInWithEmailAndPassword: async (email: string, password: string) => {
    return {
      user: {
        uid: 'demo-user-123',
        email,
        displayName: 'Demo User',
        photoURL: null,
        emailVerified: true,
        phoneNumber: null,
        isDemo: true,
      }
    };
  },
  
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    return {
      user: {
        uid: `demo-user-${Date.now()}`,
        email,
        displayName: '',
        photoURL: null,
        emailVerified: false,
        phoneNumber: null,
        isDemo: true,
      }
    };
  },
  
  sendPasswordResetEmail: async (email: string) => {
    return Promise.resolve();
  },
  
  signOut: async () => {
    return Promise.resolve();
  },
  
  confirmPasswordReset: async (code: string, newPassword: string) => {
    return Promise.resolve();
  },
};

// Firestore mock
const firestore = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: true,
        data: () => ({}),
        id,
      }),
      set: async (data: any) => Promise.resolve(),
      update: async (data: any) => Promise.resolve(),
      onSnapshot: (callback: Function) => {
        callback({
          exists: true,
          data: () => ({}),
          id,
        });
        return () => {};
      },
    }),
    add: async (data: any) => ({
      id: `doc-${Date.now()}`,
    }),
    where: () => ({
      get: async () => ({
        docs: [],
        empty: true,
        forEach: (cb: Function) => {},
      }),
      onSnapshot: (callback: Function) => {
        callback({
          docs: [],
          empty: true,
          forEach: (cb: Function) => {},
        });
        return () => {};
      },
    }),
  }),
};

// Export mock Firebase object
export const firebase = {
  auth: () => auth,
  firestore: () => firestore,
};

// Optional initialization function
export const initializeFirebase = () => {
  console.log('Mock Firebase initialized for demo mode');
  return firebase;
};
