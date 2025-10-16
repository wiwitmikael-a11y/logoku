// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
    <p><strong>Waduh, Gagal!</strong> {message}</p>
  </div>
);

export default ErrorMessage;
