// src/components/ui/animated-welcome.tsx
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const WelcomeText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: -20,
      y: 10,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ display: 'flex', overflow: 'hidden' }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn(
        "bg-gradient-to-r from-primary via-secondary to-primary text-transparent bg-clip-text text-3xl font-bold",
        className
      )}
    >
      {letters.map((letter, index) => (
        <motion.span variants={child} key={index}>
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export function AnimatedWelcome({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center">
      <WelcomeText text={text} />
    </div>
  );
}
