---
title: "Generate UI in ERP: Dynamic, But Deterministic"
slug: generate-ui-in-erp-kind-of-fixed-not-fixed
created: 2026-04-25
updated: 2026-04-25
tags:
  - genai
  - erp
  - ui
  - sap
summary: A thinking-out-loud note on why Generate UI feels exciting, irritating, and not yet fully practical for ERP.
heroImage: /blog/generate-ui-in-erp-kind-of-fixed-not-fixed/header-generative-ui-in-erp.png
---

> ## TL;DR for impatient readers
> - Generate UI is getting faster and more impressive, but latency still matters a lot. Even a few seconds can feel like YouTube buffering when the user expects an interface instantly.
> - For consumer experiments, that may still be fine. For ERP and enterprise workflows, it becomes more serious because the data is critical, connected, and validation-heavy.
> - I do not think the future is fully free-form UI generation for business systems. It may be more like generative UI controlled by metadata, templates, backend rules, and deterministic guardrails.
> - So the direction is exciting, but not very practical yet for serious ERP use. It still feels a bit gimmicky today, but with faster and more intelligent models, it may become practical sooner than we think.
> - Kind of fixed, not fixed.

---

So recently I was playing with a small browser experiment around Generate UI. It was inspired by Ben Cobley's Flash Lite Browser idea, and I made a Codex Spark version of it for fun using Codex App Server.

The surprising part was not that it worked. The surprising part was that it felt fast, and still I got irritated waiting.

The page started rendering in around two seconds and completed in maybe three or four seconds. Compared to where Generate UI demos were even a year back, this is quite fast. Models are getting extremely faster, and you can feel that shift when you play with these small experiments.

But still, that small wait gave me the same feeling I get when YouTube buffers.

<video controls muted playsinline preload="metadata" src="/blog/generate-ui-in-erp-kind-of-fixed-not-fixed/codex-spark-browser.mp4">
  Codex Spark browser experiment video.
</video>

That is when this thought started: maybe Generate UI is not just a question of whether the model can create the interface. Maybe it is also a question of whether the user can tolerate the wait.

And once UI becomes interactive and expected, even small delays start feeling unacceptable.

## The speed problem is not fully solved yet

When we talk about generated UI, it is very easy to get excited about the output. You type something, the model generates a screen, and suddenly the browser feels like it can become anything.

That is genuinely cool, but in practical use there is a very thin line between "wow, this generated something" and "why am I staring at this screen?"

Three or four seconds may sound small when we talk about AI generation. But for UI, it is a lot. If I open an app or click something and the screen takes that long to appear, my brain immediately goes into buffering mode.

It feels like the old 3G mobile days where we used to wait for a video and silently curse why it is not loading.

