import { LocalesService } from '../../services/localesService';
import { FirestoreService } from '../../services/firestoreService';

jest.mock('../../services/firestoreService');

describe('LocalesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getLocales debe retornar locales con filtros', async () => {
    const mockLocales = [
      { id: '1', nombre: 'Local 1', estado: 'ocupado' },
      { id: '2', nombre: 'Local 2', estado: 'disponible' }
    ];
    
    FirestoreService.getAll.mockResolvedValue(mockLocales);
    
    const result = await LocalesService.getLocales({ estado: 'ocupado' });
    
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('ocupado');
  });

  test('cambiarEstado debe validar contrato activo', async () => {
    const mockLocal = { 
      id: '1', 
      estado: 'disponible',
      nombre: 'Local Test'
    };
    
    jest.spyOn(LocalesService, 'getLocalById').mockResolvedValue(mockLocal);
    jest.spyOn(LocalesService, 'getContratosActivos').mockResolvedValue(0);
    
    const result = await LocalesService.cambiarEstado('1', 'ocupado');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('contrato activo');
  });
});