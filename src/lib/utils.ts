export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/') ||
      url.startsWith('data:')
    );
  } catch {
    return false;
  }
};

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  } catch {
    return 'Data não disponível';
  }
};

export const formatRating = (rating: number | string | null | undefined): string => {
  try {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    if (typeof numRating === 'number' && !isNaN(numRating)) {
      return numRating.toFixed(1);
    }
    return '0.0';
  } catch {
    return '0.0';
  }
};

export const formatPrice = (price: number | string | null | undefined): string => {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (typeof numPrice === 'number' && !isNaN(numPrice)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numPrice);
    }
    return 'R$ 0,00';
  } catch {
    return 'R$ 0,00';
  }
};