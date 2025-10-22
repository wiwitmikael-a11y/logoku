// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  link: string;
}

// Menggunakan RSS feed dari Republika kategori UMKM
const RSS_URL = 'https://www.republika.co.id/rss/umkm';
// Menggunakan proxy untuk mengatasi masalah CORS
const PROXY_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(RSS_URL)}`;

const useFetchNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(PROXY_URL);
        if (!response.ok) throw new Error('Respon jaringan bermasalah saat mengambil berita.');
        const data = await response.json();
        const xmlString = data.contents;
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
          console.error("XML Parsing Error:", parseError);
          throw new Error("Gagal memproses feed berita.");
        }
        
        const items = xmlDoc.querySelectorAll("item");
        const newsItems: NewsItem[] = Array.from(items).slice(0, 15).map(item => ({
          title: item.querySelector("title")?.textContent || '',
          link: item.querySelector("link")?.textContent || '',
        }));

        if (newsItems.length === 0) {
            // Jangan throw error, cukup tampilkan pesan
            setError("Tidak ada item berita yang ditemukan di feed.");
        }

        setNews(newsItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat berita.");
        console.error("Gagal mengambil berita:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    // Auto-refresh berita setiap 15 menit
    const interval = setInterval(fetchNews, 15 * 60 * 1000); 

    return () => clearInterval(interval);
  }, []);

  return { news, loading, error };
};

export default useFetchNews;
