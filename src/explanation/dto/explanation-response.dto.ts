export class ExplanationResponseDto {
  id: string
  puzzleId: string
  text: string
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(explanation: any) {
    this.id = explanation.id
    this.puzzleId = explanation.puzzleId
    this.text = explanation.text
    this.createdBy = explanation.createdBy
    this.createdAt = explanation.createdAt
    this.updatedAt = explanation.updatedAt
  }
}
