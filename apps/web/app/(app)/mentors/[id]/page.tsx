"use client";
import { toast } from "sonner";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";

type Mentor = {
  id: string; company: string; jobTitle: string; yearsExp: number;
  expertise: string[]; hourlyRateInr: number; ratingAvg: number; ratingCount: number;
  verified: boolean;
  user: { name: string; profile?: { avatar: string | null; bio: string | null; linkedinUrl: string | null } | null };
};
type Slot = { id: string; startAt: string; endAt: string };

export default function Page({ params }: { params: { id: string } }) {
  const { data: mentor } = useApi<Mentor>(`/mentors/${params.id}`);
  const { data: slots, mutate } = useApi<Slot[]>(`/mentors/${params.id}/slots`);
  const action = useApiAction();

  async function book(slotId: string) {
    try {
      await action(`/mentors/slots/${slotId}/book`, { method: "POST" }, { silent: true });
      track(Events.MentorBooked, { mentorId: params.id, slotId });
      await mutate();
      toast.success("Booked. Check Mocks for details.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!mentor) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-4xl font-bold tracking-tight">{mentor.user.name}</h1>
        {mentor.verified && <Badge tone="easy">Verified</Badge>}
      </div>
      <p className="text-text-3 mt-1">{mentor.jobTitle} at {mentor.company} · {mentor.yearsExp}y experience</p>
      <p className="text-text-2 mt-4 max-w-prose">{mentor.user.profile?.bio}</p>

      <Card className="mt-8">
        <h2 className="font-display text-xl font-bold">Expertise</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {mentor.expertise.map((e) => <Badge key={e} tone="accent">{e}</Badge>)}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">Book a session</h2>
          <span className="font-mono text-accent">₹{mentor.hourlyRateInr}/hr</span>
        </div>
        <p className="text-text-3 text-sm mt-2">Expert mocks require <Badge tone="accent">Elite</Badge> plan.</p>
        <div className="mt-4 space-y-2">
          {slots?.length === 0 && <p className="text-text-3 text-sm">No upcoming slots. Check back later.</p>}
          {slots?.map((s) => {
            const when = new Date(s.startAt).toLocaleString();
            return (
              <div key={s.id} className="flex items-center justify-between border border-border rounded-md p-3">
                <span className="text-sm">{when}</span>
                <Button size="sm" onClick={() => book(s.id)} aria-label={`Book session at ${when}`}>Book</Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
