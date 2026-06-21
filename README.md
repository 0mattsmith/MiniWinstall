# MiniWinstall — Cross-Platform Windows 11 Customizer & Rust Engine Optimizer

**MiniWinstall** is an interactive, browser-based customized visualizer combined with a high-fidelity **native Rust optimization engine (`wimlib` APIs)**. It empowers system administrators, developers, and power users to strip down Windows 11 installation images, bypass system hardware barriers, inject custom hardware drivers, and generate unattended answer files at lightning speeds.

---

## 🚀 Key Modules & System Features

### 1. Stripping & Custom Components Customizer
*   **Size Reduction**: Safely strip default UWP packages, bloatware, advertisements, and embedded tracking hubs to reduce the disk footprint by up to **14 GB**.
*   **Control Packages**: Toggle system services like OneDrive, Windows Defender, Xbox Live core libraries, Microsoft Edge, telemetry reports, and diagnostic logs with absolute precision.
*   **Optimized Workspace**: Maintain full stability with modular feature controls that preserve essential APIs while scrubbing redundant system processes.

### 2. Auto-Unattended Answers Setup (`unattend.xml`)
*   **Bypass Restrictions**: Bypass modern Windows 11 TPM 2.0 restrictions, SecureBoot conditions, dynamic RAM sizes, and CPU hardware requirements in a single click.
*   **Local Accounts**: Automatically configure local user profiles, admin passwords, regional locales, and timezones. Pre-approve license agreements during target assembly.
*   **Skip OOBE Bloat**: Bypass the heavy out-of-box setup phase, force offline account configurations, and skip Microsoft network account prompts.

### 3. OEM Driver Injector
*   **Pre-Boot Storage Drivers**: Integrate custom virtualization host SCSI hardware drivers (`.INF` & `.SYS` controllers) to prevent "No drives found" hardware lockouts in modern hypervisors.
*   **Network Protocols**: Inject modern Wireless and Ethernet protocol packages beforehand to guarantee connectivity immediately upon arriving at the desktop.

### 4. Interactive Compilation Terminal Simulator
*   **Live Trial Runs**: Simulates native mounting sequences, cabinet unpacking, driver injection, XML binding, and image re-compression in a visual sandbox environment before running local system commands.

### 5. Bootable GPT/MBR USB Flash Selector
*   **Rufus-Style Presets**: Design partition boundaries (GPT for UEFI, MBR for legacy BIOS) and set volume descriptors to burn completed directories efficiently under NTFS/FAT32 structures.

---

## 🛠️ Cross-Platform Rust Engine (`mini-winstall-engine`)

Unlike typical Windows customization scripts that rely strictly on heavy Microsoft Deployment Toolkits (ADK) and only compile on active Windows hypervisors, **MiniWinstall contains a lightweight native Rust engine** compiled via **LLVM** for native speed.

It leverages cross-platform **wimlib** APIs to manipulate WIM/ESD tables directly from Mac or Linux hosts without hypervisor kernel mounting requirements.

### Local Compilation Prerequisites

#### 1. System Dependency Installation (wimlib)
*   **Arch Linux**: `sudo pacman -S wimlib`
*   **Ubuntu / Debian**: `sudo apt install wimtools`
*   **macOS (Homebrew)**: `brew install wimlib`
*   **Windows Direct**: Download binary libraries from [wimlib.net](https://wimlib.net/) and place `wimlib-imagex.exe` in your system's PATH.

#### 2. Cargo Compilation
Execute within your local clone workspace:
```bash
cargo build --release
```
The optimized native executive binary will build directly inside:
```
./target/release/mini-winstall-engine
```

#### 3. CLI Invocation Syntax
Run customized runs using the following flags:
```bash
mini-winstall-engine \
  --wim-path "/path/to/extracted/install.wim" \
  --index 1 \
  --unattend-path "./unattend.xml" \
  --drivers-dir "/path/to/my/inf_drivers"
```

---

## 📦 Automated GitHub Actions CI/CD Release Pipeline

We have bundled an industry-standard **automated release workflow** inside `.github/workflows/release.yml`. When you publish your repository to GitHub, you don't even need to compile or configure Rust on your local machine!

```
                      ┌──────────────────────┐
                      │ Push Git Tag (v1.0)  │
                      └──────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Windows Runner  │     │  macOS Runner   │     │  Linux Runner   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Build Win-x64   │     │ Build Mac ARM64 │     │ Build Linux-x64 │
│ Executable (.exe│     │  & Mac Intel    │     │  Static musl    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Auto GitHub Release   │
                     │  with Compiled Assets │
                     └───────────────────────┘
```

### How to trigger a cross-platform compilation run:

1.  **Tag Your Code**: Whenever you are ready to publish a new release of the compiler engine, tag your commit and push it to GitHub:
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```
2.  **Manual Launch**: Alternatively, go to your repository page under the **"Actions"** tab, select **Cross-Platform Rust Engine Release Build**, and click **"Run workflow"**.
3.  **Get Installers**: The runners will compile everything simultaneously. Within minutes, the workflow automatically attaches native static binaries for **Windows (64-bit)**, **macOS (Apple Silicon & Intel)**, and **Linux (with static musl targets)** on your repository's **Releases page**!

---

## 📄 License & Integrity
Distributed under a lightweight, developer-first license structure. Built to modernize and accelerate sovereign custom administrative tooling worldwide.
