import { IsArray, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Body schema for PUT /api/v1/users/profile
// All fields optional — the user only sends what they want to update.
export class UpdateProfileRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Le numéro de téléphone doit faire au moins 10 caractères.' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  // ── Coach profile fields ────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  speciality?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  bio?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  experienceYears?: number;

  // Array of discipline keys selected by the coach (e.g. ['Street-Lifting', 'Freestyle'])
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disciplines?: string[];

  // ── Athlete profile fields ──────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  weightCategory?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recordMuscleUp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recordTraction?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recordDips?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recordSquat?: number;
}
