"use client";

import { Download, Calendar, RefreshCw } from "lucide-react";
import { useId } from 'react';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface AnalyticsHeaderProps {
    timeRange: string;
    setTimeRange: (value: string) => void;
    onExport: () => void;
    lastUpdated: Date;
    isRefreshing: boolean;
    onRefresh: () => void;
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
}

export function AnalyticsHeader({
    timeRange,
    setTimeRange,
    onExport,
    lastUpdated,
    isRefreshing,
    onRefresh,
    dateRange,
    setDateRange,
}: AnalyticsHeaderProps) {
    // Generate stable ID for Popover to prevent hydration mismatches
    const popoverId = useId();
    
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Analytics Overview
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500">Platform performance metrics and member engagement activity.</p>
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live
                    </div>
                    <span className="text-xs text-slate-400 ml-2">
                        Updated {format(lastUpdated, "HH:mm:ss")}
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Date Range Picker (Custom) */}
                {timeRange === "custom" && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                className={`w-full sm:w-[240px] justify-start text-left font-medium transition-all duration-200 
                                bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600`}
                                aria-controls={popoverId}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                            id={popoverId}
                            className="w-auto p-0 border-blue-100 shadow-xl" 
                            align="end"
                        >
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                className="p-3 bg-white rounded-md"
                            />
                        </PopoverContent>
                    </Popover>
                )}

                <div className="flex items-center gap-3">
                    {/* Time Range Selector */}
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="w-[150px] !bg-white border-0 !border-white !text-gray-700 font-medium hover:!border-white focus:!ring-2 focus:!ring-white/20 transition-all shadow-sm"
                        >
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-0 border-white shadow-lg p-1">
                            <SelectItem value="7" className="text-gray-700 focus:bg-blue-500 focus:text-white cursor-pointer rounded-md my-0.5">Last 7 Days</SelectItem>
                            <SelectItem value="30" className="text-gray-700 focus:bg-blue-500 focus:text-white cursor-pointer rounded-md my-0.5">Last 30 Days</SelectItem>
                            <SelectItem value="90" className="text-gray-700 focus:bg-blue-500 focus:text-white cursor-pointer rounded-md my-0.5">Last 90 Days</SelectItem>
                            <SelectItem value="custom" className="text-gray-700 font-semibold focus:bg-blue-500 focus:text-white cursor-pointer rounded-md my-0.5 border-t border-blue-50 mt-1 pt-2">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Refresh Button */}
                    <Button
                        size="icon"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="bg-white text-gray-600 hover:bg-blue-500 hover:text-white rounded-full w-10 h-10 border-none shadow-none transition-colors shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {/* Export Button (Rich Theme) */}
                <Button
                    onClick={onExport}
                    className="w-full sm:w-auto bg-white border-0 border-white text-gray-600 font-semibold shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-md transition-all duration-200"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </Button>
            </div>
        </div>
    );
}
