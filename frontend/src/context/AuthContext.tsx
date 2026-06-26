import { createContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { ProfileRow, UserRole } from '../lib/supabaseTypes';
import { buildProfilePayload } from '../services/profilePayload';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeProfile = (profile: any): ProfileRow => {
    const roleIdValue = typeof profile.role_id === 'string' ? profile.role_id : undefined;
    const isUuid = !!roleIdValue?.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/);
    return {
      ...profile,
      role_id: roleIdValue ?? profile.role,
      role: (profile.role as UserRole) || (!isUuid ? roleIdValue as UserRole : undefined),
    } as ProfileRow;
  };

  const refreshProfile = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setProfile(null);
      return;
    }

    let data: any = null;
    let error: any = null;

    ({ data, error } = await supabase
      .from('profiles')
      .select('*, role_id')
      .eq('id', userData.user.id)
      .maybeSingle());

    if (error?.message?.includes('column "role_id" does not exist')) {
      ({ data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle());
    }

    if (error) throw error;

    if (!data) {
      const role = (userData.user.user_metadata?.role as UserRole) || 'guard';
      const payload = await buildProfilePayload({
        userId: userData.user.id,
        email: userData.user.email,
        fullName:
          userData.user.user_metadata?.full_name ||
          userData.user.email?.split('@')[0] ||
          'User',
        role,
        metadataProfileType: userData.user.user_metadata?.profile_type,
      });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(payload)
        .select('*, role_id')
        .maybeSingle();

      if (createError) throw createError;
      setProfile(normalizeProfile(newProfile));
      return;
    }

    setProfile(normalizeProfile(data));
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user || null);
      if (data.session?.user) {
        try {
          await refreshProfile();
        } catch (err) {
          console.error('Failed to refresh profile:', err);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
      if (nextSession?.user) {
        refreshProfile().catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, session, profile, loading, refreshProfile }), [user, session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
