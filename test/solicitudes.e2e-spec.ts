import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SolicitudesController } from '../src/solicitudes/capaControladores/solicitudes.controller';
import { SolicitudesService } from '../src/solicitudes/fachadaService/solicitudes.service';
import { ROLES_KEY } from '../src/auth/decorators/allow-roles.decorator';
import { JwtCookieGuard } from '../src/auth/guards/jwt-cookie.guard';
import { EstadoSolicitud } from '../src/solicitudes/accesoDatos/solicitud-cambio.entity';

// ─── Mock del SolicitudesService ───────────────────────────────────────────

const mockSolicitud = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  entidadAfectada: 'ASOCOMUNAL',
  entidadId: '1',
  accion: 'ACTUALIZAR',
  datosNuevos: { nombre: 'AsoCentro' },
  estado: EstadoSolicitud.PENDIENTE,
  solicitadoPorEmail: 'operador@test.com',
  solicitadoPorNombre: 'Operador Test',
  fechaSolicitud: new Date().toISOString(),
};

const mockSolicitudesService = {
  crearSolicitud: jest.fn().mockResolvedValue(mockSolicitud),
  listarPorOperador: jest.fn().mockResolvedValue([mockSolicitud]),
  listarTodas: jest.fn().mockResolvedValue([mockSolicitud]),
  aprobarSolicitud: jest.fn().mockResolvedValue({ ...mockSolicitud, estado: EstadoSolicitud.APROBADA }),
  rechazarSolicitud: jest.fn().mockResolvedValue({ ...mockSolicitud, estado: EstadoSolicitud.RECHAZADA }),
  registrarAccionAdmin: jest.fn().mockResolvedValue({ ...mockSolicitud, estado: EstadoSolicitud.APROBADA }),
};

// ─── Guard simplificado para pruebas ────────────────────────────────────────

@Injectable()
class TestJwtGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    // Leer el rol del token (Bearer role-user)
    const tokenParts = authHeader.split(' ');
    const rolSimulado = tokenParts[1]; // ej: "admin", "operador"

    const allowedRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(rolSimulado) && rolSimulado !== 'superadmin') {
      throw new ForbiddenException(`Se requiere uno de estos roles: ${allowedRoles.join(', ')}`);
    }

    (req as any).user = {
      sub: 'test-user',
      email: `${rolSimulado}@test.com`,
      nombre: `Usuario ${rolSimulado}`,
      rol: rolSimulado,
    };
    return true;
  }
}

// ─── Suite de integración ────────────────────────────────────────────────────

describe('SolicitudesController (Integration)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudesController],
      providers: [
        { provide: SolicitudesService, useValue: mockSolicitudesService },
        Reflector,
      ],
    })
      .overrideGuard(JwtCookieGuard) // Se sobreescribe el guard real para no usar Keycloak
      .useClass(TestJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Endpoints sin token (deben fallar con 401) ──────────────────────────
  
  describe('Pruebas sin token (401 Unauthorized)', () => {
    it('POST /solicitudes', () =>
      request(app.getHttpServer()).post('/solicitudes').send({}).expect(401));

    it('GET /solicitudes/mias', () =>
      request(app.getHttpServer()).get('/solicitudes/mias').expect(401));

    it('GET /solicitudes', () =>
      request(app.getHttpServer()).get('/solicitudes').expect(401));
  });

  // ── Endpoints con tokens válidos ─────────────────────────────────────────

  describe('Pruebas con tokens válidos y roles', () => {
    
    it('POST /solicitudes → 201 al crear solicitud (como operador)', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('Authorization', 'Bearer operador')
        .send({
          entidadAfectada: 'ASOCOMUNAL',
          entidadId: '1',
          accion: 'ACTUALIZAR',
          datosNuevos: { nombre: 'AsoTest' },
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(mockSolicitudesService.crearSolicitud).toHaveBeenCalledWith(
        expect.any(Object),
        'operador@test.com',
        'Usuario operador'
      );
    });

    it('GET /solicitudes/mias → 200 listando solicitudes (como operador)', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes/mias')
        .set('Authorization', 'Bearer operador')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockSolicitudesService.listarPorOperador).toHaveBeenCalledWith('operador@test.com');
    });

    it('GET /solicitudes → 403 (un operador no puede listar todas)', async () => {
      await request(app.getHttpServer())
        .get('/solicitudes')
        .set('Authorization', 'Bearer operador')
        .expect(403);
    });

    it('GET /solicitudes → 200 listando todas (como admin)', async () => {
      await request(app.getHttpServer())
        .get('/solicitudes')
        .set('Authorization', 'Bearer admin')
        .expect(200);

      expect(mockSolicitudesService.listarTodas).toHaveBeenCalled();
    });

    it('PATCH /solicitudes/:id/aprobar → 200 (como admin)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/solicitudes/123/aprobar')
        .set('Authorization', 'Bearer admin')
        .expect(200);

      expect(res.body.estado).toBe(EstadoSolicitud.APROBADA);
      expect(mockSolicitudesService.aprobarSolicitud).toHaveBeenCalledWith('123', 'admin@test.com', 'Usuario admin');
    });

    it('PATCH /solicitudes/:id/rechazar → 200 (como admin)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/solicitudes/123/rechazar')
        .set('Authorization', 'Bearer admin')
        .send({ motivo: 'Datos incorrectos' })
        .expect(200);

      expect(res.body.estado).toBe(EstadoSolicitud.RECHAZADA);
      expect(mockSolicitudesService.rechazarSolicitud).toHaveBeenCalledWith('123', 'Datos incorrectos', 'admin@test.com', 'Usuario admin');
    });

    it('POST /solicitudes/accion-directa → 201 (como admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes/accion-directa')
        .set('Authorization', 'Bearer admin')
        .send({
          entidadAfectada: 'JAC',
          entidadId: '10',
          accion: 'ELIMINAR',
          datosNuevos: {},
        })
        .expect(201);

      expect(mockSolicitudesService.registrarAccionAdmin).toHaveBeenCalled();
    });
  });
});
