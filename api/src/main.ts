import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Security Headers
	app.use(helmet());

	// CORS
	app.enableCors({
		origin: ["http://localhost:3005"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Accept"],
		credentials: true,
	});

	// Global Interceptors & Filters
	app.useGlobalFilters(new HttpExceptionFilter());
	app.useGlobalInterceptors(new LoggingInterceptor());

	// Global Validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.setGlobalPrefix("api");
	app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

	// Swagger setup
	const config = new DocumentBuilder()
		.setTitle("SJ Assignment API")
		.setDescription(
			"The Location Management and Room Booking System API description",
		)
		.setVersion("1.0.0")
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("docs", app, document);

	const port = process.env.PORT || 3000;
	await app.listen(port, "0.0.0.0");
	console.log(`Application is running on: http://localhost:${port}`);
	console.log(
		`Swagger documentation is available at: http://localhost:${port}/docs`,
	);
}
void bootstrap();
