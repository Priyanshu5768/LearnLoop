const db = require('../config/db');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function reviewsRoutes(ctx, route, method) {
  const { res, body, session } = ctx;

  if (!session) return send(res, 401, { error: 'Not authenticated.' });

  const userId = session.data.userId;

  if ((route === '' || route === '/') && method === 'POST') {
    const { exchange_id, reviewee_id, rating, comment } = body;
    
    if (!exchange_id || !reviewee_id || !rating)
      return send(res, 400, { error: 'exchange_id, reviewee_id, and rating are required.' });
    
    if (rating < 1 || rating > 5)
      return send(res, 400, { error: 'Rating must be between 1 and 5.' });

    try {
      const [ex] = await db.query(
        'SELECT * FROM exchange_requests WHERE id = ? AND status = ?',
        [exchange_id, 'accepted']
      );
      if (!ex.length) return send(res, 400, { error: 'Exchange not found or not accepted.' });

      const [existing] = await db.query(
        'SELECT * FROM reviews WHERE exchange_id = ? AND reviewer_id = ?',
        [exchange_id, userId]
      );
      if (existing.length) return send(res, 400, { error: 'You have already reviewed this exchange.' });

      const [result] = await db.query(
        'INSERT INTO reviews (exchange_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [exchange_id, userId, reviewee_id, rating, comment || '']
      );
      return send(res, 201, { success: true, reviewId: result.insertId });
    } catch (err) {
      console.error('[add review]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  const userReviewMatch = route.match(/^\/user\/(\d+)$/);
  if (userReviewMatch && method === 'GET') {
    const targetUserId = parseInt(userReviewMatch[1], 10);
    try {
      const [reviews] = await db.query(`
        SELECT r.*, u.name AS reviewer_name, s.skill_name
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        JOIN exchange_requests er ON r.exchange_id = er.id
        JOIN skills s ON er.skill_id = s.id
        WHERE r.reviewee_id = ?
        ORDER BY r.created_at DESC
      `, [targetUserId]);
      
      const [[avgResult]] = await db.query(
        'SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews FROM reviews WHERE reviewee_id = ?',
        [targetUserId]
      );
      
      return send(res, 200, {
        reviews,
        averageRating: avgResult.avg_rating ? parseFloat(avgResult.avg_rating).toFixed(1) : 0,
        totalReviews: avgResult.total_reviews
      });
    } catch (err) {
      console.error('[get reviews]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Reviews route not found.' });
};
