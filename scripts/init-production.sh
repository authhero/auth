wrangler kv:namespace create auth_certificates --env production
wrangler kv:namespace create auth_clients --env production
wrangler r2 bucket create auth-templates --env production
wrangler queues create users --env production
wrangler d1 create auth --env production