const db = require('../config/db');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function gamificationRoutes(ctx, route, method) {
  const { res, body, session } = ctx;

  if (!session) return send(res, 401, { error: 'Not authenticated.' });

  const userId = session.data.userId;

  const checkinMatch = route.match(/^\/checkin\/(\d+)$/);
  if (checkinMatch && method === 'POST') {
    const exchangeId = parseInt(checkinMatch[1], 10);
    const { duration } = body;
    
    if (!duration || duration < 2) {
      return send(res, 400, { error: 'Minimum 2 minutes required for check-in.' });
    }

    try {
      const [ex] = await db.query(
        'SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR provider_id = ?)',
        [exchangeId, userId, userId]
      );
      if (!ex.length) return send(res, 404, { error: 'Exchange not found.' });
      if (ex[0].status !== 'accepted') {
        return send(res, 400, { error: 'Exchange must be accepted.' });
      }

      // Check if already checked in today
      const [existing] = await db.query(
        `SELECT * FROM check_ins 
         WHERE exchange_id = ? AND user_id = ? 
         AND DATE(check_in_at) = CURDATE()`,
        [exchangeId, userId]
      );
      
      if (existing.length) {
        return send(res, 400, { error: 'Already checked in today!' });
      }

      // Record check-in
      await db.query(
        'INSERT INTO check_ins (exchange_id, user_id, duration) VALUES (?, ?, ?)',
        [exchangeId, userId, duration]
      );

      // Award points (5 points per check-in)
      const POINTS_PER_CHECKIN = 5;
      await db.query('UPDATE users SET points = points + ? WHERE id = ?', [POINTS_PER_CHECKIN, userId]);

      // Check for badge
      const [[user]] = await db.query('SELECT points, badges FROM users WHERE id = ?', [userId]);
      const totalPoints = user.points + POINTS_PER_CHECKIN;
      let badges = user.badges ? user.badges.split(',') : [];
      
      // Badge rules
      const newBadges = [];
      if (totalPoints >= 10 && !badges.includes('First Steps')) newBadges.push('First Steps');
      if (totalPoints >= 25 && !badges.includes('Active Learner')) newBadges.push('Active Learner');
      if (totalPoints >= 50 && !badges.includes('Knowledge Seeker')) newBadges.push('Knowledge Seeker');
      if (totalPoints >= 100 && !badges.includes('Skill Master')) newBadges.push('Skill Master');
      
      if (newBadges.length > 0) {
        badges = [...badges, ...newBadges];
        await db.query('UPDATE users SET badges = ? WHERE id = ?', [badges.join(','), userId]);
      }

      return send(res, 200, {
        success: true,
        pointsEarned: POINTS_PER_CHECKIN,
        totalPoints: totalPoints,
        newBadges: newBadges
      });
    } catch (err) {
      console.error('[checkin]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  if (route === '/stats' && method === 'GET') {
    try {
      const [[user]] = await db.query('SELECT points, badges FROM users WHERE id = ?', [userId]);
      const [checkins] = await db.query(
        'SELECT COUNT(*) as total_checkins FROM check_ins WHERE user_id = ?',
        [userId]
      );
      const [completed] = await db.query(
        `SELECT COUNT(*) as total_completed 
         FROM exchange_requests 
         WHERE (requester_id = ? OR provider_id = ?) AND status = 'completed'`,
        [userId, userId]
      );

      return send(res, 200, {
        points: user.points || 0,
        badges: user.badges ? user.badges.split(',').filter(b => b) : [],
        totalCheckins: checkins[0].total_checkins,
        completedExchanges: completed[0].total_completed
      });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Gamification route not found.' });
};
