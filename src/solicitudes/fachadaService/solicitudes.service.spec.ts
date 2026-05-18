import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudRepository } from '../accesoDatos/repositories/solicitud.repository';
import { ProductorEventosService } from '../colaDeMensajes/productor-eventos.service';
import { EstadoSolicitud } from '../accesoDatos/solicitud-cambio.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CrearSolicitudDto } from '../accesoDatos/crear-solicitud.dto';

describe('SolicitudesService', () => {
  let service: SolicitudesService;

  // ─── Mocks ────────────────────────────────────────────────────────────────
  const mockSolicitudRepository = {
    buscarTodas: jest.fn(),
    buscarPorOperador: jest.fn(),
    buscarGarantizadaPorId: jest.fn(),
    crearNueva: jest.fn(),
    guardar: jest.fn(),
  };

  const mockProductorEventos = {
    emitirAprobacionAplicar: jest.fn(),
  };

  // ─── Setup ────────────────────────────────────────────────────────────────
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudesService,
        { provide: SolicitudRepository,       useValue: mockSolicitudRepository },
        { provide: ProductorEventosService,   useValue: mockProductorEventos    },
      ],
    }).compile();

    service = module.get<SolicitudesService>(SolicitudesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido (instanciar correctamente)', () => {
    expect(service).toBeDefined();
  });

  // ─── listarTodas() ────────────────────────────────────────────────────────
  describe('listarTodas()', () => {
    it('debería retornar todas las solicitudes sin filtro', async () => {
      const mockData = [
        { id: '1', estado: EstadoSolicitud.PENDIENTE },
        { id: '2', estado: EstadoSolicitud.APROBADA },
      ];
      mockSolicitudRepository.buscarTodas.mockResolvedValue(mockData);

      const result = await service.listarTodas();

      expect(result).toHaveLength(2);
      expect(mockSolicitudRepository.buscarTodas).toHaveBeenCalledWith(undefined);
    });

    it('debería filtrar por estado PENDIENTE', async () => {
      mockSolicitudRepository.buscarTodas.mockResolvedValue([
        { id: '1', estado: EstadoSolicitud.PENDIENTE },
      ]);

      const result = await service.listarTodas(EstadoSolicitud.PENDIENTE);

      expect(mockSolicitudRepository.buscarTodas).toHaveBeenCalledWith(EstadoSolicitud.PENDIENTE);
      expect(result).toHaveLength(1);
    });
  });

  // ─── listarPorOperador() ──────────────────────────────────────────────────
  describe('listarPorOperador()', () => {
    it('debería retornar las solicitudes de un operador específico', async () => {
      const operadorId = 'operador@test.com';
      mockSolicitudRepository.buscarPorOperador.mockResolvedValue([
        { id: '1', operadorId },
      ]);

      const result = await service.listarPorOperador(operadorId);

      expect(mockSolicitudRepository.buscarPorOperador).toHaveBeenCalledWith(operadorId);
      expect(result).toHaveLength(1);
    });
  });

  // ─── crearSolicitud() ─────────────────────────────────────────────────────
  describe('crearSolicitud()', () => {
    it('debería crear una solicitud con estado PENDIENTE', async () => {
      const dto: CrearSolicitudDto = {
        entidadAfectada: 'ASOCOMUNAL',
        tipoAccion: 'CREAR',
        payloadDeseado: { nombre: 'Aso Nueva' },
      } as CrearSolicitudDto;
      const operadorId   = 'operador@test.com';
      const operadorNombre = 'Juan Operador';
      const solicitudCreada = {
        id: 'uuid-1',
        operadorId,
        operadorNombre,
        estado: EstadoSolicitud.PENDIENTE,
      };

      mockSolicitudRepository.crearNueva.mockResolvedValue(solicitudCreada);

      const result = await service.crearSolicitud(dto, operadorId, operadorNombre);

      expect(mockSolicitudRepository.crearNueva).toHaveBeenCalledWith(dto, operadorId, operadorNombre);
      expect(result.estado).toEqual(EstadoSolicitud.PENDIENTE);
      expect(result.operadorNombre).toEqual('Juan Operador');
    });
  });

  // ─── aprobarSolicitud() ───────────────────────────────────────────────────
  describe('aprobarSolicitud()', () => {
    it('debería aprobar y emitir evento RabbitMQ', async () => {
      const solicitudPendiente = {
        id: 'uuid-1',
        estado: EstadoSolicitud.PENDIENTE,
        entidadAfectada: 'ASOCOMUNAL',
        tipoAccion: 'CREAR',
        entidadId: null,
        payloadDeseado: { nombre: 'Aso Nueva' },
        revisadoPorAdminId: null,
        revisadoPorAdminNombre: null,
      };

      mockSolicitudRepository.buscarGarantizadaPorId.mockResolvedValue(solicitudPendiente);
      mockSolicitudRepository.guardar.mockResolvedValue({
        ...solicitudPendiente,
        estado: EstadoSolicitud.APROBADA,
        revisadoPorAdminId: 'admin@test.com',
        revisadoPorAdminNombre: 'Carlos Admin',
      });

      const result = await service.aprobarSolicitud('uuid-1', 'admin@test.com', 'Carlos Admin');

      expect(result.estado).toEqual(EstadoSolicitud.APROBADA);
      expect(result.revisadoPorAdminId).toEqual('admin@test.com');
      expect(result.revisadoPorAdminNombre).toEqual('Carlos Admin');
      expect(mockProductorEventos.emitirAprobacionAplicar).toHaveBeenCalledWith(
        'ASOCOMUNAL',
        expect.objectContaining({ tipoAccion: 'CREAR' }),
      );
    });

    it('debería lanzar NotFoundException si la solicitud no existe', async () => {
      mockSolicitudRepository.buscarGarantizadaPorId.mockResolvedValue(null);

      await expect(service.aprobarSolicitud('uuid-no-existe', 'admin@test.com'))
        .rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ForbiddenException si la solicitud ya no está pendiente', async () => {
      mockSolicitudRepository.buscarGarantizadaPorId.mockResolvedValue({
        id: 'uuid-1',
        estado: EstadoSolicitud.APROBADA, // ya fue aprobada
      });

      await expect(service.aprobarSolicitud('uuid-1', 'admin@test.com'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── rechazarSolicitud() ──────────────────────────────────────────────────
  describe('rechazarSolicitud()', () => {
    it('debería rechazar la solicitud y guardar el motivo', async () => {
      const solicitudPendiente = {
        id: 'uuid-2',
        estado: EstadoSolicitud.PENDIENTE,
        motivoRechazo: null,
        revisadoPorAdminId: null,
        revisadoPorAdminNombre: null,
      };

      mockSolicitudRepository.buscarGarantizadaPorId.mockResolvedValue(solicitudPendiente);
      mockSolicitudRepository.guardar.mockResolvedValue({
        ...solicitudPendiente,
        estado: EstadoSolicitud.RECHAZADA,
        motivoRechazo: 'Datos incorrectos',
        revisadoPorAdminId: 'admin@test.com',
        revisadoPorAdminNombre: 'Carlos Admin',
      });

      const result = await service.rechazarSolicitud(
        'uuid-2', 'Datos incorrectos', 'admin@test.com', 'Carlos Admin',
      );

      expect(result.estado).toEqual(EstadoSolicitud.RECHAZADA);
      expect(result.motivoRechazo).toEqual('Datos incorrectos');
      expect(result.revisadoPorAdminNombre).toEqual('Carlos Admin');
      // rechazar NO debe emitir evento RabbitMQ
      expect(mockProductorEventos.emitirAprobacionAplicar).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la solicitud no existe', async () => {
      mockSolicitudRepository.buscarGarantizadaPorId.mockResolvedValue(null);

      await expect(service.rechazarSolicitud('uuid-no-existe', 'motivo', 'admin@test.com'))
        .rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ForbiddenException si ya fue resuelta', async () => {
      mockSolicitudRepository.buscarGarantizadaPorId.mockResolvedValue({
        id: 'uuid-2',
        estado: EstadoSolicitud.RECHAZADA,
      });

      await expect(service.rechazarSolicitud('uuid-2', 'otro motivo', 'admin@test.com'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── registrarAccionAdmin() ───────────────────────────────────────────────
  describe('registrarAccionAdmin()', () => {
    it('debería crear el log con estado APROBADA y el admin como operador y revisor', async () => {
      const dto: CrearSolicitudDto = {
        entidadAfectada: 'ASOCOMUNAL',
        tipoAccion: 'EDITAR',
        entidadId: '42',
        payloadDeseado: { nombre: 'Nombre Editado' },
      } as CrearSolicitudDto;
      const adminId     = 'admin@test.com';
      const adminNombre = 'Carlos Admin';

      const solicitudBase = {
        id: 'uuid-3',
        estado: EstadoSolicitud.PENDIENTE,
        operadorId: adminId,
        operadorNombre: adminNombre,
        revisadoPorAdminId: null,
        revisadoPorAdminNombre: null,
      };

      mockSolicitudRepository.crearNueva.mockResolvedValue(solicitudBase);
      mockSolicitudRepository.guardar.mockResolvedValue({
        ...solicitudBase,
        estado: EstadoSolicitud.APROBADA,
        revisadoPorAdminId: adminId,
        revisadoPorAdminNombre: adminNombre,
      });

      const result = await service.registrarAccionAdmin(dto, adminId, adminNombre);

      // El admin es su propio operador
      expect(mockSolicitudRepository.crearNueva).toHaveBeenCalledWith(dto, adminId, adminNombre);
      // Se guarda APROBADA de inmediato
      expect(result.estado).toEqual(EstadoSolicitud.APROBADA);
      expect(result.revisadoPorAdminId).toEqual(adminId);
      // NO debe emitir evento (el cambio ya fue aplicado directo)
      expect(mockProductorEventos.emitirAprobacionAplicar).not.toHaveBeenCalled();
    });
  });
});
