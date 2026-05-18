import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS y Cookies
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Microservicio de Auditoría (Maker-Checker)')
    .setDescription('API para la gestión de solicitudes de cambio y trazabilidad de acciones de administradores y operadores.')
    .setVersion('1.0')
    .addTag('solicitudes')
    .addCookieAuth('token') // Informamos que usamos el token en la cookie
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Iniciar RabbitMQ Listener para la colaUsuariosSistema
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'colaUsuariosSistema',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Microservicio de Auditoría corriendo en: http://localhost:${port}`);
  console.log(`Documentación Swagger en: http://localhost:${port}/api/docs`);
}
bootstrap();
