"use client";

import { ArrowUpRight, Check, Copy, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { useSfx } from "@/components/providers/SfxProvider";
import { Btn } from "@/components/ui/Button";
import { ArtStationIcon, LinkedInIcon } from "@/components/ui/Icons";
import { FadeUp, ScrambleText, SplitChars } from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const TOPICS = ["Full-time role", "Freelance", "Hard-surface prop", "Vehicle / weapon", "Environment", "Something else"];

export function Contact() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { play } = useSfx();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      play("switch");
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  // No backend needed: compose a ready-to-send email in the visitor's mail app.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = `${topic} — enquiry from ${name}`;
    const body = `${message}\n\n— ${name}\n${email}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    play("achievement");
    setSent(true);
  };

  return (
    <section id="contact" className="relative overflow-hidden border-t border-line py-28 sm:py-36" aria-label="Contact">
      <div className="pointer-events-none absolute -right-40 top-20 size-[620px] rounded-full bg-[radial-gradient(circle,rgba(255,140,40,0.10),transparent_65%)]" />
      <div className="shell relative grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="label text-ink-2">[06]</span>
            <span className="h-px w-16 bg-accent" />
            <ScrambleText text="Get in touch" className="label text-accent" />
          </div>
          <h2 aria-label="Let's work together">
            <SplitChars text="Let's" className="display block text-[clamp(3.6rem,8.2vw,9rem)] text-ink" />
            <SplitChars text="work" className="display text-outline-strong block text-[clamp(3.6rem,8.2vw,9rem)]" delay={0.1} />
            <SplitChars text="together" className="display block text-[clamp(3.6rem,8.2vw,9rem)] text-accent" delay={0.2} />
          </h2>

          <FadeUp delay={0.3} className="mt-10 max-w-lg text-[clamp(1rem,1.2vw,1.15rem)] leading-relaxed text-ink-2">
            Open to full-time roles, freelance hard-surface work and collaborations. Tell me about your project — props, vehicles, weapons or environments.
          </FadeUp>

          <FadeUp delay={0.4} className="mt-10">
            <p className="label-sm text-mute">Direct line</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a href={`mailto:${site.email}`} className="font-display text-[clamp(1.4rem,2.6vw,2.4rem)] font-bold tracking-tight text-ink transition-colors hover:text-accent">
                {site.email}
              </a>
              <button
                type="button"
                onClick={copy}
                className="label-sm flex items-center gap-2 border border-line-2 px-3 py-2 text-ink-2 transition-colors hover:border-accent hover:text-accent"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <a href={site.artstation} target="_blank" rel="noreferrer" className="label-sm flex items-center gap-2 border border-line-2 px-3.5 py-2.5 text-ink-2 transition-colors hover:border-accent hover:text-accent">
                <ArtStationIcon className="size-3.5" /> ArtStation <ArrowUpRight size={12} />
              </a>
              <a href={site.linkedin} target="_blank" rel="noreferrer" className="label-sm flex items-center gap-2 border border-line-2 px-3.5 py-2.5 text-ink-2 transition-colors hover:border-accent hover:text-accent">
                <LinkedInIcon className="size-3.5" /> LinkedIn <ArrowUpRight size={12} />
              </a>
              <span className="label-sm flex items-center gap-2 px-3.5 py-2.5 text-mute">
                <span className="pulse-dot size-1.5 rounded-full bg-[#3ddc84]" /> {site.location} · IST (UTC+5:30)
              </span>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.2} className="lg:col-span-6">
          <div className="chamfer relative border border-line-2 bg-panel/90 p-6 backdrop-blur-sm sm:p-10">
            <div className="hud-corners absolute inset-2 opacity-60" />
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div key="sent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex min-h-[520px] flex-col items-start justify-center gap-6">
                  <span className="label text-accent">Transmission ready</span>
                  <p className="display text-5xl text-ink sm:text-6xl">Message composed.</p>
                  <p className="max-w-md text-ink-2">
                    Your mail app should have opened with everything filled in — just hit send. If nothing happened, email me directly at{" "}
                    <button type="button" onClick={copy} className="text-accent underline underline-offset-4">
                      {site.email}
                    </button>
                    .
                  </p>
                  <button type="button" onClick={() => setSent(false)} className="label-sm text-mute underline underline-offset-4 hover:text-ink">
                    Write another message
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="relative space-y-7">
                  <div className="flex items-center justify-between">
                    <span className="label text-ink">New message</span>
                    <span className="label-sm text-mute">→ {site.email}</span>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Your name" name="name" placeholder="e.g. Alex Vance" autoComplete="name" />
                    <Field label="Email" name="email" type="email" placeholder="you@studio.com" autoComplete="email" />
                  </div>
                  <fieldset>
                    <legend className="label-sm mb-3 text-ink-2">
                      What&apos;s it about <span className="text-accent">*</span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          aria-pressed={topic === t}
                          className={cn(
                            "label-sm border px-3 py-2 transition-colors",
                            topic === t ? "border-accent bg-accent text-black" : "border-line-2 text-ink-2 hover:border-accent/60 hover:text-ink"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <Field label="Message" name="message" textarea placeholder="Tell me about the asset, the studio or the project…" />
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <span className="label-sm text-mute">Opens your mail app · no tracking</span>
                    <Btn type="submit" variant="accent" data-cursor="lock">
                      Send message <Send size={15} />
                    </Btn>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function Field({ label, name, type = "text", placeholder, textarea, autoComplete }: { label: string; name: string; type?: string; placeholder?: string; textarea?: boolean; autoComplete?: string }) {
  const cls =
    "peer w-full border-0 border-b border-line-2 bg-transparent px-0 py-3 text-[16px] text-ink placeholder:text-dim transition-colors focus:border-accent focus:outline-none focus:ring-0";
  return (
    <label className="group relative block">
      <span className="label-sm text-ink-2 transition-colors group-focus-within:text-accent">
        {label} <span className="text-accent">*</span>
      </span>
      {textarea ? (
        <textarea name={name} required rows={5} placeholder={placeholder} className={cn(cls, "resize-none")} data-lenis-prevent />
      ) : (
        <input name={name} type={type} required placeholder={placeholder} autoComplete={autoComplete} className={cls} />
      )}
      <span className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-accent transition-[width] duration-500 peer-focus:w-full" />
    </label>
  );
}
