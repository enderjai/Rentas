rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... reglas anteriores ...
    
    match /contratos/{contratoId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isCobrador() || 
        (isInquilino() && resource.data.inquilinoId == 
          get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.inquilinoId)
      );
      
      allow write: if isAdmin();
      allow delete: if isAdmin() && 
        resource.data.estado != 'vigente';
      
      // Validaciones al crear/actualizar
      allow create: if isAdmin() && 
        localDisponible(request.resource.data.localId) &&
        !existeContratoVigente(request.resource.data.localId);
      
      allow update: if isAdmin() && 
        (!request.resource.data.estado || 
          (request.resource.data.estado == 'vigente' && 
            localDisponible(request.resource.data.localId)));
    }
  }
  
  function existeContratoVigente(localId) {
    let contratoQuery = get(/databases/$(database)/documents/contratos)
      .where('localId', '==', localId)
      .where('estado', '==', 'vigente');
    return contratoQuery.size() > 0;
  }
  
  function localDisponible(localId) {
    let local = get(/databases/$(database)/documents/locales/$(localId));
    return local.data.estado == 'disponible';
  }
}