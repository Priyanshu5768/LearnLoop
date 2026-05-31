const db = require('../config/db');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function exchangeRoutes(ctx, route, method) {
  const { res, body, session } = ctx;

  if (!session) return send(res, 401, { error: 'Not authenticated.' });

  // ── POST /api/exchange/request ────────────────────────────────────────────
  if (route === '/request' && method === 'POST') {
    const { provider_id, skill_id, message } = body;
    if (!provider_id || !skill_id)
      return send(res, 400, { error: 'provider_id and skill_id are required.' });
    if (parseInt(provider_id) === session.data.userId)
      return send(res, 400, { error: 'You cannot request an exchange with yourself.' });

    try {
      const [result] = await db.query(
        'INSERT INTO exchange_requests (requester_id, provider_id, skill_id, message) VALUES (?, ?, ?, ?)',
        [session.data.userId, provider_id, skill_id, message || '']
      );
      return send(res, 201, { success: true, requestId: result.insertId });
    } catch (err) {
      console.error('[exchange request]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  // ── GET /api/exchange/my ─────────────────────────────────────────────────
  if (route === '/my' && method === 'GET') {
    try {
      const [sent] = await db.query(
        `SELECT er.*, u.name AS provider_name, u.gender AS provider_gender, s.skill_name
         FROM exchange_requests er
         JOIN users u  ON er.provider_id  = u.id
         JOIN skills s ON er.skill_id     = s.id
         WHERE er.requester_id = ?
         ORDER BY er.created_at DESC`,
        [session.data.userId]
      );
      const [received] = await db.query(
        `SELECT er.*, u.name AS requester_name, u.gender AS requester_gender, s.skill_name
         FROM exchange_requests er
         JOIN users u  ON er.requester_id = u.id
         JOIN skills s ON er.skill_id     = s.id
         WHERE er.provider_id = ?
         ORDER BY er.created_at DESC`,
        [session.data.userId]
      );
      return send(res, 200, { sent, received });
    } catch (err) {
      console.error('[my exchanges]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  // ── PUT /api/exchange/:id/accept  or  /reject ────────────────────────────
  const actionMatch = route.match(/^\/(\d+)\/(accept|reject)$/);
  if (actionMatch && method === 'PUT') {
    const requestId = parseInt(actionMatch[1], 10);
    const status    = actionMatch[2] === 'accept' ? 'accepted' : 'rejected';
    try {
      const [result] = await db.query(
        'UPDATE exchange_requests SET status = ? WHERE id = ? AND provider_id = ?',
        [status, requestId, session.data.userId]
      );
      if (result.affectedRows === 0)
        return send(res, 404, { error: 'Request not found or not yours.' });
      return send(res, 200, { success: true });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  // ── PUT /api/exchange/:id/complete ───────────────────────────────────────
  const completeMatch = route.match(/^\/(\d+)\/complete$/);
  if (completeMatch && method === 'PUT') {
    const requestId = parseInt(completeMatch[1], 10);
    try {
      const [ex] = await db.query(
        'SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR provider_id = ?)',
        [requestId, session.data.userId, session.data.userId]
      );
      if (!ex.length)
        return send(res, 404, { error: 'Exchange not found.' });

      const exchange = ex[0];
      const isRequester = exchange.requester_id === session.data.userId;
      const isProvider = exchange.provider_id === session.data.userId;

      if (exchange.status !== 'accepted')
        return send(res, 400, { error: 'Exchange must be accepted first.' });

      // Toggle completion status
      let completedByRequester = exchange.completed_by_requester;
      let completedByProvider = exchange.completed_by_provider;

      if (isRequester) completedByRequester = completedByRequester ? 0 : 1;
      if (isProvider) completedByProvider = completedByProvider ? 0 : 1;

      let newStatus = 'accepted';
      if (completedByRequester && completedByProvider) {
        newStatus = 'completed';
      }

      await db.query(
        'UPDATE exchange_requests SET completed_by_requester = ?, completed_by_provider = ?, status = ?, completed_at = ? WHERE id = ?',
        [completedByRequester, completedByProvider, newStatus, newStatus === 'completed' ? new Date() : null, requestId]
      );

      const myCompleted = isRequester ? completedByRequester : completedByProvider;
      const otherCompleted = isRequester ? completedByProvider : completedByRequester;

      return send(res, 200, { 
        success: true, 
        completed: myCompleted ? true : false,
        bothCompleted: completedByRequester && completedByProvider,
        status: newStatus,
        waitingForOther: !otherCompleted
      });
    } catch (err) {
      console.error('[complete]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Exchange route not found.' });
};
