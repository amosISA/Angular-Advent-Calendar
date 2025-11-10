# 🎄 Advent Calendar 2024 - Angular 20 with SSR

A modern, interactive Advent Calendar web application built with Angular 20 and Server-Side Rendering (SSR). Open a door each day in December to reveal festive surprises!

## ✨ Features

- **Modern Angular 20**: Built with the latest Angular framework using standalone components
- **Server-Side Rendering (SSR)**: Optimized performance and SEO with SSR
- **24 Interactive Doors**: One door for each day leading up to Christmas
- **Beautiful Animations**: Smooth door-opening animations with 3D flip effects
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Smart Date Logic**: Doors can only be opened on or after their corresponding day in December
- **Festive UI**: Purple gradient background with animated snowflakes
- **Modern Stack**: Using Angular Signals, computed values, and modern CSS

## 🎨 Design Features

- **Gradient Backgrounds**: Beautiful purple-to-blue gradient with radial overlays
- **3D Door Animation**: Doors flip open with perspective transforms
- **Shimmer Effects**: Subtle shimmer animation on closed doors
- **Custom Scrollbar**: Themed scrollbar matching the Christmas aesthetic
- **Poppins Font**: Modern, clean typography from Google Fonts
- **Responsive Grid**: Automatically adjusts to screen size

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production (with SSR)
npm run build

# Build for GitHub Pages (static hosting)
npm run build:ghpages

# Serve SSR build
npm run serve:ssr:advent-calendar
```

### Development

The development server will start at `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### 🌐 GitHub Pages Deployment

This app is configured for GitHub Pages deployment:

1. **Build for GitHub Pages:**
   ```bash
   npm run build:ghpages
   ```

2. **Commit and Push:**
   ```bash
   git add docs/
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

3. **Configure GitHub Pages:**
   - Go to your repository settings on GitHub
   - Navigate to Pages section
   - Set Source to: Deploy from a branch
   - Select branch: `claude/angular-advent-calendar-ssr-011CUxsF9qw39KwfY6UJFguL`
   - Select folder: `/docs`
   - Click Save

The app will be available at: `https://[your-username].github.io/Angular-Advent-Calendar/`

**Note:** The GitHub Pages build uses static hosting (no SSR). For full SSR functionality, deploy to a Node.js hosting platform.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── advent-calendar/
│   │   ├── advent-calendar.component.ts    # Main calendar logic
│   │   ├── advent-calendar.component.html  # Calendar template
│   │   └── advent-calendar.component.scss  # Calendar styles
│   ├── app.ts                              # Root component
│   ├── app.html                            # Root template
│   └── app.scss                            # Root styles
├── index.html                              # Main HTML file
├── styles.scss                             # Global styles
├── main.ts                                 # Client entry point
├── main.server.ts                          # Server entry point
└── server.ts                               # Express SSR server
```

## 🎁 Door Content

Each door contains:
- A unique emoji (🎅, ⭐, 🎁, ❄️, etc.)
- A festive message
- A custom background color

The content is randomized but consistent for each door number.

## 🛠️ Technologies Used

- **Angular 20.3.0**: Latest Angular framework
- **TypeScript 5.9.2**: Type-safe JavaScript
- **SCSS**: Advanced CSS with nesting and variables
- **Express.js**: SSR server
- **Angular SSR**: Server-side rendering support
- **RxJS 7.8**: Reactive programming
- **Google Fonts**: Poppins font family

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+ (Grid of larger doors)
- **Tablet**: 768px - 1199px (Medium doors)
- **Mobile**: < 768px (Smaller doors, optimized layout)

## 🎯 Key Features Explained

### Date-Based Door Unlocking

Doors can only be opened if:
1. The current month is December
2. The current day is equal to or past the door's day number

This creates an authentic advent calendar experience!

### Angular Signals

The app uses Angular's new reactive Signals API:
- `currentDay` and `currentMonth` signals track the current date
- `doors` signal manages the state of all 24 doors
- `openedDoorsCount` computed signal automatically calculates opened doors

### SSR Optimization

The app is fully server-side rendered, providing:
- Faster initial page load
- Better SEO
- Improved performance on slower devices

## 📄 License

This project is open source and available for educational purposes.

## 🎅 Credits

Built with Angular 20 & SSR ✨

Happy Holidays! 🎄
