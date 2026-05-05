import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

// Body schema for POST /api/v1/auth/login
export class LoginRequestDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password!: string;
}
