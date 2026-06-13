import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Schema validation for application configuration.
 * The application will fail to start if required fields are missing or invalid.
 */
export class AppConfig {
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;
}

/**
 * Validation function passed to ConfigModule.forRoot({ validate }).
 * If there are any errors, the application will log all validation errors
 * and throw an Error to exit the process.
 */
export function validateConfig(config: Record<string, unknown>): AppConfig {
  const validatedConfig = plainToInstance(AppConfig, config, {
    enableImplicitConversion: true, // auto convert string -> number for PORT, DB_PORT
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(
      `[ConfigValidation] Application failed to start due to invalid environment variables:\n${messages}`,
    );
  }

  return validatedConfig;
}
