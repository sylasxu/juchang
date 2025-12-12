// 数据导出工具
export class ExportManager {
  /**
   * 导出为 CSV 格式
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns: { key: keyof T; label: string; formatter?: (value: any) => string }[]
  ) {
    if (data.length === 0) {
      throw new Error('没有数据可导出');
    }

    // 创建 CSV 头部
    const headers = columns.map(col => col.label).join(',');
    
    // 创建 CSV 数据行
    const rows = data.map(item => {
      return columns.map(col => {
        const value = item[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : String(value || '');
        // 处理包含逗号的值
        return formattedValue.includes(',') ? `"${formattedValue}"` : formattedValue;
      }).join(',');
    });

    // 组合完整的 CSV 内容
    const csvContent = [headers, ...rows].join('\n');
    
    // 创建并下载文件
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * 导出为 JSON 格式
   */
  static exportToJSON<T>(data: T[], filename: string) {
    if (data.length === 0) {
      throw new Error('没有数据可导出');
    }

    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
  }

  /**
   * 下载文件
   */
  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理 URL 对象
    URL.revokeObjectURL(url);
  }

  /**
   * 格式化日期
   */
  static formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }

  /**
   * 格式化布尔值
   */
  static formatBoolean(value: boolean): string {
    return value ? '是' : '否';
  }

  /**
   * 格式化会员类型
   */
  static formatMembershipType(type: 'free' | 'pro'): string {
    return type === 'pro' ? 'Pro会员' : '免费用户';
  }

  /**
   * 格式化履约率
   */
  static formatFulfillmentRate(participationCount: number, fulfillmentCount: number): string {
    if (participationCount === 0) return '0%';
    return `${Math.round((fulfillmentCount / participationCount) * 100)}%`;
  }
}