/**
 * PDF rendering using @react-pdf/renderer.
 * Returns a Buffer ready to ship via Fastify reply.
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import type { ResumeDocument } from "@eyf/types";

const sty = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0A0A0A" },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  contact: { fontSize: 9, color: "#5A5A57", marginBottom: 12 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, borderBottom: "1pt solid #1C1C1C", paddingBottom: 2, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  expHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  expCompany: { fontSize: 10, fontWeight: 700 },
  expRole: { fontSize: 9, fontStyle: "italic", color: "#5A5A57" },
  bullet: { fontSize: 9, marginLeft: 8, marginTop: 1 },
  skills: { fontSize: 9, lineHeight: 1.4 },
  summary: { fontSize: 9, lineHeight: 1.4, color: "#222" },
  certPage: { padding: 60, fontSize: 12, fontFamily: "Helvetica" },
  certBox: { border: "2pt solid #E8FF47", padding: 40, textAlign: "center" as const },
  certKicker: { fontSize: 10, letterSpacing: 4, color: "#5A5A57", textTransform: "uppercase" as const, marginBottom: 12 },
  certHeadline: { fontSize: 32, fontWeight: 700, marginBottom: 8 },
  certName: { fontSize: 24, fontWeight: 700, marginVertical: 16, color: "#0A0A0A" },
  certBody: { fontSize: 11, color: "#222", marginBottom: 24, lineHeight: 1.6 },
  certFooter: { fontSize: 8, color: "#5A5A57", marginTop: 32 },
});

function ResumeDoc({ data }: { data: ResumeDocument }) {
  return (
    React.createElement(Document, null,
      React.createElement(Page, { size: "A4", style: sty.page },
        React.createElement(Text, { style: sty.h1 }, data.contact.name || "Your Name"),
        React.createElement(Text, { style: sty.contact },
          [data.contact.email, data.contact.phone, data.contact.location, data.contact.github, data.contact.linkedin]
            .filter(Boolean).join(" · ")),
        data.summary && React.createElement(View, { style: sty.section },
          React.createElement(Text, { style: sty.sectionTitle }, "Summary"),
          React.createElement(Text, { style: sty.summary }, data.summary)),
        data.skills?.length ? React.createElement(View, { style: sty.section },
          React.createElement(Text, { style: sty.sectionTitle }, "Skills"),
          React.createElement(Text, { style: sty.skills }, data.skills.join(" · "))) : null,
        data.experience?.length ? React.createElement(View, { style: sty.section },
          React.createElement(Text, { style: sty.sectionTitle }, "Experience"),
          ...data.experience.map((e, i) =>
            React.createElement(View, { key: i, style: { marginBottom: 6 } },
              React.createElement(View, { style: sty.expHeader },
                React.createElement(Text, { style: sty.expCompany }, `${e.role} · ${e.company}`),
                React.createElement(Text, { style: sty.expRole }, `${e.start} – ${e.end ?? "Present"}`)),
              ...(e.bullets ?? []).map((b, j) =>
                React.createElement(Text, { key: j, style: sty.bullet }, `• ${b}`))))) : null,
        data.projects?.length ? React.createElement(View, { style: sty.section },
          React.createElement(Text, { style: sty.sectionTitle }, "Projects"),
          ...data.projects.map((p, i) =>
            React.createElement(View, { key: i, style: { marginBottom: 4 } },
              React.createElement(Text, { style: sty.expCompany }, p.name),
              React.createElement(Text, { style: sty.bullet }, p.description)))) : null,
        data.education?.length ? React.createElement(View, { style: sty.section },
          React.createElement(Text, { style: sty.sectionTitle }, "Education"),
          ...data.education.map((e, i) =>
            React.createElement(View, { key: i, style: sty.expHeader },
              React.createElement(Text, { style: sty.expCompany }, `${e.degree} · ${e.institution}`),
              React.createElement(Text, { style: sty.expRole }, `${e.start} – ${e.end ?? "Present"}${e.gpa ? ` · GPA ${e.gpa}` : ""}`)))) : null,
      ),
    )
  );
}

function CertificateDoc({ name, title, score, verificationCode, issuedAt }: {
  name: string; title: string; score: number | null; verificationCode: string; issuedAt: Date;
}) {
  return (
    React.createElement(Document, null,
      React.createElement(Page, { size: "A4", orientation: "landscape", style: sty.certPage },
        React.createElement(View, { style: sty.certBox },
          React.createElement(Text, { style: sty.certKicker }, "Engineer Your Future"),
          React.createElement(Text, { style: sty.certHeadline }, "Certificate of Achievement"),
          React.createElement(Text, { style: sty.certBody }, "Awarded to"),
          React.createElement(Text, { style: sty.certName }, name),
          React.createElement(Text, { style: sty.certBody },
            `for completing ${title}${score != null ? ` with a score of ${score}` : ""}.`),
          React.createElement(Text, { style: sty.certFooter },
            `Issued ${issuedAt.toDateString()} · Verify at eyf.in/verify/${verificationCode}`),
        ),
      ),
    )
  );
}

export async function renderResumePdf(doc: ResumeDocument): Promise<Buffer> {
  return renderToBuffer(ResumeDoc({ data: doc }));
}

const sharePalette = {
  bg: "#0A0A0A",
  accent: "#E8FF47",
  surface: "#111111",
  border: "#1C1C1C",
  text1: "#FAFAF9",
  text3: "#8A8A87",
};

const shareStyles = StyleSheet.create({
  page: { backgroundColor: sharePalette.bg, padding: 56, fontFamily: "Helvetica" },
  kicker: { fontSize: 10, letterSpacing: 4, color: sharePalette.text3, textTransform: "uppercase" as const },
  year: { fontSize: 18, color: sharePalette.accent, marginTop: 4, fontWeight: 700 },
  headline: { fontSize: 36, color: sharePalette.text1, fontWeight: 700, lineHeight: 1.1, marginTop: 20, marginBottom: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  stat: {
    width: "45%", marginRight: "5%", marginBottom: 16,
    borderLeftWidth: 2, borderLeftColor: sharePalette.accent, borderLeftStyle: "solid",
    paddingLeft: 10,
  },
  statLabel: { fontSize: 9, letterSpacing: 2, color: sharePalette.text3, textTransform: "uppercase" as const },
  statValue: { fontSize: 32, color: sharePalette.text1, fontWeight: 700, marginTop: 2 },
  footer: {
    position: "absolute" as const, bottom: 40, left: 56, right: 56,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: sharePalette.border, borderTopStyle: "solid",
    paddingTop: 16,
    fontSize: 10, color: sharePalette.text3,
  },
  brand: { fontSize: 14, color: sharePalette.text1, fontWeight: 700 },
});

export type WrappedShareInput = {
  name: string;
  year: number;
  totalSolved: number;
  bestStreakDays: number;
  topPattern: string | null;
  badgesEarned: number;
  mockSessions: number;
  headline: string;
};

function WrappedShareDoc({ data }: { data: WrappedShareInput }) {
  // 1080x1080 square = Instagram-ready. PDF in points: 540pt = 1080px @72dpi.
  const SIDE = 540;
  return React.createElement(Document, null,
    React.createElement(Page, { size: { width: SIDE, height: SIDE }, style: shareStyles.page },
      React.createElement(Text, { style: shareStyles.kicker }, "EYF Wrapped"),
      React.createElement(Text, { style: shareStyles.year }, String(data.year)),
      React.createElement(Text, { style: shareStyles.headline }, data.headline),
      React.createElement(View, { style: shareStyles.grid },
        React.createElement(View, { style: shareStyles.stat },
          React.createElement(Text, { style: shareStyles.statLabel }, "Solved"),
          React.createElement(Text, { style: shareStyles.statValue }, String(data.totalSolved))),
        React.createElement(View, { style: shareStyles.stat },
          React.createElement(Text, { style: shareStyles.statLabel }, "Best Streak"),
          React.createElement(Text, { style: shareStyles.statValue }, `${data.bestStreakDays}d`)),
        React.createElement(View, { style: shareStyles.stat },
          React.createElement(Text, { style: shareStyles.statLabel }, "Mocks"),
          React.createElement(Text, { style: shareStyles.statValue }, String(data.mockSessions))),
        React.createElement(View, { style: shareStyles.stat },
          React.createElement(Text, { style: shareStyles.statLabel }, "Badges"),
          React.createElement(Text, { style: shareStyles.statValue }, String(data.badgesEarned))),
      ),
      data.topPattern
        ? React.createElement(View, { style: { ...shareStyles.stat, width: "95%", marginTop: 8 } },
            React.createElement(Text, { style: shareStyles.statLabel }, "Mastered Pattern"),
            React.createElement(Text, { style: { ...shareStyles.statValue, fontSize: 22 } }, data.topPattern))
        : null,
      React.createElement(View, { style: shareStyles.footer },
        React.createElement(Text, { style: shareStyles.brand }, `EYF · ${data.name}`),
        React.createElement(Text, null, "eyf.in"),
      ),
    ),
  );
}

export async function renderWrappedShare(input: WrappedShareInput): Promise<Buffer> {
  return renderToBuffer(WrappedShareDoc({ data: input }));
}

export async function renderCertificatePdf(input: {
  name: string; title: string; score: number | null;
  verificationCode: string; issuedAt: Date;
}): Promise<Buffer> {
  return renderToBuffer(CertificateDoc(input));
}
