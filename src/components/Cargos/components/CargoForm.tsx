import React, { useState, useEffect } from 'react';
import DataEditor from '../../DataEditor';
import { AddressData, CityData, FieldData, PageData } from '../../DataEditor/types';
import { CargoInfo, EMPTY_CARGO } from '../../../Store/cargoStore';
import { useToast } from '../../Toast';
import { companyGetters, useCompanyStore } from '../../../Store/companyStore';
import { useLoginStore } from '../../../Store/loginStore';
import { useHistory } from 'react-router-dom';
import { useCompany } from '../../../Store/useCompany';
import { OrganizationRequiredModal } from '../../OrganizationRequiredModal';

interface CargoFormProps {
  cargo:      CargoInfo;
  onBack:     () => void;
  onUpdate:   (guid: string, data: CargoInfo) => Promise<boolean>;
  onCreate:   (data: CargoInfo) => Promise<boolean>;
}


const cargoToPages = (cargo: CargoInfo): PageData => [
  {
    title: "Основная информация",
    data: [
      {
        label:      "Название груза",
        type:       "string",
        data:       cargo.name || "",
        validate:   true
      },
      {
        label:      "Описание",
        type:       "string", 
        data:       cargo.description || "",
        validate:   false
      }
    ]
  },
  {
    title: "Адрес отправления",
    data: [
      {
        label:      "Город",
        type:       "city",
        data: {
          city:     cargo.address?.city?.city || "",
          fias:     cargo.address?.city?.fias || ""
        },
        validate:   false
      },
      {
        label:      "Адрес",
        type:       "address",
        data: {
          address:  cargo.address?.address || "",
          fias:     cargo.address?.fias || "",
          lat:      String(cargo.address?.lat || 0),
          lon:      String(cargo.address?.lon || 0)
        },
        validate:   true
      }
    ]
  },
  {
    title: "Адрес доставки",
    data: [
      {
        label:      "Город",
        type:       "city",
        data: {
          city:     cargo.destiny?.city?.city || "",
          fias:     cargo.destiny?.city?.fias || ""
        },
        validate:   false
      },
      {
        label:      "Адрес",
        type:       "address",
        data: {
          address:  cargo.destiny?.address || "",
          fias:     cargo.destiny?.fias || "",
          lat:      String(cargo.destiny?.lat || 0),
          lon:      String(cargo.destiny?.lon || 0)
        },
        validate:   true
      }
    ]
  },
  {
    title: "Даты и параметры",
    data: [
      {
        label:      "Дата забора",
        type:       "date",
        data:       cargo.pickup_date || "",
        validate:   true
      },
      {
        label:      "Дата доставки",
        type:       "date",
        data:       cargo.delivery_date || "",
        validate:   true
      },
      {
        label:      "Вес (т)",
        type:       "number",
        data:       cargo.weight || 0,
        validate:   false
      },
      {
        label:      "Объем (м³)",
        type:       "number",
        data:       cargo.volume || 0,
        validate:   false
      }
    ]
  },
  {
    title: "Финансы, контакты",
    data: [
      {
        label:      "Цена доставки",
        type:       "number",
        data:       cargo.price || 0,
        validate:   true
      },
      {
        label:      "Стоимость груза",
        type:       "number",
        data:       cargo.cost || 0,
        validate:   true
      },
      {
        label:      "Телефон",
        type:       "string",
        data:       cargo.phone || "",
        validate:   true

      },
      {
        label:      "Контактное лицо",
        type:       "string",
        data:       cargo.face || "",
        validate:   true
      }
    ]
  }
 
];

