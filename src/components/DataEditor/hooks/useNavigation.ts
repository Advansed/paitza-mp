import { useState } from 'react';

export const useNavigation = (totalPages: number) => {
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    canGoNext: currentPage < totalPages - 1,
    canGoPrev: currentPage > 0
  };
};