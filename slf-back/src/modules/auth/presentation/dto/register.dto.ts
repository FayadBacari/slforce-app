import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../../shared/types/user-role.enum';

// Body schema for POST /api/v1/auth/register
// Validation runs automatically thanks to the global ValidationPipe.
export class RegisterRequestDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @IsEnum(UserRole, { message: 'Le rôle doit être athlete ou coach.' })
  role!: UserRole;
}
