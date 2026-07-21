package com.jobprep.session.repository;

import com.jobprep.session.entity.UserStreak;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserStreakRepository extends JpaRepository<UserStreak, String> {

    /** All users with an active streak > 0 (candidates for reminders). */
    List<UserStreak> findByActiveTrueAndStreakCountGreaterThan(int minCount);
}
