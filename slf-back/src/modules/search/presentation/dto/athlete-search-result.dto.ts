// Shape returned by GET /search/athletes for each athlete in the list.
// Only fields available in the User collection are included here.
// Speciality, weight category, medals, etc. will be added when the
// AthleteProfile collection is implemented (Phase 2).
export class AthleteSearchResultDto {
  id!:               string;
  firstName!:        string;
  lastName!:         string;
  fullName!:         string;
  profilePhotoUrl?:  string;
  registeredAt!:     string;   // ISO date string
}
