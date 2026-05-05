// Standard shape of every successful API response from our backend
export interface ApiResponse<DataType> {
  data: DataType;
  message: string;
  statusCode: number;
}

// Shape of a paginated list response from the API
export interface PaginatedApiResponse<ItemType> {
  data: ItemType[];
  total: number;
  page: number;
  perPage: number;
  hasNextPage: boolean;
}
