import { elizaLogger, Plugin } from "@elizaos/core";
import IrysService from "./services/irysService";
import { LearningIntegration } from "./services/learningIntegration";
import { CharacterEnhancer, ICharacterEnhancer } from "./services/characterEnhancer";
import { TopicProcessor }from "./services/topicProcessor"
const irysPlugin: Plugin = {
    name: "plugin-irys",
    description: "Store and retrieve data on Irys to create a decentralized knowledge base and enable multi-agent collaboration",
    actions: [],
    providers: [],
    evaluators: [],
    clients: [],
    services: [
        new IrysService(),
        new TopicProcessor()
    ],

}

export { CharacterEnhancer };
export { LearningIntegration };
export {ICharacterEnhancer };

export default irysPlugin;
