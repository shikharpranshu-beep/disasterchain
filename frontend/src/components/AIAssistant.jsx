import React from 'react';
import DisasterAIChat from './DisasterAIChat';

/**
 * AIAssistant wrapper for backwards compatibility
 * Renders the production-ready DisasterAIChat component
 */
const AIAssistant = (props) => {
  return <DisasterAIChat {...props} />;
};

export { DisasterAIChat };
export default AIAssistant;
