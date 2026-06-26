import { UserRole } from '../lib/supabaseTypes';
import { getRoleIdByName } from './roleService';

export type ProfilePayloadOptions = {
  userId: string;
  email?: string | null;
  fullName: string;
  role: UserRole;
  metadataProfileType?: string;
};

export async function buildProfilePayload({
  userId,
  email,
  fullName,
  role,
  metadataProfileType,
}: ProfilePayloadOptions): Promise<Record<string, unknown>> {
  const roleId = await getRoleIdByName(role);
  const profileType = metadataProfileType || role;

  const payload: Record<string, unknown> = {
    id: userId,
    full_name: fullName,          // NOT NULL in live DB
    email: email ?? null,
    role,                          // NOT NULL in live DB
    profile_type: profileType,     // NOT NULL in live DB
  };

  // role_id is NOT NULL in live DB — always include it when available
  if (roleId) {
    payload.role_id = roleId;
  }

  return payload;
}
