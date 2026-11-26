import nodemailer from 'nodemailer';

const smtpKeys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
let transporter;

function smtpValues() {
  return Object.fromEntries([...smtpKeys, 'SMTP_PORT'].map((key) => [key, (process.env[key] || '').trim()]));
}

export function validateEmailRuntime() {
  const values = smtpValues();
  const configuredCount = smtpKeys.filter((key) => values[key]).length;
  const production = process.env.NODE_ENV === 'production';
  if (configuredCount > 0 && configuredCount < smtpKeys.length) {
    throw new Error(`SMTP 設定不完整，需提供：${smtpKeys.join(', ')}`);
  }
  if (production && configuredCount !== smtpKeys.length) {
    throw new Error(`正式環境必須設定 SMTP：${smtpKeys.join(', ')}`);
  }

  const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
  let parsedUrl;
  try { parsedUrl = new URL(publicAppUrl); }
  catch { throw new Error('PUBLIC_APP_URL 必須是有效網址'); }
  if (production && parsedUrl.protocol !== 'https:') {
    throw new Error('正式環境的 PUBLIC_APP_URL 必須使用 HTTPS');
  }
  if (values.SMTP_PORT && (!Number.isInteger(Number(values.SMTP_PORT)) || Number(values.SMTP_PORT) < 1 || Number(values.SMTP_PORT) > 65535)) {
    throw new Error('SMTP_PORT 必須是 1 到 65535 的整數');
  }
}

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = smtpValues();
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

export async function sendVerificationEmail({ to, token }) {
  const verificationUrl = new URL('/verify-email', process.env.PUBLIC_APP_URL || 'http://localhost:5173');
  verificationUrl.searchParams.set('token', token);
  const subject = 'Skill Tree 註冊成功，請驗證 Email';
  const text = `請在 24 小時內完成 Email 驗證：\n${verificationUrl.toString()}`;
  const { SMTP_HOST, SMTP_FROM } = smtpValues();

  if (!SMTP_HOST && process.env.NODE_ENV !== 'production') {
    console.info('[DEV EMAIL]', JSON.stringify({ to, subject, verificationUrl: verificationUrl.toString() }));
    return;
  }

  await getTransporter().sendMail({ from: SMTP_FROM, to, subject, text });
}

export async function sendPasswordResetEmail({ to, token }) {
  const resetUrl = new URL('/reset-password', process.env.PUBLIC_APP_URL || 'http://localhost:5173');
  resetUrl.searchParams.set('token', token);
  const subject = '重設你的密碼';
  const text = `請在 1 小時內使用此連結重設密碼：\n${resetUrl.toString()}`;
  const { SMTP_HOST, SMTP_FROM } = smtpValues();

  if (!SMTP_HOST && process.env.NODE_ENV !== 'production') {
    console.info('[DEV EMAIL]', JSON.stringify({ to, subject, resetUrl: resetUrl.toString() }));
    return;
  }

  await getTransporter().sendMail({ from: SMTP_FROM, to, subject, text });
}
