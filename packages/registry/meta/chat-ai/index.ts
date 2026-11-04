import type { CategoryMeta } from '../types';
import message from './message';
import conversation from './conversation';
import promptInput from './prompt-input';
import attachment from './attachment';
import trace from './trace';
import questionnaire from './questionnaire';
import agentPanel from './agent-panel';

const category: CategoryMeta = {
  id: 'chat-ai',
  title: 'Чат и AI',
  description: 'Сообщения, лента разговора, поле запроса и шаги агента.',
  components: [message, conversation, promptInput, attachment, trace, questionnaire, agentPanel],
};

export default category;
