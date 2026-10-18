export interface CityData {
  city: string;
  fias: string;
  country?: string;
  lat?: number;
  lon?: number;
}

export interface AddressData {
  address: string;
  fias: string;
  lat: string;
  lon: string;
}

export interface FieldData {
  label:      string;
  type:       'string' | 'number' | 'select' | 'date' | 'boolean' | 'city' | 'address' | 'view' 
             | 'party' | 'images' | 'image' | 'password' | 'check' | 'rate' | 'label' | 'sign' | 'pdf';
  values?:    string[] | null;
  validate:   boolean;
  data:       any; 
}

export interface Section {
  title: string;
  data: FieldData[];
}

export type PageData = Section[];


export interface DataEditorProps {
  data:       PageData;
  onSave?:    (data: PageData) => void;
  onChange?:  (data: Section) => void;
  onBack:     () => void;
  title?:     string;
}

export interface NavigationState {
  currentPage:  number;
  totalPages:   number;
}
