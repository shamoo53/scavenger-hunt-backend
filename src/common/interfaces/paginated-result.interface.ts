export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
