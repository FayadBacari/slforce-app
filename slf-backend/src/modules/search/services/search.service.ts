import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../auth/data/repositories/users.repository';
import { CoachSearchResultDto } from '../presentation/dto/coach-search-result.dto';
import { AthleteSearchResultDto } from '../presentation/dto/athlete-search-result.dto';

const MAX_RESULTS_RETURNED = 10;

@Injectable()
export class SearchService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // Returns the 10 most recently registered active coaches.
  // If none exist the array is empty — the frontend handles the empty state.
  async getRecentCoaches(): Promise<CoachSearchResultDto[]> {
    const coaches = await this.usersRepository.findRecentCoaches(MAX_RESULTS_RETURNED);

    return coaches.map((coach) => ({
      id:              (coach._id as Types.ObjectId).toString(),
      firstName:       coach.firstName,
      lastName:        coach.lastName,
      fullName:        `${coach.firstName} ${coach.lastName}`,
      profilePhotoUrl: coach.profilePhotoUrl,
      registeredAt:    (coach.createdAt as Date).toISOString(),
      speciality:      coach.speciality,
      disciplines:     coach.disciplines ?? [],
      bio:             coach.bio,
      location:        coach.location,
      monthlyRate:     coach.monthlyRate,
      experienceYears: coach.experienceYears,
    }));
  }

  // Returns the 10 most recently registered active athletes.
  // If none exist the array is empty — the frontend handles the empty state.
  async getRecentAthletes(): Promise<AthleteSearchResultDto[]> {
    const athletes = await this.usersRepository.findRecentAthletes(MAX_RESULTS_RETURNED);

    return athletes.map((athlete) => ({
      id:              (athlete._id as Types.ObjectId).toString(),
      firstName:       athlete.firstName,
      lastName:        athlete.lastName,
      fullName:        `${athlete.firstName} ${athlete.lastName}`,
      profilePhotoUrl: athlete.profilePhotoUrl,
      registeredAt:    (athlete.createdAt as Date).toISOString(),
    }));
  }
}
