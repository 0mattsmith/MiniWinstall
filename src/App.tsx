import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, 
  Layers, 
  Settings, 
  Terminal, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash, 
  Play, 
  FileCode, 
  RefreshCw, 
  Download, 
  HelpCircle, 
  FileDown, 
  ArrowRight,
  Sparkles,
  Clipboard,
  Check,
  Usb,
  Github,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  ComponentItem, 
  DriverItem, 
  UnattendedConfig, 
  SystemStabilityCheck, 
  SimulationLog 
} from "./types";
import { 
  RUST_CARGO_TOML, 
  RUST_MAIN_CODE, 
  RUST_README,
  RUST_GITHUB_WORKFLOW
} from "./rustTemplate";

// Initial components definitions
const INITIAL_COMPONENTS: ComponentItem[] = [
  {
    id: "telemetry-diagnostics",
    name: "Windows Telemetry & Diagnostic Feedback",
    category: "telemetry",
    description: "Disables telemetry, host diagnostics, background usage reporting, and error logs. Highly recommended for VM optimization.",
    sizeMb: 45,
    riskScore: 0,
    checked: true,
  },
  {
    id: "microsoft-edge",
    name: "Microsoft Edge Browser Core",
    category: "system",
    description: "Removes default Edge browser files. Warning: Leaves system without an internet browser out-of-the-box.",
    sizeMb: 180,
    riskScore: 35,
    checked: false,
  },
  {
    id: "windows-defender",
    name: "Windows Defender & Security Center",
    category: "defender",
    description: "Removes default anti-malware protections. Only recommended for air-gapped sandboxes or low-latency cloud systems.",
    sizeMb: 210,
    riskScore: 85,
    checked: false,
  },
  {
    id: "xbox-gaming",
    name: "Xbox Integration & Gaming Services",
    category: "gaming",
    description: "Xbox game bar, game overlay controllers, and network authentication dependencies.",
    sizeMb: 150,
    riskScore: 15,
    checked: true,
  },
  {
    id: "teams-chat",
    name: "Microsoft Teams & Legacy Chat Client",
    category: "bloatware",
    description: "Default built-in consumer desktop collaboration chats and pre-installed notification elements.",
    sizeMb: 320,
    riskScore: 0,
    checked: true,
  },
  {
    id: "onedrive-sync",
    name: "OneDrive Cloud Storage Companion",
    category: "system",
    description: "Default cloud folders explorer hook. Disabling decreases resource consumption in idle file cycles.",
    sizeMb: 140,
    riskScore: 10,
    checked: true,
  },
  {
    id: "bing-news-widgets",
    name: "Bing News & Desktop Widgets Infrastructure",
    category: "bloatware",
    description: "Feeds system widgets, news panes, weather summaries, and taskbar visual banners.",
    sizeMb: 120,
    riskScore: 0,
    checked: true,
  },
  {
    id: "cortana-helper",
    name: "Cortana Voice Recognition & Indexing",
    category: "bloatware",
    description: "Legacy Windows speech assistant. Removing has zero impact on core system stability.",
    sizeMb: 85,
    riskScore: 0,
    checked: true,
  },
  {
    id: "solitaire-collection",
    name: "Microsoft Solitaire & OEM Game Packages",
    category: "gaming",
    description: "Standard pre-provisioned gaming files and graphics assets.",
    sizeMb: 95,
    riskScore: 0,
    checked: true,
  },
  {
    id: "clipchamp-editor",
    name: "Clipchamp Media & Video Editor App",
    category: "bloatware",
    description: "A preinstalled media template client that runs on desktop startup lists.",
    sizeMb: 160,
    riskScore: 0,
    checked: true,
  },
];

const INITIAL_DRIVERS: DriverItem[] = [
  { id: "drv-1", name: "VirtIO Network Driver Pack", type: "Network", version: "v0.1.248", sizeKb: 720, fileName: "viostor.inf" },
  { id: "drv-2", name: "VMware SCSI Controller driver", type: "Storage", version: "v1.2.9.0", sizeKb: 450, fileName: "pvscsi.inf" },
];

