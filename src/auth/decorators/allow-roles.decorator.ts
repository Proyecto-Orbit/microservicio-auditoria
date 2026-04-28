import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorador que especifica los roles permitidos para acceder a un endpoint.
 * Se usa junto con JwtCookieGuard para autorización basada en roles.
 *
 * Si no se aplica este decorador, el guard exige autenticación pero
 * no restringe por rol (cualquier usuario autenticado puede acceder).
 *
 * @param roles - Lista de roles permitidos (ej: 'admin', 'operador').
 *
 * @example
 * \@AllowRoles('admin')
 * \@Patch(':id/aprobar')
 * aprobar(...) { ... }
 */
export const AllowRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