const pagesToCargo = (pages: PageData, originalCargo?: CargoInfo): CargoInfo => {
  const base = originalCargo || EMPTY_CARGO;
  
  // Хелпер для поиска поля по label в любой секции
  const findField = (label: string): any => {
    for (const section of pages) {
      const field = section.data.find(f => f.label === label);
      if (field) return field.data;
    }
    return null;
  };
  
  // Хелпер для поиска всех полей в секции по title
  const findSection = (title: string): FieldData[] => {
    const section = pages.find(s => s.title === title);
    return section?.data || [];
  };
  
  return {
    ...base,
    
    // Основная информация (секция 0)
    name:           findField("Название груза") || "",
    description:    findField("Описание") || "",
    
    // Адрес отправления (секция 1)
    address: {
      city:         findField("Город") as CityData || { city: "", fias: "" },
      address:      (findSection("Адрес отправления").find(f => f.label === "Адрес")?.data as AddressData)?.address || "",
      fias:         (findSection("Адрес отправления").find(f => f.label === "Адрес")?.data as AddressData)?.fias || "",
      lat:          Number((findSection("Адрес отправления").find(f => f.label === "Адрес")?.data as AddressData)?.lat) || 0,
      lon:          Number((findSection("Адрес отправления").find(f => f.label === "Адрес")?.data as AddressData)?.lon) || 0
    },
    
    // Адрес доставки (секция 2)
    destiny: {
      city:         findSection("Адрес доставки").find(f => f.label === "Город")?.data as CityData || { city: "", fias: "" },
      address:      (findSection("Адрес доставки").find(f => f.label === "Адрес")?.data as AddressData)?.address || "",
      fias:         (findSection("Адрес доставки").find(f => f.label === "Адрес")?.data as AddressData)?.fias || "",
      lat:          Number((findSection("Адрес доставки").find(f => f.label === "Адрес")?.data as AddressData)?.lat) || 0,
      lon:          Number((findSection("Адрес доставки").find(f => f.label === "Адрес")?.data as AddressData)?.lon) || 0
    },
    
    // Даты и параметры (секция 3)
    pickup_date:    findField("Дата забора") || "",
    delivery_date:  findField("Дата доставки") || "",
    weight:         Number(findField("Вес (т)")) || 0,
    volume:         Number(findField("Объем (м³)")) || 0,
    
    // Финансовые параметры (секция 4)
    price:          Number(findField("Цена доставки")) || 0,
    cost:           Number(findField("Стоимость груза")) || 0,
    advance:        Number(findField("Аванс")) || 0,
    insurance:      Number(findField("Страховка")) || 0,
    
    // Контакты (секция 5)
    phone:          findField("Телефон") || "",
    face:           findField("Контактное лицо") || "",
    
    // Сохраняем статус из оригинального груза
    status:         originalCargo?.status || base.status
  };
};


export const CargoForm: React.FC<CargoFormProps> = ({ 
  cargo, 
  onBack, 
  onUpdate, 
  onCreate 
}) => {
    const toast = useToast();
    const history = useHistory();
    const user_type = useLoginStore((s) => s.user_type);

    // Подписка на store, чтобы пересчитать процент после загрузки компании
    const companyData = useCompanyStore((s) => s.data);
    const companyLoading = useCompanyStore((s) => s.isLoading);
    const { loadData: loadCompany } = useCompany();

    const companyCompletion = companyGetters.getCompletionPercentage();

  // Инициализация данных формы
  const [formData, setFormData] = useState<PageData>(() => 
    cargoToPages(cargo || EMPTY_CARGO)
  );
  
  // Обработчик сохранения
  const handleSave = async (data: PageData) => {
    try {
      const cargoData = pagesToCargo(data, cargo);
      
      // Валидация минимальных данных
      if (!cargoData.name || !cargoData.price) {
        toast.error('Заполните обязательные поля');
        return;
      }
      
      let success;
      if (cargo?.guid) {
        success = await onUpdate(cargo.guid, cargoData);
      } else {
        success = await onCreate(cargoData);
      }
      
      if (success) {
        toast.success(cargo ? 'Груз обновлен' : 'Груз создан');
        onBack();
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка при сохранении');
    }
  };
  
  // Запросить данные компании при входе в форму (заказчик), если их ещё нет
  useEffect(() => {
    if (user_type === 1 && !companyData && !companyLoading) {
      loadCompany();
    }
  }, [user_type, companyData, companyLoading, loadCompany]);

  const organizationRequired = !companyLoading && companyCompletion < 80;

  return (
    <>
    <OrganizationRequiredModal
      isOpen={organizationRequired}
      onClose={onBack}
      onGoProfile={() => history.push('/profile')}
    />
    <DataEditor
      data      = { formData }
      onSave    = { handleSave }
      onBack    = { onBack }
      title     = { cargo ? 'Редактировать груз' : 'Создать груз' }
    />
    </>
  );
};