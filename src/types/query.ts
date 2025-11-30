export interface ChunkMetadata {
    pageNumber?: number;
    sectionTitle?: string;
    characterStart?: number;
    characterEnd?: number;
    tokenCount?: number;
}
export interface SourceChunk {
    content: string;
    chunkIndex: number;
    similarity: number;
    metadata: ChunkMetadata;
}
export interface QueryResponse {
    answer: string;
    sources: SourceChunk[];
    model: string;
}
export interface QueryRequest {
    documentId: string;
    question: string;
    maxContextChunks?: number;
}
