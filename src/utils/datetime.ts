/**
 * 日期时间格式化工具类
 * @author neo
 * @since 2025-11-25
 */

/**
 * 默认日期时间格式：yyyy-MM-dd HH:mm:ss
 */
export const DEFAULT_DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

/**
 * 默认日期格式：yyyy-MM-dd
 */
export const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

/**
 * 默认时间格式：HH:mm:ss
 */
export const DEFAULT_TIME_FORMAT = "HH:mm:ss";

/**
 * 格式化日期时间
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式字符串，默认：yyyy-MM-dd HH:mm:ss
 * @returns 格式化后的字符串，如果输入为 null/undefined 则返回空字符串
 */
export function formatDateTime(
  date: Date | number | string | null | undefined,
  format: string = DEFAULT_DATETIME_FORMAT
): string {
  if (!date) return "";

  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace(/yyyy/g, String(year))
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds);
}

/**
 * 格式化日期（不包含时间）
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式字符串，默认：yyyy-MM-dd
 * @returns 格式化后的字符串
 */
export function formatDate(
  date: Date | number | string | null | undefined,
  format: string = DEFAULT_DATE_FORMAT
): string {
  return formatDateTime(date, format);
}

/**
 * 格式化时间（不包含日期）
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式字符串，默认：HH:mm:ss
 * @returns 格式化后的字符串
 */
export function formatTime(
  date: Date | number | string | null | undefined,
  format: string = DEFAULT_TIME_FORMAT
): string {
  return formatDateTime(date, format);
}

/**
 * 解析日期字符串为 Date 对象
 * @param dateStr 日期字符串
 * @returns Date 对象，如果解析失败则返回 null
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 获取当前日期时间字符串
 * @param format 格式字符串，默认：yyyy-MM-dd HH:mm:ss
 * @returns 当前日期时间字符串
 */
export function now(format: string = DEFAULT_DATETIME_FORMAT): string {
  return formatDateTime(new Date(), format);
}

/**
 * 获取当前日期字符串
 * @param format 格式字符串，默认：yyyy-MM-dd
 * @returns 当前日期字符串
 */
export function today(format: string = DEFAULT_DATE_FORMAT): string {
  return formatDateTime(new Date(), format);
}

/**
 * 获取当前时间字符串
 * @param format 格式字符串，默认：HH:mm:ss
 * @returns 当前时间字符串
 */
export function currentTime(format: string = DEFAULT_TIME_FORMAT): string {
  return formatDateTime(new Date(), format);
}

/**
 * 计算两个日期之间的天数差
 * @param date1 日期1
 * @param date2 日期2
 * @returns 天数差（绝对值）
 */
export function daysBetween(date1: Date | number | string, date2: Date | number | string): number {
  const d1 = typeof date1 === "number" || typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "number" || typeof date2 === "string" ? new Date(date2) : date2;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 判断是否为今天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 是否为今天
 */
export function isToday(date: Date | number | string): boolean {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * 判断是否为昨天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 是否为昨天
 */
export function isYesterday(date: Date | number | string): boolean {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

/**
 * 获取相对时间描述（如：刚刚、5分钟前、3小时前、昨天、2天前）
 * @param date 日期对象、时间戳或日期字符串
 * @returns 相对时间描述
 */
export function getRelativeTime(date: Date | number | string): string {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay === 1) return "昨天";
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`;
  return `${Math.floor(diffDay / 365)}年前`;
}

/**
 * 添加天数
 * @param date 日期对象、时间戳或日期字符串
 * @param days 要添加的天数（负数表示减少）
 * @returns 新的 Date 对象
 */
export function addDays(date: Date | number | string, days: number): Date {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * 添加月份
 * @param date 日期对象、时间戳或日期字符串
 * @param months 要添加的月数（负数表示减少）
 * @returns 新的 Date 对象
 */
export function addMonths(date: Date | number | string, months: number): Date {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * 获取月份的第一天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 该月第一天的 Date 对象
 */
export function getFirstDayOfMonth(date: Date | number | string = new Date()): Date {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * 获取月份的最后一天
 * @param date 日期对象、时间戳或日期字符串
 * @returns 该月最后一天的 Date 对象
 */
export function getLastDayOfMonth(date: Date | number | string = new Date()): Date {
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
