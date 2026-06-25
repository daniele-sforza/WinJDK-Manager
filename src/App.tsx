import React, { useState } from 'react';
import { Terminal } from './components/Terminal';
import { CodeBlock } from './components/CodeBlock';
import { POWERSHELL_SCRIPT, BATCH_SCRIPT } from './script';
import { Terminal as TerminalIcon, Download, Code2, Zap, Shield, HardDrive, Github, Cpu, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [selectedVersion, setSelectedVersion] = useState('21');
  const [selectedProvider, setSelectedProvider] = useState('temurin');
  const [selectedArch, setSelectedArch] = useState('auto'); // 'auto', 'x64', 'arm64'
  const [commandCopied, setCommandCopied] = useState(false);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(getGeneratedCommand());
    setCommandCopied(true);
    setTimeout(() => setCommandCopied(false), 2000);
  };

  const getGeneratedCommand = () => {
    const archPart = selectedArch === 'auto' ? '' : ` ${selectedArch}`;
    const providerPart = selectedProvider === 'temurin' && selectedArch === 'auto' ? '' : ` ${selectedProvider}`;
    return `jdk install ${selectedVersion}${providerPart}${archPart}`;
  };

  const getProviderLabel = (prov: string) => {
    switch (prov) {
      case 'temurin': return 'Eclipse Temurin';
      case 'corretto': return 'Amazon Corretto';
      case 'zulu': return 'Azul Zulu';
      case 'microsoft': return 'Microsoft OpenJDK';
      case 'openjdk': return 'Official OpenJDK';
      default: return prov;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-200">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-zinc-950 text-zinc-50 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/1920/1080?blur=10')] opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="rounded-2xl bg-zinc-800/50 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <TerminalIcon className="h-12 w-12 text-emerald-400" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-bold tracking-tight sm:text-6xl font-sans"
            >
              WinJDK Manager
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-zinc-400"
            >
              A lightning-fast PowerShell CLI tool to download, list, switch, link, and delete JDK versions on Windows.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            >
              <a
                href="#download"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 transition-all flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Get the Scripts
              </a>
              <a
                href="#features"
                className="rounded-full bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-100 shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700 transition-all flex items-center"
              >
                View Features <span aria-hidden="true" className="ml-2">→</span>
              </a>
              <a
                href="https://github.com/daniele-sforza/winjdk-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold leading-6 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Terminal Demo Section */}
      <section className="py-24 sm:py-32 bg-zinc-950 relative -mt-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Terminal />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Manage Java environments like a pro
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Stop messing with Environment Variables manually. WinJDK Manager handles downloading, extracting, and linking the JDK to your PATH automatically.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: 'Multiple Providers',
                  description: 'Download directly from Adoptium (Temurin), Amazon Corretto, Azul Zulu, Microsoft Build of OpenJDK, and official OpenJDK APIs.',
                  icon: Code2,
                },
                {
                  name: 'Instant Switching',
                  description: 'Switch between JDK 8, 11, 17, and 21 instantly. Automatically updates JAVA_HOME and PATH for the system.',
                  icon: Zap,
                },
                {
                  name: 'Link Existing JDKs',
                  description: 'Already have a JDK installed? Use the link command to add it to WinJDK Manager without redownloading.',
                  icon: HardDrive,
                },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100">
                      <feature.icon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Interactive Command Builder Section */}
      <section id="builder" className="py-20 bg-zinc-100 border-t border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-12">
            <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">Interactive Helper</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Command Builder
            </p>
            <p className="mt-4 text-lg text-zinc-600">
              Select your desired environment options to generate the exact, optimized installation command.
            </p>
          </div>

          <div className="mx-auto max-w-4xl bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 bg-zinc-50/50 p-6 md:p-8 gap-y-6 md:gap-y-0">
              
              {/* Column 1: Java Version */}
              <div className="md:pr-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  1. Java Version
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['8', '11', '17', '21', '22'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVersion(v)}
                      className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all text-center ${
                        selectedVersion === v
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Provider */}
              <div className="md:px-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  2. Distribution Provider
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'temurin', name: 'Eclipse Temurin', desc: 'Adoptium foundation (Recommended)' },
                    { id: 'corretto', name: 'Amazon Corretto', desc: 'Production-ready OpenJDK' },
                    { id: 'zulu', name: 'Azul Zulu', desc: 'Highly optimized & verified builds' },
                    { id: 'microsoft', name: 'Microsoft OpenJDK', desc: 'Built for Azure & Windows' },
                    { id: 'openjdk', name: 'Official OpenJDK', desc: 'Oracle reference implementation' },
                  ].map((p) => {
                    const isDisabled = p.id === 'microsoft' && selectedVersion === '8';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) setSelectedProvider(p.id);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-zinc-50 border-zinc-100'
                            : selectedProvider === p.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <span className="text-sm font-semibold">{p.name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Platform Architecture */}
              <div className="md:pl-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  3. Platform Architecture
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'auto', name: 'Auto-Detect', desc: 'Detects host architecture automatically (Default)', icon: Cpu },
                    { id: 'x64', name: 'x64 Architecture', desc: '64-bit Intel / AMD architecture', icon: Cpu },
                    { id: 'arm64', name: 'arm64 Architecture', desc: '64-bit ARM architecture (Windows on ARM)', icon: Cpu },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedArch(a.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                        selectedArch === a.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <a.icon className={`h-4 w-4 mt-0.5 ${selectedArch === a.id ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{a.name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{a.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Generated Command Bar */}
            <div className="bg-zinc-900 px-6 py-6 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-auto">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Generated CLI Command</span>
                <div className="flex items-center gap-3">
                  <code className="text-emerald-400 font-mono text-base md:text-lg select-all bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 break-all">
                    {getGeneratedCommand()}
                  </code>
                  <button
                    onClick={handleCopyCommand}
                    className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-lg transition-all"
                    title="Copy command"
                  >
                    {commandCopied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-zinc-400 max-w-md md:text-right border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0 w-full md:w-auto">
                <span className="font-semibold text-zinc-200 block mb-1">How it runs:</span>
                This will download and install <strong className="text-zinc-100">{getProviderLabel(selectedProvider)} {selectedVersion}</strong> for <strong className="text-zinc-100">{selectedArch === 'auto' ? 'your system architecture' : selectedArch}</strong>, verify its SHA-256 integrity, extract it to <code className="bg-zinc-950 px-1 py-0.5 rounded text-[11px] text-zinc-300">~/.jdk</code>, and set system variables automatically.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation & Troubleshooting Section */}
      <section id="installation" className="py-24 sm:py-32 bg-zinc-900 text-zinc-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl mb-8">
              Installation & Troubleshooting
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-3">1. How to Install</h3>
                <p className="mb-4 text-zinc-400">
                  Download both the <code className="text-emerald-400">jdk.ps1</code> and <code className="text-emerald-400">jdk.bat</code> scripts below. Place them <strong>in the same folder</strong>, and ensure that folder is in your system's PATH (for example, <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm">C:\Windows\System32</code> or a custom <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm">C:\scripts</code> folder).
                </p>
                <p className="mb-4 text-zinc-400">
                  By using the <code className="text-emerald-400">jdk.bat</code> wrapper, you can simply type <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm">jdk list</code> from any Command Prompt or PowerShell window, and it automatically bypasses execution policy restrictions!
                </p>
              </div>

              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Fixing "Cannot be loaded because running scripts is disabled"
                </h3>
                <p className="mb-4 text-zinc-400">
                  If you run <code className="text-red-300">.\jdk.ps1</code> directly, Windows might block it for security reasons. The <code className="text-emerald-400">jdk.bat</code> wrapper fixes this automatically. If you still want to run the PowerShell script directly, you have two options:
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-zinc-200 mb-2">Option A: Unblock the specific file (Recommended)</h4>
                    <p className="text-sm text-zinc-400 mb-2">This removes the "Mark of the Web" from the downloaded file.</p>
                    <div className="bg-zinc-950 p-3 rounded-lg font-mono text-sm text-emerald-400 border border-zinc-800">
                      Unblock-File -Path .\jdk.ps1
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-zinc-200 mb-2">Option B: Change your Execution Policy</h4>
                    <p className="text-sm text-zinc-400 mb-2">This allows your user account to run local scripts you write or download.</p>
                    <div className="bg-zinc-950 p-3 rounded-lg font-mono text-sm text-emerald-400 border border-zinc-800">
                      Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section id="download" className="py-24 sm:py-32 bg-zinc-100 border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">The Scripts</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Transparent, open, and yours.
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Download both scripts to a directory in your PATH. The <code className="bg-zinc-200 px-1 py-0.5 rounded text-sm">jdk.bat</code> wrapper allows you to run the tool from anywhere without typing <code>powershell</code>.
            </p>
          </div>
          <CodeBlock 
            files={[
              { filename: 'jdk.ps1', code: POWERSHELL_SCRIPT },
              { filename: 'jdk.bat', code: BATCH_SCRIPT }
            ]} 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="h-6 w-6 text-emerald-400" />
            <span className="text-zinc-50 font-semibold">WinJDK Manager</span>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-6">
            <p className="text-sm text-zinc-400">
              Built for Windows PowerShell. No dependencies required.
            </p>
            <a
              href="https://github.com/daniele-sforza/winjdk-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <span className="sr-only">GitHub</span>
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
