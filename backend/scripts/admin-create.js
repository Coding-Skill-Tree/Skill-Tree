import 'dotenv/config';
import { stdin, stdout } from 'node:process';
import { migrationPool, closeMigrationPool } from '../src/db/migration-pool.js';
import { hashPassword } from '../src/lib/password.js';

function readHidden(prompt) {
  if (!stdin.isTTY) throw new Error('請在互動式終端機執行此指令。');
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    let value = '';
    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.off('data', onData);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (character) => {
      if (character === '\u0003') return finish(new Error('已取消。'));
      if (character === '\r' || character === '\n') return finish();
      if (character === '\u007f' || character === '\b') {
        value = value.slice(0, -1);
        return;
      }
      if (character >= ' ' && character !== '\u007f') value += character;
    };
    stdin.on('data', onData);
  });
}

try {
  const username = (process.argv[2] || '').trim().toLowerCase();
  const role = (process.argv[3] || 'editor').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    throw new Error('帳號需為 3 到 32 個字，只能使用英文字母、數字與底線。');
  }
  if (!['owner', 'editor'].includes(role)) {
    throw new Error('角色只能是 owner 或 editor。');
  }
  const password = await readHidden('管理員密碼（12–72 字，含英文字母與數字，不會顯示）：');
  if (password.length < 12 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('密碼需為 12 到 72 個字，且至少包含英文字母與數字。');
  }

  const passwordHash = await hashPassword(password);
  await migrationPool.query('INSERT INTO admin_accounts(username, password_hash, role) VALUES ($1, $2, $3)', [username, passwordHash, role]);
  console.log(`管理員 ${username}（${role}）已建立。`);
} catch (error) {
  console.error(`管理員建立失敗：${error.message}`);
  process.exitCode = 1;
} finally {
  await closeMigrationPool();
}
