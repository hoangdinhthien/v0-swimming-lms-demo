"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useState, useEffect, useRef } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  searchFieldOptions?: {
    value: string;
    label: string;
  }[];
  filterOptions?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: string;
    }[];
  }[];
  onServerSearch?: (searchValue: string, searchField?: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  searchKey = "name",
  searchPlaceholder = "Tìm kiếm...",
  searchFieldOptions,
  filterOptions = [],
  onServerSearch,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Use local state for server-side search, table state for client-side
  const [serverSearchValue, setServerSearchValue] = useState("");
  const [selectedSearchField, setSelectedSearchField] = useState(
    searchFieldOptions?.[0]?.value || searchKey
  );
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
        onServerSearch(value, selectedSearchField);
      }, 300);
    } else {
      // Client-side search - use table filtering (no debounce needed)
      table.getColumn(searchKey)?.setFilterValue(value);
    }
  };

  // Handle search field change
  const handleSearchFieldChange = (field: string) => {
    setSelectedSearchField(field);
    // Re-trigger search with new field if there's a value
    if (serverSearchValue && onServerSearch) {
      onServerSearch(serverSearchValue, field);
    }
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center gap-2'>
        {searchFieldOptions && searchFieldOptions.length > 0 ? (
          <div className='flex items-center gap-2'>
            <Select
              value={selectedSearchField}
              onValueChange={handleSearchFieldChange}
            >
              <SelectTrigger className='h-8 w-[140px]'>
                <SelectValue placeholder='Chọn trường' />
              </SelectTrigger>
              <SelectContent>
                {searchFieldOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className='h-8 w-[150px] lg:w-[250px]'
            />
          </div>
        ) : (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            className='h-8 w-[150px] lg:w-[250px]'
          />
        )}
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
