package com.knust.codequest.aiservice.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Spring AI model configuration.
 * <p>
 * Configures the {@link ChatModel} bean for production use.
 * Currently targets OpenAI; swap to Anthropic/Gemini by changing
 * the dependency and bean definition.
 */
@Configuration
@Profile("real-ai")
public class AiModelConfig {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Bean
    public ChatModel chatModel() {
        OpenAiApi openAiApi = new OpenAiApi(apiKey);
        return new OpenAiChatModel(openAiApi);
    }
}
