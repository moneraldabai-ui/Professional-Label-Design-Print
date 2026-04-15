<div align="center">

<img src="public/logo.svg" alt="Label Studio Pro Logo" width="80" height="80">

# LABEL STUDIO PRO

*Professional Label Design & Barcode Generation Studio*

[![Version](https://img.shields.io/badge/VERSION-v1.0.0-blue?style=for-the-badge)](https://github.com/moneraldabai-ui/label-studio-pro/releases)
[![Platform](https://img.shields.io/badge/PLATFORM-Windows-0078D6?style=for-the-badge&logo=windows)](https://github.com/moneraldabai-ui/label-studio-pro)
[![License](https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge)](LICENSE)
[![Built With](https://img.shields.io/badge/BUILT_WITH-React-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/VITE-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Status](https://img.shields.io/badge/STATUS-Active-brightgreen?style=for-the-badge)](https://github.com/moneraldabai-ui/label-studio-pro)

</div>

---

<div align="center">

### Download

[![Download Source](https://img.shields.io/badge/Download_Source-ZIP-blue?style=for-the-badge&logo=github)](https://github.com/moneraldabai-ui/label-studio-pro/archive/refs/heads/main.zip)

![Total Downloads](https://img.shields.io/github/downloads/moneraldabai-ui/label-studio-pro/total?style=flat-square&label=Total%20Downloads)

| File | Description |
|------|-------------|
| `label-studio-pro-main.zip` | Complete source code with all dependencies |
| `README.md` | Documentation and setup instructions |
| `LICENSE` | MIT License file |

</div>

---

<div align="center">

[Features](#-features) · [Screenshots](#-screenshots) · [Installation](#-installation) · [Tech Stack](#️-tech-stack) · [Building](#-running-the-app) · [Roadmap](#️-roadmap)

</div>

---

## Why Label Studio Pro?

Label Studio Pro eliminates the need for expensive enterprise label design software. It provides a professional-grade label creation experience optimized specifically for Zebra thermal printers (ZD421, ZD420, GK420 series), enabling businesses to design and print professional labels without recurring subscription costs or complex software installations. Simply run it in your browser and start designing.

---

## ✨ Features

| Category | Features |
|----------|----------|
| 🏷️ **Label Design** | Drag-and-drop elements • Text blocks with custom fonts • Static text labels • Dividers (solid, dashed, dotted) • Headers & footers with styling • Shapes (rectangle, oval, star, heart, diamond, and more) • Tables with dynamic fields |
| 🔲 **Barcode Engine** | Code 128 • Code 39 • QR Code with styling (dots, corners, shapes) • Data Matrix • PDF417 • Barcode rotation (0°, 90°, 180°, 270°) • Show/hide barcode text |
| 🎨 **Template System** | 5 built-in departments (IT, HR, Warehouse, Security, Assets) • Custom department creation • Pre-built templates for common use cases • Import/export templates • Background color customization |
| 🖨️ **Print Engine** | Zebra ZD421/ZD420/GK420 optimized • Browser Print API integration • Batch printing from CSV data • Export to PNG • Print preview with zoom • Multiple label sizes supported |
| 🛠️ **Design Tools** | Floating toolbar (pinnable) • Free positioning • Element resize handles • Rotation controls • Flip horizontal/vertical • Layer ordering (z-index) • Lock elements • Undo/redo history |
| ⚙️ **Settings & Help** | Company info configuration • Default settings • Keyboard shortcuts • Help center with guides • About dialog |

---

## 📸 Screenshots

<!-- Add screenshots to the screenshots/ folder -->

*Screenshots coming soon*

---

## 🎬 Demo Video

<!-- Add demo video link here -->

*Demo video coming soon*

---

## 🛠️ Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-5-orange?style=flat-square)

</div>

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **Barcode** | bwip-js, qr-code-styling |
| **State** | Zustand with localStorage persistence |
| **Icons** | Lucide React |
| **Export** | html-to-image |
| **Print** | Browser Print API |

---

## 💻 System Requirements

| Requirement | Specification |
|-------------|---------------|
| **OS** | Windows 10 or later |
| **Browser** | Chrome, Edge, Firefox |
| **Node.js** | 18.x or later (for development) |
| **Printer** | Zebra ZD421 / ZD420 / GK420 |
| **Resolution** | 1280×800 minimum |

---

## 🔧 Prerequisites

| Prerequisite | Version | Download |
|--------------|---------|----------|
| Node.js | 18.x or later | [nodejs.org](https://nodejs.org) |
| npm | 9.x or later | Included with Node.js |

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/moneraldabai-ui/label-studio-pro.git

# Navigate to project directory
cd label-studio-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🚀 Running the App

### Development Mode

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### With System Tray Launcher

Double-click `start.bat` to launch with system tray integration.

---

## 🗂️ Project Structure

```
label-studio-pro/
├── public/
│   ├── logo.svg              # Application logo
│   └── icon.ico              # Windows icon
├── src/
│   ├── components/
│   │   ├── barcode/          # Barcode rendering components
│   │   ├── controls/         # UI control components
│   │   ├── labels/           # Label preview components
│   │   ├── layout/           # Layout components (Header, TabBar, TwoPanel)
│   │   ├── modals/           # Modal dialogs (Settings, Help, About, etc.)
│   │   ├── preview/          # Label preview panel
│   │   └── toolbar/          # Floating toolbar components
│   ├── data/
│   │   └── prebuiltTemplates.ts  # Pre-built template definitions
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts  # Keyboard shortcut handling
│   │   └── usePrintExport.ts        # Print and export logic
│   ├── store/
│   │   ├── useCustomTemplateStore.ts   # Custom departments state
│   │   ├── useFixedDepartmentStore.ts  # Fixed departments state
│   │   ├── useLabelStore.ts            # Label dimensions state
│   │   ├── useSettingsStore.ts         # App settings state
│   │   ├── useHistoryStore.ts          # Undo/redo state
│   │   └── ...                         # Other stores
│   ├── tabs/
│   │   ├── CustomDepartmentTab.tsx     # Custom department workspace
│   │   ├── DepartmentWorkspace.tsx     # Department workspace container
│   │   └── FixedDepartmentTab.tsx      # Fixed department workspace
│   ├── types/
│   │   └── barcode.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── colors.ts           # Color utility functions
│   │   ├── export.ts           # Export utilities
│   │   ├── print.ts            # Print utilities
│   │   └── units.ts            # Unit conversion utilities
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── screenshots/                # Application screenshots
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── LICENSE
└── README.md
```

---

## 🖨️ Supported Printers

| Model | Resolution | Type |
|-------|------------|------|
| Zebra ZD421 | 203 DPI | Direct Thermal |
| Zebra ZD420 | 203 DPI | Direct Thermal |
| Zebra GK420 | 203 DPI | Direct Thermal |

---

## 📋 Supported Barcode Types

| Barcode Type | Description |
|--------------|-------------|
| Code 128 | High-density alphanumeric barcode |
| Code 39 | Alphanumeric barcode, widely used |
| QR Code | 2D barcode with customizable styling |
| Data Matrix | 2D barcode for small items |
| PDF417 | 2D stacked barcode |

---

## 🗺️ Roadmap

- [x] **v1.0.0** — Initial release
- [ ] Update system — *Coming Soon*
- [ ] Multi-language support (Arabic/Dutch/English) — *Coming Soon*
- [ ] Demo video
- [ ] **v1.1.0** — Cloud template sync

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 M. O. N. E. R
```

---

<div align="center">

### 🏷️ Label Studio Pro

Built with ❤️ by **M · O · N · E · R**

*Application Developer & AI Specialist*

![Made with React](https://img.shields.io/badge/Made_with-React-61DAFB?style=flat-square&logo=react)
![Copyright](https://img.shields.io/badge/©_2026-M.O.N.E.R-blue?style=flat-square)

</div>
