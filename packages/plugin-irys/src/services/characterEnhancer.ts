import { IAgentRuntime, Memory, ModelClass, Service, ServiceType, elizaLogger, generateMessageResponse } from "@elizaos/core";
import { LearningIntegration } from "./learningIntegration";

export class CharacterEnhancer extends Service {
    // static serviceType = ServiceType.CHARACTER_ENHANCER;
    static serviceType = 'character_enhancer' as ServiceType;

    private runtime: IAgentRuntime;
    private learningService: LearningIntegration;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        this.runtime = runtime;
        this.learningService = runtime.getService('LEARNING_INTEGRATION' as ServiceType) as LearningIntegration;
    }

    async processAndEnhance(message: Memory): Promise<void> {
        if (!message?.content?.text) return;

        elizaLogger.info("Processing message for learning:", message.content.text);

        // Extract topics using the runtime's message generation
        const response = await generateMessageResponse({
            runtime: this.runtime,
            context: `Extract key topics from: "${message.content.text}"`,
            modelClass: ModelClass.MEDIUM
        });

        if (!response.success) return;

        const topics = response.content.toString()
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean);

        if (topics.length > 0) {
            const learningService = this.runtime.getService('LEARNING_INTEGRATION' as ServiceType) as LearningIntegration;
            await learningService?.storeTopics(topics);
        }
    }

    private async extractTopics(text: string): Promise<string[]> {
        elizaLogger.log("Extracting topics from:", text);
        const response = await generateMessageResponse({
            runtime: this.runtime,
            context: `Extract key topics as comma-separated values: "${text}"`,
            modelClass: ModelClass.MEDIUM
        });

        return response.success ?
        response.content.toString()
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean) :
        [];
    }

    private async processNewTopics(newTopics: string[]): Promise<void> {
        try {
            const character = this.runtime.character;
            elizaLogger.log("Current topics:", character.topics);
            elizaLogger.log("New topics to process:", newTopics);
        elizaLogger.log("\n📋 Current Topics:", character.topics);

        const uniqueNewTopics = newTopics.filter(topic => !character.topics.includes(topic));

        if (uniqueNewTopics.length > 0) {
            elizaLogger.log("🆕 New Topics Found:", uniqueNewTopics);
            const stored = await this.learningService.storeTopics(uniqueNewTopics);

            if (stored) {
                character.topics = [...character.topics, ...uniqueNewTopics];
                elizaLogger.log("✅ Topics Updated and Stored");
            }
        } else {
            elizaLogger.log("No new topics to add");
        }

    }catch (error) {
    elizaLogger.error("Error processing topics:", error);
}
    }
}export interface ICharacterEnhancer {
    processAndEnhance(message: any): Promise<void>;
}
