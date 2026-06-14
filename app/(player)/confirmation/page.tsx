import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { ConfirmationClient } from './ConfirmationClient';

export const metadata: Metadata = { title: 'Registration Confirmed' };

type SearchParams = Promise<{ ref?: string }>;

export default async function ConfirmationPage({ searchParams }: { searchParams: SearchParams }) {
  const { ref } = await searchParams;

  if (!ref) notFound();

  const { data: reg } = await serverSupabase
    .from('registrations')
    .select(`
      id, booking_ref, registration_status, payment_status,
      registered_at, character_1, character_2, character_3,
      support_character, team_name, team_type,
      tournaments(
        id, name, slug, game_type, format, status,
        start_at, entry_fee, prize_pool, venue,
        arcades(name, city, whatsapp_number, contact_email)
      ),
      profiles(gamer_tag, full_name, phone)
    `)
    .eq('booking_ref', ref)
    .single();

  if (!reg) notFound();

  return <ConfirmationClient reg={reg as any} />;
}
