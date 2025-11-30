"use client";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SourceChunk } from "@/types/query";
interface SourceViewerProps {
    sources: SourceChunk[];
}
export function SourceViewer({ sources }: SourceViewerProps) {
    const [expanded, setExpanded] = useState(false);
    if (!sources.length)
        return null;
    return (<div className="space-y-2 overflow-visible relative z-10">
      <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} className="w-full justify-between rounded-xl hover:bg-primary/5">
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4"/>
          {sources.length} {sources.length === 1 ? "Fonte" : "Fontes"}
        </span>
        {expanded ? (<ChevronUp className="h-4 w-4"/>) : (<ChevronDown className="h-4 w-4"/>)}
      </Button>

      {expanded && (<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {sources.map((source, index) => (<Card key={`${source.metadata.pageNumber || 0}-${source.content.substring(0, 50)}-${index}`} className="text-sm rounded-xl border-2 overflow-visible">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm md:text-base flex items-center justify-between">
                  <span>Fonte {index + 1}</span>
                  <div className="flex gap-2 flex-wrap">
                    {source.metadata.pageNumber && (<Badge variant="secondary" className="rounded-lg">
                        Pág. {source.metadata.pageNumber}
                      </Badge>)}
                    <Badge variant="outline" className="rounded-lg">
                      {(source.similarity * 100).toFixed(0)}% relevante
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs md:text-sm text-muted-foreground">
                <p className="whitespace-pre-wrap leading-relaxed bg-muted/50 p-3 rounded-lg">
                  "{source.content}"
                </p>
                {source.metadata.sectionTitle && (<p className="mt-2 italic">
                    Seção: {source.metadata.sectionTitle}
                  </p>)}
              </CardContent>
            </Card>))}
        </div>)}
    </div>);
}