Of course, the models are getting faster. I saw the [Taalas announcement](https://taalas.com/) where they talk about turning AI models into custom silicon and their [HC1 page](https://taalas.com/products/) mentions 17k tokens per second per user for Llama 3.1 8B.

That kind of thing makes you wonder: how fast can this go?

Maybe even 1k tokens per second is not enough for some interactions. Maybe the real bar for UI is not "fast for AI", but "fast enough that the user does not feel any waiting."

For UI, the target probably needs to be milliseconds or at least less than a second. Otherwise, it is still a lagging experience, even if technically the model is very fast.

## Then ERP makes the question harder

Now this is all good when we talk about speed and generating UI on the fly. But I always come back to this question when I think about ERP.

In ERP, the UI has to be kind of fixed, not fixed.

That phrase is a little funny, but I think it captures the problem well.

You cannot simply say that data entry screens can be dynamically generated like a consumer app demo. Business users are entering, editing, and reviewing data that is critical for the organization.

That data is huge, connected across systems, and in many cases sensitive. One wrong value can affect finance, logistics, compliance, reporting, approvals, or downstream processes.

So immediately the question comes:

What about validations?

In SAP and ERP systems, a lot of validations happen at the backend or API level. The UI should not be the final source of truth. But still, the UI is where the user understands what they are doing.

If the UI is generated dynamically, it still has to guide the user properly. It should show the right fields, the right actions, the right messages, and the right context. It cannot hallucinate some random field or generate information that looks nice but does not make sense for the business object.

For enterprise customers, especially where the data affects the organization, there should not be much room for error.

## Fiori elements already gives an interesting clue

When I think about SAP, [Fiori elements](https://www.sap.com/design-system/fiori-design-web/v1-96/discover/frameworks/sap-fiori-elements/smart-templates) is already an interesting example. It is not Generate UI in the full AI sense, but it is also not a fully hand-built static UI. The template responds to metadata from the backend API and shows the UI based on that.

So in one sense, it is already generated UI, but template-based and API-driven.

And honestly, that direction works quite well.

That is why I do not think the future of ERP Generate UI is pure free-form generation. There has to be some kind of template, metadata, or validation structure. In CAP/OData terms, [annotations](https://cap.cloud.sap/docs/guides/uis/fiori#fiori-annotations) are already one way of carrying that UI-relevant meaning with the service model.

Maybe the intelligent model understands the metadata and dynamically creates the experience around it. Maybe Fiori elements, or something in that direction, evolves into a more dynamic generated UI model.

But it still needs to be templated in a different way.

Not completely static.

Not completely free-form.

Kind of fixed, not fixed.

## Intelligence is not just about generating a pretty screen

When I say the model needs to be intelligent, I do not only mean that it should generate a beautiful UI.

It should show the UI based on what the user asked, but also based on what the system allows. It should understand the metadata, validations, and current business context.

And it should not hallucinate.

In normal AI demos, hallucination is already a problem. In ERP UI, it is more serious because the generated interface can influence user action.

That is why I think intelligence and speed both matter together.

If the system is intelligent but slow, users will get irritated.

If it is fast but not reliable, enterprise customers will not trust it.

Both have to improve.

## Agentic loops make this more interesting

Another thing I keep thinking about is that we are moving beyond the old pattern of calling a model API, passing some data, and getting a response. That feels very old already.

For something like enterprise Generate UI, the system probably needs an agentic loop. It has to check, iterate, validate, and ensure the outcome is proper.

But the moment you add an agentic loop, latency comes back into the picture.

The model may be fast. But if the agent needs one or two seconds to reason, check, and produce the UI, the user may still feel that lag.

This is also why my Codex Spark experiment was interesting to me. I was not just calling a model API directly and waiting for a plain request/response. I used [Codex App Server](https://developers.openai.com/codex/app-server), which works with threads and turns and streams Codex events back.

So in my head, it sits closer to an agent-style flow than a simple model API call. I should be careful with the exact terminology, but the important point is that there is some orchestration around the response, and even that still has to feel instant.

It felt much faster than older Generate UI demos, but still not fast enough for that instant UI feeling.

Maybe the future needs the intelligence of an agentic loop, but the perceived speed of a normal app.

That is not easy.

## And then I saw Flipbook

The crazy part is that I recently saw another post about [Flipbook](https://flipbook.page/). This felt like image generation on steroids. With live video streaming, the UX looked so lively and beautiful. Instead of generating UI elements in the normal sense, it looked more like generating an image and streaming through it.

On click or interaction, it can generate the next image or next state on the fly.

That is even more lively than the normal "generate a component tree" idea.

<video controls muted playsinline preload="metadata" src="/blog/generate-ui-in-erp-kind-of-fixed-not-fixed/flipbook-live.mp4">
  Flipbook live demo video.
</video>

But again, the enterprise question comes back.

How relevant is this for enterprise customers, businesses, and organizations? Maybe not so much right now. Or maybe I am wrong, because it is hard to predict considering how fast everything is evolving.

For many enterprise customers, the question is still more basic: how can the data be factual, how can validations be proper, and how can the experience be trusted?

Of course, we can separate backend and UI. The backend owns the data, validations, and process. The UI is for interaction. But even then, the UI cannot become pure visual magic without business grounding.

## So where does this leave Generate UI?

For now, I think Generate UI is still not very practical for serious enterprise workflows.

It is impressive, moving fast, useful for demos, and maybe even useful for companies to show that they have this capability.

But for practical usage, people get irritated.

I cannot really look at a screen generating for three or four seconds just to see some user interface. It becomes boring and irritating very quickly.

Of course, this is also funny because I have worked with customer systems where a report used to run in the background for around three hours, and after optimization it came down to around 30 seconds. So maybe people do not mind waiting when the job is really important. Or maybe we have trained ourselves to suffer for enterprise reports, who knows. :)

But waiting for a UI to appear feels different. That wait is right in front of your face, and you feel every second of it.

So at this moment, it can still feel a bit gimmicky.

But I also do not want to dismiss it.

Because if you look at the speed of progress, models are becoming faster and more intelligent with every iteration. Hardware, streaming experiences, and agentic systems are also changing.

So maybe we are still in the 3G era of Generate UI.

Everything is technically possible, but you can still feel the buffering.

At some point, the 5G moment may come, where there is no buffering, no waiting, and the generated interface feels smooth and natural.

That is when this may become much more practical.

Especially for ERP, I do not think the answer is "generate anything freely." I think the interesting future is more like:

Generate UI, but with templates.

Generate UI, but based on metadata.

Generate UI, but with backend validations.

Generate UI, but deterministic where it matters.

Generate UI that is kind of fixed, not fixed.

That is the direction I am most curious about.

## Further reading

- [SAP Fiori elements smart templates](https://www.sap.com/design-system/fiori-design-web/v1-96/discover/frameworks/sap-fiori-elements/smart-templates)
- [CAP Fiori annotations](https://cap.cloud.sap/docs/guides/uis/fiori#fiori-annotations)
- [Taalas](https://taalas.com/)
- [Taalas HC1](https://taalas.com/products/)
- [Codex App Server](https://developers.openai.com/codex/app-server)
- [Flipbook](https://flipbook.page/)
- [Flipbook post on X](https://x.com/zan2434/status/2046982383430496444)

So that's it folks, let me know your thoughts. I am also still exploring how practical this whole Generate UI direction is for enterprise systems, so any corrections, alternate views, or better examples are much appreciated.

Cheers!
Mahesh
