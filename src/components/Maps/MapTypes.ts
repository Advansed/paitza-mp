import { CargoInfo } from "../../Store/cargoStore";
import { WorkInfo } from "../Works/types";

export interface Coordinates {
  lat: number;
  long: number;
}

export interface MapProps {
  startCoords: Coordinates;
  endCoords: Coordinates;
  waypoints?: Coordinates[];
  cargoInfo?: CargoInfo;
  workInfo?: WorkInfo;
  executorPoint?: Coordinates | null;
  height?: string;
}

export interface RouteInfoProps {
  distance?: string;
  duration?: string;
  cargoInfo?: CargoInfo;
  workInfo?: WorkInfo;
}

export interface GoogleMapInstance {
  map: any;
  objects: any[];
  lookAtPoints?: Array<{ lat: number; lng: number }>;
  lookAtZoom?: number;
  bounds?: any;
  executorMarker?: any;
  destroy: () => void;
  resize: () => void;
}
