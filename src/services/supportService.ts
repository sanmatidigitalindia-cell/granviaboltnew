import { supabase } from '../lib/supabaseClient';

export async function listMySupportTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, support_ticket_messages(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSupportTicket(input: {
  company_id?: string;
  subject: string;
  category?: string;
  priority?: string;
  message: string;
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in is required.');

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userData.user.id,
      company_id: input.company_id,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
    })
    .select()
    .single();
  if (ticketError) throw ticketError;

  const { error: messageError } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: userData.user.id,
      message: input.message,
    });
  if (messageError) throw messageError;

  return ticket;
}
