// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import useFetchNews from '../../hooks/useFetchNews';

const Newsticker: React.FC = () => {
    const { news, loading } = useFetchNews();

    if (loading || news.length === 0) {
        return null;
    }

    return (
        <div className="bg-surface border-b border-border-main overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center h-10">
                    <span className="flex-shrink-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-sm mr-4">INFO</span>
                    <div className="flex-grow relative h-full overflow-hidden">
                        {/* A simple implementation without CSS animation to fix build errors. */}
                        <div className="absolute inset-0 flex items-center">
                            {news.map(item => (
                                <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-text-body whitespace-nowrap px-6 hover:text-primary">
                                    {item.title}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Newsticker;
