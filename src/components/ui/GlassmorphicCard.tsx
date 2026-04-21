import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -5, scale: 1.01 } : {}}
      className={cn(
        "glass rounded-2xl p-6 shadow-xl overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphicCard;
