import 'dotenv/config';
import { migrationPool, closeMigrationPool } from '../src/db/migration-pool.js';

const username = String(process.argv[2] || '').trim().toLowerCase();

try {
  if (!/^[a-z0-9_]{3,32}$/u.test(username)) {
    throw new Error('Usage: npm run admin:transfer-owner -- <active-editor-username>');
  }

  const client = await migrationPool.connect();
  try {
    await client.query('BEGIN');
    const targetResult = await client.query(
      `SELECT id, username, role, disabled_at AS "disabledAt"
       FROM admin_accounts WHERE username = $1 FOR UPDATE`,
      [username],
    );
    const target = targetResult.rows[0];
    if (!target) throw new Error('找不到此管理員帳號。');
    if (target.disabledAt) throw new Error('不能把最高管理權移交給已停用的帳號。');

    const ownerResult = await client.query(
      `SELECT id, username FROM admin_accounts
       WHERE role = 'owner' AND disabled_at IS NULL FOR UPDATE`,
    );
    const currentOwner = ownerResult.rows[0] || null;
    if (currentOwner && String(currentOwner.id) === String(target.id)) {
      await client.query('COMMIT');
      console.log(`${username} 已是目前的最高管理者。`);
    } else {
      if (currentOwner) {
        await client.query(
          `UPDATE admin_accounts SET role = 'editor', updated_at = now() WHERE id = $1`,
          [currentOwner.id],
        );
      }
      await client.query(
        `UPDATE admin_accounts SET role = 'owner', updated_at = now() WHERE id = $1`,
        [target.id],
      );
      await client.query(
        `INSERT INTO admin_audit_log(admin_id, action, target_type, target_id, metadata)
         VALUES ($1, 'admin.owner.transfer', 'admin_account', $2, $3::jsonb)`,
        [currentOwner?.id ?? null, target.id, JSON.stringify({ previousOwner: currentOwner?.username ?? null, newOwner: target.username })],
      );
      await client.query('COMMIT');
      console.log(`最高管理權已移交給 ${username}。`);
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(`最高管理權移交失敗：${error.message}`);
  process.exitCode = 1;
} finally {
  await closeMigrationPool();
}
