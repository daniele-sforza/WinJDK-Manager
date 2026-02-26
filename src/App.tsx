import React from 'react';
import { Terminal } from './components/Terminal';
import { CodeBlock } from './components/CodeBlock';
import { POWERSHELL_SCRIPT, BATCH_SCRIPT } from './script';
import { Terminal as TerminalIcon, Download, Code2, Zap, Shield, HardDrive } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
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
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <a
                href="#download"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 transition-all flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Get the Scripts
              </a>
              <a href="#features" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition-colors">
                View Features <span aria-hidden="true">→</span>
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
          <p className="mt-4 md:mt-0 text-sm text-zinc-400">
            Built for Windows PowerShell. No dependencies required.
          </p>
        </div>
      </footer>
    </div>
  );
}
