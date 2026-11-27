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
  const secure = process.env.SMTP_SECURE === 'true' || Number(SMTP_PORT || 587) === 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure,
    requireTLS: process.env.NODE_ENV === 'production' && !secure,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

export async function sendWelcomeEmail({ to }) {
  const subject = '歡迎加入 Skill Tree';
  const text = '你的 Skill Tree 帳號已建立，歡迎開始探索技能樹。';
  const { SMTP_HOST, SMTP_FROM } = smtpValues();

  if (!SMTP_HOST && process.env.NODE_ENV !== 'production') {
    console.info('[DEV EMAIL]', JSON.stringify({ to, subject, text }));
    return;
  }

  await getTransporter().sendMail({ from: SMTP_FROM, to, subject, text });
}

export async function sendPasswordResetCodeEmail({ to, code }) {
  const resetUrl = new URL('/reset-password', process.env.PUBLIC_APP_URL || 'http://localhost:5173');
  const subject = 'Skill Tree 密碼重設驗證碼';
  const text = `你的密碼重設驗證碼是：${code}\n請在 10 分鐘內前往以下頁面，輸入註冊 Email、驗證碼並設定新密碼：\n${resetUrl.toString()}\n若你沒有提出申請，請忽略此信。`;
  const { SMTP_HOST, SMTP_FROM } = smtpValues();

  if (!SMTP_HOST && process.env.NODE_ENV !== 'production') {
    console.info('[DEV EMAIL]', JSON.stringify({ to, subject, code, resetUrl: resetUrl.toString() }));
    return;
  }

  await getTransporter().sendMail({ from: SMTP_FROM, to, subject, text });
}
