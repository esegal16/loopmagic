/**
 * LoopMagic Analyzer Module
 * Exports deal analysis and Excel reading functionality
 */

export { analyzeDeal, formatAnalysis } from './deal-analyzer';
export type { DealAnalysis, AnalyzerOptions } from './deal-analyzer';

export { readExcelMetrics, formatMetrics } from './excel-reader';
export type { ExcelMetrics } from './excel-reader';
