rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... reglas anteriores ...
    
    match /documentos/{documentoId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        (isCobrador() && resource.data.visibilidad != 'admin') ||
        (isInquilino() && (
          resource.data.visibilidad == 'publico' || 
          (resource.data.visibilidad == 'inquilino' && 
            resource.data.entidadId == getInquilinoId(request.auth.uid))
        ))
      );
      
      allow write: if isAdmin() || isCobrador();
      allow delete: if isAdmin();
      allow update: if isAdmin() || isCobrador();
    }
  }
}