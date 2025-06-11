"use client";

import React from "react";
import { Waves, Loader2 } from "lucide-react";
import Link from "next/link";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Đang tải..." }: LoadingScreenProps) {
  return (
    <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-black/95'>
      <Link
        href='/'
        className='flex items-center gap-2 mb-8'
      >
        <Waves className='h-8 w-8 text-sky-500' />
        <span className='font-bold text-2xl'>AquaLearn</span>
      </Link>

      <div className='flex flex-col items-center justify-center gap-4'>
        <div className='relative'>
          <div className='h-16 w-16 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin'></div>
          <Waves className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-sky-500' />
        </div>
        <p className='text-lg font-medium text-gray-700 dark:text-gray-300'>
          {message}
        </p>
      </div>
    </div>
  );
}
