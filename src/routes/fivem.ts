import { Hono } from "hono";
import type { Env } from "../env";

export const fivemRoutes = new Hono<{ Bindings: Env }>();

const FIVEM_HOST = "distritopaulistarp.fivebr.gg";
const FIVEM_PORT = 30120;

fivemRoutes.get("/", async (c) => {
  const cacheKey = "cache:fivem:status:live";

  // Cache KV de 10 segundos para preservar o FXServer sem gerar lag
  try {
    if (c.env.KV) {
      const cached = await c.env.KV.get(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached));
      }
    }
  } catch (e) {}

  let statusData = {
    online: false,
    clients: 0,
    maxClients: 128,
    serverName: "DISTRITO PAULISTA",
    gametype: "Distrito Paulista Roleplay",
    connectIp: FIVEM_HOST,
    ping: 0,
    updatedAt: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const t0 = Date.now();
    const res = await fetch(`http://${FIVEM_HOST}:${FIVEM_PORT}/dynamic.json`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DistritoPaulista-Portal/3.5",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeout);
    const ping = Date.now() - t0;

    if (res.ok) {
      const data = (await res.json()) as any;
      statusData = {
        online: true,
        clients: typeof data.clients === "number" ? data.clients : parseInt(data.clients || "0", 10) || 0,
        maxClients: typeof data.sv_maxclients === "number" ? data.sv_maxclients : parseInt(data.sv_maxclients || "128", 10) || 128,
        serverName: data.hostname || "DISTRITO PAULISTA",
        gametype: data.gametype || "Distrito Paulista Roleplay",
        connectIp: FIVEM_HOST,
        ping,
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    // Tentativa secundária com players.json caso dynamic.json falhe temporariamente
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 2500);
      const res2 = await fetch(`http://${FIVEM_HOST}:${FIVEM_PORT}/players.json`, {
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
      if (res2.ok) {
        const players = (await res2.json()) as any[];
        statusData.online = true;
        statusData.clients = Array.isArray(players) ? players.length : 0;
        statusData.updatedAt = new Date().toISOString();
      }
    } catch (err2) {
      // Servidor inacessível ou reiniciando no momento
      statusData.online = false;
      statusData.clients = 0;
      statusData.updatedAt = new Date().toISOString();
    }
  }

  try {
    if (c.env.KV) {
      await c.env.KV.put(cacheKey, JSON.stringify(statusData), {
        expirationTtl: 10,
      });
    }
  } catch (e) {}

  return c.json(statusData);
});
