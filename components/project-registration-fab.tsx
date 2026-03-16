"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  FileText
} from "lucide-react";

interface ProjectRegistrationFabProps {
  user?: any;
  onClick: () => void;
}

export function ProjectRegistrationFab({ user, onClick }: ProjectRegistrationFabProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Only show for students
  if (user?.type !== 'student') {
    return null;
  }

  return (
    <div className="group relative">
      <Button
        onClick={onClick}
        className={`
          fixed bottom-8 right-8 z-40 
          w-14 h-14 rounded-full 
          bg-gradient-to-r from-blue-600 to-purple-600 
          hover:from-blue-700 hover:to-purple-700
          shadow-lg hover:shadow-xl
          transform transition-all duration-300 
          hover:scale-110 active:scale-95
          border-2 border-white/20
          backdrop-blur-sm
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <Plus 
            className={`
              h-6 w-6 text-white 
              transition-transform duration-300
              ${isHovered ? 'rotate-90' : 'rotate-0'}
              ${isHovered ? 'opacity-5' : 'opacity-100'}
            `} 
          />
          <FileText 
            className={`
              h-4 w-4 text-white 
              absolute top-0 right-0 
              opacity-0 transition-opacity duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `} 
          />
        </div>
      </Button>
      
      {/* Tooltip */}
      <div className={`
        absolute right-16 top-1/2 -translate-y-1/2
        bg-gray-900 text-white px-3 py-2 rounded-lg
        opacity-0 transition-opacity duration-200
        pointer-events-none whitespace-nowrap
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        <p className="font-medium text-sm">Register Project</p>
        <p className="text-xs text-gray-300">Start your project registration</p>
        {/* Arrow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
      </div>
    </div>
  );
}
