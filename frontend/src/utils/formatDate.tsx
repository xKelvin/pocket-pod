export const formatDate = (isoString: Date, showTime?: boolean) => {
  if (!isoString) return '----/--/--';
  const date = new Date(isoString);

  // 年、月、日を取得
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // YYYY-MM-DD形式の文字列を作成
  let formattedDate = `${year}-${month}-${day}`;

  // showTimeがtrueの場合、時刻を追加
  if (showTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    formattedDate += ` ${hours}:${minutes}`;
  }

  return formattedDate;
};
