import { UserRole } from '../types';

export const MOCK_DATA = {
  users: [
    // A default admin user is necessary to allow initial login and content creation.
    { id: 'admin-1', fullName: 'Admin User', email: 'admin@cnfl.com', role: UserRole.ADMIN, fbLink: 'https://facebook.com/admin' },
  ],
  events: [],
  teams: [],
  players: [],
  participantTeams: [],
  replacementRequests: [],
  announcements: [],
  chatMessages: [],
  cnflHistory: [],
  siteSettings: {
    siteLogo: null,
    contactInfo: 'For any queries, please contact the admin.',
    heroTitle: 'Welcome to',
    heroHighlightedText: 'Cricket Nagar Fantasy League',
    heroSubtitle: 'Build your dream team, compete with friends, and experience the thrill of fantasy cricket.\nPlay for fun, not for money!',
    heroBackgroundImage: null,
    showParticipantTeams: false,
  },
};
