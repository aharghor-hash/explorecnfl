import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabase/client';
import * as api from '../supabase/api';
import { 
    Event, CricketTeam, Player, ParticipantTeam, ReplacementRequest, 
    Announcement, ChatMessage, User, SiteSettings, CnflHistory
} from '../types';

interface AppState {
  users: User[];
  events: Event[];
  teams: CricketTeam[];
  players: Player[];
  participantTeams: ParticipantTeam[];
  replacementRequests: ReplacementRequest[];
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  cnflHistory: CnflHistory[];
  siteSettings: SiteSettings;
}

// The actions interface remains largely the same for component compatibility
interface Actions {
    createEvent: (event: Omit<Event, 'id'>) => Promise<Event | null>;
    updateEvent: (event: Event) => Promise<Event | null>;
    deleteEvent: (id: string) => Promise<void>;
    addTeam: (team: Omit<CricketTeam, 'id'>) => Promise<CricketTeam | null>;
    updateTeam: (team: CricketTeam) => Promise<CricketTeam | null>;
    deleteTeam: (id: string) => Promise<void>;
    addPlayer: (player: Omit<Player, 'id'>) => Promise<Player | null>;
    addBulkPlayers: (players: Omit<Player, 'id' | 'points'>[]) => Promise<any>;
    updatePlayer: (player: Player) => Promise<Player | null>;
    deletePlayer: (id: string) => Promise<void>;
    updatePlayerPoints: (payload: { playerId: string; points: number[] }) => Promise<void>;
    updateReplacementRequest: (req: ReplacementRequest) => Promise<void>;
    addReplacementRequest: (req: Omit<ReplacementRequest, 'id'>) => Promise<ReplacementRequest | null>;
    addAnnouncement: (announcement: Omit<Announcement, 'id'>) => Promise<Announcement | null>;
    deleteAnnouncement: (id: string) => Promise<void>;
    addChatMessage: (msg: Omit<ChatMessage, 'id'>) => Promise<ChatMessage | null>;
    updateSiteSettings: (settings: SiteSettings) => Promise<SiteSettings | null>;
    addHistory: (item: Omit<CnflHistory, 'id'>) => Promise<CnflHistory | null>;
    updateHistory: (item: CnflHistory) => Promise<CnflHistory | null>;
    deleteHistory: (id: string) => Promise<void>;
    addParticipantTeam: (team: Omit<ParticipantTeam, 'id'>) => Promise<ParticipantTeam | null>;
    updateParticipantTeam: (team: ParticipantTeam) => Promise<ParticipantTeam | null>;
    updateUser: (user: User) => Promise<User | null>;
}

interface DataContextType {
  state: AppState;
  actions: Actions;
  loading: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

const INITIAL_STATE: AppState = {
    users: [], events: [], teams: [], players: [], participantTeams: [],
    replacementRequests: [], announcements: [], chatMessages: [],
    cnflHistory: [], siteSettings: { showParticipantTeams: false },
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [loading, setLoading] = useState(true);

    const actions = useMemo<Actions>(() => ({
        createEvent: api.createEvent,
        updateEvent: api.updateEvent,
        deleteEvent: async (id) => { await api.deleteEvent(id); },
        addTeam: api.addTeam,
        updateTeam: api.updateTeam,
        deleteTeam: async (id) => { await api.deleteTeam(id); },
        addPlayer: api.addPlayer,
        addBulkPlayers: api.addBulkPlayers,
        updatePlayer: api.updatePlayer,
        deletePlayer: async (id) => { await api.deletePlayer(id); },
        updatePlayerPoints: async (payload) => { await api.updatePlayerPoints(payload); },
        updateReplacementRequest: async (req) => { await api.updateReplacementRequest(req); },
        addReplacementRequest: api.addReplacementRequest,
        addAnnouncement: api.addAnnouncement,
        deleteAnnouncement: async (id) => { await api.deleteAnnouncement(id); },
        addChatMessage: api.addChatMessage,
        updateSiteSettings: api.updateSiteSettings,
        addHistory: api.addHistory,
        updateHistory: api.updateHistory,
        deleteHistory: async (id) => { await api.deleteHistory(id); },
        addParticipantTeam: api.addParticipantTeam,
        updateParticipantTeam: api.updateParticipantTeam,
        updateUser: api.updateUser,
    }), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await api.getInitialData();
                setState(data);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                // Optionally set an error state to show a message in the UI
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const handleDbChange = (payload: any) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            
            const tableKeyMap: {[key: string]: keyof AppState} = {
                'profiles': 'users', 'events': 'events', 'teams': 'teams', 'players': 'players',
                'participant_teams': 'participantTeams', 'replacement_requests': 'replacementRequests',
                'announcements': 'announcements', 'chat_messages': 'chatMessages', 'cnfl_history': 'cnflHistory',
            };

            if (table === 'site_settings') {
                if (eventType === 'UPDATE' || eventType === 'INSERT') {
                    setState(prevState => ({ ...prevState, siteSettings: newRecord as SiteSettings }));
                }
                return;
            }

            const stateKey = tableKeyMap[table];
            if (!stateKey || !Array.isArray(state[stateKey])) return;

            setState(prevState => {
                const newState = { ...prevState };
                let items = [...(prevState[stateKey] as any[])];
                const recordId = eventType === 'DELETE' ? oldRecord.id : newRecord.id;

                if (eventType === 'INSERT') {
                    if (!items.some(item => item.id === recordId)) items.push(newRecord);
                } else if (eventType === 'UPDATE') {
                    const index = items.findIndex(item => item.id === recordId);
                    if (index !== -1) items[index] = newRecord; else items.push(newRecord);
                } else if (eventType === 'DELETE') {
                    items = items.filter(item => item.id !== recordId);
                }
                
                // Keep sorted lists sorted
                if (stateKey === 'announcements') items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                else if (stateKey === 'chatMessages') items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                else if (stateKey === 'cnflHistory') items.sort((a,b) => a.seasonNumber.localeCompare(b.seasonNumber));

                (newState[stateKey] as any) = items;
                return newState;
            });
        };

        const channel = supabase.channel('db-changes');
        channel.on('postgres_changes', { event: '*', schema: 'public' }, handleDbChange).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    return (
        <DataContext.Provider value={{ state, actions, loading }}>
            {children}
        </DataContext.Provider>
    );
};
