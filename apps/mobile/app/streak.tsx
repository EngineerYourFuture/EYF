import { View, Text, ActivityIndicator, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { theme } from "../lib/theme";

type Me = {
  xp: number; level: number; xpAtLevel: number; xpToNext: number;
  streak: number; longestStreak: number; totalSolved: number;
  badges: { slug: string; name: string; tier: string; earnedAt: string }[];
};

export default function Streak() {
  const [data, setData] = useState<Me | null>(null);

  useEffect(() => {
    apiFetch<Me>("/gamification/me").then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
    <ActivityIndicator color={theme.accent} />
  </View>;

  const pct = data.xpAtLevel + data.xpToNext === 0 ? 0 : (data.xpAtLevel / (data.xpAtLevel + data.xpToNext));

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: theme.bg }}>
      <Text style={{ color: theme.text3, letterSpacing: 2, textTransform: "uppercase", fontSize: 11 }}>Current</Text>
      <Text style={{ color: theme.text1, fontSize: 56, fontWeight: "700", marginTop: 4 }}>
        {data.streak}<Text style={{ color: theme.text3, fontSize: 28 }}> days</Text>
      </Text>
      <Text style={{ color: theme.text3, marginTop: 4 }}>Longest: {data.longestStreak} days</Text>

      <View style={{ marginTop: 32, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, backgroundColor: theme.surface }}>
        <Text style={{ color: theme.text3, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Level {data.level}</Text>
        <Text style={{ color: theme.text1, fontSize: 24, fontWeight: "700", marginTop: 4 }}>{data.xp} XP</Text>
        <View style={{ height: 6, backgroundColor: theme.border, borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${Math.min(100, pct * 100)}%`, backgroundColor: theme.accent }} />
        </View>
        <Text style={{ color: theme.text3, fontSize: 12, marginTop: 8 }}>{data.xpToNext} XP to L{data.level + 1}</Text>
      </View>

      <Text style={{ color: theme.text1, fontWeight: "700", fontSize: 18, marginTop: 32 }}>Badges</Text>
      {data.badges.length === 0
        ? <Text style={{ color: theme.text3, marginTop: 8 }}>None yet. Solve more.</Text>
        : <FlatList
            data={data.badges}
            keyExtractor={(b) => b.slug}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginTop: 12 }}
            renderItem={({ item }) => (
              <View style={{ borderWidth: 1, borderColor: theme.accent + "66", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "600" }}>{item.name}</Text>
              </View>
            )}
          />}
    </View>
  );
}
