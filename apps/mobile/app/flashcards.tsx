import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { theme } from "../lib/theme";

type Card = { id: string; topic: string; front: string; back: string };

export default function Flashcards() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    apiFetch<Card[]>("/subjects/OS/flashcards/due").then(setCards).catch(() => setCards([]));
  }, []);

  if (!cards) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
    <ActivityIndicator color={theme.accent} />
  </View>;
  if (cards.length === 0) return <Empty />;
  if (idx >= cards.length) return <AllDone />;
  const c = cards[idx]!;

  async function grade(q: 0 | 3 | 4 | 5) {
    try { await apiFetch(`/subjects/flashcards/${c.id}/review`, { method: "POST", body: JSON.stringify({ quality: q }) }); } catch {/*noop*/}
    setIdx((i) => i + 1);
    setRevealed(false);
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: theme.bg, justifyContent: "center" }}>
      <Text style={{ color: theme.text3, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
        {c.topic} · {idx + 1}/{cards.length}
      </Text>
      <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 24, marginTop: 12, backgroundColor: theme.surface, minHeight: 220 }}>
        <Text style={{ color: theme.text1, fontSize: 22, fontWeight: "600" }}>{c.front}</Text>
        {revealed && (
          <Text style={{ color: theme.text2, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, lineHeight: 22 }}>
            {c.back}
          </Text>
        )}
      </View>

      {!revealed ? (
        <Btn onPress={() => setRevealed(true)} label="Reveal" />
      ) : (
        <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
          <Btn onPress={() => grade(0)} label="Again" tone="ghost" />
          <Btn onPress={() => grade(3)} label="Hard"  tone="ghost" />
          <Btn onPress={() => grade(4)} label="Good"  tone="ghost" />
          <Btn onPress={() => grade(5)} label="Easy" />
        </View>
      )}
    </View>
  );
}

function Btn({ label, onPress, tone = "primary" }: { label: string; onPress: () => void; tone?: "primary" | "ghost" }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, paddingVertical: 14, borderRadius: 8, marginTop: tone === "primary" ? 16 : 0,
        backgroundColor: tone === "primary" ? theme.accent : theme.surface,
        borderWidth: 1, borderColor: tone === "primary" ? theme.accent : theme.border,
      }}
    >
      <Text style={{ color: tone === "primary" ? theme.bg : theme.text1, textAlign: "center", fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function Empty() {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
    <Text style={{ color: theme.text3 }}>No cards due. Come back tomorrow.</Text>
  </View>;
}
function AllDone() {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
    <Text style={{ color: theme.text1, fontSize: 22, fontWeight: "700" }}>All caught up 🎉</Text>
  </View>;
}
