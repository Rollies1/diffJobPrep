package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.entity.User;
import com.knust.codequest.questionservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new com.knust.codequest.questionservice.exception.ResourceNotFoundException("User", "id", id));
    }

    @Transactional
    public User createUser(String email) {
        User user = new User(email);
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }
}
