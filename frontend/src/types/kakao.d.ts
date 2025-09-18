// 카카오 지도 API 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

declare namespace kakao {
  namespace maps {
    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setLevel(level: number, options?: { animate?: boolean }): void;
      getLevel(): number;
      panTo(latlng: LatLng): void;
      setBounds(bounds: LatLngBounds): void;
      getBounds(): LatLngBounds;
    }

    class LatLng {
      constructor(latitude: number, longitude: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      constructor(sw: LatLng, ne: LatLng);
      extend(latlng: LatLng): void;
      contain(latlng: LatLng): boolean;
      isEmpty(): boolean;
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getMap(): Map;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
      setTitle(title: string): void;
      getTitle(): string;
      setImage(image: MarkerImage): void;
      getImage(): MarkerImage;
      setZIndex(zIndex: number): void;
      getZIndex(): number;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker?: Marker): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
      getContent(): string | HTMLElement;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
    }

    namespace event {
      function addListener(target: any, type: string, handler: Function): void;
      function removeListener(target: any, type: string, handler: Function): void;
    }

    namespace services {
      class Geocoder {
        addressSearch(address: string, callback: (result: any[], status: Status) => void): void;
        coord2Address(
          lng: number,
          lat: number,
          callback: (result: any[], status: Status) => void
        ): void;
      }

      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: any[], status: Status, pagination: any) => void
        ): void;
        categorySearch(
          category: string,
          callback: (result: any[], status: Status, pagination: any) => void,
          options?: any
        ): void;
      }

      enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }
    }

    interface MapOptions {
      center: LatLng;
      level: number;
      mapTypeId?: MapTypeId;
      draggable?: boolean;
      scrollwheel?: boolean;
      disableDoubleClick?: boolean;
      disableDoubleClickZoom?: boolean;
      projectionId?: string;
    }

    interface MarkerOptions {
      position: LatLng;
      image?: MarkerImage;
      title?: string;
      draggable?: boolean;
      clickable?: boolean;
      zIndex?: number;
      opacity?: number;
      map?: Map;
    }

    interface MarkerImageOptions {
      offset?: Point;
      alt?: string;
      shape?: string;
      coords?: string;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      disableAutoPan?: boolean;
      map?: Map;
      position?: LatLng;
      removable?: boolean;
      zIndex?: number;
    }

    enum MapTypeId {
      ROADMAP = 1,
      SKYVIEW = 2,
      HYBRID = 3,
    }
  }
}

export {};
