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
  onSnapshot,
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
  Timestamp,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { LOCAL_COLECCION } from '../utils/constants';
import { Local, LocalFormData } from '../types';

export class FirestoreService {
  // Servicio genérico para operaciones CRUD
  static async getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return this.mapDocs<T>(querySnapshot);
  }

  static async getById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return this.mapDoc<T>(docSnap.id, docSnap.data());
    }
    return null;
  }

  static async create<T>(collectionName: string, data: any): Promise<T> {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    });
    const newDoc = await getDoc(docRef);
    return this.mapDoc<T>(docRef.id, newDoc.data()!);
  }

  static async update(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      fechaActualizacion: serverTimestamp()
    });
  }

  static async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  static listenToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ) {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(q, (snapshot) => {
      const data = this.mapDocs<T>(snapshot);
      callback(data);
    });
  }

  static listenToDoc<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void
  ) {
    const docRef = doc(db, collectionName, id);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(this.mapDoc<T>(snapshot.id, snapshot.data()));
      } else {
        callback(null);
      }
    });
  }

  private static mapDoc<T>(id: string, data: DocumentData): T {
    return {
      id,
      ...this.convertTimestamps(data)
    } as T;
  }

  private static mapDocs<T>(snapshot: QuerySnapshot): T[] {
    return snapshot.docs.map(doc => this.mapDoc<T>(doc.id, doc.data()));
  }

  private static convertTimestamps(data: any): any {
    const result = { ...data };
    for (const key in result) {
      if (result[key] instanceof Timestamp) {
        result[key] = result[key].toDate();
      }
      if (Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) => {
          if (item && typeof item === 'object') {
            return this.convertTimestamps(item);
          }
          return item;
        });
      }
      if (result[key] && typeof result[key] === 'object') {
        result[key] = this.convertTimestamps(result[key]);
      }
    }
    return result;
  }
}