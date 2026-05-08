import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '@modules/users/data/repositories/users.repository';
import type { UserDocument } from '@modules/users/data/schemas/user.schema';
import { CoachSearchResultDto } from '../presentation/dto/coach-search-result.dto';
import { AthleteSearchResultDto } from '../presentation/dto/athlete-search-result.dto';

// Limite — la search ne renvoie que les 10 derniers inscrits.
// Pas de pagination tant que le volume reste raisonnable (<10k coachs).
const MAX_RESULTS_RETURNED = 10;

@Injectable()
export class SearchService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // ─── GET /search/coaches ─────────────────────────────────────────────────────
  // Renvoie les 10 coachs les plus récemment inscrits (publics + actifs).
  // Tableau vide si aucun coach n'existe encore — le frontend gère l'empty state.
  async getRecentCoaches(): Promise<CoachSearchResultDto[]> {
    const coaches = await this.usersRepository.findRecentCoaches(MAX_RESULTS_RETURNED);
    return coaches.map((coach) => this.mapUserToCoachSearchResult(coach));
  }

  // ─── GET /search/athletes ────────────────────────────────────────────────────
  // Renvoie les 10 athlètes les plus récemment inscrits (publics + actifs).
  async getRecentAthletes(): Promise<AthleteSearchResultDto[]> {
    const athletes = await this.usersRepository.findRecentAthletes(MAX_RESULTS_RETURNED);
    return athletes.map((athlete) => this.mapUserToAthleteSearchResult(athlete));
  }

  // ─── Private mappers ─────────────────────────────────────────────────────────
  //
  // Centralisent la conversion UserDocument → DTO de search.
  // Toute évolution future de la shape (ajout d'un badge, d'un compteur…) se fait
  // ici à un seul endroit, jamais dans deux branches divergentes.

  private mapUserToCoachSearchResult(coach: UserDocument): CoachSearchResultDto {
    return {
      ...this.mapUserToBaseSearchResult(coach),
      speciality:      coach.speciality,
      disciplines:     coach.disciplines ?? [],
      bio:             coach.bio,
      location:        coach.location,
      monthlyRate:     coach.monthlyRate,
      experienceYears: coach.experienceYears,
    };
  }

  private mapUserToAthleteSearchResult(athlete: UserDocument): AthleteSearchResultDto {
    // Aujourd'hui l'athlete card n'expose que les champs partagés.
    // Les champs spécifiques (records, weightCategory…) seront ajoutés Phase 2
    // quand AthleteProfile sera une collection séparée.
    return this.mapUserToBaseSearchResult(athlete);
  }

  // Champs communs à tous les résultats de search — projetés une seule fois.
  // Garde la cohérence du shape entre coach et athlete.
  private mapUserToBaseSearchResult(user: UserDocument): {
    id:               string;
    firstName:        string;
    lastName:         string;
    fullName:         string;
    profilePhotoUrl?: string;
    registeredAt:     string;
  } {
    return {
      id:              (user._id as Types.ObjectId).toString(),
      firstName:       user.firstName,
      lastName:        user.lastName,
      fullName:        `${user.firstName} ${user.lastName}`,
      profilePhotoUrl: user.profilePhotoUrl,
      registeredAt:    (user.createdAt as Date).toISOString(),
    };
  }
}
