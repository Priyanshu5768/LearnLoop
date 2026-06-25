require('dotenv').config();
const notificationQueue = require('../queues/notificationQueue');
const nodemailer = require('nodemailer');


notificationQueue.on('error', (err) => {
  console.error('❌ Queue error:', err.message);
});
notificationQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} waiting`);
});
notificationQueue.on('active', (job) => {
  console.log(`⚡ Job ${job.id} started`);
});
notificationQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});
notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

notificationQueue.process(async (job) => {
  console.log('📨 Processing job:', job.data);
  const { recipientEmail, senderName, skillName, type } = job.data;

  let subject, html;

  if (type === 'accepted') {
    subject = 'Your Skill Exchange Request Has Been Accepted — LearnLoop';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Great News! 🎉</h2>
        <p style="color: #555; font-size: 15px;">Dear User,</p>
        <p style="color: #555; font-size: 15px;">
          <strong>${senderName}</strong> has accepted your skill exchange request for 
          <strong>"${skillName}"</strong> on <strong>LearnLoop</strong>.
        </p>
        <p style="color: #555; font-size: 15px;">
          You can now connect with ${senderName}, start chatting, and begin sharing resources on the platform.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">
          LearnLoop — Peer-to-Peer Skill Exchange Platform<br/>
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    `;
  } else {
    subject = 'New Skill Exchange Request Received — LearnLoop';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50;">New Exchange Request</h2>
        <p style="color: #555; font-size: 15px;">Dear User,</p>
        <p style="color: #555; font-size: 15px;">
          <strong>${senderName}</strong> has sent you a skill exchange request for 
          <strong>"${skillName}"</strong> on <strong>LearnLoop</strong>.
        </p>
        <p style="color: #555; font-size: 15px;">
          Please log in to LearnLoop to review the request and choose to accept or decline.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">
          LearnLoop — Peer-to-Peer Skill Exchange Platform<br/>
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    `;
  }

  await transporter.sendMail({
    from: `"LearnLoop" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html
  });

  console.log(`✓ Email sent to ${recipientEmail}`);
});

console.log('🚀 Notification worker running...');