import { IsBoolean, IsOptional } from 'class-validator';

// ─── GET /users/privacy — response ───────────────────────────────────────────
export interface PrivacySettingsResponseDto {
  isProfilePublic:  boolean;
  showOnlineStatus: boolean;
}

// ─── PATCH /users/privacy — request body ─────────────────────────────────────
// Both fields are optional — only provided fields are updated.
export class UpdatePrivacySettingsBodyDto {
  @IsBoolean()
  @IsOptional()
  isProfilePublic?: boolean;

  @IsBoolean()
  @IsOptional()
  showOnlineStatus?: boolean;
}
