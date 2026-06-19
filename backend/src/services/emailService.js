const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true para 465, false para outras portas como 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// 📬 Função genérica para enviar emails
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"PT-Control" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Email enviado com sucesso:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro crítico ao enviar email:', error);
    throw new Error('Não foi possível enviar o email de notificação.');
  }
};

module.exports = {
  sendEmail,
};