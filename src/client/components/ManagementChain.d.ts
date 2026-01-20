import React from 'react';
import { User } from '../types';
interface ManagementChainProps {
    currentUser: User | null;
    managementChain: User[];
    onClose: () => void;
    onUserSelect: (user: User, shouldZoom: boolean) => void;
    onVisibleUsersChange: (users: User[]) => void;
    panelWidth?: number;
    onPanelWidthChange?: (width: number) => void;
}
declare const ManagementChain: React.FC<ManagementChainProps>;
export default ManagementChain;
//# sourceMappingURL=ManagementChain.d.ts.map