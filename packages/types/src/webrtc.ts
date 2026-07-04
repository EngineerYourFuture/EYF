/** ICE-server config for peer WebRTC. STUN alone fails behind symmetric NAT
 *  (many campus/corporate networks) — a TURN relay is needed to guarantee a
 *  connection. TURN is added only when fully configured (url + username +
 *  credential) so a partial config can't produce a half-broken server. */
export type IceServer = { urls: string; username?: string; credential?: string };

const STUN: IceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function buildIceServers(cfg: {
  turnUrl?: string;
  turnUsername?: string;
  turnCredential?: string;
}): IceServer[] {
  const servers = [...STUN];
  if (cfg.turnUrl && cfg.turnUsername && cfg.turnCredential) {
    servers.push({ urls: cfg.turnUrl, username: cfg.turnUsername, credential: cfg.turnCredential });
  }
  return servers;
}
