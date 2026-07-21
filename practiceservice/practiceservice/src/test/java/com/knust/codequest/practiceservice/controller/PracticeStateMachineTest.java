package com.knust.codequest.practiceservice.controller;

import com.knust.codequest.practiceservice.model.entity.PracticeSession;
import com.knust.codequest.practiceservice.model.enums.SessionStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PracticeStateMachineTest {

    @Test
    void isInProgress_trueForInProgress() {
        PracticeSession session = new PracticeSession();
        session.setStatus(SessionStatus.IN_PROGRESS);
        assertTrue(session.isInProgress());
    }

    @Test
    void isInProgress_falseForCompletedOrAbandoned() {
        PracticeSession session = new PracticeSession();
        
        session.setStatus(SessionStatus.COMPLETED);
        assertFalse(session.isInProgress());

        session.setStatus(SessionStatus.ABANDONED);
        assertFalse(session.isInProgress());
    }
}
