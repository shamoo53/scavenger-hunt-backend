export class BookmarkResponseDto {
  id: string
  userId: string
  puzzleId: string
  createdAt: Date

  constructor(bookmark: any) {
    this.id = bookmark.id
    this.userId = bookmark.userId
    this.puzzleId = bookmark.puzzleId
    this.createdAt = bookmark.createdAt
  }
}
