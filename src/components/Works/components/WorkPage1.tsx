import React, { useEffect, useState } from 'react';
import { PageData } from '../../DataEditor/types';
import DataEditor from '../../DataEditor';
import { useToast } from '../../Toast';
import { WorkInfo } from '../types';
import { useSocket } from '../../../Store/useSocket';

interface VehicleInspectionProps {
    work:             WorkInfo;
    pdf:              string;
    onSave:           (data: SaveData) => Promise<boolean>;
    onBack:           () => void;
    initialData?:     SaveData;
}

export interface SaveData {
  inspectVehicle:     boolean;
  checkDocuments:     boolean;
  bodyPhotos:         string[]; // Массив URL или base64 изображений
  notes?:             string;
  sign:               string;
}

const EMPTY_INSPECTION: SaveData = {
  inspectVehicle:     false,
  checkDocuments:     false,
  bodyPhotos:         [],
  notes:              '',
  sign:               ''
};

export const WorkPage1: React.FC<VehicleInspectionProps> = ({ 
    work, pdf,
    onSave, 
    onBack, 
    initialData = EMPTY_INSPECTION 
}) => {
  const toast = useToast();


  // Преобразование данных в формат для DataEditor
  const inspectionToPages = (data: SaveData): PageData => [
    {
      title: "Договор",
      data: [
        {
          label:    "Договор",
          type:     "pdf",
          data:     pdf,
          validate: true
        }
      ]
    },
    {
      title: "Подписать догоовор",
      data: [
        {
          label:    "Подпись",
          type:     "sign",
          data:     data.sign,
          validate: true
        }
      ]
    },
    {
      title: "Проверка транспортного средства",
      data: [
        {
          label:    "Осмотреть ТС",
          type:     "check",
          data:     data.inspectVehicle,
          validate: true
        },
        {
          label: "Фото кузова",
          type: "images",
          data: data.bodyPhotos || [],
          validate: true,
        }
      ]
    },
    {
      title: "Проверка транспортного средства",
      data: [
        {
          label: "Проверить документы",
          type: "check",
          data: data.checkDocuments,
          validate: true
        },
        {
          label: "Заметки по осмотру",
          type: "string",
          data: data.notes || "",
          validate: true,
        }
      ]
    }
  ];

  // Преобразование данных из DataEditor обратно в VehicleInspectionData
  const pagesToInspection = ( data: PageData ): SaveData => {
    return {
        sign:             data[1].data[0].data, 
        inspectVehicle:   data[2].data[0].data, 
        bodyPhotos:       data[2].data[1].data, 
        checkDocuments:   data[3].data[0].data, 
        notes:            data[3].data[1].data, 
    } 

  };

  const handleSave = async (data: PageData) => {

    try {
      const inspectionData = pagesToInspection(data);
      

      const success = await onSave(inspectionData);
      
      if (success) {
        toast.success('Данные осмотра сохранены');
        onBack();
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка при сохранении данных осмотра');
    }
  };

  return (
    <DataEditor
        data      = { inspectionToPages(initialData) }
        onSave    = { handleSave }
        onBack    = { onBack }
        title     = "Осмотр транспортного средства"
    />
  );
};