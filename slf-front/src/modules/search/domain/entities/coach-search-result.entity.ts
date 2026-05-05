// A coach as returned by GET /search/coaches.
export interface CoachSearchResultEntity {
  id:              string;
  firstName:       string;
  lastName:        string;
  fullName:        string;
  profilePhotoUrl: string | undefined;
  registeredAt:    string;

  // Coach profile fields — undefined when not yet filled by the coach
  disciplines:      string[];   // badge array — empty [] when not yet set
  bio?:             string;
  location?:        string;
  monthlyRate?:     number;
  experienceYears?: number;
}
