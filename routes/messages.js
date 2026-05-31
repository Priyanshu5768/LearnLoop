const db = require('../config/db');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function messagesRoutes(ctx, route, method) {
  const { res, body, session } = ctx;

  if (!session) return send(res, 401, { error: 'Not authenticated.' });

  const userId = session.data.userId;

  // ── GET /api/messages/conversations ──────────────────────────────────────
  if (route === '/conversations' && method === 'GET') {
    try {
      const [convos] = await db.query(`
        SELECT DISTINCT 
          er.id AS exchange_id,
          er.status,
          s.skill_name,
          CASE WHEN er.requester_id = ? THEN er.provider_id ELSE er.requester_id END AS other_user_id,
          u.name AS other_user_name,
          u.gender AS other_user_gender,
          (SELECT message FROM messages WHERE exchange_id = er.id ORDER BY created_at DESC LIMIT 1) AS last_message
        FROM exchange_requests er
        JOIN users u ON u.id = CASE WHEN er.requester_id = ? THEN er.provider_id ELSE er.requester_id END
        JOIN skills s ON s.id = er.skill_id
        WHERE (er.requester_id = ? OR er.provider_id = ?) AND er.status IN ('accepted', 'completed')
        ORDER BY er.created_at DESC
      `, [userId, userId, userId, userId]);
      return send(res, 200, { conversations: convos });
    } catch (err) {
      console.error('[conversations]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  // ── GET /api/messages/:exchangeId ─────────────────────────────────────────
  const msgMatch = route.match(/^\/(\d+)$/);
  if (msgMatch && method === 'GET') {
    const exchangeId = parseInt(msgMatch[1], 10);
    try {
      const [messages] = await db.query(`
        SELECT m.*, u.name AS sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.exchange_id = ?
        ORDER BY m.created_at ASC
      `, [exchangeId]);
      return send(res, 200, { messages });
    } catch (err) {
      console.error('[get messages]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  // ── POST /api/messages/:exchangeId ────────────────────────────────────────
  if (msgMatch && method === 'POST') {
    const exchangeId = parseInt(msgMatch[1], 10);
    const { message } = body;
    
    if (!message || !message.trim()) return send(res, 400, { error: 'Message is required.' });

    try {
      const [ex] = await db.query(
        'SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR provider_id = ?)',
        [exchangeId, userId, userId]
      );
      if (!ex.length) return send(res, 404, { error: 'Exchange not found.' });
      if (ex[0].status !== 'accepted') return send(res, 400, { error: 'Exchange not accepted yet.' });

      const [result] = await db.query(
        'INSERT INTO messages (exchange_id, sender_id, message) VALUES (?, ?, ?)',
        [exchangeId, userId, message.trim()]
      );
      return send(res, 201, { success: true, messageId: result.insertId });
    } catch (err) {
      console.error('[send message]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Messages route not found.' });
};
