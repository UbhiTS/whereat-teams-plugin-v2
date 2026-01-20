export interface Location {
    type: string;
    street: string | null;
    city: string;
    state: string;
    countryOrRegion: string;
    postalCode: string | null;
    officeLocation: string | null;
}
export interface DirectReport {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail: string;
    jobTitle: string;
}
export interface User {
    id: string;
    displayName: string;
    givenName: string;
    surname: string;
    userPrincipalName: string;
    mail: string;
    jobTitle: string;
    officeLocation: string;
    businessPhones: string[];
    mobilePhone: string | null;
    preferredLanguage: string | null;
    location: Location;
    directReports: DirectReport[];
    directReportIds: string[];
    photo: string;
    scrapedAt: string;
}
export interface UserContext {
    currentUser: User | null;
    allUsers: User[];
    managementChain: User[];
    directReports: User[];
    selectedUser: User | null;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}
export interface MapMarker {
    user: User;
    coordinates: [number, number];
    type: 'current' | 'manager' | 'direct-report' | 'colleague';
}
export declare const cityCoordinates: Record<string, [number, number]>;
export declare function getCityCoordinates(city: string): [number, number] | null;
//# sourceMappingURL=index.d.ts.map