/**
 * 标准身高百分位数据（0-18岁，217个月）
 * 预计算的完整数据，避免每次渲染时插值计算
 */

/**
 * 解析年龄字符串为月份数
 * @param {string} ageStr 年龄字符串，如"出生"、"1月"、"2岁"、"2.5岁"等
 * @returns {number} 月份数
 */
function parseAgeToMonths(ageStr) {
  if (ageStr === '出生') return 0;
  if (ageStr.includes('岁')) {
    const parts = ageStr.split('岁');
    const years = parseInt(parts[0]) || 0;
    let months = 0;
    if (parts[1]) {
      const monthMatch = parts[1].match(/(\d+)月/);
      if (monthMatch) {
        months = parseInt(monthMatch[1]);
      } else if (parts[1].includes('.')) {
        // 处理如 "2.5岁" 的情况
        const decimal = parseFloat(parts[1]);
        months = Math.round(decimal * 12);
      }
    }
    return years * 12 + months;
  }
  if (ageStr.includes('月')) {
    return parseInt(ageStr) || 0;
  }
  return 0;
}

// 预计算完整217个月数据
function generateStandardHeightData() {
  // 完整的数据点（从出生到18岁）
  const rawData = [
    { age: '出生', m3sd: 44.7, m2sd: 46.4, m1sd: 48.0, median: 49.7, p1sd: 51.4, p2sd: 53.2, p3sd: 55.0 },
    { age: '1月', m3sd: 47.9, m2sd: 49.8, m1sd: 51.7, median: 53.6, p1sd: 55.5, p2sd: 57.5, p3sd: 59.6 },
    { age: '2月', m3sd: 51.1, m2sd: 53.2, m1sd: 55.3, median: 57.4, p1sd: 59.6, p2sd: 61.8, p3sd: 64.1 },
    { age: '3月', m3sd: 53.9, m2sd: 56.0, m1sd: 58.2, median: 60.3, p1sd: 62.5, p2sd: 64.8, p3sd: 67.1 },
    { age: '4月', m3sd: 56.7, m2sd: 58.8, m1sd: 61.0, median: 63.1, p1sd: 65.4, p2sd: 67.7, p3sd: 70.0 },
    { age: '5月', m3sd: 58.4, m2sd: 60.6, m1sd: 62.8, median: 65.0, p1sd: 67.3, p2sd: 69.6, p3sd: 72.0 },
    { age: '6月', m3sd: 60.1, m2sd: 62.3, m1sd: 64.5, median: 66.8, p1sd: 69.1, p2sd: 71.5, p3sd: 74.0 },
    { age: '7月', m3sd: 61.3, m2sd: 63.6, m1sd: 65.8, median: 68.2, p1sd: 70.6, p2sd: 73.1, p3sd: 75.6 },
    { age: '8月', m3sd: 62.5, m2sd: 64.8, m1sd: 67.2, median: 69.6, p1sd: 72.1, p2sd: 74.6, p3sd: 77.3 },
    { age: '9月', m3sd: 63.7, m2sd: 66.1, m1sd: 68.5, median: 71.0, p1sd: 73.6, p2sd: 76.2, p3sd: 78.9 },
    { age: '10月', m3sd: 64.9, m2sd: 67.3, m1sd: 69.8, median: 72.3, p1sd: 75.0, p2sd: 77.6, p3sd: 80.4 },
    { age: '11月', m3sd: 66.0, m2sd: 68.5, m1sd: 71.0, median: 73.7, p1sd: 76.3, p2sd: 79.1, p3sd: 81.9 },
    { age: '12月', m3sd: 67.2, m2sd: 69.7, m1sd: 72.3, median: 75.0, p1sd: 77.7, p2sd: 80.5, p3sd: 83.4 },
    { age: '13月', m3sd: 68.2, m2sd: 70.8, m1sd: 73.4, median: 76.2, p1sd: 78.9, p2sd: 81.8, p3sd: 84.7 },
    { age: '14月', m3sd: 69.2, m2sd: 71.8, m1sd: 74.5, median: 77.3, p1sd: 80.2, p2sd: 83.0, p3sd: 86.1 },
    { age: '15月', m3sd: 70.2, m2sd: 72.9, m1sd: 75.6, median: 78.5, p1sd: 81.4, p2sd: 84.3, p3sd: 87.4 },
    { age: '16月', m3sd: 71.1, m2sd: 73.8, m1sd: 76.6, median: 79.5, p1sd: 82.5, p2sd: 85.4, p3sd: 88.6 },
    { age: '17月', m3sd: 71.9, m2sd: 74.7, m1sd: 77.5, median: 80.5, p1sd: 83.5, p2sd: 86.6, p3sd: 89.8 },
    { age: '18月', m3sd: 72.8, m2sd: 75.6, m1sd: 78.5, median: 81.5, p1sd: 84.6, p2sd: 87.7, p3sd: 91.0 },
    { age: '19月', m3sd: 73.6, m2sd: 76.4, m1sd: 79.4, median: 82.5, p1sd: 85.6, p2sd: 88.8, p3sd: 92.2 },
    { age: '20月', m3sd: 74.3, m2sd: 77.3, m1sd: 80.3, median: 83.4, p1sd: 86.7, p2sd: 90.0, p3sd: 93.3 },
    { age: '21月', m3sd: 75.1, m2sd: 78.1, m1sd: 81.2, median: 84.4, p1sd: 87.7, p2sd: 91.1, p3sd: 94.5 },
    { age: '22月', m3sd: 75.8, m2sd: 78.9, m1sd: 82.1, median: 85.3, p1sd: 88.7, p2sd: 92.2, p3sd: 95.7 },
    { age: '23月', m3sd: 76.6, m2sd: 79.7, m1sd: 82.9, median: 86.3, p1sd: 89.7, p2sd: 93.2, p3sd: 96.8 },
    { age: '2岁', m3sd: 77.3, m2sd: 80.5, m1sd: 83.8, median: 87.2, p1sd: 90.7, p2sd: 94.3, p3sd: 98.0 },
    { age: '2岁1月', m3sd: 78.0, m2sd: 81.2, m1sd: 84.6, median: 88.0, p1sd: 91.6, p2sd: 95.2, p3sd: 99.0 },
    { age: '2岁2月', m3sd: 78.7, m2sd: 81.9, m1sd: 85.3, median: 88.8, p1sd: 92.4, p2sd: 96.1, p3sd: 99.9 },
    { age: '2岁3月', m3sd: 79.4, m2sd: 82.7, m1sd: 86.1, median: 89.7, p1sd: 93.3, p2sd: 97.1, p3sd: 100.9 },
    { age: '2岁4月', m3sd: 80.0, m2sd: 83.4, m1sd: 86.9, median: 90.5, p1sd: 94.2, p2sd: 98.0, p3sd: 101.9 },
    { age: '2岁5月', m3sd: 80.7, m2sd: 84.1, m1sd: 87.6, median: 91.3, p1sd: 95.0, p2sd: 98.9, p3sd: 102.8 },
    { age: '2.5岁', m3sd: 81.4, m2sd: 84.8, m1sd: 88.4, median: 92.1, p1sd: 95.9, p2sd: 99.8, p3sd: 103.8 },
    { age: '2岁7月', m3sd: 82.0, m2sd: 85.4, m1sd: 89.0, median: 92.7, p1sd: 96.5, p2sd: 100.4, p3sd: 104.4 },
    { age: '2岁8月', m3sd: 82.5, m2sd: 85.9, m1sd: 89.5, median: 93.3, p1sd: 97.1, p2sd: 101.0, p3sd: 105.0 },
    { age: '2岁9月', m3sd: 83.1, m2sd: 86.5, m1sd: 90.1, median: 93.9, p1sd: 97.7, p2sd: 101.6, p3sd: 105.6 },
    { age: '2岁10月', m3sd: 83.6, m2sd: 87.1, m1sd: 90.7, median: 94.4, p1sd: 98.2, p2sd: 102.2, p3sd: 106.2 },
    { age: '2岁11月', m3sd: 84.2, m2sd: 87.6, m1sd: 91.2, median: 95.0, p1sd: 98.8, p2sd: 102.8, p3sd: 106.8 },
    { age: '3岁', m3sd: 84.7, m2sd: 88.2, m1sd: 91.8, median: 95.6, p1sd: 99.4, p2sd: 103.4, p3sd: 107.4 },
    { age: '3岁1月', m3sd: 85.3, m2sd: 88.8, m1sd: 92.4, median: 96.2, p1sd: 100.1, p2sd: 104.0, p3sd: 108.1 },
    { age: '3岁2月', m3sd: 85.9, m2sd: 89.4, m1sd: 93.1, median: 96.9, p1sd: 100.7, p2sd: 104.7, p3sd: 108.7 },
    { age: '3岁3月', m3sd: 86.6, m2sd: 90.1, m1sd: 93.7, median: 97.5, p1sd: 101.4, p2sd: 105.3, p3sd: 109.4 },
    { age: '3岁4月', m3sd: 87.2, m2sd: 90.7, m1sd: 94.3, median: 98.1, p1sd: 102.0, p2sd: 105.9, p3sd: 110.0 },
    { age: '3岁5月', m3sd: 87.8, m2sd: 91.3, m1sd: 95.0, median: 98.8, p1sd: 102.7, p2sd: 106.6, p3sd: 110.7 },
    { age: '3.5岁', m3sd: 88.4, m2sd: 91.9, m1sd: 95.6, median: 99.4, p1sd: 103.3, p2sd: 107.2, p3sd: 111.3 },
    { age: '3岁7月', m3sd: 89.0, m2sd: 92.5, m1sd: 96.2, median: 100.0, p1sd: 103.9, p2sd: 107.9, p3sd: 112.0 },
    { age: '3岁8月', m3sd: 89.5, m2sd: 93.1, m1sd: 96.8, median: 100.6, p1sd: 104.5, p2sd: 108.5, p3sd: 112.6 },
    { age: '3岁9月', m3sd: 90.1, m2sd: 93.7, m1sd: 97.4, median: 101.3, p1sd: 105.2, p2sd: 109.2, p3sd: 113.3 },
    { age: '3岁10月', m3sd: 90.6, m2sd: 94.2, m1sd: 98.0, median: 101.9, p1sd: 105.8, p2sd: 109.8, p3sd: 114.0 },
    { age: '3岁11月', m3sd: 91.2, m2sd: 94.8, m1sd: 98.6, median: 102.5, p1sd: 106.4, p2sd: 110.5, p3sd: 114.6 },
    { age: '4岁', m3sd: 91.7, m2sd: 95.4, m1sd: 99.2, median: 103.1, p1sd: 107.0, p2sd: 111.1, p3sd: 115.3 },
    { age: '4岁1月', m3sd: 92.2, m2sd: 96.0, m1sd: 99.8, median: 103.7, p1sd: 107.7, p2sd: 111.8, p3sd: 116.0 },
    { age: '4岁2月', m3sd: 92.7, m2sd: 96.5, m1sd: 100.4, median: 104.3, p1sd: 108.3, p2sd: 112.5, p3sd: 116.7 },
    { age: '4岁3月', m3sd: 93.3, m2sd: 97.1, m1sd: 101.0, median: 104.9, p1sd: 109.0, p2sd: 113.2, p3sd: 117.4 },
    { age: '4岁4月', m3sd: 93.8, m2sd: 97.6, m1sd: 101.5, median: 105.5, p1sd: 109.6, p2sd: 113.8, p3sd: 118.1 },
    { age: '4岁5月', m3sd: 94.3, m2sd: 98.2, m1sd: 102.1, median: 106.1, p1sd: 110.3, p2sd: 114.5, p3sd: 118.8 },
    { age: '4.5岁', m3sd: 94.8, m2sd: 98.7, m1sd: 102.7, median: 106.7, p1sd: 110.9, p2sd: 115.2, p3sd: 119.5 },
    { age: '4岁7月', m3sd: 95.3, m2sd: 99.2, m1sd: 103.3, median: 107.3, p1sd: 111.5, p2sd: 115.8, p3sd: 120.2 },
    { age: '4岁8月', m3sd: 95.8, m2sd: 99.7, m1sd: 103.8, median: 107.9, p1sd: 112.1, p2sd: 116.4, p3sd: 120.8 },
    { age: '4岁9月', m3sd: 96.3, m2sd: 100.3, m1sd: 104.4, median: 108.5, p1sd: 112.7, p2sd: 117.1, p3sd: 121.5 },
    { age: '4岁10月', m3sd: 96.8, m2sd: 100.8, m1sd: 104.9, median: 109.0, p1sd: 113.3, p2sd: 117.7, p3sd: 122.1 },
    { age: '4岁11月', m3sd: 97.3, m2sd: 101.3, m1sd: 105.5, median: 109.6, p1sd: 113.9, p2sd: 118.3, p3sd: 122.8 },
    { age: '5岁', m3sd: 97.8, m2sd: 101.8, m1sd: 106.0, median: 110.2, p1sd: 114.5, p2sd: 118.9, p3sd: 123.4 },
    { age: '5岁1月', m3sd: 98.3, m2sd: 102.3, m1sd: 106.5, median: 110.8, p1sd: 115.1, p2sd: 119.5, p3sd: 124.0 },
    { age: '5岁2月', m3sd: 98.8, m2sd: 102.8, m1sd: 107.1, median: 111.3, p1sd: 115.7, p2sd: 120.1, p3sd: 124.7 },
    { age: '5岁3月', m3sd: 99.3, m2sd: 103.4, m1sd: 107.6, median: 111.9, p1sd: 116.3, p2sd: 120.8, p3sd: 125.3 },
    { age: '5岁4月', m3sd: 99.7, m2sd: 103.9, m1sd: 108.1, median: 112.4, p1sd: 116.8, p2sd: 121.4, p3sd: 125.9 },
    { age: '5岁5月', m3sd: 100.2, m2sd: 104.4, m1sd: 108.7, median: 113.0, p1sd: 117.4, p2sd: 122.0, p3sd: 126.6 },
    { age: '5.5岁', m3sd: 100.7, m2sd: 104.9, m1sd: 109.2, median: 113.5, p1sd: 118.0, p2sd: 122.6, p3sd: 127.2 },
    { age: '5岁7月', m3sd: 101.1, m2sd: 105.4, m1sd: 109.7, median: 114.0, p1sd: 118.5, p2sd: 123.2, p3sd: 127.8 },
    { age: '5岁8月', m3sd: 101.5, m2sd: 105.8, m1sd: 110.1, median: 114.5, p1sd: 119.1, p2sd: 123.7, p3sd: 128.4 },
    { age: '5岁9月', m3sd: 102.0, m2sd: 106.3, m1sd: 110.6, median: 115.1, p1sd: 119.6, p2sd: 124.3, p3sd: 129.0 },
    { age: '5岁10月', m3sd: 102.4, m2sd: 106.7, m1sd: 111.1, median: 115.6, p1sd: 120.1, p2sd: 124.9, p3sd: 129.6 },
    { age: '5岁11月', m3sd: 102.8, m2sd: 107.2, m1sd: 111.5, median: 116.1, p1sd: 120.7, p2sd: 125.4, p3sd: 130.2 },
    { age: '6岁', m3sd: 103.2, m2sd: 107.6, m1sd: 112.0, median: 116.6, p1sd: 121.2, p2sd: 126.0, p3sd: 130.8 },
    { age: '6岁1月', m3sd: 103.6, m2sd: 108.0, m1sd: 112.5, median: 117.1, p1sd: 121.7, p2sd: 126.5, p3sd: 131.4 },
    { age: '6岁2月', m3sd: 104.0, m2sd: 108.4, m1sd: 112.9, median: 117.5, p1sd: 122.2, p2sd: 127.1, p3sd: 131.9 },
    { age: '6岁3月', m3sd: 104.4, m2sd: 108.9, m1sd: 113.4, median: 118.0, p1sd: 122.8, p2sd: 127.6, p3sd: 132.5 },
    { age: '6岁4月', m3sd: 104.7, m2sd: 109.3, m1sd: 113.8, median: 118.5, p1sd: 123.3, p2sd: 128.1, p3sd: 133.1 },
    { age: '6岁5月', m3sd: 105.1, m2sd: 109.7, m1sd: 114.3, median: 118.9, p1sd: 123.8, p2sd: 128.7, p3sd: 133.6 },
    { age: '6.5岁', m3sd: 105.5, m2sd: 110.1, m1sd: 114.7, median: 119.4, p1sd: 124.3, p2sd: 129.2, p3sd: 134.2 },
    { age: '6岁7月', m3sd: 105.9, m2sd: 110.5, m1sd: 115.2, median: 119.9, p1sd: 124.9, p2sd: 129.8, p3sd: 134.8 },
    { age: '6岁8月', m3sd: 106.3, m2sd: 111.0, m1sd: 115.7, median: 120.4, p1sd: 125.4, p2sd: 130.4, p3sd: 135.4 },
    { age: '6岁9月', m3sd: 106.8, m2sd: 111.4, m1sd: 116.2, median: 121.0, p1sd: 126.0, p2sd: 131.0, p3sd: 136.1 },
    { age: '6岁10月', m3sd: 107.2, m2sd: 111.8, m1sd: 116.6, median: 121.5, p1sd: 126.5, p2sd: 131.5, p3sd: 136.7 },
    { age: '6岁11月', m3sd: 107.6, m2sd: 112.3, m1sd: 117.1, median: 122.0, p1sd: 127.1, p2sd: 132.1, p3sd: 137.3 },
    { age: '7岁', m3sd: 108.0, m2sd: 112.7, m1sd: 117.6, median: 122.5, p1sd: 127.6, p2sd: 132.7, p3sd: 137.9 },
    { age: '7岁1月', m3sd: 108.4, m2sd: 113.2, m1sd: 118.1, median: 123.0, p1sd: 128.1, p2sd: 133.3, p3sd: 138.5 },
    { age: '7岁2月', m3sd: 108.8, m2sd: 113.6, m1sd: 118.5, median: 123.5, p1sd: 128.7, p2sd: 133.8, p3sd: 139.1 },
    { age: '7岁3月', m3sd: 109.2, m2sd: 114.1, m1sd: 119.0, median: 124.1, p1sd: 129.2, p2sd: 134.4, p3sd: 139.7 },
    { age: '7岁4月', m3sd: 109.6, m2sd: 114.5, m1sd: 119.5, median: 124.6, p1sd: 129.7, p2sd: 135.0, p3sd: 140.3 },
    { age: '7岁5月', m3sd: 110.0, m2sd: 115.0, m1sd: 119.9, median: 125.1, p1sd: 130.3, p2sd: 135.5, p3sd: 140.9 },
    { age: '7.5岁', m3sd: 110.4, m2sd: 115.4, m1sd: 120.4, median: 125.6, p1sd: 130.8, p2sd: 136.1, p3sd: 141.5 },
    { age: '7岁7月', m3sd: 110.8, m2sd: 115.8, m1sd: 120.9, median: 126.1, p1sd: 131.3, p2sd: 136.7, p3sd: 142.1 },
    { age: '7岁8月', m3sd: 111.2, m2sd: 116.2, m1sd: 121.3, median: 126.6, p1sd: 131.8, p2sd: 137.2, p3sd: 142.6 },
    { age: '7岁9月', m3sd: 111.6, m2sd: 116.7, m1sd: 121.8, median: 127.1, p1sd: 132.4, p2sd: 137.8, p3sd: 143.2 },
    { age: '7岁10月', m3sd: 111.9, m2sd: 117.1, m1sd: 122.2, median: 127.5, p1sd: 132.9, p2sd: 138.3, p3sd: 143.8 },
    { age: '7岁11月', m3sd: 112.3, m2sd: 117.5, m1sd: 122.7, median: 128.0, p1sd: 133.4, p2sd: 138.9, p3sd: 144.3 },
    { age: '8岁', m3sd: 112.7, m2sd: 117.9, m1sd: 123.1, median: 128.5, p1sd: 133.9, p2sd: 139.4, p3sd: 144.9 },
    { age: '8岁1月', m3sd: 113.1, m2sd: 118.3, m1sd: 123.6, median: 129.0, p1sd: 134.4, p2sd: 139.9, p3sd: 145.5 },
    { age: '8岁2月', m3sd: 113.5, m2sd: 118.7, m1sd: 124.0, median: 129.4, p1sd: 134.9, p2sd: 140.5, p3sd: 146.1 },
    { age: '8岁3月', m3sd: 113.9, m2sd: 119.1, m1sd: 124.5, median: 129.9, p1sd: 135.4, p2sd: 141.0, p3sd: 146.7 },
    { age: '8岁4月', m3sd: 114.2, m2sd: 119.5, m1sd: 124.9, median: 130.4, p1sd: 135.9, p2sd: 141.5, p3sd: 147.2 },
    { age: '8岁5月', m3sd: 114.6, m2sd: 119.9, m1sd: 125.4, median: 130.8, p1sd: 136.4, p2sd: 142.1, p3sd: 147.8 },
    { age: '8.5岁', m3sd: 115.0, m2sd: 120.3, m1sd: 125.8, median: 131.3, p1sd: 136.9, p2sd: 142.6, p3sd: 148.4 },
    { age: '8岁7月', m3sd: 115.3, m2sd: 120.7, m1sd: 126.2, median: 131.8, p1sd: 137.4, p2sd: 143.1, p3sd: 149.0 },
    { age: '8岁8月', m3sd: 115.7, m2sd: 121.1, m1sd: 126.6, median: 132.2, p1sd: 137.9, p2sd: 143.7, p3sd: 149.5 },
    { age: '8岁9月', m3sd: 116.0, m2sd: 121.5, m1sd: 127.1, median: 132.7, p1sd: 138.4, p2sd: 144.2, p3sd: 150.1 },
    { age: '8岁10月', m3sd: 116.3, m2sd: 121.8, m1sd: 127.5, median: 133.2, p1sd: 138.9, p2sd: 144.7, p3sd: 150.7 },
    { age: '8岁11月', m3sd: 116.7, m2sd: 122.2, m1sd: 127.9, median: 133.6, p1sd: 139.4, p2sd: 145.3, p3sd: 151.2 },
    { age: '9岁', m3sd: 117.0, m2sd: 122.6, m1sd: 128.3, median: 134.1, p1sd: 139.9, p2sd: 145.8, p3sd: 151.8 },
    { age: '9岁1月', m3sd: 117.4, m2sd: 123.0, m1sd: 128.8, median: 134.6, p1sd: 140.4, p2sd: 146.4, p3sd: 152.4 },
    { age: '9岁2月', m3sd: 117.7, m2sd: 123.4, m1sd: 129.2, median: 135.1, p1sd: 141.0, p2sd: 146.9, p3sd: 153.0 },
    { age: '9岁3月', m3sd: 118.1, m2sd: 123.8, m1sd: 129.7, median: 135.6, p1sd: 141.5, p2sd: 147.5, p3sd: 153.6 },
    { age: '9岁4月', m3sd: 118.4, m2sd: 124.2, m1sd: 130.1, median: 136.0, p1sd: 142.0, p2sd: 148.1, p3sd: 154.2 },
    { age: '9岁5月', m3sd: 118.8, m2sd: 124.6, m1sd: 130.6, median: 136.5, p1sd: 142.6, p2sd: 148.6, p3sd: 154.8 },
    { age: '9.5岁', m3sd: 119.1, m2sd: 125.0, m1sd: 131.0, median: 137.0, p1sd: 143.1, p2sd: 149.2, p3sd: 155.4 },
    { age: '9岁7月', m3sd: 119.5, m2sd: 125.4, m1sd: 131.5, median: 137.5, p1sd: 143.7, p2sd: 149.8, p3sd: 156.0 },
    { age: '9岁8月', m3sd: 119.9, m2sd: 125.9, m1sd: 131.9, median: 138.0, p1sd: 144.2, p2sd: 150.4, p3sd: 156.7 },
    { age: '9岁9月', m3sd: 120.3, m2sd: 126.3, m1sd: 132.4, median: 138.6, p1sd: 144.8, p2sd: 151.0, p3sd: 157.3 },
    { age: '9岁10月', m3sd: 120.7, m2sd: 126.7, m1sd: 132.9, median: 139.1, p1sd: 145.3, p2sd: 151.6, p3sd: 157.9 },
    { age: '9岁11月', m3sd: 121.1, m2sd: 127.2, m1sd: 133.3, median: 139.6, p1sd: 145.9, p2sd: 152.2, p3sd: 158.6 },
    { age: '10岁', m3sd: 121.5, m2sd: 127.6, m1sd: 133.8, median: 140.1, p1sd: 146.4, p2sd: 152.8, p3sd: 159.2 },
    { age: '10岁1月', m3sd: 121.9, m2sd: 128.1, m1sd: 134.3, median: 140.6, p1sd: 147.0, p2sd: 153.4, p3sd: 159.8 },
    { age: '10岁2月', m3sd: 122.3, m2sd: 128.5, m1sd: 134.8, median: 141.2, p1sd: 147.5, p2sd: 154.0, p3sd: 160.5 },
    { age: '10岁3月', m3sd: 122.7, m2sd: 129.0, m1sd: 135.3, median: 141.7, p1sd: 148.1, p2sd: 154.6, p3sd: 161.1 },
    { age: '10岁4月', m3sd: 123.1, m2sd: 129.4, m1sd: 135.8, median: 142.2, p1sd: 148.7, p2sd: 155.1, p3sd: 161.7 },
    { age: '10岁5月', m3sd: 123.5, m2sd: 129.9, m1sd: 136.3, median: 142.8, p1sd: 149.2, p2sd: 155.7, p3sd: 162.4 },
    { age: '10.5岁', m3sd: 123.9, m2sd: 130.3, m1sd: 136.8, median: 143.3, p1sd: 149.8, p2sd: 156.3, p3sd: 163.0 },
    { age: '10岁7月', m3sd: 124.4, m2sd: 130.8, m1sd: 137.3, median: 143.9, p1sd: 150.4, p2sd: 156.9, p3sd: 163.6 },
    { age: '10岁8月', m3sd: 124.9, m2sd: 131.3, m1sd: 137.9, median: 144.4, p1sd: 151.0, p2sd: 157.5, p3sd: 164.2 },
    { age: '10岁9月', m3sd: 125.4, m2sd: 131.9, m1sd: 138.4, median: 145.0, p1sd: 151.6, p2sd: 158.2, p3sd: 164.9 },
    { age: '10岁10月', m3sd: 125.9, m2sd: 132.4, m1sd: 138.9, median: 145.5, p1sd: 152.1, p2sd: 158.8, p3sd: 165.5 },
    { age: '10岁11月', m3sd: 126.4, m2sd: 132.9, m1sd: 139.5, median: 146.1, p1sd: 152.7, p2sd: 159.4, p3sd: 166.1 },
    { age: '11岁', m3sd: 126.9, m2sd: 133.4, m1sd: 140.0, median: 146.6, p1sd: 153.3, p2sd: 160.0, p3sd: 166.7 },
    { age: '11岁1月', m3sd: 127.4, m2sd: 133.9, m1sd: 140.5, median: 147.1, p1sd: 153.8, p2sd: 160.5, p3sd: 167.2 },
    { age: '11岁2月', m3sd: 127.9, m2sd: 134.4, m1sd: 141.0, median: 147.6, p1sd: 154.3, p2sd: 161.0, p3sd: 167.7 },
    { age: '11岁3月', m3sd: 128.4, m2sd: 135.0, m1sd: 141.6, median: 148.2, p1sd: 154.8, p2sd: 161.5, p3sd: 168.2 },
    { age: '11岁4月', m3sd: 128.9, m2sd: 135.5, m1sd: 142.1, median: 148.7, p1sd: 155.3, p2sd: 161.9, p3sd: 168.6 },
    { age: '11岁5月', m3sd: 129.4, m2sd: 136.0, m1sd: 142.6, median: 149.2, p1sd: 155.8, p2sd: 162.4, p3sd: 169.1 },
    { age: '11.5岁', m3sd: 129.9, m2sd: 136.5, m1sd: 143.1, median: 149.7, p1sd: 156.3, p2sd: 162.9, p3sd: 169.6 },
    { age: '11岁7月', m3sd: 130.4, m2sd: 137.0, m1sd: 143.6, median: 150.2, p1sd: 156.7, p2sd: 163.3, p3sd: 170.0 },
    { age: '11岁8月', m3sd: 130.9, m2sd: 137.5, m1sd: 144.0, median: 150.6, p1sd: 157.1, p2sd: 163.7, p3sd: 170.3 },
    { age: '11岁9月', m3sd: 131.5, m2sd: 138.0, m1sd: 144.5, median: 151.1, p1sd: 157.6, p2sd: 164.1, p3sd: 170.7 },
    { age: '11岁10月', m3sd: 132.0, m2sd: 138.5, m1sd: 145.0, median: 151.5, p1sd: 158.0, p2sd: 164.5, p3sd: 171.1 },
    { age: '11岁11月', m3sd: 132.5, m2sd: 139.0, m1sd: 145.4, median: 152.0, p1sd: 158.4, p2sd: 164.9, p3sd: 171.4 },
    { age: '12岁', m3sd: 133.0, m2sd: 139.5, m1sd: 145.9, median: 152.4, p1sd: 158.8, p2sd: 165.3, p3sd: 171.8 },
    { age: '12岁1月', m3sd: 133.5, m2sd: 139.9, m1sd: 146.3, median: 152.8, p1sd: 159.1, p2sd: 165.6, p3sd: 172.1 },
    { age: '12岁2月', m3sd: 134.0, m2sd: 140.4, m1sd: 146.7, median: 153.1, p1sd: 159.5, p2sd: 165.9, p3sd: 172.3 },
    { age: '12岁3月', m3sd: 134.5, m2sd: 140.8, m1sd: 147.2, median: 153.5, p1sd: 159.8, p2sd: 166.2, p3sd: 172.6 },
    { age: '12岁4月', m3sd: 134.9, m2sd: 141.2, m1sd: 147.6, median: 153.9, p1sd: 160.1, p2sd: 166.5, p3sd: 172.8 },
    { age: '12岁5月', m3sd: 135.4, m2sd: 141.7, m1sd: 148.0, median: 154.2, p1sd: 160.5, p2sd: 166.8, p3sd: 173.1 },
    { age: '12.5岁', m3sd: 135.9, m2sd: 142.1, m1sd: 148.4, median: 154.6, p1sd: 160.8, p2sd: 167.1, p3sd: 173.3 },
    { age: '12岁7月', m3sd: 136.3, m2sd: 142.5, m1sd: 148.7, median: 154.9, p1sd: 161.1, p2sd: 167.3, p3sd: 173.5 },
    { age: '12岁8月', m3sd: 136.7, m2sd: 142.8, m1sd: 149.0, median: 155.2, p1sd: 161.3, p2sd: 167.5, p3sd: 173.6 },
    { age: '12岁9月', m3sd: 137.1, m2sd: 143.2, m1sd: 149.4, median: 155.5, p1sd: 161.6, p2sd: 167.7, p3sd: 173.8 },
    { age: '12岁10月', m3sd: 137.4, m2sd: 143.5, m1sd: 149.7, median: 155.7, p1sd: 161.8, p2sd: 167.9, p3sd: 174.0 },
    { age: '12岁11月', m3sd: 137.8, m2sd: 143.9, m1sd: 150.0, median: 156.0, p1sd: 162.1, p2sd: 168.1, p3sd: 174.1 },
    { age: '13岁', m3sd: 138.2, m2sd: 144.2, m1sd: 150.3, median: 156.3, p1sd: 162.3, p2sd: 168.3, p3sd: 174.3 },
    { age: '13岁1月', m3sd: 138.5, m2sd: 144.5, m1sd: 150.6, median: 156.5, p1sd: 162.5, p2sd: 168.5, p3sd: 174.4 },
    { age: '13岁2月', m3sd: 138.8, m2sd: 144.8, m1sd: 150.8, median: 156.7, p1sd: 162.7, p2sd: 168.6, p3sd: 174.5 },
    { age: '13岁3月', m3sd: 139.2, m2sd: 145.1, m1sd: 151.1, median: 157.0, p1sd: 162.9, p2sd: 168.8, p3sd: 174.7 },
    { age: '13岁4月', m3sd: 139.5, m2sd: 145.4, m1sd: 151.3, median: 157.2, p1sd: 163.0, p2sd: 168.9, p3sd: 174.8 },
    { age: '13岁5月', m3sd: 139.8, m2sd: 145.7, m1sd: 151.6, median: 157.4, p1sd: 163.2, p2sd: 169.1, p3sd: 174.9 },
    { age: '13.5岁', m3sd: 140.1, m2sd: 146.0, m1sd: 151.8, median: 157.6, p1sd: 163.4, p2sd: 169.2, p3sd: 175.0 },
    { age: '13岁7月', m3sd: 140.3, m2sd: 146.2, m1sd: 152.0, median: 157.8, p1sd: 163.6, p2sd: 169.3, p3sd: 175.1 },
    { age: '13岁8月', m3sd: 140.6, m2sd: 146.4, m1sd: 152.2, median: 157.9, p1sd: 163.7, p2sd: 169.4, p3sd: 175.2 },
    { age: '13岁9月', m3sd: 140.8, m2sd: 146.6, m1sd: 152.4, median: 158.1, p1sd: 163.9, p2sd: 169.6, p3sd: 175.3 },
    { age: '13岁10月', m3sd: 141.0, m2sd: 146.8, m1sd: 152.5, median: 158.3, p1sd: 164.0, p2sd: 169.7, p3sd: 175.3 },
    { age: '13岁11月', m3sd: 141.3, m2sd: 147.0, m1sd: 152.7, median: 158.4, p1sd: 164.2, p2sd: 169.8, p3sd: 175.4 },
    { age: '14岁', m3sd: 141.5, m2sd: 147.2, m1sd: 152.9, median: 158.6, p1sd: 164.3, p2sd: 169.9, p3sd: 175.5 },
    { age: '14岁1月', m3sd: 141.7, m2sd: 147.4, m1sd: 153.1, median: 158.7, p1sd: 164.4, p2sd: 170.0, p3sd: 175.6 },
    { age: '14岁2月', m3sd: 141.9, m2sd: 147.5, m1sd: 153.2, median: 158.9, p1sd: 164.5, p2sd: 170.1, p3sd: 175.6 },
    { age: '14岁3月', m3sd: 142.1, m2sd: 147.7, m1sd: 153.4, median: 159.0, p1sd: 164.6, p2sd: 170.2, p3sd: 175.7 },
    { age: '14岁4月', m3sd: 142.2, m2sd: 147.9, m1sd: 153.5, median: 159.1, p1sd: 164.7, p2sd: 170.2, p3sd: 175.8 },
    { age: '14岁5月', m3sd: 142.4, m2sd: 148.0, m1sd: 153.7, median: 159.3, p1sd: 164.8, p2sd: 170.3, p3sd: 175.8 },
    { age: '14.5岁', m3sd: 142.6, m2sd: 148.2, m1sd: 153.8, median: 159.4, p1sd: 164.9, p2sd: 170.4, p3sd: 175.9 },
    { age: '14岁7月', m3sd: 142.7, m2sd: 148.3, m1sd: 153.9, median: 159.5, p1sd: 165.0, p2sd: 170.5, p3sd: 176.0 },
    { age: '14岁8月', m3sd: 142.8, m2sd: 148.4, m1sd: 154.0, median: 159.5, p1sd: 165.0, p2sd: 170.5, p3sd: 176.0 },
    { age: '14岁9月', m3sd: 143.0, m2sd: 148.5, m1sd: 154.1, median: 159.6, p1sd: 165.1, p2sd: 170.6, p3sd: 176.1 },
    { age: '14岁10月', m3sd: 143.1, m2sd: 148.6, m1sd: 154.1, median: 159.7, p1sd: 165.2, p2sd: 170.7, p3sd: 176.1 },
    { age: '14岁11月', m3sd: 143.2, m2sd: 148.7, m1sd: 154.2, median: 159.7, p1sd: 165.2, p2sd: 170.7, p3sd: 176.2 },
    { age: '15岁', m3sd: 143.3, m2sd: 148.8, m1sd: 154.3, median: 159.8, p1sd: 165.3, p2sd: 170.8, p3sd: 176.2 },
    { age: '15岁1月', m3sd: 143.4, m2sd: 148.9, m1sd: 154.4, median: 159.9, p1sd: 165.4, p2sd: 170.9, p3sd: 176.2 },
    { age: '15岁2月', m3sd: 143.4, m2sd: 148.9, m1sd: 154.4, median: 159.9, p1sd: 165.4, p2sd: 170.9, p3sd: 176.3 },
    { age: '15岁3月', m3sd: 143.5, m2sd: 149.0, m1sd: 154.5, median: 160.0, p1sd: 165.5, p2sd: 171.0, p3sd: 176.3 },
    { age: '15岁4月', m3sd: 143.6, m2sd: 149.1, m1sd: 154.6, median: 160.0, p1sd: 165.5, p2sd: 171.0, p3sd: 176.3 },
    { age: '15岁5月', m3sd: 143.6, m2sd: 149.1, m1sd: 154.6, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
    { age: '15.5岁', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
    { age: '15岁7月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
    { age: '15岁8月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
    { age: '15岁9月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
    { age: '15岁10月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
    { age: '15岁11月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁1月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁2月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁3月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁4月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁5月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
    { age: '16.5岁', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁7月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁8月', m3sd: 143.9, m2sd: 149.4, m1sd: 154.8, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
    { age: '16岁9月', m3sd: 143.9, m2sd: 149.4, m1sd: 154.8, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
    { age: '16岁10月', m3sd: 143.9, m2sd: 149.4, m1sd: 154.8, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
    { age: '16岁11月', m3sd: 144.0, m2sd: 149.5, m1sd: 154.9, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
    { age: '17岁', m3sd: 144.0, m2sd: 149.5, m1sd: 154.9, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
    { age: '17岁1月', m3sd: 144.0, m2sd: 149.5, m1sd: 154.9, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
    { age: '17岁2月', m3sd: 144.1, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.7, p2sd: 171.1, p3sd: 176.5 },
    { age: '17岁3月', m3sd: 144.1, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.8, p2sd: 171.1, p3sd: 176.5 },
    { age: '17岁4月', m3sd: 144.1, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.8, p2sd: 171.1, p3sd: 176.5 },
    { age: '17岁5月', m3sd: 144.2, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.8, p2sd: 171.1, p3sd: 176.5 },
    { age: '17岁6月', m3sd: 144.2, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.8, p2sd: 171.2, p3sd: 176.6 },
    { age: '17岁7月', m3sd: 144.2, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.8, p2sd: 171.2, p3sd: 176.6 },
    { age: '17岁8月', m3sd: 144.3, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.8, p2sd: 171.2, p3sd: 176.6 },
    { age: '17岁9月', m3sd: 144.3, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.9, p2sd: 171.2, p3sd: 176.6 },
    { age: '17岁10月', m3sd: 144.3, m2sd: 149.8, m1sd: 155.2, median: 160.6, p1sd: 165.9, p2sd: 171.3, p3sd: 176.6 },
    { age: '17岁11月', m3sd: 144.4, m2sd: 149.8, m1sd: 155.2, median: 160.6, p1sd: 165.9, p2sd: 171.3, p3sd: 176.6 },
    { age: '18岁', m3sd: 144.4, m2sd: 149.8, m1sd: 155.2, median: 160.6, p1sd: 165.9, p2sd: 171.3, p3sd: 176.6 }
  ];

  // 将数据转换为以月份为索引的映射
  const dataMap = {};
  rawData.forEach(item => {
    const months = parseAgeToMonths(item.age);
    dataMap[months] = {
      m3sd: item.m3sd,
      m2sd: item.m2sd,
      m1sd: item.m1sd,
      median: item.median,
      p1sd: item.p1sd,
      p2sd: item.p2sd,
      p3sd: item.p3sd
    };
  });
  
  // 生成0-216个月的完整数据（使用线性插值填充缺失的月份）
  const fullData = {};
  for (let month = 0; month <= 216; month++) {
    if (dataMap[month]) {
      fullData[month] = dataMap[month];
    } else {
      // 找到最近的两个数据点进行插值
      let lowerMonth = month - 1;
      let upperMonth = month + 1;
      while (lowerMonth >= 0 && !dataMap[lowerMonth]) lowerMonth--;
      while (upperMonth <= 216 && !dataMap[upperMonth]) upperMonth++;
      
      if (lowerMonth >= 0 && upperMonth <= 216) {
        const lowerData = dataMap[lowerMonth];
        const upperData = dataMap[upperMonth];
        const ratio = (month - lowerMonth) / (upperMonth - lowerMonth);
        
        fullData[month] = {
          m3sd: parseFloat((lowerData.m3sd + (upperData.m3sd - lowerData.m3sd) * ratio).toFixed(1)),
          m2sd: parseFloat((lowerData.m2sd + (upperData.m2sd - lowerData.m2sd) * ratio).toFixed(1)),
          m1sd: parseFloat((lowerData.m1sd + (upperData.m1sd - lowerData.m1sd) * ratio).toFixed(1)),
          median: parseFloat((lowerData.median + (upperData.median - lowerData.median) * ratio).toFixed(1)),
          p1sd: parseFloat((lowerData.p1sd + (upperData.p1sd - lowerData.p1sd) * ratio).toFixed(1)),
          p2sd: parseFloat((lowerData.p2sd + (upperData.p2sd - lowerData.p2sd) * ratio).toFixed(1)),
          p3sd: parseFloat((lowerData.p3sd + (upperData.p3sd - lowerData.p3sd) * ratio).toFixed(1))
        };
      } else if (lowerMonth >= 0) {
        fullData[month] = { ...dataMap[lowerMonth] };
      } else if (upperMonth <= 216) {
        fullData[month] = { ...dataMap[upperMonth] };
      }
    }
  }
  
  // 最终验证：确保所有217个月都有完整数据
  for (let month = 0; month <= 216; month++) {
    if (!fullData[month] || 
        typeof fullData[month].m3sd !== 'number' || 
        typeof fullData[month].m2sd !== 'number' ||
        typeof fullData[month].m1sd !== 'number' ||
        typeof fullData[month].median !== 'number' ||
        typeof fullData[month].p1sd !== 'number' ||
        typeof fullData[month].p2sd !== 'number' ||
        typeof fullData[month].p3sd !== 'number') {
      throw new Error(`数据完整性验证失败：月份 ${month} 的数据不完整`);
    }
  }
  
  return fullData;
}

// 预计算并导出静态数据（只计算一次）
const STANDARD_HEIGHT_DATA = generateStandardHeightData();

/**
 * 根据月龄获取标准身高数据
 * @param {number} ageInMonths 月龄（0-216）
 * @returns {object} 标准身高百分位数据
 */
function getStandardHeightByAge(ageInMonths) {
  const ageKey = Math.floor(ageInMonths);
  if (ageKey >= 0 && ageKey <= 216) {
    return STANDARD_HEIGHT_DATA[ageKey] || STANDARD_HEIGHT_DATA[Math.max(0, Math.min(216, ageKey))];
  }
  // 超出范围返回边界值
  return ageKey < 0 ? STANDARD_HEIGHT_DATA[0] : STANDARD_HEIGHT_DATA[216];
}

module.exports = {
  STANDARD_HEIGHT_DATA,
  getStandardHeightByAge,
  parseAgeToMonths
};

