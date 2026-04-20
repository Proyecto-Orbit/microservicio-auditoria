import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  nombre: string;
  rol: string;
}

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    // Obtenemos la cookie basada en la var de entorno o 'token' por defecto
    const cookieName = process.env.COOKIE_NAME ?? 'token';
    const token: string | undefined = request.cookies?.[cookieName];

    if (!token) {
      throw new UnauthorizedException('Token de autenticación no proporcionado en la solicitud');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token de sesión inválido o expirado');
    }

    // Inyectamos el payload en el request para que los controladores puedan saber quién lo hizo
    (request as Request & { user: JwtPayload }).user = payload;
    return true;
  }
}
