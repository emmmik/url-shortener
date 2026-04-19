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

export interface URLTableProps {
  urls: URLItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface URLStatsProps {
  params: Promise<{ id: string }>;
}

export interface URLWithFaviconProps {
  url: string;
  urlTextClassName?: string;
}
