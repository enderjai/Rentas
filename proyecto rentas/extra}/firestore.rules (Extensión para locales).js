rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... reglas anteriores ...
    
    match /locales/{localId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isCobrador() || 
        (isInquilino() && resource.data.estado == 'ocupado' && 
          existeContratoActivo(localId, request.auth.uid))
      );
      
      allow write: if isAdmin();
      allow delete: if isAdmin() && 
        !existeContratoActivo(localId, null);
      
      // Validaciones para subida de documentos
      allow update: if isAdmin() || isCobrador();
      
      // Función para verificar si existe contrato activo
      function existeContratoActivo(localId, userId) {
        let contratoQuery = get(/databases/$(database)/documents/contratos).where('localId', '==', localId).where('estado', '==', 'vigente');
        return contratoQuery.size() > 0 && 
          (userId == null || contratoQuery.where('inquilinoId', '==', userId).size() > 0);
      }
    }
    
    // Reglas para subdocumentos de documentos
    match /locales/{localId}/documentos/{documentoId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isCobrador() || 
        (isInquilino() && resource.data.visibilidad in ['inquilino', 'publico'])
      );
      allow write: if isAdmin() || isCobrador();
      allow delete: if isAdmin() || isCobrador();
    }
  }
}