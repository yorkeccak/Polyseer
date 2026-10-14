/**
 * Unified database interface that switches between Supabase (valyu mode)
 * and SQLite (self-hosted mode) based on NEXT_PUBLIC_APP_MODE
 */

import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { getLocalDb, DEV_USER_ID } from "./local-db/client";
import { getDevUser, isSelfHostedMode } from "./local-db/local-auth";
import { eq } from "drizzle-orm";
import * as schema from "./local-db/schema";

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

export async function getUser() {
  if (isSelfHostedMode()) {
    return { data: { user: getDevUser() }, error: null };
  }

  const supabase = await createSupabaseClient();
  return await supabase.auth.getUser();
}

export async function getSession() {
  if (isSelfHostedMode()) {
    return {
      data: {
        session: {
          user: getDevUser(),
          access_token: "dev-access-token",
        },
      },
      error: null,
    };
  }

  const supabase = await createSupabaseClient();
  return await supabase.auth.getSession();
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function getUserById(userId: string) {
  if (isSelfHostedMode()) {
    const db = getLocalDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    return { data: user || null, error: null };
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

export async function upsertUser(userData: {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  valyu_sub?: string;
  valyu_user_type?: string;
  valyu_organisation_id?: string;
  valyu_organisation_name?: string;
}) {
  if (isSelfHostedMode()) {
    const db = getLocalDb();
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.id, userData.id),
    });

    if (existing) {
      await db
        .update(schema.users)
        .set({
          email: userData.email,
          fullName: userData.full_name,
          avatarUrl: userData.avatar_url,
          valyuSub: userData.valyu_sub,
          valyuUserType: userData.valyu_user_type,
          valyuOrganisationId: userData.valyu_organisation_id,
          valyuOrganisationName: userData.valyu_organisation_name,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userData.id));
    } else {
      await db.insert(schema.users).values({
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        avatarUrl: userData.avatar_url,
        valyuSub: userData.valyu_sub,
        valyuUserType: userData.valyu_user_type,
        valyuOrganisationId: userData.valyu_organisation_id,
        valyuOrganisationName: userData.valyu_organisation_name,
      });
    }

    return { error: null };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("users").upsert(userData);
  return { error };
}

// ============================================================================
// DEV MODE HELPERS
// ============================================================================

export { isSelfHostedMode, DEV_USER_ID };
