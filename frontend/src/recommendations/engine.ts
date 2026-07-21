import { offlineDB } from '../offline/database';

export interface DeckScore {
  deckId: string;
  title: string;
  score: number;
  reason: 'weak_area' | 'streak_saver' | 'next_level' | 'trending';
}

class RecommendationEngine {
  async getRecommendations(limit: number = 3): Promise<DeckScore[]> {
    const decks = await offlineDB.getAllDecks(); // Note: adjusted to use getAllDecks
    const scores: DeckScore[] = [];

    for (const deck of decks) {
      const progress = await offlineDB.getProgressForDeck(deck.id);
      const masteredRatio = progress.total > 0 ? progress.mastered / progress.total : 0;
      
      let score = 0;
      let reason: DeckScore['reason'] = 'trending';

      // Weak area: low mastery, high attempts
      if (progress.total > 0 && masteredRatio < 0.3) {
        score += 100;
        reason = 'weak_area';
      }
      
      // Streak saver: hasn't practiced today, deck is partially done
      const lastAttempt = await this.getLastAttempt(deck.id);
      const hoursSince = lastAttempt ? (Date.now() - lastAttempt) / 3600000 : 48;
      if (hoursSince > 20 && masteredRatio > 0 && masteredRatio < 1) {
        score += 80;
        reason = 'streak_saver';
      }
      
      // Next level: high mastery, ready for harder content
      if (masteredRatio > 0.7) {
        score += 60;
        reason = 'next_level';
      }

      // Premium boost (if not subscribed, tease premium decks)
      if (deck.is_premium === 1 && masteredRatio === 0) {
        score += 40;
      }

      scores.push({
        deckId: deck.id,
        title: deck.title,
        score,
        reason,
      });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getLastAttempt(deckId: string): Promise<number | null> {
    const result = await offlineDB.db?.getFirstAsync<{ last_attempted_at: string }>(
      `SELECT MAX(last_attempted_at) as last_attempted_at 
       FROM user_progress WHERE deck_id = ?`,
      [deckId]
    );
    return result?.last_attempted_at ? new Date(result.last_attempted_at).getTime() : null;
  }
}

export const recommendations = new RecommendationEngine();
