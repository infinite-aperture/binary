# Bits Trainer - Binary & Subnet Learning Tool

An interactive web application for learning binary arithmetic, subnetting, and IPv4 networking concepts through gamified exercises. Perfect for networking students, IHK/AP1 certification preparation, and anyone wanting to master networking fundamentals.

## 🎯 Features

### 🕹️ Bit-Flipper
- Interactive binary-to-decimal conversion game
- Visual representation of bit weights (128, 64, 32, 16, 8, 4, 2, 1)
- Real-time feedback and scoring system
- Keyboard shortcuts for quick bit toggling

### 🎭 Subnet Mask Builder
- Interactive CIDR to subnet mask converter
- Live calculation of wildcard masks and usable hosts
- Educational tool for understanding CIDR notation

### 🌐 IPv4 Challenge
- Network calculation exercises
- Calculate network address, broadcast address, first/last usable hosts
- Random IP generation for unlimited practice
- Immediate feedback with solution reveal options

### ✂️ CIDR-Split
- Subnet division calculator
- Split networks into equal-sized subnets
- Visual table showing all subnet ranges
- Educational for understanding subnet planning

## 🎮 Gamification

- **XP System**: Earn experience points for completing challenges
- **Leveling**: Progress through levels with increasing difficulty
- **Streaks**: Maintain streaks for bonus points
- **Celebrations**: Confetti effects for achievements
- **Timer**: Track your learning sessions

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/infinite-aperture/binary.git
   cd binary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Press `T` to jump directly to the trainer
   - Or visit `http://localhost:5173/#trainer`

## 🎯 How to Use

### Bit-Flipper Game
- Click on bit chips to toggle them on/off
- Use number keys 1-8 to toggle bits (1 = LSB, 8 = MSB)
- Reach the target decimal value by setting the correct bits
- Press Enter or click "Prüfen" to submit your answer

### IPv4 Challenge
- Enter an IP address and CIDR notation
- Calculate the network address, broadcast address, and usable host range
- Use the "Tipp" button for hints
- Click "Lösung" to reveal the correct answers

### Keyboard Shortcuts
- `T` - Jump to trainer
- `1-8` - Toggle bits in Bit-Flipper
- `Enter` - Submit answer in games

## 🛠️ Technology Stack

- **React 19.1.1** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Canvas Confetti** - Celebration effects
- **CSS-in-JS** - Scoped styling

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## 🎨 Design

- **Dark Theme**: Easy on the eyes for extended learning sessions
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Keyboard navigation and screen reader friendly
- **Modern UI**: Clean, professional interface with smooth animations

## 🌐 Live Demo

Visit the live application: [Bits Trainer](https://infinite-aperture.github.io/binary/)

## 📚 Learning Resources

This tool is designed to complement networking education:
- **Binary Arithmetic**: Understanding bit weights and conversions
- **CIDR Notation**: Learning subnet mask concepts
- **IPv4 Subnetting**: Practical network planning exercises
- **Network Calculations**: Real-world networking scenarios

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features
- Submit pull requests for improvements
- Add new training modules or exercises
- Improve documentation or translations

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for the networking community**
