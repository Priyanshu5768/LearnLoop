const db = require('../config/db');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function skillsRoutes(ctx, route, method) {
  const { res, body, session, query } = ctx;

  if ((route === '' || route === '/') && method === 'GET') {
    const { q, category, type } = query;
    let sql = `SELECT s.*, u.name AS user_name, u.gender
               FROM skills s
               JOIN users u ON s.user_id = u.id
               WHERE 1=1`;
    const params = [];

    if (q) {
      sql += ' AND (s.skill_name LIKE ? OR s.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category && category !== 'all') {
      sql += ' AND s.category = ?';
      params.push(category);
    }
    if (type && type !== 'all') {
      sql += ' AND s.skill_type = ?';
      params.push(type);
    }
    sql += ' ORDER BY s.created_at DESC';

    try {
      const [skills] = await db.query(sql, params);
      return send(res, 200, { skills });
    } catch (err) {
      console.error('[get skills]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  if (route === '/my' && method === 'GET') {
    if (!session) return send(res, 401, { error: 'Not authenticated.' });
    try {
      const [skills] = await db.query(
        'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC',
        [session.data.userId]
      );
      return send(res, 200, { skills });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  if ((route === '' || route === '/') && method === 'POST') {
    if (!session) return send(res, 401, { error: 'Not authenticated.' });
    const { skill_name, category, skill_type, description } = body;
    if (!skill_name || !category || !skill_type)
      return send(res, 400, { error: 'skill_name, category and skill_type are required.' });

    try {
      const [result] = await db.query(
        'INSERT INTO skills (user_id, skill_name, category, skill_type, description) VALUES (?, ?, ?, ?, ?)',
        [session.data.userId, skill_name, category, skill_type, description || '']
      );
      return send(res, 201, { success: true, skillId: result.insertId });
    } catch (err) {
      console.error('[add skill]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  const deleteMatch = route.match(/^\/(\d+)$/);
  if (deleteMatch && method === 'DELETE') {
    if (!session) return send(res, 401, { error: 'Not authenticated.' });
    const skillId = parseInt(deleteMatch[1], 10);
    try {
      const [result] = await db.query(
        'DELETE FROM skills WHERE id = ? AND user_id = ?',
        [skillId, session.data.userId]
      );
      if (result.affectedRows === 0)
        return send(res, 404, { error: 'Skill not found or not yours.' });
      return send(res, 200, { success: true });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Skills route not found.' });
};
