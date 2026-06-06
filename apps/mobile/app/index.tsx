import { View, Text, Pressable, ScrollView } from "react-native";
import { Link, type Href } from "expo-router";
import { theme } from "../lib/theme";

const tiles: { href: Href; emoji: string; title: string; sub: string }[] = [
  { href: "/daily" as Href,      emoji: "🎯", title: "Daily Challenge",  sub: "One problem. Today." },
  { href: "/flashcards" as Href, emoji: "🧠", title: "Flashcards",       sub: "Spaced repetition for OS/DBMS/CN." },
  { href: "/streak" as Href,     emoji: "🔥", title: "Streak",           sub: "Keep the chain alive." },
];

export default function Home() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: theme.text1, fontSize: 32, fontWeight: "700" }}>EYF</Text>
      <Text style={{ color: theme.text3, marginTop: 4 }}>On-the-go placement prep.</Text>

      <View style={{ marginTop: 32, gap: 12 }}>
        {tiles.map((t) => (
          <Link key={t.href as string} href={t.href} asChild>
            <Pressable
              style={{
                borderWidth: 1, borderColor: theme.border, borderRadius: 12,
                padding: 20, backgroundColor: theme.surface,
              }}
            >
              <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
              <Text style={{ color: theme.text1, fontSize: 18, fontWeight: "700", marginTop: 8 }}>{t.title}</Text>
              <Text style={{ color: theme.text3, marginTop: 4 }}>{t.sub}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={{ color: theme.text3, fontSize: 12, marginTop: 40, textAlign: "center" }}>
        Full experience on web → eyf.in
      </Text>
    </ScrollView>
  );
}
