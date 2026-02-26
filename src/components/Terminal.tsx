import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const commands = [
  { cmd: 'jdk list', output: 'Installed JDKs in C:\\Users\\User\\.jdk:\n  * temurin-17 (Active)\n    corretto-21' },
  { cmd: 'jdk install 21 zulu', output: 'Downloading Zulu 21 from https://cdn.azul.com/...\nExtracting archive...\nInstalled Zulu 21 to C:\\Users\\User\\.jdk\\zulu-21' },
  { cmd: 'jdk use 21', output: 'Successfully switched to JDK at C:\\Users\\User\\.jdk\\zulu-21' },
];

export function Terminal() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % (commands.length + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 font-mono text-sm">
      <div className="flex items-center px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="mx-auto text-zinc-500 text-xs font-medium">powershell</div>
      </div>
      <div className="p-4 h-64 overflow-y-auto text-zinc-300">
        {commands.slice(0, step).map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex">
              <span className="text-emerald-400 mr-2">PS C:\Users\User&gt;</span>
              <span className="text-zinc-100">{c.cmd}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap text-zinc-400">{c.output}</div>
          </motion.div>
        ))}
        {step < commands.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex"
          >
            <span className="text-emerald-400 mr-2">PS C:\Users\User&gt;</span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-2 h-4 bg-zinc-400 inline-block"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
