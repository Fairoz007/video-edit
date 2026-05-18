import { motion } from 'framer-motion';
import { Bell, HelpCircle, Crown } from 'lucide-react';

export function UserProfile() {
  return (
    <div className="mt-auto pt-2 space-y-2">
      <div className="flex items-center justify-center gap-1">
        <button type="button" className="btn-icon p-2" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </button>
        <button type="button" className="btn-icon p-2" aria-label="Help">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
      <motion.div
        className="p-2 rounded-xl bg-gradient-to-br from-indigo-950/80 to-purple-950/50 border border-forge-border-bright/30"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center text-xs font-bold text-white shadow-glow-sm"
            animate={{ boxShadow: ['0 0 12px rgba(168,85,247,0.3)', '0 0 20px rgba(99,102,241,0.4)', '0 0 12px rgba(168,85,247,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            A
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Arjun</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Crown className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-medium text-amber-400/90">Pro Plan</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
