package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Integer> {

    Optional<Topic> findByName(String name);

    @Query("SELECT t FROM Topic t JOIN FETCH t.category c WHERE c.name = :categoryName")
    List<Topic> findByCategoryName(@Param("categoryName") String categoryName);
}
