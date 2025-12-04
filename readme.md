# ⚛️ Studio AV - Quantum Compute Engine (v2.2)

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg) ![Electron](https://img.shields.io/badge/Electron-Desktop-lightgrey) ![Node](https://img.shields.io/badge/Node-Backend-green) ![Status](https://img.shields.io/badge/Quantum-Stable-purple)

> **Une station de travail hybride (Audio/Vidéo/IA) pilotée par superposition quantique et contrôle MIDI.**

## 📋 Description

Studio AV est une application Electron modulaire conçue pour la performance live et l'édition non-linéaire expérimentale. Elle intègre un moteur de rendu multicouche (Vidéo, WebGL, ASCII, Vectoriel) piloté par une "logique quantique" (superposition d'états visuels) et une intégration IA (Llama/Groq) pour la mutation de code en temps réel.

## 🚀 Architecture

Le système repose sur une architecture Client-Serveur locale :

* **Backend (Port 3145) :** Node.js + Express + Socket.io. Gère l'état global, le MIDI, et les appels API IA.
* **Frontend :** Electron (Chromium). Interface "DaVinci-like" avec timeline, pool média et moteur de rendu composite.
* **Moteur Quantique :** Système de gestion de Z-Index dynamique piloté par l'index Pad 15 (MPD218), permettant de basculer entre les dimensions visuelles (Standard, Boost Dessin, Fusion, Quantum Front).

## 🛠️ Installation

```bash
# 1. Cloner le dépôt
git clone [https://github.com/VOTRE_USER/studio-av-quantum.git](https://github.com/VOTRE_USER/studio-av-quantum.git)
cd studio-av-quantum

# 2. Installer les dépendances
npm install

# 3. Démarrer le Serveur API (Backend)
node server.js

# 4. Dans un autre terminal, lancer le Studio (Electron)
npm start