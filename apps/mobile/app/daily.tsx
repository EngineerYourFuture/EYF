import { View, Text, ActivityIndicator, Linking, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { theme } from "../lib/theme";

type Today = {
  challenge: {
    problem: { slug: string; title: string; difficulty: string; patterns: string[] };
    alreadySolvedToday: boolean;
  } | null;
  streak: number;
  xpToday: number;
  problemsSolvedToday: number;
};

export default function Daily() {
  const [data, setData] = useState<Today | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Today>("/roadmap/today").then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <View style={{ flex: 1, padding: 24, backgroundColor: theme.bg }}>
    <Text style={{ color: theme.hard }}>{err}</Text>
  </View>;
  if (!data) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
    <ActivityIndicator color={theme.accent} />
  </View>;

  const c = data.challenge;
  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: theme.bg, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Stat label="Streak" value={`${data.streak}d`} />
        <Stat label="Today"  value={`${data.problemsSolvedToday} solved`} />
        <Stat label="XP"     value={`+${data.xpToday}`} />
      </View>

      {c ? (
        <View style={{ borderWidth: 1, borderColor: theme.accent + "66", borderRadius: 12, padding: 20, backgroundColor: theme.surface }}>
          <Text style={{ color: theme.text3, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
            Daily Challenge {c.alreadySolvedToday ? "· done ✓" : ""}
          </Text>
          <Text style={{ color: theme.text1, fontSize: 22, fontWeight: "700", marginTop: 8 }}>{c.problem.title}</Text>
          <Text style={{ color: theme.text3, marginTop: 4 }}>{c.problem.difficulty} · {c.problem.patterns.join(" · ")}</Text>
          <Pressable
            onPress={() => Linking.openURL(`https://eyf.in/problems/${c.problem.slug}`)}
            style={{ marginTop: 16, backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: theme.bg, textAlign: "center", fontWeight: "700" }}>Solve on web →</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={{ color: theme.text3 }}>No challenge today.</Text>
      )}
    </View>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12 }}>
      <Text style={{ color: theme.text3, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: theme.text1, fontSize: 20, fontWeight: "700", marginTop: 4 }}>{value}</Text>
    </View>
  );
}
