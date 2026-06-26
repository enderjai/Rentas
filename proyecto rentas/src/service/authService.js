import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Obtener información adicional del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid))
      const userData = userDoc.exists() ? userDoc.data() : {}
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      }
    } catch (error) {
      throw new Error(error.message)
    }
  },
  
  // Registrar nuevo usuario
  register: async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Actualizar perfil
      await updateProfile(user, {
        displayName: userData.nombre
      })
      
      // Guardar información adicional en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        ...userData,
        email: user.email,
        createdAt: new Date().toISOString()
      })
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: userData.nombre,
        ...userData
      }
    } catch (error) {
      throw new Error(error.message)
    }
  },
  
  // Cerrar sesión
  logout: async () => {
    try {
      await signOut(auth)
      return true
    } catch (error) {
      throw new Error(error.message)
    }
  },
  
  // Restablecer contraseña
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (error) {
      throw new Error(error.message)
    }
  },
  
  // Escuchar cambios en el estado de autenticación
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid))
        const userData = userDoc.exists() ? userDoc.data() : {}
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userData
        })
      } else {
        callback(null)
      }
    })
  }
}