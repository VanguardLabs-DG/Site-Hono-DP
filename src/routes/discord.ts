import { Hono } from "hono";
import type { Env } from "../env";

export const discordRoutes = new Hono<{ Bindings: Env }>();

const DEFAULT_DISCORD_INVITE = "dprp";

discordRoutes.get("/", async (c) => {
  const inviteCode = DEFAULT_DISCORD_INVITE;
  const cacheKey = `cache:discord:${inviteCode}:v1`;

  // Cache KV de 30 segundos (respeitando os limites de taxa da API pública do Discord)
  try {
    if (c.env.KV) {
      const cached = await c.env.KV.get(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached));
      }
    }
  } catch (e) { }

  let discordData = {
    online: true,
    code: inviteCode,
    guildName: "Darkness Clan",
    memberCount: 0,
    presenceCount: 0,
    inviteUrl: `https://discord.gg/${inviteCode}`,
    iconUrl: null as string | null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DistritoPaulista-Portal/3.5",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      const guild = data?.guild;
      const iconHash = guild?.icon;
      const iconUrl =
        iconHash && guild?.id
          ? `https://cdn.discordapp.com/icons/${guild.id}/${iconHash}.png?size=128`
          : null;

      discordData = {
        online: true,
        code: data?.code || inviteCode,
        guildName: guild?.name || "Darkness Clan",
        memberCount: typeof data?.approximate_member_count === "number" ? data.approximate_member_count : 0,
        presenceCount: typeof data?.approximate_presence_count === "number" ? data.approximate_presence_count : 0,
        inviteUrl: `https://discord.gg/${data?.code || inviteCode}`,
        iconUrl,
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    // Falha de rede ou timeout: mantém o objeto com contagem graciosa
  }

  try {
    if (c.env.KV) {
      await c.env.KV.put(cacheKey, JSON.stringify(discordData), {
        expirationTtl: 30,
      });
    }
  } catch (e) { }

  return c.json(discordData);
});
