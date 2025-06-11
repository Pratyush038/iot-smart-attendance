import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AttendanceRecord } from "@shared/schema";

interface CentralNotificationProps {
  latestEntry: AttendanceRecord | null;
}

export default function CentralNotification({ latestEntry }: CentralNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (latestEntry && latestEntry !== currentEntry) {
      setCurrentEntry(latestEntry);
      setShowNotification(true);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestEntry, currentEntry]);

  if (!showNotification || !currentEntry) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -100 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl border-2 border-green-300 max-w-md mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                >
                  <i className="fas fa-check text-green-600 text-lg"></i>
                </motion.div>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">Student Has Entered!</h3>
              <div className="space-y-1">
                <p className="text-lg font-semibold">Roll #{currentEntry.roll}</p>
                {currentEntry.name && (
                  <p className="text-green-100 font-medium">{currentEntry.name}</p>
                )}
                <p className="text-green-200 text-sm">
                  {new Date(currentEntry.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-green-200 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          {/* Progress bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-1 bg-white bg-opacity-30 mt-4 rounded-full overflow-hidden"
          >
            <div className="h-full bg-white bg-opacity-60"></div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}