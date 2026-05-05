import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '../../../../shared/types/user-role.enum';

// ── Nested DTO: personal records (athlete) ────────────────────────────────────
// Numeric values are sent as strings from the mobile form — @Type(() => Number)
// coerces them transparently.
export class RegisterAthleteRecordsDto {
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  muscleUp?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  traction?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  dips?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  squat?: number;
}

// ── Nested DTO: athlete onboarding profile ────────────────────────────────────
export class RegisterAthleteProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  weightCategory?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  weightKg?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  heightCm?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterAthleteRecordsDto)
  records?: RegisterAthleteRecordsDto;
}

// ── Nested DTO: coach onboarding profile ──────────────────────────────────────
export class RegisterCoachProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  speciality?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location?: string;

  // Sent as a string from the mobile form
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  pricePerMonth?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

// ── Main body schema for POST /api/v1/auth/register ──────────────────────────
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

  // Profile data collected during the onboarding flow.
  // Both optional — the account can exist without a completed profile.
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterCoachProfileDto)
  coachProfile?: RegisterCoachProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterAthleteProfileDto)
  athleteProfile?: RegisterAthleteProfileDto;
}
