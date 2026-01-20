import React from 'react';
import { User } from '../types';
interface MapViewProps {
    users: User[];
    currentUser: User | null;
    managementChain: User[];
    directReports: User[];
    selectedUser: User | null;
    shouldZoomToUser?: boolean;
    onUserSelect: (user: User, shouldZoom?: boolean) => void;
}
declare const MapView: React.FC<MapViewProps>;
export default MapView;
//# sourceMappingURL=MapView.d.ts.map