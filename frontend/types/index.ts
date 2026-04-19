export interface URLItem {
  id: number;
  url: string;
  short_code: string;
  access_count: number;
  custom_alias?: string;
  created_at: string;
  updated_at: string;
}

export interface URLItemCreate {
  url: string;
  custom_alias?: string;
}

export interface UrlTableProps {
  urls: URLItem[];
  loading: boolean;
}
