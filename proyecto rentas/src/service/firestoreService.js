import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Servicio genérico para operaciones CRUD
export const firestoreService = {
  // Obtener todos los documentos de una colección
  getAll: async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  },
  
  // Obtener un documento por ID
  getById: async (collectionName, id) => {
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  },
  
  // Crear un nuevo documento
  create: async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return { id: docRef.id, ...data }
  },
  
  // Actualizar un documento
  update: async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    })
    return { id, ...data }
  },
  
  // Eliminar un documento
  delete: async (collectionName, id) => {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
    return id
  },
  
  // Escuchar cambios en tiempo real
  listenToCollection: (collectionName, callback, conditions = []) => {
    let q = collection(db, collectionName)
    
    // Aplicar condiciones (where, orderBy)
    conditions.forEach(condition => {
      if (condition.type === 'where') {
        q = query(q, where(condition.field, condition.operator, condition.value))
      } else if (condition.type === 'orderBy') {
        q = query(q, orderBy(condition.field, condition.direction || 'asc'))
      }
    })
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(data)
    })
  }
}

// Servicios específicos por entidad
export const localesService = {
  getAll: () => firestoreService.getAll('locales'),
  getById: (id) => firestoreService.getById('locales', id),
  create: (data) => firestoreService.create('locales', data),
  update: (id, data) => firestoreService.update('locales', id, data),
  delete: (id) => firestoreService.delete('locales', id),
  listen: (callback) => firestoreService.listenToCollection('locales', callback, [
    { type: 'orderBy', field: 'nombre', direction: 'asc' }
  ])
}

export const inquilinosService = {
  getAll: () => firestoreService.getAll('inquilinos'),
  getById: (id) => firestoreService.getById('inquilinos', id),
  create: (data) => firestoreService.create('inquilinos', data),
  update: (id, data) => firestoreService.update('inquilinos', id, data),
  delete: (id) => firestoreService.delete('inquilinos', id),
  listen: (callback) => firestoreService.listenToCollection('inquilinos', callback, [
    { type: 'orderBy', field: 'nombre', direction: 'asc' }
  ])
}

export const contratosService = {
  getAll: () => firestoreService.getAll('contratos'),
  getById: (id) => firestoreService.getById('contratos', id),
  create: (data) => firestoreService.create('contratos', data),
  update: (id, data) => firestoreService.update('contratos', id, data),
  delete: (id) => firestoreService.delete('contratos', id),
  listen: (callback) => firestoreService.listenToCollection('contratos', callback, [
    { type: 'orderBy', field: 'fechaInicio', direction: 'desc' }
  ])
}

export const pagosService = {
  getAll: () => firestoreService.getAll('pagos'),
  getById: (id) => firestoreService.getById('pagos', id),
  create: (data) => firestoreService.create('pagos', data),
  update: (id, data) => firestoreService.update('pagos', id, data),
  delete: (id) => firestoreService.delete('pagos', id),
  listen: (callback) => firestoreService.listenToCollection('pagos', callback, [
    { type: 'orderBy', field: 'fechaPago', direction: 'desc' }
  ])
}