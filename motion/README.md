# Product promo — motion graphics

A 20-second, 1920×1080 animated product promo, rendered from code.
No After Effects, no timeline app: `scene.html` draws every frame as a pure
function of time, `render.cjs` steps through it in headless Chromium and
encodes the result with ffmpeg. Same input always produces the same output.

> **The copy in here is placeholder.** `LUMEN` is a stand-in product and the
> product UI is an abstract mock. Swap both — see *Changing the content*.

## Output

| File | What it is |
|---|---|
| `out/promo-16x9.mp4` | the promo — H.264, yuv420p, 30 fps, CRF 18 |
| `out/promo-16x9-poster.png` | still from the end card, for thumbnails |

## Running it

```bash
node render.cjs                      # → out/promo-16x9.mp4
node render.cjs --fps 60             # smoother, ~2× the render time
node render.cjs --scale 2            # render at 4K, downscale later
node storyboard.cjs /tmp/sb 2.6 5.9  # contact sheet of just those timestamps
```

`storyboard.cjs` is the fast feedback loop: it samples only the moments you
name, so you can check a layout in seconds instead of re-rendering 600 frames.

## Changing the content

Open `scene.html`. Everything you'd want to edit is in the `CONFIG` block at
the very top — product name, tagline, the hook, feature copy, the three cards,
the three stats, and the call to action. Edit, re-run `node render.cjs`, done.

The palette is the `C` block directly beneath it. Replace those hex values
with your brand colours and the whole piece re-themes; the scenes only ever
refer to colours by name.

Dropping in real assets: `scene3`'s `appWindow()` draws the fake product UI.
Replace that function body with a drawn-in screenshot
(`ctx.drawImage(img, …)`, loaded in `window.ready`) and the rest of the
animation — the spring entrance, the float, the shadow — keeps working.

## The 6 beats

| Time | Beat |
|---|---|
| 0.0 – 3.5s | Brand reveal — confetti settles, logo springs in, name builds letter by letter |
| 3.5 – 7.3s | The hook — the problem, as big kinetic type |
| 7.3 – 11.3s | Product — placeholder UI springs up, feature headline wipes in |
| 11.3 – 14.9s | Three feature cards, popping in sequence |
| 14.9 – 17.5s | The numbers — counters easing up to their values |
| 17.5 – 20.0s | End card — logo, tagline, CTA button, URL |

Cuts are hidden behind layered colour panels that sweep across the frame; the
scene swaps at the midpoint, while the screen is fully covered.

## How the timing works

`renderFrame(t)` is given a timestamp in seconds and draws that instant — it
never reads a clock and never accumulates state. Each scene gets a *local* `t`
starting at 0, so every animation inside is written against its own beat.

Motion is built from eased segments: `E.outBack` for anything that should
overshoot and settle (the playful pop), `E.outQuint` for type wipes,
`E.outExpo` for the counters, `E.inOutQuart` for the panel sweeps. Nothing is
ever perfectly still — shapes drift on slow sine offsets so the frame stays
alive between beats.

## Audio

The MP4 is silent. To lay a track under it:

```bash
ffmpeg -i out/promo-16x9.mp4 -i track.mp3 -c:v copy -c:a aac -b:a 192k \
       -shortest out/promo-16x9-audio.mp4
```

## Requirements

Node with `playwright` resolvable, Chromium, ffmpeg, and the Inter / Inter
Display families installed (the type is set in Inter Display Black at 900).
