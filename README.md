# FitMe 3D — Personal Men's Outfit Studio

FitMe 3D is a personal men's outfit colour-combination studio that lets you visualize clothing colour combinations on an interactive 3D male avatar before wearing them.

---

## Features

- **Interactive 3D Male Avatar**: Real WebGL rendering with 360° orbit rotation, vertical tilt, smooth zoom, and camera angle presets (`Full Body`, `Shirt`, `Trousers`, `Shoes`).
- **Immediate Colour Updates**: Select clothing items (Shirt, Trousers, Shoes) and see materials update in real time with smooth colour lerping.
- **Deterministic Compatibility Engine**: 100% offline, zero-latency rule engine analyzing contrast, lightness, saturation, temperature harmony, and classic menswear color rules.
- **Objective Scoring (0–100)**: With clear rating tiers (`Excellent`, `Very Good`, `Good`, `Decent`, `Weak`) and short sartorial explanations.
- **One-Click Recommendations**: "Recommend Alternatives" finds up to three stronger color options and applies them directly to the 3D model.
- **One-Click Reset**: Restores the studio to the classic menswear baseline (`White shirt` + `Light Khaki trousers` + `Brown shoes`).
- **Provider-Agnostic Architecture**: Not tied to any single AI provider. Operates completely without external APIs, with an extensible adapter interface for Gemini, OpenAI, Claude, or local LLMs.
- **Replaceable Avatar Asset**: Drop your own GLB avatar file into `/public/assets/avatar/my-avatar.glb` or upload any `.glb` model directly via the UI button.

---

## Project Structure

```text
/
├── public/
│   └── assets/
│       └── avatar/
│           ├── my-avatar.glb    # (Place your custom GLB avatar here)
│           └── README.md
├── src/
│   ├── types/
│   │   └── outfit.ts            # Core types (ColorItem, OutfitState, Evaluation)
│   ├── data/
│   │   ├── colors.ts            # Centralized colour database with metadata
│   │   └── clothing.ts          # Clothing categories and configuration
│   ├── utils/
│   │   ├── colorUtils.ts        # Relative luminance and contrast ratio math
│   │   └── scoring.ts           # Deterministic compatibility matrix and recommendation engine
│   ├── services/
│   │   └── ai/
│   │       ├── types.ts         # Generic AIStyleProvider interface
│   │       ├── deterministicProvider.ts # Built-in local offline engine
│   │       ├── geminiProvider.ts        # Optional Gemini LLM adapter
│   │       └── index.ts         # Service manager
│   ├── components/
│   │   ├── Studio/
│   │   │   └── StudioCanvas.tsx # Three.js WebGL scene, lighting, avatar & controls
│   │   ├── Outfit/
│   │   │   ├── ClothingSelector.tsx
│   │   │   └── ColorSwatch.tsx
│   │   ├── Evaluation/
│   │   │   ├── ScoreDisplay.tsx
│   │   │   └── RecommendationPanel.tsx
│   │   └── UI/
│   │       └── Header.tsx
│   ├── hooks/
│   │   └── useOutfit.ts         # Central state management hook
│   ├── App.tsx                  # Main layout
│   ├── index.css                # Tailwind CSS v4 and custom styles
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## Getting Started

### 1. Installation

Install dependencies:

```bash
npm install
```

### 2. Local Development

Run the Vite development server on port 3000:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 3. Production Build

Build the static distribution files:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Deployment

The app is a static client-side Single Page Application (SPA) that requires no backend database or servers to function:

- **Vercel**: Run `vercel` or link repository. Output directory is `dist`.
- **Netlify**: Set build command to `npm run build` and publish directory to `dist`.
- **Cloudflare Pages**: Set build command to `npm run build` and build output directory to `dist`.
- **GitHub Pages**: Build with `npm run build` and deploy the contents of `dist`.

---

## Replacing the Avatar with Your Own 3D Model

The application is structured to treat the 3D avatar as a pluggable asset:

1. **Static Replacement**:
   Save your 3D avatar model in binary GLTF format (`.glb`) at:
   ```text
   public/assets/avatar/my-avatar.glb
   ```
2. **In-Browser Upload**:
   Click the **"Load Avatar GLB"** button located at the top-right of the 3D studio viewport to preview any `.glb` model instantly in real time.
3. **Mesh Naming Convention**:
   To enable automatic color changes on your custom model, name the meshes or materials in Blender/Maya using any of these keywords:
   - Shirt/Top: contains `shirt`, `top`, `tshirt`, or `polo`
   - Trousers: contains `trouser`, `pant`, `jean`, or `chino`
   - Shoes: contains `shoe`, `boot`, `foot`, or `sneaker`
4. If `/assets/avatar/my-avatar.glb` is not present, FitMe 3D automatically falls back to its built-in studio mannequin with zero errors or disruption.

---

## Adding Proper Clothing Assets Later

When dedicated 3D clothing items (e.g. separate jackets, Oxford shirts, chinos, boots) are ready:
1. Place clothing `.glb` files into `public/assets/clothing/`.
2. In `src/data/clothing.ts`, update `CLOTHING_SLOTS` with paths to the assets.
3. In `StudioCanvas.tsx`, load the mesh pieces onto the avatar's bone rig or locator hierarchy.

---

## Connecting an Optional AI Provider

The application uses an abstract, provider-agnostic interface defined in `src/services/ai/types.ts`:

```typescript
export interface AIStyleProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  getStyleAdvice(request: StyleAdviceRequest): Promise<StyleAdviceResponse>;
}
```

To connect an AI provider:
1. Implement `AIStyleProvider` (e.g., for OpenAI, Anthropic Claude, or a self-hosted Ollama model).
2. Register your provider in `src/services/ai/index.ts`:
   ```typescript
   styleService.registerProvider(new MyCustomProvider());
   ```
3. If no external provider is configured or if network fails, the local deterministic engine automatically handles all scoring and advice without disruption.

---

## Environment Variables

Defined in `.env.example`:

- `GEMINI_API_KEY`: *(Optional)* Only needed if you choose to enable the optional remote Gemini styling advisor adapter. When absent, the local deterministic engine runs automatically.
