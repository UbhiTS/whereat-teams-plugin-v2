import React from 'react';
import { User } from '../types';
interface ChatPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    currentUser: User | null;
    managementChainWidth?: number;
}
declare const ChatPanel: React.FC<ChatPanelProps>;
export default ChatPanel;
//# sourceMappingURL=ChatPanel.d.ts.map