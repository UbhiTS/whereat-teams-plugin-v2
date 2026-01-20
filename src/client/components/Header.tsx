import React from 'react';
import { User } from '../types';
import { 
  Avatar, 
  Text, 
  Badge 
} from '@fluentui/react-components';
import { 
  LocationRegular,
  PersonRegular
} from '@fluentui/react-icons';

interface HeaderProps {
  currentUser: User | null;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-icon">
          <LocationRegular fontSize={24} />
        </div>
        <div className="header-title">
          <Text size={500} weight="semibold">Where@ - Team Insights</Text>
        </div>
      </div>
      
      <div className="header-right">
        {currentUser && (
          <div className="current-user-info">
            <Avatar
              image={{ src: currentUser.photo }}
              name={currentUser.displayName}
              size={32}
            />
            <div className="user-details">
              <Text size={200} weight="semibold">{currentUser.displayName}</Text>
              <Text size={100} className="user-title">{currentUser.jobTitle}</Text>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
