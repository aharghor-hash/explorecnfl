import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase, isUsingMock } from '../supabase';
import { MOCK_DATA } from './mockData';
import { 
    Event, CricketTeam, Player, ParticipantTeam, ReplacementRequest, 
    Announcement, ChatMessage, User, SiteSettings, CnflHistory
} from '../types';

interface AppState {
  users: User[]; // from 'profiles' table
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

interface Actions {
    createEvent: (event: Omit<Event, 'id'>) => Promise<Event | null>;
    updateEvent: (event: Event) => Promise<Event | null>;
    deleteEvent: (id: string) => Promise<void>;
    addTeam: (team: Omit<CricketTeam, 'id'>) => Promise<CricketTeam | null>;
    updateTeam: (team: CricketTeam) => Promise<CricketTeam | null>;
    deleteTeam: (id: string) => Promise<void>;
    addPlayer: (player: Omit<Player, 'id'>) => Promise<Player | null>;
    addBulkPlayers: (players: Omit<Player, 'id' | 'points'>[]) => Promise<Player[] | null>;
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

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Supabase error in ${context}:`, error);
        // Here you could also set an error state to show in the UI
    }
    return error;
};

const INITIAL_STATE: AppState = {
    users: [], events: [], teams: [], players: [], participantTeams: [],
    replacementRequests: [], announcements: [], chatMessages: [],
    cnflHistory: [], siteSettings: { showParticipantTeams: false },
};

// --- Prepare Mock State ---
const MOCK_STATE_INITIALIZED: AppState = {
    ...INITIAL_STATE, // Start with a clean slate
    ...MOCK_DATA,
    // The user type in mockData might have a password, which we remove for type safety.
    users: MOCK_DATA.users.map(({ password, ...user }: any) => user),
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [loading, setLoading] = useState(true);

    const actions = useMemo<Actions>(() => {
        if (isUsingMock) {
            const mockAction = (name: string) => async (..._args: any[]): Promise<any> => {
                console.warn(`Action "${name}" is disabled in mock mode.`);
                alert(`Action "${name}" is not available in mock mode. Configure Supabase credentials to enable backend interaction.`);
                return null;
            };
            return {
                createEvent: mockAction('createEvent'),
                updateEvent: mockAction('updateEvent'),
                deleteEvent: mockAction('deleteEvent'),
                addTeam: mockAction('addTeam'),
                updateTeam: mockAction('updateTeam'),
                deleteTeam: mockAction('deleteTeam'),
                addPlayer: mockAction('addPlayer'),
                addBulkPlayers: mockAction('addBulkPlayers'),
                updatePlayer: mockAction('updatePlayer'),
                deletePlayer: mockAction('deletePlayer'),
                updatePlayerPoints: mockAction('updatePlayerPoints'),
                updateReplacementRequest: mockAction('updateReplacementRequest'),
                addReplacementRequest: mockAction('addReplacementRequest'),
                addAnnouncement: mockAction('addAnnouncement'),
                deleteAnnouncement: mockAction('deleteAnnouncement'),
                addChatMessage: mockAction('addChatMessage'),
                updateSiteSettings: mockAction('updateSiteSettings'),
                addHistory: mockAction('addHistory'),
                updateHistory: mockAction('updateHistory'),
                deleteHistory: mockAction('deleteHistory'),
                addParticipantTeam: mockAction('addParticipantTeam'),
                updateParticipantTeam: mockAction('updateParticipantTeam'),
                updateUser: mockAction('updateUser'),
            };
        }

        return {
            createEvent: async (event) => {
                const { data, error } = await supabase.from('events').insert(event).select().single();
                return handleSupabaseError(error, 'createEvent') ? null : data;
            },
            updateEvent: async (event) => {
                const { data, error } = await supabase.from('events').update(event).eq('id', event.id).select().single();
                return handleSupabaseError(error, 'updateEvent') ? null : data;
            },
            deleteEvent: async (id) => {
                const { error } = await supabase.from('events').delete().eq('id', id);
                handleSupabaseError(error, 'deleteEvent');
            },
            addTeam: async (team) => {
                const { data, error } = await supabase.from('teams').insert(team).select().single();
                return handleSupabaseError(error, 'addTeam') ? null : data;
            },
            updateTeam: async (team) => {
                const { data, error } = await supabase.from('teams').update(team).eq('id', team.id).select().single();
                return handleSupabaseError(error, 'updateTeam') ? null : data;
            },
            deleteTeam: async (id) => {
                const { error } = await supabase.from('teams').delete().eq('id', id);
                handleSupabaseError(error, 'deleteTeam');
            },
            addPlayer: async (player) => {
                const { data, error } = await supabase.from('players').insert(player).select().single();
                return handleSupabaseError(error, 'addPlayer') ? null : data;
            },
            addBulkPlayers: async (players) => {
                const playersWithPoints = players.map(p => ({ ...p, points: [] }));
                const { data, error } = await supabase.from('players').insert(playersWithPoints).select();
                return handleSupabaseError(error, 'addBulkPlayers') ? null : data;
            },
            updatePlayer: async (player) => {
                const { data, error } = await supabase.from('players').update(player).eq('id', player.id).select().single();
                return handleSupabaseError(error, 'updatePlayer') ? null : data;
            },
            deletePlayer: async (id) => {
                const { error } = await supabase.from('players').delete().eq('id', id);
                handleSupabaseError(error, 'deletePlayer');
            },
            updatePlayerPoints: async ({ playerId, points }) => {
                const { error } = await supabase.from('players').update({ points }).eq('id', playerId);
                handleSupabaseError(error, 'updatePlayerPoints');
            },
            updateReplacementRequest: async (req) => {
                const { error } = await supabase.from('replacement_requests').update(req).eq('id', req.id);
                handleSupabaseError(error, 'updateReplacementRequest');
            },
            addReplacementRequest: async (req) => {
                const { data, error } = await supabase.from('replacement_requests').insert(req).select().single();
                return handleSupabaseError(error, 'addReplacementRequest') ? null : data;
            },
            addAnnouncement: async (announcement) => {
                const { data, error } = await supabase.from('announcements').insert(announcement).select().single();
                return handleSupabaseError(error, 'addAnnouncement') ? null : data;
            },
            deleteAnnouncement: async (id) => {
                const { error } = await supabase.from('announcements').delete().eq('id', id);
                handleSupabaseError(error, 'deleteAnnouncement');
            },
            addChatMessage: async (msg) => {
                const { data, error } = await supabase.from('chat_messages').insert(msg).select().single();
                return handleSupabaseError(error, 'addChatMessage') ? null : data;
            },
            updateSiteSettings: async (settings) => {
                const { data, error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'id' }).select().single();
                return handleSupabaseError(error, 'updateSiteSettings') ? null : data;
            },
            addHistory: async (item) => {
                const { data, error } = await supabase.from('cnfl_history').insert(item).select().single();
                return handleSupabaseError(error, 'addHistory') ? null : data;
            },
            updateHistory: async (item) => {
                const { data, error } = await supabase.from('cnfl_history').update(item).eq('id', item.id).select().single();
                return handleSupabaseError(error, 'updateHistory') ? null : data;
            },
            deleteHistory: async (id) => {
                const { error } = await supabase.from('cnfl_history').delete().eq('id', id);
                handleSupabaseError(error, 'deleteHistory');
            },
            addParticipantTeam: async (team) => {
                const { data, error } = await supabase.from('participant_teams').insert(team).select().single();
                return handleSupabaseError(error, 'addParticipantTeam') ? null : data;
            },
            updateParticipantTeam: async (team) => {
                const { data, error } = await supabase.from('participant_teams').update(team).eq('id', team.id).select().single();
                return handleSupabaseError(error, 'updateParticipantTeam') ? null : data;
            },
            updateUser: async (user) => {
                const { data, error } = await supabase.from('profiles').update(user).eq('id', user.id).select().single();
                return handleSupabaseError(error, 'updateUser') ? null : data;
            },
        };
    }, []);
    

    useEffect(() => {
        if (isUsingMock) {
            setState(MOCK_STATE_INITIALIZED);
            setLoading(false);
            return; // Exit early, no fetching or subscriptions
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [
                    users, events, teams, players, participantTeams,
                    replacementRequests, announcements, chatMessages,
                    cnflHistory, siteSettings
                ] = await Promise.all([
                    supabase.from('profiles').select('*'),
                    supabase.from('events').select('*'),
                    supabase.from('teams').select('*'),
                    supabase.from('players').select('*'),
                    supabase.from('participant_teams').select('*'),
                    supabase.from('replacement_requests').select('*'),
                    supabase.from('announcements').select('*').order('timestamp', { ascending: false }),
                    supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
                    supabase.from('cnfl_history').select('*').order('seasonNumber', { ascending: true }),
                    supabase.from('site_settings').select('*').limit(1).single()
                ]);
                
                const checkError = (res: any, name: string) => { if (res.error && res.error.code !== 'PGRST116') { throw new Error(`Failed to fetch ${name}: ${res.error.message}`);} return res.data || []; };
                
                setState({
                    users: checkError(users, 'profiles'),
                    events: checkError(events, 'events'),
                    teams: checkError(teams, 'teams'),
                    players: checkError(players, 'players'),
                    participantTeams: checkError(participantTeams, 'participant_teams'),
                    replacementRequests: checkError(replacementRequests, 'replacement_requests'),
                    announcements: checkError(announcements, 'announcements'),
                    chatMessages: checkError(chatMessages, 'chat_messages'),
                    cnflHistory: checkError(cnflHistory, 'cnfl_history'),
                    siteSettings: siteSettings.data || { showParticipantTeams: false },
                });
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const handleDbChange = (payload: any) => {
            console.log('Realtime change received!', payload);
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            
            const tableKeyMap: {[key: string]: keyof AppState} = {
                'profiles': 'users',
                'events': 'events',
                'teams': 'teams',
                'players': 'players',
                'participant_teams': 'participantTeams',
                'replacement_requests': 'replacementRequests',
                'announcements': 'announcements',
                'chat_messages': 'chatMessages',
                'cnfl_history': 'cnflHistory',
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
                    // Avoid duplicates from race conditions with initial fetch
                    if (!items.some(item => item.id === recordId)) {
                        items.push(newRecord);
                    }
                } else if (eventType === 'UPDATE') {
                    const index = items.findIndex(item => item.id === recordId);
                    if (index !== -1) {
                        items[index] = newRecord;
                    } else {
                        items.push(newRecord); // If not found, add it
                    }
                } else if (eventType === 'DELETE') {
                    items = items.filter(item => item.id !== recordId);
                }
                
                if (stateKey === 'announcements') {
                    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                } else if (stateKey === 'chatMessages') {
                    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                } else if (stateKey === 'cnflHistory') {
                     items.sort((a,b) => a.seasonNumber.localeCompare(b.seasonNumber));
                }

                (newState[stateKey] as any) = items;
                return newState;
            });
        };

        const channel = supabase.channel('db-changes');
        channel
          .on('postgres_changes', { event: '*', schema: 'public' }, handleDbChange)
          .subscribe();

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
