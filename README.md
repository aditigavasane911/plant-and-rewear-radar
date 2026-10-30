# PlantCare AI & ReWear Radar

A full-stack, standalone web application combining intelligent plant diagnostics, botanical care tracking, and smart garment care intelligence. Built with TanStack Start, React 19, Vite 6, Tailwind CSS, and Supabase.

## ✨ Features

- **AI Plant Pathology**: Snap or upload any plant photo to analyze disease patterns, nutritional deficiencies, and receive actionable organic treatments with confidence scoring.
- **My Garden Tracker**: Monitor individual plants, watering rhythms, fertilizing schedules, and historical health logs.
- **Botanical Library**: Deep dive into light requirements, propagation methods, toxicity levels, and humidity needs for house and garden plants.
- **Gesture-driven & Camera Engine**: Real-time webcam leaf inspection with motion controls and visual feedback.
- **Data Science Explorer**: Dataset inspection, model performance metrics, and pathology distribution visualizer.
- **Full Offline & Demo Mode**: Test and run all features locally without needing active cloud credentials.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)

### Installation & Local Run

```bash
# Clone the repository
git clone <repository-url>
cd plant-and-rewear-radar

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

### Environment Configuration (Optional)

Create a `.env` file in the project root to configure your database or AI models:

```env
# Supabase (Optional — Demo mode runs automatically without these)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider (Optional — Demo diagnosis generator runs locally)
OPENAI_API_KEY=your-openai-api-key
AI_MODEL_ID=gpt-4o-mini
```

## 🛠 Tech Stack

- **Framework**: TanStack Start (React 19)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **State & Data**: TanStack Query v5, Zustand, Zod
- **Backend / Database**: Supabase JS, Drizzle ORM
