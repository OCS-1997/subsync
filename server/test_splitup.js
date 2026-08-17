import appDB from './db/subsyncDB.js';

async function test() {
  const sql = `
    SELECT 
      t.assigned_to AS username,
      u.name AS name,
      COUNT(*) AS total,
      SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
      SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
      SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
      SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
      SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.username
    GROUP BY t.assigned_to, u.name
    ORDER BY total DESC
  `;
  const [rows] = await appDB.query(sql);
  console.log('TEAM TASK SPLITUP BY MEMBER:', rows);
  process.exit(0);
}

test().catch(console.error);
