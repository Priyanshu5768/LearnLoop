const db = require('../config/db');
const fs = require('fs');
const path = require('path');

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async function resourcesRoutes(ctx, route, method) {
  const { res, body, session } = ctx;

  if (!session) return send(res, 401, { error: 'Not authenticated.' });

  const userId = session.data.userId;

  const exMatch = route.match(/^\/(\d+)$/);
  if (exMatch && method === 'GET') {
    const exchangeId = parseInt(exMatch[1], 10);
    
    try {
      const [ex] = await db.query(
        'SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR provider_id = ?)',
        [exchangeId, userId, userId]
      );
      if (!ex.length) return send(res, 404, { error: 'Exchange not found.' });

      const [resources] = await db.query(`
        SELECT r.*, u.name AS sender_name
        FROM resources r
        JOIN users u ON r.sender_id = u.id
        WHERE r.exchange_id = ?
        ORDER BY r.created_at DESC
      `, [exchangeId]);
      
      return send(res, 200, { resources });
    } catch (err) {
      console.error('[get resources]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  if (exMatch && method === 'POST') {
    const exchangeId = parseInt(exMatch[1], 10);
    const { filename, mimeType, data: base64Data, description } = body;
    
    if (!filename || !base64Data) {
      return send(res, 400, { error: 'File is required.' });
    }

    try {
      const [ex] = await db.query(
        'SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR provider_id = ?)',
        [exchangeId, userId, userId]
      );
      if (!ex.length) return send(res, 404, { error: 'Exchange not found.' });
      if (ex[0].status === 'pending' || ex[0].status === 'rejected')
        return send(res, 400, { error: 'Exchange must be accepted first.' });

      // Create uploads directory if not exists
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Get extension from mime type or filename
      const extMap = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
        'application/pdf': '.pdf',
        'text/plain': '.txt',
        'text/html': '.html',
        'text/css': '.css',
        'text/javascript': '.js'
      };
      const ext = extMap[mimeType] || path.extname(filename) || '.bin';
      
      // Generate unique filename
      const newFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
      const filepath = path.join(uploadsDir, newFilename);
      
      // Decode base64 and save file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      // Get file type
      let fileType = 'other';
      if (mimeType.includes('pdf')) fileType = 'pdf';
      else if (mimeType.includes('image')) fileType = 'image';
      else if (mimeType.includes('text')) fileType = 'notes';
      else if (mimeType.includes('javascript') || mimeType.includes('css')) fileType = 'code';
      
      // Save to database
      const [result] = await db.query(
        'INSERT INTO resources (exchange_id, sender_id, title, description, link, type) VALUES (?, ?, ?, ?, ?, ?)',
        [exchangeId, userId, filename.replace(path.extname(filename), ''), description || '', `/uploads/${newFilename}`, fileType]
      );
      
      return send(res, 201, { success: true, resourceId: result.insertId });
    } catch (err) {
      console.error('[add resource]', err.message);
      return send(res, 500, { error: 'Server error.' });
    }
  }

  const delMatch = route.match(/^\/delete\/(\d+)$/);
  if (delMatch && method === 'DELETE') {
    const resourceId = parseInt(delMatch[1], 10);
    
    try {
      const [r] = await db.query(
        'SELECT * FROM resources WHERE id = ? AND sender_id = ?',
        [resourceId, userId]
      );
      if (!r.length) return send(res, 404, { error: 'Resource not found or not yours.' });

      // Delete file if exists
      if (r[0].link) {
        const filepath = path.join(__dirname, '..', 'public', r[0].link);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }

      await db.query('DELETE FROM resources WHERE id = ?', [resourceId]);
      return send(res, 200, { success: true });
    } catch (err) {
      return send(res, 500, { error: 'Server error.' });
    }
  }

  return send(res, 404, { error: 'Resources route not found.' });
};
