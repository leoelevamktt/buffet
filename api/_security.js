import { getTrustedIp } from './_audit.js'

export async function reserveAttempt(sql, key, limit) {
  const result = await sql.query(`INSERT INTO buffet_login_attempts AS attempts(ip,failures,blocked_until,updated_at)
    VALUES($1,1,NULL,now()) ON CONFLICT(ip) DO UPDATE SET
    failures=CASE WHEN attempts.blocked_until>now() THEN attempts.failures
      WHEN attempts.updated_at<now()-interval '15 minutes' THEN 1 ELSE attempts.failures+1 END,
    blocked_until=CASE WHEN attempts.blocked_until>now() THEN attempts.blocked_until
      WHEN attempts.updated_at<now()-interval '15 minutes' THEN NULL
      WHEN attempts.failures+1 >= $2 THEN now()+interval '15 minutes' ELSE NULL END,
    updated_at=CASE WHEN attempts.blocked_until>now() THEN attempts.updated_at ELSE now() END
    RETURNING blocked_until>now() AS blocked`, [key,limit])
  return Boolean(result.rows[0].blocked)
}

export async function securityEvent(sql, req, event, userId=null, details={}) {
  await sql.query(`INSERT INTO buffet_security_events(event,user_id,ip,user_agent,details)
    VALUES($1,$2,$3,$4,$5::jsonb)`, [event,userId,getTrustedIp(req).ip,
    String(req.headers['user-agent']||'').slice(0,500),JSON.stringify(details)])
}