export default function App() {
  // Navigation Tabs: 'customize' (Features & Options), 'automation' (unattend), 'drivers' (drivers list), 'rust' (rust project engine), 'simulate' (simulation terminal), 'usb' (usb flasher)
  const [activeTab, setActiveTab] = useState<"customize" | "automation" | "drivers" | "rust" | "simulate" | "usb">("customize");
  const [showWorkflowCode, setShowWorkflowCode] = useState(false);
  const [docTab, setDocTab] = useState<"manual" | "rust" | "cicd">("manual");

  // USB Flashing state variables
  const [usbDrive, setUsbDrive] = useState("D: [32GB] Kingston DataTraveler 3.0");
  const [usbPartitionScheme, setUsbPartitionScheme] = useState("GPT");
  const [usbTargetSystem, setUsbTargetSystem] = useState("UEFI (non CSM)");
  const [usbFileSystem, setUsbFileSystem] = useState("NTFS");
  const [usbVolumeLabel, setUsbVolumeLabel] = useState("MINI_WIN11");
  const [usbBypasses, setUsbBypasses] = useState({
    bypassTPM: true,
    bypassRAM: true,
    bypassSecureBoot: true,
    skipOnlineAccount: true,
    bypassDiskCheck: true,
    disableBitLocker: true,
    skipPrivacyQuestions: true,
  });
  const [usbFlashingProgress, setUsbFlashingProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [usbLogs, setUsbLogs] = useState<SimulationLog[]>([]);
  const usbTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (usbTimerRef.current) clearTimeout(usbTimerRef.current);
    };
  }, []);

  const USB_DRIVES = [
    { label: "D: [32GB] Kingston DataTraveler 3.0", value: "D: [32GB] Kingston DataTraveler 3.0" },
    { label: "E: [16GB] SanDisk Ultra Dual USB", value: "E: [16GB] SanDisk Ultra Dual USB" },
    { label: "F: [64GB] Samsung BAR Plus Metal", value: "F: [64GB] Samsung BAR Plus Metal" },
  ];

  const handleUsbBypassChange = (field: string, checked: boolean) => {
    setUsbBypasses(prev => ({ ...prev, [field]: checked }));
  };

  const startUsbFlashing = () => {
    if (isFlashing) return;
    setIsFlashing(true);
    setUsbFlashingProgress(0);
    setUsbLogs([]);

    const steps = [
      { message: "[INFO] Accessing target device: " + usbDrive + "..." },
      { message: "[INFO] System locks check: No active filesystems handle bindings found." },
      { message: "[INFO] Clearing direct sector tables & checking for flash cell bad blocks..." },
      { message: "[SUCCESS] Sector validation completed. 0 bad cells found." },
      { message: "[INFO] Creating primary active partition block with scheme: " + usbPartitionScheme + "..." },
      { message: "[INFO] Formatting volume using " + usbFileSystem + " with allocation unit size 4096 bytes..." },
      { message: "[SUCCESS] Drive formatted successfully. Assigned Volume Label: " + usbVolumeLabel },
      { message: "[INFO] Mounting Windows 11 customized micro image distribution system..." },
      { message: "[INFO] Unpacking core operating system files & extracting install.wim..." },
      { message: "[INFO] Allocating master boot block elements (Target: " + usbTargetSystem + ")..." },
      { message: "[SUCCESS] Master boot records and offline support files placed correctly." },
      { message: "[INFO] Patching setup registry hives to force hardware and configuration bypasses..." },
      ...(usbBypasses.bypassTPM ? [{ message: "[SUCCESS] Injected registry patch: BypassTPMCheck = 0x01" }] : []),
      ...(usbBypasses.bypassRAM ? [{ message: "[SUCCESS] Injected registry patch: BypassRAMCheck = 0x01" }] : []),
      ...(usbBypasses.bypassSecureBoot ? [{ message: "[SUCCESS] Injected registry patch: BypassSecureBootCheck = 0x01" }] : []),
      ...(usbBypasses.skipOnlineAccount ? [{ message: "[SUCCESS] Injected registry patch: SkipMachineOOBEOnlineRequirement = 0x01" }] : []),
      ...(usbBypasses.disableBitLocker ? [{ message: "[SUCCESS] Injected registry patch: PreventAutomaticBitLocker = 0x01" }] : []),
      ...(usbBypasses.skipPrivacyQuestions ? [{ message: "[SUCCESS] Injected registry patch: SkipPrivacyQuestions = 0x01" }] : []),
      { message: "[INFO] Transferring custom Panther configuration & unattended scripts..." },
      { message: "[SUCCESS] Written Panther unattend.xml to USB root direct directory." },
      { message: "[INFO] Checking staged OEM drivers inside target..." },
      { message: "[INFO] Staged OEM Driver Packages count: " + drivers.length + "." },
      ...drivers.map(drv => ({ message: "[SUCCESS] OEM driver file copied to flash disk: " + drv.fileName + " (" + drv.name + ")" })),
      { message: "[INFO] Flashing complete. Finalizing media structure and writing sync cache sectors..." },
      { message: "[SUCCESS] Completed formatting and creating bootable USB media disk. Ready to deploy!" }
    ];

    let currentStep = 0;
    const runStep = () => {
      if (currentStep >= steps.length) {
        setUsbFlashingProgress(100);
        setIsFlashing(false);
        return;
      }

      const step = steps[currentStep];
      const level = step.message.startsWith("[SUCCESS]") ? "success" 
                  : step.message.startsWith("[WARN]") ? "warn" 
                  : step.message.startsWith("[ERROR]") ? "error" 
                  : "info";

      const logItem: SimulationLog = {
        id: `usb-log-${Date.now()}-${currentStep}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: step.message
      };

      setUsbLogs(prev => [...prev, logItem]);
      setUsbFlashingProgress(Math.min(99, Math.round(((currentStep + 1) / steps.length) * 100)));

      currentStep++;
      usbTimerRef.current = setTimeout(runStep, 950);
    };

    runStep();
  };

  const stopUsbFlashing = () => {
    if (usbTimerRef.current) {
      clearTimeout(usbTimerRef.current);
    }
    setIsFlashing(false);
    setUsbLogs(prev => [...prev, {
      id: `usb-log-abort-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: "[WARN] Flashing pipeline aborted by user request. Disk state may be corrupted."
    }]);
  };

  const [components, setComponents] = useState<ComponentItem[]>(INITIAL_COMPONENTS);
  const [drivers, setDrivers] = useState<DriverItem[]>(INITIAL_DRIVERS);
  const [unattend, setUnattend] = useState<UnattendedConfig>({
    username: "TinyPC",
    computerName: "TINY11-VM",
    bypassTPM: true,
    bypassRAMCheck: true,
    bypassSecureBoot: true,
    bypassDiskCheck: true,
    skipMicrosoftAccount: true,
    enableDeveloperMode: true,
    autoLogon: true,
    timezone: "Pacific Standard Time"
  });

  // State for dynamic evaluations
  const [xmlContent, setXmlContent] = useState<string>("");
  const [isGeneratingXml, setIsGeneratingXml] = useState<boolean>(false);
  const [stabilityCheck, setStabilityCheck] = useState<SystemStabilityCheck>({
    isStable: true,
    integrityScore: 92,
    potentialIssues: ["None active"],
    recommendedFixes: ["Selection looks highly optimized!"],
    estimatedSizeDecreaseGb: 2.1,
    performanceImprovementPct: 15
  });
  const [isAnalyzingStability, setIsAnalyzingStability] = useState<boolean>(false);

  // Sparkle effects or copy confirmations
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Simulation Console Logging State
  const [simLogs, setSimLogs] = useState<SimulationLog[]>([]);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // New Driver Form State
  const [newDriver, setNewDriver] = useState({ name: "", type: "Network", version: "v1.0.0", sizeKb: 120, fileName: "driver.inf" });

  // Load XML representation and analyze config upon change with a debounce behavior to stay safe from Gemini rate limits
  useEffect(() => {
    const handler = setTimeout(() => {
      generateSetupXml();
      triggerStabilityAnalysis();
    }, 1200);

    return () => {
      clearTimeout(handler);
    };
  }, [unattend, components, drivers]);

  const generateSetupXml = async () => {
    setIsGeneratingXml(true);
    try {
      const response = await fetch("/api/gemini/generate-unattend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unattend)
      });
      const data = await response.json();
      setXmlContent(data.xml || "");
    } catch (e) {
      console.error("Failed to generate XML", e);
    } finally {
      setIsGeneratingXml(false);
    }
  };

  const triggerStabilityAnalysis = async () => {
    setIsAnalyzingStability(true);
    const removedList = components.filter(c => c.checked);
    try {
      const response = await fetch("/api/gemini/analyze-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removedComponents: removedList,
          unattendConfig: unattend,
          drivers: drivers
        })
      });
      const data = await response.json();
      if (data.analysis) {
        setStabilityCheck(data.analysis);
      }
    } catch (e) {
      console.error("Stability check failed", e);
    } finally {
      setIsAnalyzingStability(false);
    }
  };

  const handleComponentToggle = (id: string) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  const handleUnattendChange = (field: keyof UnattendedConfig, value: any) => {
    setUnattend(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.fileName) return;
    const item: DriverItem = {
      id: `drv-${Date.now()}`,
      name: newDriver.name,
      type: newDriver.type,
      version: newDriver.version,
      sizeKb: newDriver.sizeKb,
      fileName: newDriver.fileName,
    };
    setDrivers(prev => [...prev, item]);
    setNewDriver({ name: "", type: "Network", version: "v1.0.0", sizeKb: 120, fileName: "driver.inf" });
  };

  const handleRemoveDriver = (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const startPipelineSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimProgress(0);
    setSimLogs([]);
    setActiveTab("simulate");

    const removedList = components.filter(c => c.checked);
    try {
      const response = await fetch("/api/simulate-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removedComponents: removedList,
          unattendConfig: unattend,
          drivers,
        })
      });
      const data = await response.json();
      const steps = data.steps || [];

      let currentStep = 0;
      
      const runStep = () => {
        if (currentStep >= steps.length) {
          setSimProgress(100);
          setIsSimulating(false);
          return;
        }

        const step = steps[currentStep];
        const level = step.message.startsWith("[SUCCESS]") ? "success" 
                    : step.message.startsWith("[WARN]") ? "warn" 
                    : step.message.startsWith("[ERROR]") ? "error" 
                    : "info";

        const logItem: SimulationLog = {
          id: `log-${Date.now()}-${currentStep}`,
          timestamp: new Date().toLocaleTimeString(),
          level,
          message: step.message
        };

        setSimLogs(prev => [...prev, logItem]);
        setSimProgress(Math.min(99, Math.round(((currentStep + 1) / steps.length) * 100)));

        currentStep++;
        simTimerRef.current = setTimeout(runStep, 1000); // Trigger step every second
      };

      runStep();
    } catch (e) {
      console.error(e);
      setIsSimulating(false);
    }
  };

  const stopPipelineSimulation = () => {
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current);
    }
    setIsSimulating(false);
    setSimLogs(prev => [...prev, {
      id: `log-abort-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: "[WARN] Execution pipeline aborted by custom user interrupt."
    }]);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pre-calculate aggregate reductions
  const selectedRemovalMb = components.filter(c => c.checked).reduce((acc, curr) => acc + curr.sizeMb, 0);

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden" id="customizer-app">
      {/* Header Navigation */}
      <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-mono font-extrabold text-white shadow-lg shadow-orange-900/20">
            M
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight uppercase flex items-center gap-2 text-white">
              MiniWinstall
              <span className="text-[10px] text-slate-500 font-normal underline decoration-orange-600/50 underline-offset-4">
                Rust Core v0.8.4-stable
              </span>
            </h1>
          </div>
        </div>

        {/* Dense Tabs Navigation */}
        <nav className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 overflow-x-auto mx-4">
          <button
            onClick={() => setActiveTab("customize")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition ${
              activeTab === "customize" ? "bg-slate-800 text-orange-400 border border-slate-700" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3 w-3" />
            Strip Packages
          </button>
          <button
            onClick={() => setActiveTab("automation")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition ${
              activeTab === "automation" ? "bg-slate-800 text-orange-400 border border-slate-700" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="h-3 w-3" />
            Unattended Setup
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition ${
              activeTab === "drivers" ? "bg-slate-800 text-orange-400 border border-slate-700" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus className="h-3 w-3" />
            inject drivers
          </button>
          <button
            onClick={() => setActiveTab("rust")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition ${
              activeTab === "rust" ? "bg-slate-800 text-orange-400 border border-slate-700" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="h-3 w-3" />
            rust source
          </button>
          <button
            onClick={() => setActiveTab("simulate")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition ${
              activeTab === "simulate" ? "bg-slate-800 text-orange-400 border border-slate-700" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3 w-3" />
            simulation console
          </button>
          <button
            onClick={() => setActiveTab("usb")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition ${
              activeTab === "usb" ? "bg-slate-800 text-orange-400 border border-slate-700" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Usb className="h-3 w-3" />
            USB Flasher
          </button>
        </nav>

        {/* Right Info Flags & Action */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-[10px] uppercase font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
            Kernel Active: 6.8.9-arch1-1
          </div>
          <div className="hidden lg:flex gap-1">
            <div className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 border border-slate-700">LLVM 18.1.0</div>
            <div className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 border border-slate-700 font-mono">rustc 1.78.0</div>
          </div>
          <button
            onClick={startPipelineSimulation}
            disabled={isSimulating}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded border border-orange-700 transition duration-150 active:scale-95"
          >
            {isSimulating ? "Compiling..." : "Compile WIM"}
          </button>
        </div>
      </header>

      {/* Main Control Panel split */}
      <main className="flex-1 flex bg-slate-800 overflow-hidden">
        
        {/* Left Side: System Status & Resources Monitor */}
        <aside className="w-64 bg-slate-950 flex flex-col p-3 gap-3 shrink-0 overflow-y-auto border-r border-slate-850">
          
          {/* Source Image Module */}
          <section className="bg-slate-900 border border-slate-800 rounded p-2.5">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-widest">Selected Image Source</h2>
            <div className="font-mono text-[10px] text-orange-400 break-all leading-normal bg-slate-950 p-2 rounded border border-slate-800">
              /home/user/iso/win11_23h2_pro.iso
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
              <span>WIM Size: 6.42 GB</span>
              <span>Index: 1 (Pro)</span>
            </div>
          </section>

          {/* Validation Preflight */}
          <section className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded p-2.5 gap-2">
            <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Integrity Score</span>
              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                stabilityCheck.isStable ? "text-emerald-400 bg-emerald-950/40" : "text-rose-400 bg-rose-950/40"
              }`}>
                {stabilityCheck.integrityScore}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] bg-emerald-500/10 p-1 rounded border border-emerald-500/20">
                <span className="text-emerald-400">UEFI SecureBoot</span>
                <span className="text-emerald-500 font-bold font-mono">READY</span>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-slate-950 p-1 rounded border border-slate-850">
                <span className="text-slate-400 font-mono text-[10px]">Disk Shrink Estimate</span>
                <span className="text-orange-400 font-bold font-mono">-{stabilityCheck.estimatedSizeDecreaseGb} GB</span>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-slate-950 p-1 rounded border border-slate-850">
                <span className="text-slate-400 font-mono text-[10px]">Perf Boost Predict</span>
                <span className="text-emerald-400 font-bold font-mono">+{stabilityCheck.performanceImprovementPct}%</span>
              </div>
            </div>

            {/* Micro Risks list */}
            <div className="flex-1 flex flex-col gap-1.5 border-t border-slate-850 pt-2.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">System Warnings</span>
              <div className="text-[10.5px] text-slate-400 leading-normal overflow-y-auto space-y-2 max-h-40 pr-1 select-none">
                {stabilityCheck.potentialIssues.map((issue, idx) => (
                  <div key={idx} className="flex gap-1 items-start bg-slate-950/60 p-1.5 rounded border border-slate-850">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Tweak */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-850 text-[10px] text-slate-400 leading-normal">
              <span className="text-orange-400 font-bold">Fix Recommendation:</span> {stabilityCheck.recommendedFixes[0]}
            </div>
          </section>

          {/* Bottom Host Resource Monitor */}
          <section className="bg-slate-900 border border-slate-800 rounded p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Rust Resource Monitor</span>
              <span className="text-[10px] font-mono text-orange-500 font-bold">{isSimulating ? "42.8% CPU" : "1.2% CPU"}</span>
            </div>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300" 
                style={{ width: isSimulating ? "42.8%" : "1.2%" }}
              ></div>
            </div>
          </section>
        </aside>

        {/* Middle Core Content Panel */}
        <section className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* TAB 1: Customize Components to Remove */}
            {activeTab === "customize" && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Component Modification Workspace</h2>
                    <p className="text-[11px] text-slate-500">Pick packages to eliminate from the target deployment ISO</p>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-slate-500">Total Wiped Size: </span>
                    <strong className="text-orange-400 font-mono text-xs">{selectedRemovalMb} MB</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Category Group Left */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-850">
                    <h3 className="text-[10px] font-bold text-orange-500 uppercase mb-1 tracking-widest border-b border-slate-800 pb-1">
                      UWP AppX & Telemetry
                    </h3>
                    <div className="space-y-1.5">
                      {components.filter(c => c.category === "bloatware" || c.category === "telemetry").map((c) => (
                        <label 
                          key={c.id}
                          className={`flex items-start gap-2 text-[11px] p-2 rounded cursor-pointer border transition ${
                            c.checked ? "bg-slate-900 border-orange-500/20 text-slate-205" : "bg-slate-950/40 border-transparent hover:border-slate-800 text-slate-400"
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={c.checked}
                            onChange={() => handleComponentToggle(c.id)}
                            className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between font-medium">
                              <span className="text-slate-100">{c.name}</span>
                              <span className="text-slate-500 font-mono text-[9px] -mt-0.5">-{c.sizeMb}M</span>
                            </div>
                            <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{c.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category Group Right */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-850">
                    <h3 className="text-[10px] font-bold text-orange-500 uppercase mb-1 tracking-widest border-b border-slate-800 pb-1">
                      System Services, Gaming & Security
                    </h3>
                    <div className="space-y-1.5">
                      {components.filter(c => c.category !== "bloatware" && c.category !== "telemetry").map((c) => (
                        <label 
                          key={c.id}
                          className={`flex items-start gap-2 text-[11px] p-2 rounded cursor-pointer border transition ${
                            c.checked ? "bg-slate-900 border-orange-500/20 text-slate-205" : "bg-slate-950/40 border-transparent hover:border-slate-800 text-slate-400"
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={c.checked}
                            onChange={() => handleComponentToggle(c.id)}
                            className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between font-medium">
                              <span className="text-slate-100">{c.name}</span>
                              <span className="text-slate-500 font-mono text-[9px] -mt-0.5">-{c.sizeMb}M</span>
                            </div>
                            <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{c.description}</span>
                            {c.riskScore > 40 && (
                              <span className="text-[9px] text-amber-500 bg-amber-950/50 px-1 py-0.5 rounded inline-block mt-1 font-mono border border-amber-900/30">
                                Warning: Security Critical Package
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Unattended XML Scripting and Setup Checks */}
            {activeTab === "automation" && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Unattended Automation Settings</h2>
                    <p className="text-[11px] text-slate-500">Inject automated settings for offline bypasses of minimum requirements</p>
                  </div>
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-emerald-800/40">
                    Auto-validation: OK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded border border-slate-800">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Default Login Admin User</label>
                      <input 
                        type="text" 
                        value={unattend.username}
                        onChange={(e) => handleUnattendChange("username", e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Host Computer Name</label>
                      <input 
                        type="text" 
                        value={unattend.computerName}
                        onChange={(e) => handleUnattendChange("computerName", e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">System Timezone</label>
                      <select 
                        value={unattend.timezone}
                        onChange={(e) => handleUnattendChange("timezone", e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-orange-500"
                      >
                        <option value="Pacific Standard Time">Pacific Standard Time (UTC-08)</option>
                        <option value="Eastern Standard Time">Eastern Standard Time (UTC-05)</option>
                        <option value="GMT Standard Time">GMT standard Time (UTC+00)</option>
                        <option value="W. Europe Standard Time">Central European Time (UTC+01)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mandatory Bypasses</span>
                      <label className="flex items-center gap-2 text-[10.5px] cursor-pointer text-slate-300">
                        <input 
                          type="checkbox" 
                          checked={unattend.bypassTPM}
                          onChange={(e) => handleUnattendChange("bypassTPM", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded"
                        />
                        Bypass TPM 2.0 validation
                      </label>
                      <label className="flex items-center gap-2 text-[10.5px] cursor-pointer text-slate-300">
                        <input 
                          type="checkbox" 
                          checked={unattend.bypassRAMCheck}
                          onChange={(e) => handleUnattendChange("bypassRAMCheck", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded"
                        />
                        Bypass RAM Check limit (4GB requirement)
                      </label>
                      <label className="flex items-center gap-2 text-[10.5px] cursor-pointer text-slate-300">
                        <input 
                          type="checkbox" 
                          checked={unattend.bypassSecureBoot}
                          onChange={(e) => handleUnattendChange("bypassSecureBoot", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded"
                        />
                        Bypass SecureBoot activation check
                      </label>
                      <label className="flex items-center gap-2 text-[10.5px] cursor-pointer text-slate-300">
                        <input 
                          type="checkbox" 
                          checked={unattend.bypassDiskCheck}
                          onChange={(e) => handleUnattendChange("bypassDiskCheck", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded"
                        />
                        Bypass Hard Disk Capacity minimal checks
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <label className="flex items-center gap-1.5 text-[10.5px] text-slate-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={unattend.autoLogon}
                          onChange={(e) => handleUnattendChange("autoLogon", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded"
                        />
                        Immediate Auto-Login
                      </label>
                      <label className="flex items-center gap-1.5 text-[10.5px] text-slate-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={unattend.enableDeveloperMode}
                          onChange={(e) => handleUnattendChange("enableDeveloperMode", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded"
                        />
                        Enable Developer Mod
                      </label>
                    </div>
                  </div>
                </div>

                {/* XML view container */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active XML Output (Automated Panther Path)</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleCopyText(xmlContent, "unattend")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 rounded flex items-center gap-1 cursor-pointer font-semibold font-mono"
                      >
                        {copyStatus === "unattend" ? "Copied" : "Copy XML"}
                      </button>
                      <button 
                        onClick={() => downloadFile("unattend.xml", xmlContent)}
                        className="px-2 py-0.5 bg-slate-850 hover:bg-slate-800 text-[10px] text-orange-400 border border-slate-700 rounded flex items-center gap-1 cursor-pointer font-semibold font-mono"
                      >
                        Download file
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 bg-black text-emerald-400 border border-slate-850 rounded h-40 overflow-auto font-mono text-[10px] leading-relaxed">
                    {xmlContent}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* TAB 3: OEM Driver Injection */}
            {activeTab === "drivers" && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="border-b border-slate-800 pb-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">OEM Drivers Integration Hub</h2>
                  <p className="text-[11px] text-slate-500">Inject custom third-party storage, network adapters and OEM graphics controllers</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left: Driver list */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Staged Driver Manifest</span>
                    
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 h-[220px] overflow-y-auto space-y-1.5 pr-1">
                      {drivers.length === 0 ? (
                        <div className="text-center text-slate-600 text-[11px] py-12">No drivers staged. Use the panel on the right to append INF definitions.</div>
                      ) : (
                        drivers.map(drv => (
                          <div key={drv.id} className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-orange-400 font-bold">{drv.fileName}</span>
                                <span className="text-[9px] bg-slate-950 px-1 py-0.2 text-slate-400 border border-slate-850 font-semibold">{drv.type}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">{drv.name} — {drv.version}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-500">{drv.sizeKb}KB</span>
                              <button 
                                onClick={() => handleRemoveDriver(drv.id)} 
                                className="text-slate-500 hover:text-rose-500 transition cursor-pointer"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Inject form */}
                  <form onSubmit={handleAddDriver} className="bg-slate-950/40 p-3 rounded border border-slate-800 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Add Stage Pack</span>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase">Package Name</label>
                      <input 
                        type="text" 
                        value={newDriver.name}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-slate-200 rounded outline-none focus:border-orange-500"
                        placeholder="RedHat KVM Disk Controller"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase">INF File</label>
                        <input 
                          type="text" 
                          value={newDriver.fileName}
                          onChange={(e) => setNewDriver(prev => ({ ...prev, fileName: e.target.value }))}
                          className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-slate-200 rounded font-mono outline-none focus:border-orange-500"
                          placeholder="vioscsi.inf"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase">Category</label>
                        <select 
                          value={newDriver.type}
                          onChange={(e) => setNewDriver(prev => ({ ...prev, type: e.target.value }))}
                          className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-slate-350 rounded outline-none"
                        >
                          <option>Network</option>
                          <option>Storage</option>
                          <option>Graphics</option>
                          <option>OEM</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2">
                      <button 
                        type="submit"
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-orange-700 transition"
                      >
                        Append Stage Pack
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* TAB 4: Extensible Rust Engine Panel */}
            {activeTab === "rust" && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-orange-500" />
                      tiny11-rust-engine::LLVM_Core
                    </h2>
                    <p className="text-[11px] text-slate-500 font-sans">Cross-Platform (Linux / macOS / Windows) Rust builder utilizing wimlib APIs for seamless file allocation.</p>
                  </div>
                  <div className="flex gap-1.5 border-l border-slate-800 pl-2.5">
                    <button 
                      onClick={() => downloadFile("main.rs", RUST_MAIN_CODE)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-orange-400 cursor-pointer transition select-none"
                    >
                      get main.rs
                    </button>
                    <button 
                      onClick={() => downloadFile("Cargo.toml", RUST_CARGO_TOML)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-orange-400 cursor-pointer transition select-none"
                    >
                      get Cargo.toml
                    </button>
                    <button 
                      onClick={() => downloadFile("release.yml", RUST_GITHUB_WORKFLOW)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-orange-400 cursor-pointer transition flex items-center gap-1 select-none"
                    >
                      <Github className="h-2.5 w-2.5" />
                      get release.yml
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left Column: Local Compiling Summary */}
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between gap-2">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-450 font-mono tracking-widest border-b border-slate-850 pb-1 flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-orange-500" /> Local Compilation Setup
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Build highly performant native binaries on your home machine to customize installation trees directly without virtualization privileges.
                      </p>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Local Build Command:</span>
                        <code className="block bg-slate-900 p-2 rounded font-mono text-indigo-400 text-[10.5px] border border-slate-850 select-all">
                          cargo build --release
                        </code>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex gap-2 items-center text-[10px] text-slate-500">
                      <Info className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span className="font-sans leading-tight">Requires installing the <code className="text-orange-400 font-mono">wimlib</code> toolkit package.</span>
                    </div>
                  </div>

                  {/* Right Column: GitHub Actions Workflow Release Compilation */}
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between gap-2">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-450 font-mono tracking-widest border-b border-slate-850 pb-1 flex items-center gap-1.5">
                        <Github className="h-3.5 w-3.5 text-orange-400" /> GitHub Actions Core Release Pipeline
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        An integrated, live automated compiling release workflow has been placed inside <code className="text-orange-400 font-mono">.github/workflows/release.yml</code>.
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        When you push code tags starting with <code className="text-orange-400 font-mono">v*</code> (like <code className="text-orange-400 font-mono">v1.0.0</code>) or trigger a build manually, GitHub automatically builds:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-500 ml-1">
                        <span className="flex items-center gap-1">🔹 Win64 (.exe)</span>
                        <span className="flex items-center gap-1">🔹 MacOS ARM64</span>
                        <span className="flex items-center gap-1">🔹 MacOS Intel</span>
                        <span className="flex items-center gap-1">🔹 Linux AMD64</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-emerald-400" /> Auto Release Compiler Pack
                      </span>
                      <button 
                        onClick={() => setShowWorkflowCode(!showWorkflowCode)}
                        className="text-orange-400 font-bold hover:underline select-none cursor-pointer"
                      >
                        {showWorkflowCode ? "Hide Workflow Code" : "Inspect release.yml"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-orange-500/15 text-[10.5px] text-slate-400 leading-normal gap-2 flex items-start">
                  <Sparkles className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="font-sans">
                    With these workflows, you can build installer assemblies and CLI packages simultaneously. Users can download complete releases of each runtime platform installer directly from your repository's Releases page!
                  </span>
                </div>

                {/* Conditional show of github workflow code block or main.rs code display block */}
                {showWorkflowCode ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      <span>.github / workflows / release.yml  — GitHub Actions compiler code</span>
                      <button 
                        onClick={() => handleCopyText(RUST_GITHUB_WORKFLOW, "workflow")}
                        className="text-orange-400 font-bold hover:underline cursor-pointer"
                      >
                        {copyStatus === "workflow" ? "Copied" : "Copy Buffer"}
                      </button>
                    </div>
                    <pre className="p-3 bg-black text-slate-300 font-mono text-[10px] border border-slate-850 h-56 overflow-y-auto leading-relaxed rounded selection:bg-orange-600/30">
                      {RUST_GITHUB_WORKFLOW}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      <span>Src / main.rs — Core implementation code</span>
                      <button 
                        onClick={() => handleCopyText(RUST_MAIN_CODE, "rust")}
                        className="text-orange-400 font-bold hover:underline"
                      >
                        {copyStatus === "rust" ? "Copied" : "Copy Buffer"}
                      </button>
                    </div>
                    <pre className="p-3 bg-black text-slate-300 font-mono text-[10px] border border-slate-850 h-56 overflow-y-auto leading-relaxed rounded selection:bg-orange-600/30">
                      {RUST_MAIN_CODE}
                    </pre>
                  </div>
                )}

                {/* Compiler read-me guidance */}
                <div className="bg-slate-950 p-4 rounded-md border border-slate-800 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-2 gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest flex items-center gap-1.5 select-none">
                      <FileCode className="h-4 w-4 text-orange-500" /> README.md Comprehensive User Documentation
                    </span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                      <button
                        onClick={() => setDocTab("manual")}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-semibold transition cursor-pointer select-none ${
                          docTab === "manual" ? "bg-orange-600 text-white font-bold" : "text-slate-450 hover:text-slate-200"
                        }`}
                      >
                        1. MiniWinstall Manual
                      </button>
                      <button
                        onClick={() => setDocTab("rust")}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-semibold transition cursor-pointer select-none ${
                          docTab === "rust" ? "bg-orange-600 text-white font-bold" : "text-slate-450 hover:text-slate-200"
                        }`}
                      >
                        2. Rust Core CLI
                      </button>
                      <button
                        onClick={() => setDocTab("cicd")}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-semibold transition cursor-pointer select-none ${
                          docTab === "cicd" ? "bg-orange-600 text-white font-bold" : "text-slate-450 hover:text-slate-200"
                        }`}
                      >
                        3. GitHub CI/CD Action
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: MiniWinstall General Manual */}
                  {docTab === "manual" && (
                    <div className="text-[11px] text-slate-400 leading-relaxed font-sans space-y-3">
                      <div className="bg-slate-900/50 p-3 rounded border border-slate-800/40">
                        <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-orange-400" /> Executive Description & Architecture
                        </h4>
                        <p>
                          <strong>MiniWinstall</strong> is an in-browser dashboard combined with a high-performance **native Rust optimizer CLI**. It allows power users, system operators, and developers to trim the Windows 11 installation footprint by eliminating bulk UWP packages, embedded system trackers, gaming accessories, and telemetry hooks prior to network deployment.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <h5 className="font-bold text-slate-250 uppercase text-[10px] font-mono mb-1 text-orange-400">🔥 Core Features & Workflows:</h5>
                          <ul className="space-y-1.5 list-none">
                            <li className="flex items-start gap-1">
                              <span className="text-orange-500 font-mono">▸</span>
                              <span><strong>Strip Packages Tab:</strong> Eliminates telemetry, default bloatware, Xbox frameworks, and Edge to decrease the footprint by up to 14 GB.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-orange-500 font-mono">▸</span>
                              <span><strong>Unattended Setup XML:</strong> Fully script auto-login keys, developer modes, offline local accounts, and bypass Win11 hardware barriers.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-orange-500 font-mono">▸</span>
                              <span><strong>OEM Driver Injector:</strong> Pack virtual SCSI storage disk drivers (.INF / .SYS) or high-speed wireless protocols direct in boot tables.</span>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-bold text-slate-250 uppercase text-[10px] font-mono mb-1 text-orange-400">🔥 Burning and Deployment:</h5>
                          <ul className="space-y-1.5 list-none">
                            <li className="flex items-start gap-1">
                              <span className="text-orange-500 font-mono">▸</span>
                              <span><strong>Direct USB Flasher:</strong> Configure Rufus-style write operations. Setup GPT/MBR partition boundaries, volume labels, and formatted file structures (NTFS/FAT32).</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-orange-500 font-mono">▸</span>
                              <span><strong>Compilation Simulator:</strong> Test build processes in real-time in the secure environment shell log tracer before running physical commands.</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850 text-[10px] flex justify-between items-center mt-1">
                        <span className="text-slate-500">Need the full raw documentation file for your git repo root?</span>
                        <button
                          onClick={() => downloadFile("README.md", RUST_README)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded font-semibold text-orange-400 font-mono text-[10px] transition cursor-pointer select-none"
                        >
                          Download complete README.md
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Local CLI Tool Guide */}
                  {docTab === "rust" && (
                    <div className="text-[11px] text-slate-400 leading-relaxed font-sans space-y-3">
                      <div>
                        <h4 className="font-bold text-slate-200 mb-1">🔧 Compiling the Native Rust CLI Engine Locally</h4>
                        <p>The native Rust optimizer uses zero-overhead memory operations to dissect, mount, and restructure `.WIM` cabinets. Unlike Microsoft ADK packages, our compiled Rust core leverages unprivileged user-space manipulation through the cross-platform <code className="text-orange-400 font-mono">wimlib</code> APIs.</p>
                      </div>

                      <div className="space-y-1 bg-slate-900 p-2.5 rounded border border-slate-850 font-mono text-[10.5px]">
                        <p className="font-bold text-slate-300 select-none"># Install Wimlib & Rust tools depending on OS:</p>
                        <p className="text-slate-450 select-none">// Arch Linux:</p>
                        <code className="text-indigo-400 select-all block">sudo pacman -S wimlib</code>
                        <p className="text-slate-450 select-none">// Ubuntu & Debian Linux:</p>
                        <code className="text-indigo-400 select-all block">sudo apt install wimtools</code>
                        <p className="text-slate-450 select-none">// MacOS (Apple Silicon or Intel):</p>
                        <code className="text-indigo-400 select-all block">brew install wimlib</code>
                        <p className="text-slate-450 select-none">// Once tools are active, compile via Cargo:</p>
                        <code className="text-indigo-400 select-all block">cargo build --release</code>
                      </div>

                      <div className="space-y-1.5">
                        <h5 className="font-bold text-slate-350 select-none text-[10px] tracking-wide uppercase font-mono">Executing local customizations:</h5>
                        <code className="block bg-slate-950 p-2 rounded border border-slate-850 font-mono text-[10px] text-orange-400 selection:bg-orange-800/30 whitespace-pre-wrap">
  {`./target/release/mini-winstall-engine \\
  --wim-path "/path/to/sources/install.wim" \\
  --index 1 \\
  --unattend-path "./unattend.xml" \\
  --drivers-dir "/path/to/my/manufacture_drivers"`}
                        </code>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: CI/CD Pipeline Flow */}
                  {docTab === "cicd" && (
                    <div className="text-[11px] text-slate-400 leading-relaxed font-sans space-y-2.5">
                      <div>
                        <h4 className="font-bold text-slate-205 mb-1 flex items-center gap-1.5 text-xs font-mono">
                          <Github className="h-3.5 w-3.5 text-orange-400" /> Automated GitHub CI/CD Compiling Blueprint
                        </h4>
                        <p>
                          To completely bypass home system compilation requirements, an optimized CI/CD workflow is provided inside your repository folder structure at <code className="text-orange-405 font-mono">.github/workflows/release.yml</code>.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                        <div className="bg-slate-900/30 p-2 border border-slate-850 rounded">
                          <span className="font-bold block text-slate-300 text-[10.5px]">1. Tag Release Trigger</span>
                          <span className="text-[10px] text-slate-500 leading-normal block mt-1">Pushing any tag beginning with <code className="text-orange-400">v*</code>, like <code className="text-orange-400">v1.2.0</code> automatically spins up cross-platform runner agents globally.</span>
                        </div>
                        <div className="bg-slate-900/30 p-2 border border-slate-850 rounded">
                          <span className="font-bold block text-slate-300 text-[10.5px]">2. Cross-Compilation</span>
                          <span className="text-[10px] text-slate-500 leading-normal block mt-1">Runner machines on Windows Latest, Carbon Ubuntu, and macOS run isolated cargo tasks targeting static libraries and musl architectures.</span>
                        </div>
                        <div className="bg-slate-900/30 p-2 border border-slate-850 rounded">
                          <span className="font-bold block text-slate-300 text-[10.5px]">3. Release Artifact Delivery</span>
                          <span className="text-[10px] text-slate-500 leading-normal block mt-1">Ready compiled binaries for Windows, macOS Silicon, macOS Intel, and Linux are uploaded and mapped to your GitHub repository Releases pane automatically!</span>
                        </div>
                      </div>

                      <div className="pt-1 select-none flex items-center gap-2 text-slate-500 font-mono text-[9.5px]">
                        <Info className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                        <span>All environment cryptographic signatures are handled autonomously in secure runner sandboxes.</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 5: Live Compilation Simulation Terminal */}
            {activeTab === "simulate" && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Terminal Shell Pipe Trace</h2>
                    <p className="text-[11px] text-slate-500">Simulate and track the output from LLVM cargo deployment scripts</p>
                  </div>
                  <div className="flex gap-2">
                    {isSimulating ? (
                      <button 
                        onClick={stopPipelineSimulation}
                        className="bg-rose-900 border border-rose-700 px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-rose-800 rounded font-mono text-white cursor-pointer"
                      >
                        Abort
                      </button>
                    ) : (
                      <button 
                        onClick={startPipelineSimulation}
                        className="bg-orange-600 border border-orange-700 px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-orange-500 rounded font-mono text-white cursor-pointer shadow-md shadow-orange-900/10"
                      >
                        Trigger Pipeline
                      </button>
                    )}
                    <button 
                      onClick={() => { setSimLogs([]); setSimProgress(0); }}
                      disabled={isSimulating}
                      className="bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] uppercase hover:bg-slate-700 font-mono text-slate-400 rounded disabled:opacity-40"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-2 text-xs text-slate-450 rounded border border-slate-800">
                  <div className="flex justify-between text-[11px] mb-1 font-mono text-slate-400">
                    <span>Compilation stage</span>
                    <span>{simProgress}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full transition-all duration-300"
                      style={{ width: `${simProgress}%` }}
                    />
                  </div>
                </div>

                {/* Shell emulator window output preview style */}
                <div className="bg-black text-slate-350 p-3 h-64 overflow-y-auto block rounded border border-slate-850 font-mono text-[10.5px] leading-relaxed flex flex-col gap-1.5 selection:bg-orange-600/30">
                  {simLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-20 flex flex-col items-center">
                      <span>_ STDOUT_PIPE STABLE</span>
                      <span className="text-[10px] text-slate-700 mt-1">Press "Trigger Pipeline" or "Compile WIM" to monitor active syscall routines.</span>
                    </div>
                  ) : (
                    simLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex gap-3 leading-normal start-alignment ${
                          log.level === "success" ? "text-emerald-400" 
                          : log.level === "warn" ? "text-amber-400 font-semibold" 
                          : log.level === "error" ? "text-rose-400 font-extrabold" 
                          : "text-slate-300"
                        }`}
                      >
                        <span className="text-[9px] text-slate-650 opacity-40 shrink-0 font-bold select-none">{log.timestamp}</span>
                        <span>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 6: USB Flashing & Bypass Integration Panel */}
            {activeTab === "usb" && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
                      <Usb className="h-3.5 w-3.5 text-orange-500" />
                      Direct UEFI/BIOS Write-to-USB Engine
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Configure Rufus-style parameters to burn your customized MiniWinstall ISO image directly to flash media.
                    </p>
                  </div>
                  <span className="bg-orange-950/20 text-orange-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-orange-850">
                    Dual BIOS/UEFI Mode Active
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Left Column: Rufus-Style settings UI mockup */}
                  <div className="bg-slate-950 p-3 rounded-md border border-slate-800 flex flex-col gap-3.5">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block border-b border-slate-850 pb-1">
                      Drive properties & specifications
                    </span>

                    <div className="space-y-3">
                      {/* Target USB drive */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 flex justify-between">
                          <span>Target Device</span>
                          <span className="text-[9px] text-slate-500 normal-case select-none">Must be formatted FAT32/NTFS</span>
                        </label>
                        <select 
                          value={usbDrive}
                          onChange={(e) => setUsbDrive(e.target.value)}
                          className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none w-full focus:border-orange-500"
                          disabled={isFlashing}
                        >
                          {USB_DRIVES.map(drv => (
                            <option key={drv.value} value={drv.value}>{drv.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Partition scheme & Target System types */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Partition Scheme</label>
                          <select 
                            value={usbPartitionScheme}
                            onChange={(e) => {
                              setUsbPartitionScheme(e.target.value);
                              // Auto sync target system type
                              if (e.target.value === "GPT") setUsbTargetSystem("UEFI (non CSM)");
                              else setUsbTargetSystem("BIOS (or UEFI-CSM)");
                            }}
                            className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none shadow-sm shadow-black"
                            disabled={isFlashing}
                          >
                            <option value="GPT">GPT</option>
                            <option value="MBR">MBR</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Target System</label>
                          <select 
                            value={usbTargetSystem}
                            onChange={(e) => setUsbTargetSystem(e.target.value)}
                            className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none"
                            disabled={isFlashing}
                          >
                            <option value="UEFI (non CSM)">UEFI (non CSM)</option>
                            <option value="BIOS (or UEFI-CSM)">BIOS (or UEFI-CSM)</option>
                          </select>
                        </div>
                      </div>

                      {/* File System & Volume Label */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">File System</label>
                          <select 
                            value={usbFileSystem}
                            onChange={(e) => setUsbFileSystem(e.target.value)}
                            className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none"
                            disabled={isFlashing}
                          >
                            <option value="NTFS">NTFS</option>
                            <option value="FAT32">FAT32</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">New Volume Label</label>
                          <input 
                            type="text"
                            value={usbVolumeLabel}
                            onChange={(e) => setUsbVolumeLabel(e.target.value)}
                            className="bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded font-mono outline-none focus:border-orange-500"
                            placeholder="MINI_WIN11"
                            disabled={isFlashing}
                          />
                        </div>
                      </div>

                      {/* Mini Warning/Guidance Box */}
                      <div className="bg-slate-900/40 p-2.5 rounded border border-slate-850 text-[10px] text-slate-400 leading-normal gap-2 flex">
                        <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                        <span>
                          {usbFileSystem === "FAT32" 
                            ? "FAT32 limits the install.wim size to 4GB. The MiniWinstall flashing pipeline will automatically slice your WIM clusters if it grows beyond this threshold." 
                            : "NTFS is selected. Ideal for large system images. Dual-mode UEFI boot files will be mapped in a small hidden FAT32 partition to respect SecureBoot requirements."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Custom Windows User Experience bypass options (Rufus parameters) */}
                  <div className="bg-slate-950 p-3 rounded-md border border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block border-b border-slate-850 pb-1 mb-2">
                        Rufus Windows User Experience (Bypasses)
                      </span>

                      <div className="space-y-2">
                        <label className="flex items-start gap-2.5 text-[11px] text-slate-350 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={usbBypasses.bypassTPM}
                            onChange={(e) => handleUsbBypassChange("bypassTPM", e.target.checked)}
                            className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded mt-0.5"
                            disabled={isFlashing}
                          />
                          <div>
                            <span className="font-bold text-slate-200 block">Remove Win11 RAM, Secure Boot & TPM 2.0 Limits</span>
                            <span className="text-[10px] text-slate-500 leading-normal">Allows installing on legacy hardware that lacks dedicated cryptographic modules.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 text-[11px] text-slate-350 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={usbBypasses.skipOnlineAccount}
                            onChange={(e) => handleUsbBypassChange("skipOnlineAccount", e.target.checked)}
                            className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded mt-0.5"
                            disabled={isFlashing}
                          />
                          <div>
                            <span className="font-bold text-slate-200 block">Remove Online Microsoft Account Obligation</span>
                            <span className="text-[10px] text-slate-500 leading-normal">Bypasses OOBE requirement to create or sign in with an online email. Creates local user "{unattend.username}".</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 text-[11px] text-slate-350 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={usbBypasses.disableBitLocker}
                            onChange={(e) => handleUsbBypassChange("disableBitLocker", e.target.checked)}
                            className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded mt-0.5"
                            disabled={isFlashing}
                          />
                          <div>
                            <span className="font-bold text-slate-200 block">Disable Automatic BitLocker Device Encryption</span>
                            <span className="text-[10px] text-slate-500 leading-normal">Prevents Windows from locking drives behind auto-generated keys immediately after install.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 text-[11px] text-slate-350 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={usbBypasses.skipPrivacyQuestions}
                            onChange={(e) => handleUsbBypassChange("skipPrivacyQuestions", e.target.checked)}
                            className="w-3.5 h-3.5 accent-orange-600 bg-slate-800 border-slate-700 rounded mt-0.5"
                            disabled={isFlashing}
                          />
                          <div>
                            <span className="font-bold text-slate-200 block">Disable Privacy & Data Collection Prompts</span>
                            <span className="text-[10px] text-slate-500 leading-normal">Sets all setup privacy configuration sliders to "Off" by default and hides respective setup panes.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Flashing progress indicators/action */}
                    <div className="bg-slate-900/30 p-2 border border-slate-850 rounded flex gap-3 items-center mt-2.5">
                      {isFlashing ? (
                        <button 
                          type="button"
                          onClick={stopUsbFlashing}
                          className="bg-rose-900 text-white font-mono uppercase text-[10px] hover:bg-rose-800 px-3 py-2 rounded font-bold border border-rose-700 tracking-wider shrink-0 transition"
                        >
                          Abort Flash
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={startUsbFlashing}
                          className="bg-orange-600 text-white font-mono uppercase text-[10px] hover:bg-orange-500 px-3.5 py-2 rounded font-bold border border-orange-700 tracking-widest shrink-0 transition"
                        >
                          Start Flashing
                        </button>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between font-mono text-[9.5px] text-slate-400 mb-1 leading-none">
                          <span className="font-semibold uppercase tracking-wider">{isFlashing ? "Writing Sector Cycles..." : "Ready to Burn ISO"}</span>
                          <span>{usbFlashingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-orange-500 h-full transition-all duration-300"
                            style={{ width: `${usbFlashingProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated low level flasher output trace console */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Low-level block write trace (sector logging)
                  </span>
                  <div className="bg-black text-slate-350 p-2.5 h-44 overflow-y-auto block rounded border border-slate-850 font-mono text-[10px] leading-relaxed flex flex-col gap-1 selection:bg-orange-600/30">
                    {usbLogs.length === 0 ? (
                      <div className="text-slate-650 text-center py-12 flex flex-col items-center select-none font-sans">
                        <Terminal className="h-5 w-5 text-slate-700 mb-1" />
                        <span>FLASHER_BLOCK_STORAGE_INTERFACE STATUS: IDEAL</span>
                        <span className="text-[9.5px] text-slate-700 mt-0.5">Click "Start Flashing" to format drive and burn configured ISO filesystems.</span>
                      </div>
                    ) : (
                      usbLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className={`flex gap-3 leading-normal items-start ${
                            log.level === "success" ? "text-emerald-400" 
                            : log.level === "warn" ? "text-amber-400 font-semibold" 
                            : log.level === "error" ? "text-rose-400 font-bold" 
                            : "text-slate-300"
                          }`}
                        >
                          <span className="text-[8.5px] text-slate-650 opacity-40 shrink-0 font-bold select-none">{log.timestamp}</span>
                          <span>{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* Micro Console Output Preview at bottom of core workspace */}
          <div className="h-16 shrink-0 bg-black border-t border-slate-800/80 p-2 font-mono text-[10px] text-slate-500 overflow-hidden select-none flex flex-col justify-end">
            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>[INFO] Native compilation target active on host filesystem</span>
            </div>
            <div className="text-slate-600 text-[9px] leading-relaxed truncate">
              {isSimulating && simLogs.length > 0 
                ? `[SYS_TRACE] ${simLogs[simLogs.length - 1].message}` 
                : "[DEBUG] syscall::fadvise used for optimized system stream IO read-write throughputs..."}
            </div>
          </div>
        </section>

        {/* Right Action Icons Panel strip */}
        <aside className="w-12 bg-slate-950 flex flex-col items-center py-4 gap-4 border-l border-slate-850 shrink-0 select-none">
          <button 
            title="Compile ISO" 
            onClick={startPipelineSimulation}
            disabled={isSimulating}
            className="w-8 h-8 rounded bg-orange-600 hover:bg-orange-500 disabled:bg-slate-900 disabled:text-slate-700 hover:rotate-12 transition-all flex items-center justify-center text-white cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4" />
          </button>
          
          <button 
            title="Bypasses configuration" 
            onClick={() => setActiveTab("automation")}
            className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-orange-400 transition"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button 
            title="Download Custom UNATTEND XML" 
            onClick={() => downloadFile("unattend.xml", xmlContent)}
            className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="mt-auto flex flex-col items-center gap-2">
            <div className="w-1 h-16 bg-slate-850 rounded-full flex flex-col justify-end overflow-hidden">
              <div 
                className="w-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ height: isSimulating ? `${simProgress}%` : "15%" }}
              ></div>
            </div>
            <span className="text-[7.5px] text-slate-600 font-mono tracking-widest uppercase rotate-90 mb-4 whitespace-nowrap">Core State</span>
          </div>
        </aside>

      </main>

      {/* Bottom Status Footers Bar */}
      <footer className="h-6 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0 font-mono">
        <div className="flex gap-4">
          <span>PLATFORM: LINUX_X64 (ARCH_MUTEX_ENGINE)</span>
          <span className="text-slate-800">|</span>
          <span>EST_WIM_OPTIMIZATION_TIME: 142s</span>
        </div>
        <div className="flex items-center gap-3">
          <span>COMPRESSION: LZX (High)</span>
          <span className="text-orange-500 font-bold">BUILD READY</span>
        </div>
      </footer>
    </div>
  );
}
