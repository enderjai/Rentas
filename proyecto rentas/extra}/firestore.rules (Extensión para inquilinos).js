rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... reglas anteriores ...
    
    match /inquilinos/{inquilinoId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isCobrador() || 
        (isInquilino() && request.auth.uid == resource.data.userId)
      );
      
      allow write: if isAdmin();
      allow delete: if isAdmin() && 
        !existeContratoActivo(inquilinoId);
      
      // Validación para documentos
      match /documentos/{documentoId} {
        allow read: if isAuthenticated() && (
          isAdmin() || 
          isCobrador() || 
          (isInquilino() && request.auth.uid == resource.data.userId)
        );
        allow write: if isAdmin() || isCobrador();
        allow delete: if isAdmin() || isCobrador();
      }
    }
  }
  
  function existeContratoActivo(inquilinoId) {
    let contratoQuery = get(/databases/$(database)/documents/contratos)
      .where('inquilinoId', '==', inquilinoId)
      .where('estado', '==', 'vigente');
    return contratoQuery.size() > 0;
  }
}