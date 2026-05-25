import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../guards/jwt-cookie.guard';

/**
 * Extrae el objeto `user` (UserPayload) inyectado por el JwtCookieGuard en la request actual.
 */
export const UsuarioActivo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
