import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../guards/jwt-cookie.guard';

/**
 * Extrae el objeto `user` (JwtPayload) inyectado por el JwtCookieGuard en la request actual.
 */
export const UsuarioActivo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
