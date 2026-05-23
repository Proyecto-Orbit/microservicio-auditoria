import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtCookieGuard } from './guards/jwt-cookie.guard';
import { KeycloakKeyService } from './keycloak-key.service';

/**
 * Módulo de autenticación global.
 *
 * Al ser @Global(), JwtCookieGuard y JwtService quedan disponibles en
 * todos los módulos de la aplicación sin necesidad de importar AuthModule
 * explícitamente en cada uno. Esto permite que el decorador @AdminOnly()
 * funcione en cualquier controlador.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  providers: [JwtCookieGuard, KeycloakKeyService],
  exports: [JwtCookieGuard, JwtModule, KeycloakKeyService],
})
export class AuthModule {}
