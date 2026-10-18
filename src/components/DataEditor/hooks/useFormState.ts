import { useState, useEffect } from 'react';
import { PageData } from '../types';

export const useFormState = (initialData: PageData) => {
  const [data, setData] = useState<PageData>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const updateField = (sectionIndex: number, fieldIndex: number, value: any) => {
    const newData = [...data];
    if (newData[sectionIndex]?.data[fieldIndex]) {
      newData[sectionIndex].data[fieldIndex].data = value;
      setData(newData);
    }
  };

  return { data, updateField };
};