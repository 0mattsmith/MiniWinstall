import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to safely get the Gemini API client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    return null;
  }
}

// REST API Endpoints

// 1. Generate customized unattend.xml using Gemini 3.5 Flash (or generic backup)
app.post("/api/gemini/generate-unattend", async (req, res) => {
  const config = req.body;
  const username = config.username || "Admin";
  const computerName = config.computerName || "Tiny11-PC";
  const bypassTPM = !!config.bypassTPM;
  const bypassRAMCheck = !!config.bypassRAMCheck;
  const bypassSecureBoot = !!config.bypassSecureBoot;
  const bypassDiskCheck = !!config.bypassDiskCheck;
  const skipOOBE = !!config.skipMicrosoftAccount;
  const devMode = !!config.enableDeveloperMode;
  const autoLogon = !!config.autoLogon;
  const timezone = config.timezone || "Pacific Standard Time";

  // Check if Gemini is configured to generate high-fidelity tailored notes/tweaks
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Generate a standard, fully copyable Windows 11 Unattend XML (unattend.xml) setup configuration based on these configurations:
- Local Admin account name: "${username}"
- Computer name: "${computerName}"
- Bypass TPM 2.0 requirements: ${bypassTPM}
- Bypass RAM requirements: ${bypassRAMCheck}
- Bypass SecureBoot requirements: ${bypassSecureBoot}
- Bypass Disk Check: ${bypassDiskCheck}
- Skip OOBE / Microsoft Account / Online requirement: ${skipOOBE}
- Enable Developer Mode: ${devMode}
- Auto Logon enabled: ${autoLogon}
- Target Timezone: "${timezone}"

Provide raw, clean XML code for Windows setup within a standard XML structure. It must include the standard settings and commands to create local administrators, configure bypasses in Setup, and adjust Windows preferences. Include helpful inline XML comments indicating what each portion does.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      // Extract XML block if returned with markdown backticks
      let cleanXml = text;
      const xmlMatch = text.match(/```xml([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
      if (xmlMatch) {
        cleanXml = xmlMatch[1].trim();
      }

      return res.json({ xml: cleanXml, source: "gemini" });
    } catch (err: any) {
      console.log("Serving local static unattend.xml fallback due to Gemini rate limits or connection state.");
    }
  }

  // Backup static generator if Gemini API key is missing or fails
  const staticXml = `<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
  <settings pass="windowsPE">
    <component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <UserData>
        <ProductKey>
          <Key></Key>
          <WillShowUI>OnError</WillShowUI>
        </ProductKey>
        <AcceptEula>true</AcceptEula>
      </UserData>
      <RunSynchronous>
        <!-- Custom Registry Bypasses for Hardware Verification -->
        ${bypassTPM ? `<RunSynchronousCommand wcm:action="add">
          <Order>1</Order>
          <Path>cmd.exe /c reg add "HKLM\\SYSTEM\\Setup\\LabConfig" /v BypassTPMCheck /t REG_DWORD /d 1 /f</Path>
          <Description>Bypass TPM 2.0 Checks</Description>
        </RunSynchronousCommand>` : ""}
        ${bypassSecureBoot ? `<RunSynchronousCommand wcm:action="add">
          <Order>2</Order>
          <Path>cmd.exe /c reg add "HKLM\\SYSTEM\\Setup\\LabConfig" /v BypassSecureBootCheck /t REG_DWORD /d 1 /f</Path>
          <Description>Bypass Secure Boot Verification</Description>
        </RunSynchronousCommand>` : ""}
        ${bypassRAMCheck ? `<RunSynchronousCommand wcm:action="add">
          <Order>3</Order>
          <Path>cmd.exe /c reg add "HKLM\\SYSTEM\\Setup\\LabConfig" /v BypassRAMCheck /t REG_DWORD /d 1 /f</Path>
          <Description>Bypass RAM Size Requirements</Description>
        </RunSynchronousCommand>` : ""}
        ${bypassDiskCheck ? `<RunSynchronousCommand wcm:action="add">
          <Order>4</Order>
          <Path>cmd.exe /c reg add "HKLM\\SYSTEM\\Setup\\LabConfig" /v BypassStorageCheck /t REG_DWORD /d 1 /f</Path>
          <Description>Bypass Storage Capacity Checks</Description>
        </RunSynchronousCommand>` : ""}
      </RunSynchronous>
    </component>
  </settings>
  <settings pass="oobeSystem">
    <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <OOBE>
        <HideEULAPage>true</HideEULAPage>
        <HideOEMRegistrationScreen>true</HideOEMRegistrationScreen>
        <HideOnlineAccountScreens>${skipOOBE ? "true" : "false"}</HideOnlineAccountScreens>
        <HideWirelessSetupInOOBE>true</HideWirelessSetupInOOBE>
        <NetworkLocation>Work</NetworkLocation>
        <ProtectYourPC>3</ProtectYourPC>
      </OOBE>
      <UserAccounts>
        <LocalAccounts>
          <LocalAccount wcm:action="add">
            <Password>
              <Value></Value>
              <PlainText>true</PlainText>
            </Password>
            <Description>Tiny11 Custom Administrator Account</Description>
            <DisplayName>${username}</DisplayName>
            <Group>Administrators</Group>
            <Name>${username}</Name>
          </LocalAccount>
        </LocalAccounts>
      </UserAccounts>
      ${autoLogon ? `<AutoLogon>
        <Password>
          <Value></Value>
          <PlainText>true</PlainText>
        </Password>
        <Enabled>true</Enabled>
        <LogonCount>999</LogonCount>
        <Username>${username}</Username>
      </AutoLogon>` : ""}
      <TimeZone>${timezone}</TimeZone>
      <ComputerName>${computerName}</ComputerName>
    </component>
  </settings>
</unattend>`;

  res.json({ xml: staticXml.trim(), source: "local" });
});

// 2. Perform advanced feature removal analysis and stability report using Gemini
app.post("/api/gemini/analyze-components", async (req, res) => {
  const { removedComponents, unattendConfig, drivers } = req.body;
  const componentNames = (removedComponents || []).map((c: any) => `${c.name} (${c.category})`);

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Act as an expert Windows Deployment and image engineering (WIM/DISM) specialist.
Review the following planned Tiny11 modification profile:
- Components selected for removal:
${componentNames.map((name: string) => `  * ${name}`).join("\n")}
- Drivers to inject:
${(drivers || []).map((d: any) => `  * ${d.name} (${d.type})`).join("\n")}
- Setup configurations:
  * Username: ${unattendConfig?.username}
  * Bypass TPM: ${unattendConfig?.bypassTPM}
  * Bypass Defender: ${componentNames.some((n: string) => n.toLowerCase().includes("defender"))}

Analyze the deployment profile and provide a structured JSON response with:
1. "integrityScore": An overall deployment safety score from 0 to 100 based on removal risks.
2. "isStable": Boolean. Are there conflicting removals (like removing App Store while expecting Windows updates, or removing Defender without secondary controls)?
3. "potentialIssues": Array of specific system stability issues or app crash warnings. Recommended fixes or warnings about VM performance.
4. "recommendedFixes": Array of suggested build tweaks or dependencies to restore.
5. "estimatedSizeDecreaseGb": A real estimated size reduction (such as 3.2 GB).
6. "performanceImprovementPct": Expected CPU/RAM reduction percentage.

Your output must be strictly in clean JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsedAnalysis = JSON.parse(responseText.trim());
      return res.json({ analysis: parsedAnalysis, source: "gemini" });
    } catch (err: any) {
      console.log("Serving local stability profile fallback due to Gemini rate limits or connection state.");
    }
  }

  // Local calculation framework in case Gemini fails or is not connected
  let integrityScore = 100;
  let sizeSavings = 0;
  let perfBonus = 0;
  const issues: string[] = [];
  const fixes: string[] = [];

  const removalsList = componentNames.map((n: string) => n.toLowerCase());

  if (removalsList.some((n: string) => n.includes("defender"))) {
    integrityScore -= 18;
    issues.push("Security risk raised: Windows Defender is removed. Realtime host malware scan will be inactive.");
    fixes.push("Substitute with an anti-virus solution post-deployment or use on fully air-gapped sandboxed virtual machines.");
  }
  if (removalsList.some((n: string) => n.includes("edge"))) {
    integrityScore -= 12;
    issues.push("WSA & System protocol binding: No default web browser present for web hyperlinks.");
    fixes.push("Inject standalone browser setup executable (e.g. Firefox Installer or Chromium) using custom plugins post-install.");
  }
  if (removalsList.some((n: string) => n.includes("telemetry") || n.includes("diagnostics"))) {
    integrityScore -= 5;
    perfBonus += 15;
    fixes.push("Excellent reduction in diagnostic overhead! Reduces background VM memory consumption by ~180MB RAM.");
  }
  if (removalsList.some((n: string) => n.includes("bloatware"))) {
    integrityScore -= 2;
    sizeSavings += 1.4;
    perfBonus += 4;
  }
  if (removalsList.some((n: string) => n.includes("gaming") || n.includes("xbox"))) {
    integrityScore -= 5;
    issues.push("Gaming subsystem elements missing: Xbox controllers or Store login capabilities will require manual registry repairs.");
    fixes.push("Retain Xbox Game Bar components if targeting steam or controller gaming setups.");
  }

  // Base estimations
  sizeSavings = Math.max(0.8, Number((sizeSavings + (removalsList.length * 0.45)).toFixed(2)));
  perfBonus = Math.max(5, Math.min(45, Math.round(perfBonus + (removalsList.length * 2.5))));
  integrityScore = Math.max(30, integrityScore);

  res.json({
    analysis: {
      integrityScore,
      isStable: integrityScore >= 70,
      potentialIssues: issues.length > 0 ? issues : ["None computed! The current selection is safe for generic deployment."],
      recommendedFixes: fixes.length > 0 ? fixes : ["No additional patches suggested."],
      estimatedSizeDecreaseGb: sizeSavings,
      performanceImprovementPct: perfBonus,
    },
    source: "local",
  });
});

// 3. Simulated logs streaming API simulation
app.post("/api/simulate-builder", (req, res) => {
  const { removedComponents, unattendConfig, drivers, plugins, isoPath, sandboxPath } = req.body;
  const steps = [
    { delay: 1000, message: "[INFO] Initializing Windows Tiny 11 Rust Customizer Image Pipeline..." },
    { delay: 2000, message: `[INFO] Image source: Loaded "${isoPath || "C:\\Users\\TinyPC\\Downloads\\Win11_23H2_English_x64.iso"}"` },
    { delay: 3000, message: `[INFO] Unpacking and sandbox workspace: "${sandboxPath || "C:\\MiniWinstall\\Sandbox"}"` },
    { delay: 3800, message: "[SUCCESS] Rust core workspace parsed. Native bindings to LLVM initialized." },
    { delay: 4800, message: "[INFO] Extracting boot files & catalog index structures..." },
    { delay: 5800, message: `[INFO] Generating customized unattended XML configuration... OK` },
    ...((removedComponents || []).map((comp: any, idx: number) => {
      return {
        delay: 8200 + (idx * 1100),
        message: `[SUCCESS] Applying component removal plugin: Deleting modern app package -> ${comp.name} (${comp.sizeMb}MB).`
      };
    })),
    { delay: 14000, message: "[INFO] Processing Driver Injection package queue..." },
    ...((drivers || []).map((drv: any, idx: number) => {
      return {
        delay: 15100 + (idx * 900),
        message: `[SUCCESS] Active driver injected into WinPE/offline registry: Inoculating ${drv.name} (${drv.type}, ${drv.sizeKb}KB).`
      };
    })),
    ...((plugins || []).map((plug: any, idx: number) => {
      return {
        delay: 18000 + (idx * 1200),
        message: `[INFO] Execution of Custom Plugin Hooks [${plug.trigger}]: Running "${plug.name}"... Successfully run.`
      };
    })),
    { delay: 20500, message: "[INFO] Performing post-modification verification checklist..." },
    { delay: 22000, message: "[INFO] Rebuilding the compressed WIM archive file... Compression factor: LZX (High)" },
    { delay: 23500, message: "[SUCCESS] Master boot records modified. ISO-9660 container generated: tiny11_custom_boot.iso" },
    { delay: 24500, message: "[SUCCESS] Validation Passed! Integrity verification stable. File size: 3.12GB (Original: 5.48GB)." }
  ];

  res.json({ steps });
});

// Serve frontend in production, or mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Windows Tiny 11 Builder backend is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
