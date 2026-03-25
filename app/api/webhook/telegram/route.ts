import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_CHATS = new Set([
  '-5165806246', // Comando Central
  '-5058435783', // Panteão Digital
  '-5172114972', // AgiSales
  '-5179635546', // Colorimetria
  '-5151394904', // Consórcio
  '-5137285968', // Feedback
]);

const CHAT_NAMES: Record<string, string> = {
  '-5165806246': 'Comando Central',
  '-5058435783': 'Panteão Digital',
  '-5172114972': 'AgiSales',
  '-5179635546': 'Colorimetria',
  '-5151394904': 'Consórcio',
  '-5137285968': 'Feedback',
};

export async function POST(req: NextRequest) {
  // Validate secret token
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    const message = body.message || body.edited_message || body.channel_post;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat?.id || '');
    if (!ALLOWED_CHATS.has(chatId)) {
      return NextResponse.json({ ok: true });
    }

    const fromUser = message.from || {};
    const fromName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || fromUser.username || 'Unknown';

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      chat_name: CHAT_NAMES[chatId] || message.chat?.title || chatId,
      message_id: message.message_id,
      from_id: String(fromUser.id || ''),
      from_name: fromName,
      from_username: fromUser.username || null,
      text: message.text || message.caption || null,
      date: new Date(message.date * 1000).toISOString(),
      is_bot: fromUser.is_bot || false,
      reply_to_message_id: message.reply_to_message?.message_id || null,
      raw: message,
    });

    if (error) {
      console.error('Supabase insert error:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
