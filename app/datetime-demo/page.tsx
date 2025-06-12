"use client";

import React, { useState } from "react";
import { formatVietnamDate } from "@/utils/date-utils";

export default function DateTimeDemo() {
  const [timestamp, setTimestamp] = useState("2025-06-12T21:08:02.000Z");
  const [showSeconds, setShowSeconds] = useState(true);

  // Get the formatted time
  const formattedTime = formatVietnamDate(timestamp, showSeconds);

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>DateTime Formatting Demo</h1>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm'>UTC Timestamp:</label>
          <input
            type='text'
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className='w-full p-2 border rounded'
          />
        </div>

        <div className='flex items-center'>
          <input
            type='checkbox'
            id='showSeconds'
            checked={showSeconds}
            onChange={(e) => setShowSeconds(e.target.checked)}
            className='mr-2'
          />
          <label htmlFor='showSeconds'>Show seconds</label>
        </div>

        <div className='bg-slate-100 p-4 rounded'>
          <h2 className='font-bold'>Formatted result (Vietnam time):</h2>
          <p className='text-xl mt-2'>{formattedTime}</p>
        </div>

        <div className='bg-slate-100 p-4 rounded'>
          <h2 className='font-bold'>Details:</h2>
          <ul className='list-disc pl-5 mt-2'>
            <li>
              Input: <code>{timestamp}</code>
            </li>
            <li>Vietnam timezone: UTC+7</li>
            <li>Format: dd/MM/yyyy, HH:mm{showSeconds ? ":ss" : ""}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
