import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from '../fachadaService/solicitudes.service';
import { EstadoSolicitud } from '../accesoDatos/solicitud-cambio.entity';
import { JwtCookieGuard } from '../../auth/guards/jwt-cookie.guard';
import type { JwtPayload } from '../../auth/guards/jwt-cookie.guard';

// Usuario simulado que el guard inyectaría en el request
const mockAdmin: JwtPayload   = { sub: '1', email: 'admin@test.com',    nombre: 'Carlos Admin',    rol: 'admin' };
const mockOperador: JwtPayload = { sub: '2', email: 'operador@test.com', nombre: 'Juan Operador', rol: 'operador' };

describe('SolicitudesController', () => {
  let controller: SolicitudesController;

  // ─── Mock del servicio ────────────────────────────────────────────────────
  const mockSolicitudesService = {
    crearSolicitud:       jest.fn(),
    listarPorOperador:    jest.fn(),
    listarTodas:          jest.fn(),
    aprobarSolicitud:     jest.fn(),
    rechazarSolicitud:    jest.fn(),
    registrarAccionAdmin: jest.fn(),
  };

  // ─── Setup ────────────────────────────────────────────────────────────────
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudesController],
      providers: [
        { provide: SolicitudesService, useValue: mockSolicitudesService },
      ],
    })
      // Desactivamos el guard para que no pida JWT real en los tests
      .overrideGuard(JwtCookieGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SolicitudesController>(SolicitudesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido (instanciar correctamente)', () => {
    expect(controller).toBeDefined();
  });

  // ─── crearSolicitud (Operador) ─────────────────────────────────────────────
  describe('crearSolicitud()', () => {
    it('debería delegar en service.crearSolicitud con email y nombre del operador', async () => {
      const dto: any = { entidadAfectada: 'ASOCOMUNAL', tipoAccion: 'CREAR', payloadDeseado: {} };
      const expected = { id: 'uuid-1', estado: EstadoSolicitud.PENDIENTE };

      mockSolicitudesService.crearSolicitud.mockResolvedValue(expected);

      const result = await controller.crearSolicitud(dto, mockOperador);

      expect(mockSolicitudesService.crearSolicitud).toHaveBeenCalledWith(
        dto, 'operador@test.com', 'Juan Operador',
      );
      expect(result).toEqual(expected);
    });
  });

  // ─── listarMias (Operador) ────────────────────────────────────────────────
  describe('listarMias()', () => {
    it('debería delegar en service.listarPorOperador con el email del usuario activo', async () => {
      mockSolicitudesService.listarPorOperador.mockResolvedValue([]);

      const result = await controller.listarMias(mockOperador);

      expect(mockSolicitudesService.listarPorOperador).toHaveBeenCalledWith('operador@test.com');
      expect(result).toEqual([]);
    });
  });

  // ─── listarTodas (Admin) ──────────────────────────────────────────────────
  describe('listarTodas()', () => {
    it('debería retornar todas las solicitudes sin filtro de estado', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      mockSolicitudesService.listarTodas.mockResolvedValue(mockData);

      const result = await controller.listarTodas(undefined as any);

      expect(mockSolicitudesService.listarTodas).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
    });

    it('debería filtrar por estado cuando se pasa el query param', async () => {
      mockSolicitudesService.listarTodas.mockResolvedValue([{ id: '1', estado: EstadoSolicitud.PENDIENTE }]);

      const result = await controller.listarTodas(EstadoSolicitud.PENDIENTE);

      expect(mockSolicitudesService.listarTodas).toHaveBeenCalledWith(EstadoSolicitud.PENDIENTE);
      expect(result).toHaveLength(1);
    });
  });

  // ─── aprobarSolicitud (Admin) ─────────────────────────────────────────────
  describe('aprobarSolicitud()', () => {
    it('debería delegar en service.aprobarSolicitud con id, email y nombre del admin', async () => {
      const solicitudAprobada = { id: 'uuid-1', estado: EstadoSolicitud.APROBADA };
      mockSolicitudesService.aprobarSolicitud.mockResolvedValue(solicitudAprobada);

      const result = await controller.aprobarSolicitud('uuid-1', mockAdmin);

      expect(mockSolicitudesService.aprobarSolicitud).toHaveBeenCalledWith(
        'uuid-1', 'admin@test.com', 'Carlos Admin',
      );
      expect(result.estado).toEqual(EstadoSolicitud.APROBADA);
    });
  });

  // ─── rechazarSolicitud (Admin) ────────────────────────────────────────────
  describe('rechazarSolicitud()', () => {
    it('debería delegar en service.rechazarSolicitud con motivo, email y nombre', async () => {
      const solicitudRechazada = { id: 'uuid-2', estado: EstadoSolicitud.RECHAZADA };
      mockSolicitudesService.rechazarSolicitud.mockResolvedValue(solicitudRechazada);

      const result = await controller.rechazarSolicitud(
        'uuid-2',
        { motivo: 'Datos incorrectos' },
        mockAdmin,
      );

      expect(mockSolicitudesService.rechazarSolicitud).toHaveBeenCalledWith(
        'uuid-2', 'Datos incorrectos', 'admin@test.com', 'Carlos Admin',
      );
      expect(result.estado).toEqual(EstadoSolicitud.RECHAZADA);
    });
  });

  // ─── registrarAccionAdmin (Admin) ─────────────────────────────────────────
  describe('registrarAccionAdmin()', () => {
    it('debería delegar en service.registrarAccionAdmin con email y nombre del admin', async () => {
      const dto: any = { entidadAfectada: 'ASOCOMUNAL', tipoAccion: 'EDITAR', payloadDeseado: {} };
      const logCreado = { id: 'uuid-3', estado: EstadoSolicitud.APROBADA };

      mockSolicitudesService.registrarAccionAdmin.mockResolvedValue(logCreado);

      const result = await controller.registrarAccionAdmin(dto, mockAdmin);

      expect(mockSolicitudesService.registrarAccionAdmin).toHaveBeenCalledWith(
        dto, 'admin@test.com', 'Carlos Admin',
      );
      expect(result.estado).toEqual(EstadoSolicitud.APROBADA);
    });
  });
});
