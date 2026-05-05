// Shape returned by GET /search/coaches for each coach in the list.
export class CoachSearchResultDto {
  id!:               string;
  firstName!:        string;
  lastName!:         string;
  fullName!:         string;
  profilePhotoUrl?:  string;
  registeredAt!:     string;

  // Coach profile fields (null when not yet filled by the coach)
  speciality?:       string;
  disciplines!:      string[];   // selected discipline badges
  bio?:              string;
  location?:         string;
  monthlyRate?:      number;
  experienceYears?:  number;
}
