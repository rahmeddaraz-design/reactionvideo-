import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Monitor, 
  Smartphone, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Wifi, 
  Layers,
  Package,
  PlayCircle,
  FolderDown,
  Sparkles
} from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'github-exe' | 'windows' | 'termux' | 'lan'>('github-exe');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const windowsBatScript = `@echo off
echo ===================================================
echo     Ahmed Reaction Studio - Windows Launcher
echo ===================================================
echo Checking dependencies...

REM Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required. Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo Installing studio dependencies...
    call npm install
)

echo Starting Ahmed Reaction Studio on port 3000...
start "" http://localhost:3000
call npm run dev -- --host 0.0.0.0 --port 3000
pause
`;

  const termuxShScript = `#!/data/data/com.termux/files/usr/bin/bash
# ===================================================
#     Ahmed Reaction Studio - Android Termux Launcher
# ===================================================

echo ">> Preparing Ahmed Reaction Studio on Termux..."

# Update packages and install nodejs
pkg update -y
pkg install -y nodejs

# Verify directory and install node modules
if [ ! -d "node_modules" ]; then
    echo ">> Installing studio packages..."
    npm install
fi

# Detect Local Wi-Fi IP address
WIFI_IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}')
if [ -z "$WIFI_IP" ]; then
    WIFI_IP="localhost"
fi

echo "==================================================="
echo "  Studio is starting!"
echo "  Open in Mobile Chrome on this phone:"
echo "  --> http://localhost:3000"
echo ""
echo "  Or open from laptop/tablet on same Wi-Fi:"
echo "  --> http://$WIFI_IP:3000"
echo "==================================================="

# Open in default Android Chrome browser
termux-open-url http://localhost:3000 2>/dev/null || true

# Start Vite dev server bound to all interfaces
npm run dev -- --host 0.0.0.0 --port 3000
`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Windows &amp; Termux Local Deployment Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('github-exe')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'github-exe'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Windows .EXE (GitHub Actions)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('termux')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'termux'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Termux</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'windows'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows (Dev Server)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lan')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'lan'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi / LAN Access</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300">
          {activeTab === 'github-exe' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-300">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-400">
                  <Package className="w-4 h-4" />
                  <span>Automated GitHub Actions Windows .EXE Workflow Included</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-200/90">
                  The project includes an automated GitHub Actions CI/CD workflow at <code className="font-mono text-white bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/30">.github/workflows/build-exe.yml</code>. Whenever you push to GitHub or trigger it manually, GitHub automatically compiles the web app and packages standalone Windows <strong>.exe</strong> binaries ready to download!
                </p>
              </div>

              {/* Two formats generated */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>1. NSIS Installer (.exe)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <code className="text-emerald-300 font-mono">Ahmed-Reaction-Studio-1.0.0-Windows-x64.exe</code>
                    <br />
                    Standard Windows installer that creates desktop &amp; Start menu shortcuts.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>2. Portable Standalone (.exe)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <code className="text-sky-300 font-mono">Ahmed-Reaction-Studio-1.0.0-Windows-x64-portable.exe</code>
                    <br />
                    Single executable that runs instantly without installation from any USB drive or folder.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>How to Get Your .EXE on GitHub:</span>
                </div>

                <ol className="space-y-2 text-[11px] text-slate-300">
                  <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-slate-200">Push / Export your project to GitHub</strong>
                      <p className="text-slate-400 mt-0.5">Use the AI Studio settings to export to your GitHub repository or push via git.</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-slate-200">Go to the "Actions" tab in your GitHub repository</strong>
                      <p className="text-slate-400 mt-0.5">In the left sidebar, click on <span className="text-emerald-300 font-semibold">"Build Windows Executable (.exe)"</span>.</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-slate-200">Click "Run workflow"</strong>
                      <p className="text-slate-400 mt-0.5">Select the <code className="text-slate-200 bg-slate-800 px-1 py-0.2 rounded">main</code> branch and click the green <em>Run workflow</em> button (it also runs automatically on any push).</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">4</span>
                    <div>
                      <strong className="text-slate-200">Download your packaged .EXE from Artifacts</strong>
                      <p className="text-slate-400 mt-0.5">When the green checkmark appears (~2 minutes), click the run title and scroll down to <strong className="text-emerald-400">Artifacts</strong> to download <code className="text-slate-200">Ahmed-Reaction-Studio-Windows-EXE.zip</code>.</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Local PC build commands */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">Or Build .EXE Locally on your PC:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('npm run build:exe', 'local-exe')}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedScript === 'local-exe' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript === 'local-exe' ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`npm install
npm run build
npx --yes electron-builder --win --x64`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'termux' && (
            <div className="space-y-3">
              <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-lg text-sky-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>100% Local &amp; Mobile Chrome Optimized</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ahmed Reaction Studio is designed to run locally inside Android Termux, serving directly to Chrome on your phone with touch-optimized handles, responsive portrait/landscape canvas scaling, and up to 2 camera feeds.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">Terminal Commands (Run in Termux):</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('pkg update && pkg install -y nodejs && npm install && npm run dev -- --host 0.0.0.0', 'termux-cmd')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedScript === 'termux-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript === 'termux-cmd' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`pkg update && pkg install -y nodejs
npm install
npm run dev -- --host 0.0.0.0`}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">One-Click Script: <code className="text-sky-300 font-mono">start_termux.sh</code></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(termuxShScript, 'termux-sh')}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                    >
                      {copiedScript === 'termux-sh' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript === 'termux-sh' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('start_termux.sh', termuxShScript)}
                      className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40">
                  {termuxShScript}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-3">
              <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-lg text-sky-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>Windows Desktop &amp; Chrome Setup</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  On Windows, Ahmed Reaction Studio supports multiple cameras, high-definition 1080p / 4K composite canvas, screen sharing commentary, and full keyboard nudging (Arrow keys to move, Shift+Arrow to resize).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-200">One-Click Windows Launcher: <code className="text-sky-300 font-mono">start_windows.bat</code></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(windowsBatScript, 'win-bat')}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                    >
                      {copiedScript === 'win-bat' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript === 'win-bat' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('start_windows.bat', windowsBatScript)}
                      className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-48">
                  {windowsBatScript}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'lan' && (
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-lg">
                <h3 className="font-bold text-slate-100 flex items-center gap-1.5 mb-1">
                  <Wifi className="w-4 h-4 text-sky-400" />
                  <span>Use from Another Phone, Tablet, or PC over Wi-Fi</span>
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  When running on either your Windows PC or Termux with <code className="text-sky-400 font-mono">--host 0.0.0.0</code>, any device on the same local Wi-Fi network can open the studio!
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1">Step 1: Find your local IP address</div>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                    <li>On Windows: run <code className="text-emerald-400">ipconfig</code> in cmd (look for IPv4 Address e.g. 192.168.1.50)</li>
                    <li>On Termux: run <code className="text-emerald-400">ip a</code> or check Wi-Fi settings in Android</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1">Step 2: Open in Mobile Chrome</div>
                  <p className="text-[11px] text-slate-400">
                    Navigate to <code className="text-sky-400 font-mono">http://&lt;YOUR-IP&gt;:3000</code> in Google Chrome. For camera access on HTTP across local LAN, enable <code className="text-amber-400 font-mono">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> and add your IP.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
