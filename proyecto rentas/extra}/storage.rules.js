rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.rol in ['admin', 'cobrador'];
      allow delete: if request.auth != null && 
        request.auth.token.rol == 'admin';
    }
    
    // Tamaño máximo de archivos
    match /{allPaths=**} {
      allow write: if request.resource.size < 10 * 1024 * 1024; // 10MB
    }
    
    // Solo imágenes y PDFs
    match /{allPaths=**} {
      allow write: if request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}