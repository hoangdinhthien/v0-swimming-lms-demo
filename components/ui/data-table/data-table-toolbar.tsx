"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useState, useEffect, useRef } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: string;
    }[];
  }[];
  onServerSearch?: (searchValue: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  searchKey = "name",
  searchPlaceholder = "Tìm kiếm...",
  filterOptions = [],
  onServerSearch,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  
  // Use local state for server-side search, table state for client-side
  const [serverSearchValue, setServerSearchValue] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the appropriate value based on search mode
  const searchValue = onServerSearch 
    ? serverSearchValue 
    : (table.getColumn(searchKey)?.getFilterValue() as string) ?? "";

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    if (onServerSearch) {
      // Server-side search - use local state and debounced callback
      setServerSearchValue(value);
      
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer for 300ms delay (faster response)
      debounceTimerRef.current = setTimeout(() => {
        onServerSearch(value);
      }, 300);
    } else {
      // Client-side search - use table filtering (no debounce needed)
      table.getColumn(searchKey)?.setFilterValue(value);
    }
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center gap-2'>
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => handleSearchChange(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        {filterOptions.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;

          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Đặt lại
            <X className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
