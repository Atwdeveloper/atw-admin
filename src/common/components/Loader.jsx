"use client";

import React from "react";
import { motion } from "framer-motion";

const Loader = ({
  size = "lg",
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  return (
    <motion.div
      className={`${fullScreen ? "fixed inset-0 z-50" : "py-32"} 
        flex items-center justify-center dark:bg-slate-900/80 backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center justify-center gap-6">

        {/* Rotating Gradient Box */}
        <motion.div
          className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center 
                      shadow-xl overflow-hidden relative`}
          style={{
            background:
              "linear-gradient(45deg, #0ea5e9, #6366f1, #8b5cf6, #14b8a6)",
            backgroundSize: "300% 300%",
          }}
          animate={{
            rotate: 360,
            y: [-8, 8, -8],
            transition: {
              rotate: {
                duration: 7,
                repeat: Infinity,
                ease: "linear",
              },
              y: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            },
          }}
        >
          {/* Counter Rotate Inner Text */}
          <motion.div
            className="w-full h-full flex items-center justify-center"
            animate={{
              rotate: -360,
              transition: {
                duration: 7,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            <span className="font-extrabold text-white text-3xl tracking-tight">
              AW
            </span>
          </motion.div>
        </motion.div>

        {/* Branding Text */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p
            className="text-sm text-slate-600 dark:text-slate-300"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <span className="font-semibold text-xl text-indigo-600 dark:text-indigo-400">
              Anytime Work
            </span>
            <br />
            <span className="text-slate-500 dark:text-slate-400">
              Please wait, setting things up...
            </span>
          </motion.p>
        </motion.div>

        {/* Smooth Progress Bar */}
        <motion.div
          className="w-36 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: "9rem" }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Loader;
