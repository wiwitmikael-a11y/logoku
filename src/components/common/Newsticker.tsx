// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import useFetchNews from '../../hooks/useFetchNews';

const Newsticker: React.FC = () => {
    const { news, loading, error } = useFetchNews();

    if (loading || error || news.length === 0) {
        // Render nothing if there's an issue or no news
        return null;
    }

    return (
        <div className="bg-background border-b border-border-main text-text-muted text-xs font-semibold overflow-hidden whitespace-nowrap flex items-center h-7">
            <span className="bg-primary text-white px-2 py-1 text-xs font-bold h-full flex items-center shrink-0">INFO UMKM</span>
            <div className="marquee-text-wrapper">
                <p className="marquee-text" style={{ animationDuration: `${news.length * 6}s`}}>
                    {news.map((item, index) => (
                        <React.Fragment key={index}>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline mx-4">
                                {item.title}
                            </a>
                            {index < news.length - 1 && ' ++ '}
                        </React.Fragment>
                    ))}
                     {/* Duplicate for seamless loop */}
                    {news.map((item, index) => (
                        <React.Fragment key={`dup-${index}`}>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline mx-4">
                                {item.title}
                            </a>
                            {index < news.length - 1 && ' ++ '}
                        </React.Fragment>
                    ))}
                </p>
            </div>
        </div>
    );
};

export default Newsticker;
