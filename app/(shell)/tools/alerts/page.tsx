import EditorFeedComposer from "@/components/toolkit/EditorFeedComposer";
import EditorFeedPanel from "@/components/toolkit/EditorFeedPanel";
import EditorSummaryPanel from "@/components/toolkit/EditorSummaryPanel";

export default function ToolkitAlertsWidgetPage() {
  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Alert workflow</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Alert! Alert! handoff
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Alert delivery still lives outside the hosted dashboard runtime, but the latest local editor summary can now surface here for queue visibility and localhost handoff.
        </p>
      </section>

      <EditorSummaryPanel />
      <EditorFeedPanel />
      <EditorFeedComposer
        defaultKind="chat_bookmark"
        description="Use this operator handoff form to push a chat-highlight bookmark into the shared editor feed. Alert! Alert! will import it into the current reel project as a source moment."
        submitLabel="Queue chat bookmark"
        title="Operator bookmark"
      />

      <section className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
        <p className="toolkit-eyebrow">Runtime split</p>
        <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Full alert playback, Twitch VOD loading, clip import, and reel project storage still live in the separate desktop app. Toolkit only renders a mirrored summary so the hosted UI can launch or resume the local workflow without duplicating editor state.
        </p>
      </section>
    </div>
  );
}
