// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { useState, useEffect } from 'react';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
}

const useFetchNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from an API.
    // For now, we'll use static data.
    const staticNews: NewsItem[] = [
      { id: '1', title: 'Fitur Baru: AI Presenter kini hadir di Sotoshop!', link: '#' },
      { id: '2', title: 'Tips & Trik: Cara Membuat Logo yang Efektif', link: '#' },
      { id: '3', title: 'Update: Token harian gratis telah di-reset!', link: '#' },
    ];
    setNews(staticNews);
    setLoading(false);
  }, []);

  return { news, loading };
};

export default useFetchNews;
