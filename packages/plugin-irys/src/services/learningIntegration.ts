import { elizaLogger, IAgentRuntime, IrysDataType, IrysMessageType, Service, ServiceType, generateMessageResponse, ModelClass } from "@elizaos/core";
import { IrysService } from "./irysService";

export class LearningIntegration extends Service {
    static serviceType = 'LEARNING_INTEGRATION' as ServiceType;
    private runtime: IAgentRuntime;
    private irysService: IrysService;
    private processingTopics = false;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        this.runtime = runtime;
        this.irysService = runtime.getService(ServiceType.IRYS) as IrysService;
    }

    async storeTopics(messageText: string[]): Promise<boolean> {
        if (this.processingTopics) {
            elizaLogger.warn("Already processing topics");
            return false;
        }

        this.processingTopics = true;
        try {
            // Extract topics
            const topics = await this.extractTopics(messageText[0]);
            elizaLogger.info("Extracted topics:", topics);

            if (!topics.length) return false;

            // Check uniqueness
            const existingTopics = new Set(this.runtime.character.topics || []);
            const uniqueTopics = topics.filter(topic => !existingTopics.has(topic));

            if (!uniqueTopics.length) {
                elizaLogger.info("No new unique topics found");
                return false;
            }

            // Store on Irys
            const result = await this.irysService.workerUploadDataOnIrys(
                { topics: uniqueTopics },
                IrysDataType.OTHER,
                IrysMessageType.DATA_STORAGE,
                ["Topics"],
                ["Character Development"]
            );

            if (result.success) {
                this.runtime.character.topics = [...Array.from(existingTopics), ...uniqueTopics];
                elizaLogger.info("Successfully stored new topics:", uniqueTopics);
                elizaLogger.info("Irys transaction URL:", result.url);
                return true;
            }

            elizaLogger.error("Failed to store topics:", result.error);
            return false;
        } catch (error) {
            elizaLogger.error("Error in topic processing:", error);
            return false;
        } finally {
            this.processingTopics = false;
        }
    }

    private async extractTopics(text: string): Promise<string[]> {
        const response = await generateMessageResponse({
            runtime: this.runtime,
            context: `Extract 2-3 key topics as simple comma-separated words (no phrases or explanations):\n"${text}"\n\nTopics:`,
            modelClass: ModelClass.SMALL
        });

        return response?.text?.split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 2 && t.length < 30) || [];
    }
}