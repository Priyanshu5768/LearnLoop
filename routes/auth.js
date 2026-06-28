const bcrypt   = require('bcryptjs');
const { randomUUID } = require('crypto');
const db       = require('../config/db');
const sessions = require('../sessions');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function authRoutes(ctx, route, method) {
  const { res, body, session } = ctx;

  if (route === '/register' && method === 'POST') {
    const { name, email, password, gender } = body;
    if (!name || !email || !password)
      return send(res, 400, { error: 'Name, email and password are required.' });

    try {
      const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) return send(res, 409, { error: 'Email is already registered.' });

      const hashed = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        'INSERT INTO users (name, email, password, gender) VALUES (?, ?, ?, ?)',
        [name, email, hashed, gender || 'other']
      );

      const sid = randomUUID();
      sessions[sid] = { userId: result.insertId, name, email };
      res.setHeader('Set-Cookie', `session_id=${sid}; HttpOnly; Path=/; Max-Age=86400`);
      return send(res, 201, { success: true, user: { id: result.insertId, name, email, gender: gender || 'other' } });
    } catch (err) {
      console.error('[register]', err.message);
      return send(res, 500, { error: 'Server error. Please try again.' });
    }
  }

  if (route === '/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password)
      return send(res, 400, { error: 'Email and password are required.' });

    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return send(res, 401, { error: 'Invalid email or password.' });

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return send(res, 401, { error: 'Invalid email or password.' });

      const sid = randomUUID();
      sessions[sid] = { userId: user.id, name: user.name, email: user.email };
      res.setHeader('Set-Cookie', `session_id=${sid}; HttpOnly; Path=/; Max-Age=86400`);
      return send(res, 200, { success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error('[login]', err.message);
      return send(res, 500, { error: 'Server error. Please try again.' });
    }
  }

  if (route === '/logout' && method === 'POST') {
    if (session) delete sessions[session.id];
    res.setHeader('Set-Cookie', 'session_id=; HttpOnly; Path=/; Max-Age=0');
    return send(res, 200, { success: true });
  }

  if (route === '/me' && method === 'GET') {
    if (!session) return send(res, 401, { error: 'Not authenticated.' });

    try {
      const [rows] = await db.query(
        'SELECT id, name, email, gender, bio, avatar_url, created_at FROM users WHERE id = ?',
        [session.data.userId]
      );
      if (!rows.length) return send(res, 404, { error: 'User not found.' });
      return send(res, 200, { user: rows[0] });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  if (route === '/profile' && method === 'PUT') {
    if (!session) return send(res, 401, { error: 'Not authenticated.' });
    const { name, bio, gender } = body;
    if (!name) return send(res, 400, { error: 'Name is required.' });

    try {
      await db.query('UPDATE users SET name = ?, bio = ?, gender = ? WHERE id = ?',
        [name, bio || '', gender || 'other', session.data.userId]);
      // Update session name
      sessions[session.id].name = name;
      return send(res, 200, { success: true });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  if (route === '/password' && method === 'PUT') {
    if (!session) return send(res, 401, { error: 'Not authenticated.' });
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword)
      return send(res, 400, { error: 'Current and new password are required.' });
    
    if (newPassword.length < 6)
      return send(res, 400, { error: 'New password must be at least 6 characters.' });

    try {
      const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [session.data.userId]);
      if (!rows.length) return send(res, 404, { error: 'User not found.' });
      
      const valid = await bcrypt.compare(currentPassword, rows[0].password);
      if (!valid) return send(res, 400, { error: 'Current password is incorrect.' });
      
      const hashed = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, session.data.userId]);
      return send(res, 200, { success: true });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Auth route not found.' });
};
