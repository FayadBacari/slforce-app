// An athlete as returned by GET /search/athletes.
// Only fields available in the User collection — speciality, weight category,
// medals, etc. will be added when the AthleteProfile collection is implemented.
export interface AthleteSearchResultEntity {
  id:              string;
  firstName:       string;
  lastName:        string;
  fullName:        string;
  profilePhotoUrl: string | undefined;
  registeredAt:    string;
}
